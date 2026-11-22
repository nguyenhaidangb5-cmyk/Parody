// ===== Các màn hình phủ: chọn nghề, tạm dừng, nhật ký, group chat, thẻ nhân viên =====
import { useEffect, useRef, useState } from 'react';
import { useGame, resolveText, currentObjective, countPrefix } from '../game/store';
import { CAREERS } from '../data/careers';
import type { Career } from '../game/types';
import { QUESTS, QUEST_ORDER } from '../data/quests';
import { CAKE_CLUES, SECRET_CLUES } from '../data/endings';
import { drawMap, drawPlayerArrow } from './mapDraw';
import { runtime } from '../game/runtime';
import { sfx } from '../game/audio';
import { SettingsModal, HelpModal } from './Modals';
import { NPC_MAP } from '../data/npcs';

export function CareerSelect() {
  const choose = useGame((s) => s.chooseCareer);
  return (
    <div className="fullscreen">
      <div className="screen-title">
        <h2>Chọn con đường của bạn</h2>
        <p>Nghề nghiệp quyết định nhiệm vụ riêng chiều nay và một số câu thoại. Câu chuyện chính vẫn… hỗn loạn như nhau.</p>
      </div>
      <div className="career-grid">
        {(Object.keys(CAREERS) as Career[]).map((c, i) => {
          const d = CAREERS[c];
          return (
            <button
              key={c}
              className="career-card"
              style={{ ['--c' as string]: d.color, animationDelay: `${i * 0.07}s` } as React.CSSProperties}
              onMouseEnter={() => sfx('hover')}
              onClick={() => choose(c)}
            >
              <div className="ic">{d.icon}</div>
              <h3>{d.name}</h3>
              <div className="tl">{d.tagline}</div>
              <p>{d.desc}</p>
              <div className="m">Nhiệm vụ: {d.mission}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PauseMenu() {
  const setUi = useGame((s) => s.setUi);
  const [modal, setModal] = useState<null | 'settings' | 'help'>(null);
  const [saved, setSaved] = useState(false);
  return (
    <div className="modal-back">
      <div className="modal" style={{ width: 'min(420px, 100%)' }}>
        <h2>Tạm dừng</h2>
        <p className="lead">Đồng hồ công ty cũng dừng. Chỉ có anh Đức là vẫn đang đếm.</p>
        <div className="menu-buttons" style={{ maxWidth: 'none' }}>
          <button className="btn primary" onClick={() => setUi({ pause: false })}>
            ▶ Tiếp tục chơi
          </button>
          <button
            className="btn"
            onClick={() => {
              useGame.getState().saveNow();
              setSaved(true);
              sfx('success');
            }}
          >
            💾 {saved ? 'Đã lưu!' : 'Lưu game'}
          </button>
          <button className="btn" onClick={() => setUi({ pause: false, map: true })}>
            🗺️ Bản đồ & nhiệm vụ
          </button>
          <button className="btn" onClick={() => setModal('help')}>
            ? Hướng dẫn
          </button>
          <button className="btn" onClick={() => setModal('settings')}>
            ⚙ Cài đặt
          </button>
          <button className="btn ghost" onClick={() => useGame.getState().toMenu()}>
            ⌂ Lưu & về menu chính
          </button>
        </div>
      </div>
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
    </div>
  );
}

export function JournalMap() {
  const save = useGame((s) => s.save);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = ref.current;
      if (!c) return;
      const g = c.getContext('2d')!;
      const W = c.width;
      const H = c.height;
      const minX = -31;
      const maxX = 31;
      const minZ = -27;
      const maxZ = 42;
      const s = Math.min(W / (maxX - minX), H / (maxZ - minZ));
      const ox = (W - (maxX - minX) * s) / 2;
      const oy = (H - (maxZ - minZ) * s) / 2;
      const tf = (x: number, z: number): [number, number] => [ox + (x - minX) * s, oy + (z - minZ) * s];
      drawMap(g, W, H, tf, s, { labels: true, npcs: true });
      const p = runtime.player;
      const [px, py] = tf(p.x, p.z);
      // hướng: canvas lên = -z; rotY=PI là hướng -z
      drawPlayerArrow(g, px, py, Math.PI - p.rotY, 10);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const quests = QUEST_ORDER.filter((id) => save.quests[id]).reverse();
  const cake = save.clues.filter((c) => c.startsWith('cake_'));
  const tu = save.clues.filter((c) => c.startsWith('tu_'));
  return (
    <div className="fullscreen" onClick={() => useGame.getState().setUi({ map: false })}>
      <div className="journal" onClick={(e) => e.stopPropagation()}>
        <div className="panel bigmap">
          <h3>Bản đồ FTEL Tower</h3>
          <canvas ref={ref} width={620} height={640} />
        </div>
        <div className="panel">
          <h3>Nhật ký nhiệm vụ</h3>
          <div className="qlist">
            {quests.map((id) => {
              const q = QUESTS[id];
              const st = save.quests[id];
              const cur = currentObjective(save, id);
              return (
                <div key={id} className={`qitem ${st.status === 'done' ? 'done' : ''}`}>
                  <h4>
                    <span className="tm">{q.time}</span>
                    {q.title}
                  </h4>
                  <ul>
                    {q.objectives
                      .filter((o) => st.done.includes(o.id) || o.id === cur)
                      .map((o) => (
                        <li key={o.id} className={st.done.includes(o.id) ? 'ok' : ''}>
                          {resolveText(o.text, save)}
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
          </div>
          {(cake.length > 0 || save.quests.q6) && (
            <>
              <h3 style={{ marginTop: 18 }}>Manh mối vụ bánh kem ({cake.length})</h3>
              <div className="clues">
                {cake.length === 0 && <div>Chưa có manh mối nào.</div>}
                {cake.map((c) => (
                  <div key={c}>{CAKE_CLUES[c]}</div>
                ))}
              </div>
            </>
          )}
          {tu.length > 0 && (
            <>
              <h3 style={{ marginTop: 18 }}>Những điều kỳ lạ về chú Tư ({tu.length}/6)</h3>
              <div className="clues">
                {tu.map((c) => (
                  <div key={c} className="tu">
                    {SECRET_CLUES[c]}
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="modal-actions">
            <button className="btn primary" onClick={() => useGame.getState().setUi({ map: false })}>
              Đóng (Tab)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CHAT: { who: string; text: string; delay: number }[] = [
  { who: 'mai', text: 'Anh chị em ơi, có việc này gấp lắm. Chỉ 5 phút thôi! 🙏', delay: 600 },
  { who: 'bap', text: 'Chương trình 17h ở hội trường cần người hỗ trợ GẤP!!! Mất micro rồi 😱', delay: 1500 },
  { who: 'nam', text: 'Em {name} phụ trách mà, đúng không? Kịch bản ghi "nhân vật trung tâm: tân binh" 👍', delay: 1500 },
  { who: 'linh', text: 'Ơ…', delay: 1100 },
  { who: 'linh', text: 'Ừ… đúng rồi, em qua hội trường giúp mọi người nha 😅', delay: 1300 },
  { who: 'hanh', text: 'Ai chi tiền nhớ giữ hóa đơn đỏ.', delay: 1200 },
  { who: 'duc', text: 'Còn 1 phút nữa là 17h. Tôi đã cầm chìa khóa xe trên tay.', delay: 1300 },
  { who: 'mai', text: '@Đức 5 phút thôi mà 😊', delay: 1100 },
  { who: 'nam', text: '5 phút của chị Mai = 2 tiếng nha mọi người, em nói trước 🫡', delay: 1300 },
  { who: 'thu', text: 'Cô có bánh… à không, cô có nước. Qua lấy nha mấy đứa.', delay: 1300 },
];

export function ChatPhone() {
  const name = useGame((s) => s.save.name);
  const [n, setN] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (n >= CHAT.length) return;
    const t = setTimeout(() => {
      setN((v) => v + 1);
      sfx('chat');
    }, CHAT[n].delay);
    return () => clearTimeout(t);
  }, [n]);
  useEffect(() => {
    box.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [n]);
  const done = n >= CHAT.length;
  return (
    <div className="fullscreen">
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-head">
            <div className="av">🚀</div>
            <div>
              <b>FTEL Team Siêu Nhân</b>
              <small>16:59 · 12 thành viên</small>
            </div>
          </div>
          <div className="phone-msgs" ref={box}>
            {CHAT.slice(0, n).map((m, i) => {
              const npc = NPC_MAP[m.who];
              return (
                <div key={i} className="msg">
                  <div className="a" style={{ background: npc.color }}>
                    {npc.name.split(' ').pop()?.[0]}
                  </div>
                  <div className="b">
                    <small style={{ color: npc.color }}>{npc.name}</small>
                    {m.text.replace('{name}', name)}
                  </div>
                </div>
              );
            })}
            {!done && <div className="typing">{NPC_MAP[CHAT[n].who].name} đang soạn tin…</div>}
            {done && (
              <div className="msg me">
                <div className="b">Dạ… em qua liền 🏃</div>
              </div>
            )}
          </div>
          <div className="phone-foot">
            <button className="btn primary" style={{ width: '100%' }} onClick={() => (done ? useGame.getState().closeChat() : setN(CHAT.length))}>
              {done ? 'Chạy qua hội trường!' : 'Đọc nhanh ▸▸'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardView() {
  const save = useGame((s) => s.save);
  const close = () => {
    sfx('pickup');
    useGame.getState().setUi({ card: false });
    useGame.getState().toast('Đã đeo thẻ nhân viên', '🪪', 'done');
  };
  return (
    <div className="fullscreen" onClick={close}>
      <div className="idcard" onClick={(e) => e.stopPropagation()}>
        <div className="top">
          <span>FTEL</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>THẺ NHÂN VIÊN</span>
        </div>
        <div className="body">
          <div className="photo">
            <svg viewBox="0 0 100 120" width="100" height="120">
              <circle cx="50" cy="48" r="26" fill="#f0c39e" />
              <path d="M24 44 Q26 18 50 18 Q76 18 76 42 Q70 30 52 30 Q36 30 24 44Z" fill="#2a1c14" />
              <path d="M38 50 h8 M54 50 h8" stroke="#1d1a22" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M42 62 Q50 67 58 62" stroke="#7a2f2f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M14 120 Q16 82 50 80 Q84 82 86 120Z" fill="#fff" />
              <path d="M47 82 L53 82 L55 110 L50 116 L45 110Z" fill="#1f3b70" />
            </svg>
          </div>
          <div className="info">
            <span>Họ tên</span>
            <b>{save.name}</b>
            <span>Bộ phận</span>
            <div style={{ fontWeight: 800 }}>{save.career ? CAREERS[save.career].name : '—'}</div>
            <span>Mã số</span>
            <div style={{ fontWeight: 800 }}>FTEL-2026-0427</div>
            <span style={{ fontSize: 11 }}>(Ảnh: đang chớp mắt)</span>
          </div>
        </div>
        <div className="bar">
          <i style={{ background: '#F37021' }} />
          <i style={{ background: '#0A6FC2' }} />
          <i style={{ background: '#18A558' }} />
        </div>
        <div style={{ padding: 14, textAlign: 'center' }}>
          <button className="btn primary" onClick={close}>
            Đeo thẻ vào
          </button>
        </div>
      </div>
    </div>
  );
}

export { countPrefix };
