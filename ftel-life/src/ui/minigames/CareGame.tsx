// ===== Minigame CSKH: lắng nghe – xác minh – hỗ trợ khách báo mạng chậm =====
import { useEffect, useRef, useState } from 'react';
import type { MgProps } from './MinigameHost';
import { sfx } from '../../game/audio';
import { useGame } from '../../game/store';

interface Round {
  customer: string;
  options: { text: string; delta: number; reply?: string }[];
}

const ROUNDS: Round[] = [
  {
    customer: 'Alô! Mạng nhà chị chậm như rùa! Chị đóng tiền đầy đủ mà!!! 😤',
    options: [
      { text: 'Dạ em rất hiểu cảm giác khó chịu này ạ. Chị cho em xin vài thông tin để kiểm tra ngay nhé.', delta: 25, reply: 'Ừ… vậy còn được.' },
      { text: 'Chị bình tĩnh, mạng chậm là chuyện bình thường mà chị.', delta: -20, reply: 'BÌNH THƯỜNG?!' },
      { text: 'Chị thử… chạy nhanh hơn con rùa xem sao ạ?', delta: -15, reply: 'Em đang đùa với chị đó hả?' },
    ],
  },
  {
    customer: 'Hợp đồng tên Phượng, số điện thoại đuôi 2468. Mà kiểm tra gì lâu vậy em?',
    options: [
      { text: 'Dạ em đã xác minh được hợp đồng, đường truyền tới nhà chị vẫn ổn định. Mạng chậm trên tất cả thiết bị hay chỉ vài máy ạ?', delta: 25, reply: 'À, để chị coi…' },
      { text: 'Em đoán là modem cũ rồi, chị mua cái mới nhé.', delta: -15, reply: 'Đoán? Em đoán hả?' },
      { text: 'Hệ thống bên em không bao giờ lỗi đâu chị.', delta: -20, reply: 'Vậy là lỗi do chị hả?!' },
    ],
  },
  {
    customer: 'Chậm hết trơn! Tối nào cũng chậm, nhất là 8 giờ. Lạ ghê, nhà chị ai cũng ngủ sớm mà.',
    options: [
      { text: 'Dạ chị cho em kiểm tra số thiết bị đang kết nối nhé… Em thấy có 14 thiết bị đang dùng Wi-Fi nhà mình ạ.', delta: 20, reply: 'MƯỜI BỐN?!' },
      { text: 'Chắc tại giờ cao điểm thôi chị ạ.', delta: -5, reply: 'Cao điểm gì mà ngày nào cũng cao?' },
      { text: 'Có khi nào… nhà chị có ma không ạ?', delta: -10, reply: '…Em nói vậy chị sợ đó.' },
    ],
  },
  {
    customer: '14 cái?! Nhà chị có 3 người! …Khoan, mật khẩu Wi-Fi nhà chị là 12345678, vậy có sao không em?',
    options: [
      { text: 'Dạ em hướng dẫn chị đổi mật khẩu mạnh hơn ngay trên ứng dụng nhé, chỉ mất 2 phút thôi ạ.', delta: 25, reply: 'Đổi xong rồi! Mạng nhanh như gió luôn em ơi!' },
      { text: 'Dạ để em cho kỹ thuật qua tận nhà kiểm tra trong 3–5 ngày ạ.', delta: 5, reply: '3–5 ngày? Thôi cũng được…' },
      { text: 'Mật khẩu đó dễ nhớ mà chị, cứ để vậy đi ạ.', delta: -20, reply: 'Dễ nhớ với cả xóm luôn hả em?' },
    ],
  },
];

interface Line {
  me: boolean;
  text: string;
}

export function CareGame({ onWin }: MgProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(25);
  const [log, setLog] = useState<Line[]>([{ me: false, text: ROUNDS[0].customer }]);
  const [state, setState] = useState<'play' | 'win' | 'lose'>('play');
  const [order, setOrder] = useState<number[]>(() => shuffle([0, 1, 2]));
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [log]);

  const pick = (oi: number) => {
    if (state !== 'play') return;
    const r = ROUNDS[round];
    const o = r.options[oi];
    const ns = Math.max(0, Math.min(100, score + o.delta));
    setScore(ns);
    sfx(o.delta > 0 ? 'pickup' : 'error');
    const newLog: Line[] = [...log, { me: true, text: o.text }];
    if (o.reply) newLog.push({ me: false, text: o.reply });
    if (round + 1 < ROUNDS.length) {
      newLog.push({ me: false, text: ROUNDS[round + 1].customer });
      setRound(round + 1);
      setOrder(shuffle([0, 1, 2]));
    } else {
      if (ns >= 75) {
        newLog.push({ me: false, text: 'Cảm ơn em nhiều nha! Chị cho em 5 sao! ⭐⭐⭐⭐⭐' });
        setState('win');
        useGame.getState().applyEffects([{ stat: 'tonTrong', add: 1 }]);
        onWin();
      } else {
        newLog.push({ me: false, text: 'Thôi được rồi… chị sẽ suy nghĩ thêm. Tút… tút…' });
        setState('lose');
        sfx('fail');
      }
    }
    setLog(newLog);
  };

  const reset = () => {
    setRound(0);
    setScore(25);
    setLog([{ me: false, text: ROUNDS[0].customer }]);
    setState('play');
    setOrder(shuffle([0, 1, 2]));
  };

  const color = score >= 75 ? '#18A558' : score >= 45 ? '#fab005' : '#e03131';
  return (
    <>
      <div className="mg-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}>
          <span>Mức hài lòng của chị Phượng</span>
          <span style={{ color }}>
            {score}/100 {score >= 75 ? '😊' : score >= 45 ? '😐' : '😠'}
          </span>
        </div>
        <div className="meter">
          <i style={{ width: `${score}%`, background: color }} />
        </div>
        <div className="mg-cols" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="chatlog" ref={box}>
            {log.map((l, i) => (
              <div key={i} className={`msg ${l.me ? 'me' : ''}`}>
                <div className="a" style={{ background: l.me ? '#18A558' : '#e64980' }}>
                  {l.me ? 'Em' : 'P'}
                </div>
                <div className="b">{l.text}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="mg-card">
              <h4>
                Chọn câu trả lời · Lượt {Math.min(round + 1, ROUNDS.length)}/{ROUNDS.length}
              </h4>
              {state === 'play' &&
                order.map((oi) => (
                  <button key={oi} className="qbtn" onClick={() => pick(oi)}>
                    {ROUNDS[round].options[oi].text}
                  </button>
                ))}
              {state !== 'play' && <p style={{ fontSize: 14, fontWeight: 600 }}>{state === 'win' ? 'Cuộc gọi kết thúc tốt đẹp!' : 'Cần đạt ít nhất 75 điểm hài lòng.'}</p>}
            </div>
            <p style={{ fontSize: 12, color: '#868e96' }}>Bí kíp: Lắng nghe → Xác minh → Hỗ trợ. Đừng đoán, đừng đổ lỗi, đừng nhắc tới con rùa.</p>
          </div>
        </div>
      </div>
      <div className="mg-foot">
        {state === 'win' && <span className="mg-result good">Hoàn thành! Chị Phượng hài lòng.</span>}
        {state === 'lose' && <span className="mg-result bad">Chị Phượng chưa hài lòng. Thử lại nhé!</span>}
        <button className="btn primary" disabled={state === 'win'} onClick={reset}>
          Gọi lại từ đầu
        </button>
      </div>
    </>
  );
}

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
