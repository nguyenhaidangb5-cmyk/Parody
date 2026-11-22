import { useEffect, useRef, useState } from 'react';
import { useGame, currentObjective, resolveText, checkCond } from '../game/store';
import { QUESTS } from '../data/quests';
import { runtime } from '../game/runtime';
import { drawMap, drawPlayerArrow, roomNameAt } from './mapDraw';
import { interact } from '../scene/Player';
import { isTouchDevice } from '../game/input';

export function HUD() {
  const save = useGame((s) => s.save);
  const toasts = useGame((s) => s.toasts);
  const banner = useGame((s) => s.banner);
  const prompt = useGame((s) => s.prompt);
  const ui = useGame((s) => s.ui);
  const q = save.mainQuest ? QUESTS[save.mainQuest] : null;
  const qs = q ? save.quests[q.id] : null;
  const oid = q ? currentObjective(save, q.id) : null;
  const ob = q?.objectives.find((o) => o.id === oid);
  const doneCount = qs ? qs.done.length : 0;
  const busy = !!(ui.dialogue || ui.minigame || ui.careerSelect || ui.chat || ui.card || ui.map || ui.pause);
  const [locked, setLocked] = useState(!!document.pointerLockElement);

  useEffect(() => {
    const f = () => setLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', f);
    return () => document.removeEventListener('pointerlockchange', f);
  }, []);

  return (
    <div className="hud">
      {q && !ui.dialogue && (
        <div className="quest-card">
          <span className="time">🕗 {q.time}</span>
          <span className="chapter">{q.chapterLabel}</span>
          <h3>{q.title}</h3>
          {ob ? <div className="obj">{resolveText(ob.text)}</div> : <div className="obj">Hoàn thành!</div>}
          {ob?.hint && <div className="hint">Gợi ý: {ob.hint}</div>}
          {q.id === 'q6' && oid === 'clues' && (
            <div className="hint">Manh mối: {save.clues.filter((c) => c.startsWith('cake_')).length}/3</div>
          )}
          <div className="progress">
            <i style={{ width: `${(doneCount / q.objectives.length) * 100}%` }} />
          </div>
        </div>
      )}
      <Minimap />
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span className="i">{t.icon}</span>
            {t.text}
          </div>
        ))}
      </div>
      {banner && !ui.dialogue && (
        <div className="banner" key={banner.title}>
          <span className="t">{banner.time}</span>
          <h2>{banner.title}</h2>
          <p>{banner.sub}</p>
        </div>
      )}
      {prompt && !busy && (
        <div className="prompt" onClick={() => interact()}>
          <kbd>E</kbd> Nhấn E để {prompt}
        </div>
      )}
      {!busy && (
        <div className="hud-hints">
          <span>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> Di chuyển
          </span>
          <span>
            <kbd>Shift</kbd> Chạy
          </span>
          <span>
            <kbd>E</kbd> Tương tác
          </span>
          <span>
            <kbd>Tab</kbd> Bản đồ
          </span>
          <span>
            <kbd>Esc</kbd> Tạm dừng
          </span>
        </div>
      )}
      {!busy && !locked && !isTouchDevice() && <div className="click-hint">Nhấp chuột vào màn hình để xoay camera bằng chuột (hoặc giữ & kéo)</div>}
      {!busy && (
        <button className="btn small pause-btn" onClick={() => useGame.getState().setUi({ pause: true })}>
          ❚❚ Tạm dừng
        </button>
      )}
    </div>
  );
}

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let lastRoom = '';
    let frame = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (frame++ % 2) return;
      const c = ref.current;
      if (!c) return;
      const g = c.getContext('2d')!;
      const W = c.width;
      const H = c.height;
      const p = runtime.player;
      const yaw = runtime.camYaw;
      const s = 3.4;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      const rx = -Math.cos(yaw);
      const rz = Math.sin(yaw);
      const tf = (x: number, z: number): [number, number] => {
        const dx = x - p.x;
        const dz = z - p.z;
        return [W / 2 + (dx * rx + dz * rz) * s, H / 2 - (dx * fx + dz * fz) * s];
      };
      drawMap(g, W, H, tf, s, { npcs: true });
      // mũi tên người chơi (hướng tương đối so với camera)
      const rel = p.rotY - yaw;
      drawPlayerArrow(g, W / 2, H / 2, -rel, 9);
      const room = roomNameAt(p.x, p.z);
      if (room !== lastRoom && label.current) {
        lastRoom = room;
        label.current.textContent = room;
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      <div className="minimap">
        <canvas ref={ref} width={200} height={200} />
      </div>
      <div className="minimap-label" ref={label} />
    </>
  );
}

export { checkCond };
