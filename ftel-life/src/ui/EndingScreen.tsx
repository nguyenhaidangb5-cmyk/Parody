import { useGame, STAT_LABEL, countPrefix, resolveText } from '../game/store';
import { ENDINGS, ACHIEVEMENTS } from '../data/endings';
import { CAREERS } from '../data/careers';
import { NPC_MAP } from '../data/npcs';
import type { StatKey } from '../game/types';
import { sfx } from '../game/audio';

const ORDER: StatKey[] = ['tonTrong', 'doiMoi', 'dongDoi', 'chiCong', 'guongMau', 'sangSuot'];

export function EndingScreen() {
  const id = useGame((s) => s.endingId) ?? 'A';
  const save = useGame((s) => s.save);
  const unlocked = useGame((s) => s.endingsUnlocked);
  const e = ENDINGS[id];
  const max = Math.max(3, ...ORDER.map((k) => save.stats[k] ?? 0));
  const career = save.career ? CAREERS[save.career] : null;
  const mins = Math.max(1, Math.round(save.playTime / 60));

  return (
    <div className="ending">
      <div className="ending-main">
        <span className="ending-badge" style={{ background: e.color }}>
          {id === 'SECRET' ? '★ KẾT THÚC BÍ MẬT' : `KẾT THÚC ${id}`} · {unlocked.length}/4 đã mở
        </span>
        <h1>{e.title}</h1>
        <p className="sub">{e.subtitle}</p>
        <div className="story">
          {e.story.map((p, i) => (
            <p key={i}>{resolveText(p, save)}</p>
          ))}
        </div>
        <div className="quotes">
          {e.quotes.map((q, i) => {
            const npc = NPC_MAP[q.who];
            return (
              <div className="quote" key={i} style={{ animationDelay: `${0.3 + i * 0.2}s` }}>
                <div className="a" style={{ background: npc.color }}>
                  {npc.name.split(' ').pop()?.[0]}
                </div>
                <div>
                  <b>{npc.name}:</b> “{resolveText(q.text, save)}”
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <button
            className="btn primary"
            onClick={() => {
              sfx('click');
              useGame.getState().wipeSave();
              useGame.getState().newGame(save.name);
            }}
          >
            ⟳ Chơi lại
          </button>
          <button
            className="btn"
            onClick={() => {
              sfx('click');
              useGame.getState().wipeSave();
              useGame.getState().toMenu();
            }}
          >
            ⌂ Về menu
          </button>
        </div>
      </div>
      <div className="ending-side">
        <div className="panel">
          <h3>Hồ sơ ngày đầu</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: career?.color ?? '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              {career?.icon ?? '❔'}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{save.name}</div>
              <div style={{ color: '#ffd9bf', fontWeight: 700, fontSize: 13 }}>{career?.name ?? 'Chưa chọn nghề'} · ~{mins} phút</div>
            </div>
          </div>
          {ORDER.map((k) => (
            <div className="stat-row" key={k}>
              <span>{STAT_LABEL[k]}</span>
              <div className="bar">
                <i style={{ width: `${((save.stats[k] ?? 0) / max) * 100}%` }} />
              </div>
              <b>{save.stats[k] ?? 0}</b>
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#8a99b3', marginTop: 6 }}>
            Độ "kỳ quặc": {save.stats.kyQuac} · Bí mật chú Tư: {countPrefix(save.clues, 'tu_')}/6 · Manh mối bánh: {countPrefix(save.clues, 'cake_')}/6
          </div>
        </div>
        <div className="panel">
          <h3>Thành tựu</h3>
          <div className="ach">
            {Object.entries(ACHIEVEMENTS).map(([k, a]) => (
              <span key={k} className={save.achievements.includes(k) ? '' : 'off'} title={a.desc}>
                {a.icon} {a.name}
              </span>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Những quyết định đáng nhớ</h3>
          <ul className="decisions">
            {save.decisions.slice(-8).map((d) => (
              <li key={d.id}>{resolveText(d.text, save)}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Các kết thúc</h3>
          <div className="clues">
            {(['A', 'B', 'C', 'SECRET'] as const).map((k) => (
              <div key={k} className={k === 'SECRET' ? 'tu' : ''} style={{ opacity: unlocked.includes(k) ? 1 : 0.5 }}>
                <b>{unlocked.includes(k) ? ENDINGS[k].title : '??? (chưa mở)'}</b>
                <br />
                <small>{ENDINGS[k].condition}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
