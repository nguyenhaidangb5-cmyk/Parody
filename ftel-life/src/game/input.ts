// ===== Bàn phím, chuột, khóa con trỏ và điều khiển cảm ứng =====

const keys = new Set<string>();
let mouseDX = 0;
let mouseDY = 0;
let wheel = 0;
let dragging = false;
const pressedOnce = new Set<string>();

export const touch = { moveX: 0, moveY: 0, run: false, active: false };

export function initInput() {
  window.addEventListener('keydown', (e) => {
    const k = e.code;
    if (!keys.has(k)) pressedOnce.add(k);
    keys.add(k);
    if (['Space', 'Tab', 'ArrowUp', 'ArrowDown'].includes(k) && !isTypingTarget(e.target)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement || dragging) {
      mouseDX += e.movementX;
      mouseDY += e.movementY;
    }
  });
  window.addEventListener('mouseup', () => (dragging = false));
  window.addEventListener(
    'wheel',
    (e) => {
      wheel += Math.sign(e.deltaY);
    },
    { passive: true },
  );
}

function isTypingTarget(t: EventTarget | null) {
  return t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
}

export function startDrag() {
  dragging = true;
}

export function isDown(code: string) {
  return keys.has(code);
}

/** true đúng một lần cho mỗi lần nhấn phím */
export function consumePress(code: string) {
  if (pressedOnce.has(code)) {
    pressedOnce.delete(code);
    return true;
  }
  return false;
}

export function clearPresses() {
  pressedOnce.clear();
}

export function consumeMouse() {
  const r = { dx: mouseDX, dy: mouseDY, wheel };
  mouseDX = 0;
  mouseDY = 0;
  wheel = 0;
  return r;
}

export function addLook(dx: number, dy: number) {
  mouseDX += dx;
  mouseDY += dy;
}

export function requestLock(el?: Element | null) {
  const target = el ?? document.querySelector('canvas');
  if (!target || document.pointerLockElement) return;
  try {
    const r = (target as HTMLElement).requestPointerLock() as unknown;
    if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => {});
  } catch {
    /* Một số trình duyệt chặn khóa chuột – vẫn chơi được bằng kéo chuột */
  }
}

export function exitLock() {
  if (document.pointerLockElement) document.exitPointerLock();
}

export const isTouchDevice = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);
