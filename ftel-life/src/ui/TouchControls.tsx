// ===== Điều khiển cảm ứng (điện thoại / máy tính bảng) =====
import { useRef } from 'react';
import { touch, addLook } from '../game/input';
import { interact } from '../scene/Player';
import { useGame } from '../game/store';
import { runtime } from '../game/runtime';

export function TouchControls() {
  const knob = useRef<HTMLElement>(null);
  const joyId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  const onJoy = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2);
    let dy = (e.clientY - cy) / (r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > 1) {
      dx /= l;
      dy /= l;
    }
    touch.active = true;
    touch.moveX = dx;
    touch.moveY = -dy;
    touch.run = l > 0.92;
    if (knob.current) knob.current.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
  };
  const endJoy = () => {
    joyId.current = null;
    touch.active = false;
    touch.moveX = touch.moveY = 0;
    touch.run = false;
    if (knob.current) knob.current.style.transform = '';
  };

  return (
    <div className="touch">
      <div
        className="look-area"
        onPointerDown={(e) => {
          lookId.current = e.pointerId;
          lookLast.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (lookId.current !== e.pointerId) return;
          addLook((e.clientX - lookLast.current.x) * 1.6, (e.clientY - lookLast.current.y) * 1.6);
          lookLast.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (lookId.current = null)}
        onPointerCancel={() => (lookId.current = null)}
      />
      <div
        className="joy"
        onPointerDown={(e) => {
          joyId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          onJoy(e);
        }}
        onPointerMove={(e) => joyId.current === e.pointerId && onJoy(e)}
        onPointerUp={endJoy}
        onPointerCancel={endJoy}
      >
        <i ref={knob} />
      </div>
      <div className="touch-btns">
        <button
          onPointerDown={() => {
            const p = runtime.player;
            if (p.grounded) {
              p.vy = 4.3;
              p.grounded = false;
            }
          }}
        >
          ⤒
        </button>
        <button onPointerDown={() => useGame.getState().setUi({ map: true })}>🗺</button>
        <button className="e" onPointerDown={() => interact()}>
          E
        </button>
      </div>
    </div>
  );
}
