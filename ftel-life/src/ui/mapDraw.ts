// ===== Vẽ bản đồ 2D (minimap + bản đồ lớn) từ dữ liệu bố cục =====
import { ROOMS, WALLS, WALL_T } from '../data/layout';
import { NPCS } from '../data/npcs';
import { runtime } from '../game/runtime';
import { targetPosition, currentTarget } from '../scene/Environment';

type Tf = (x: number, z: number) => [number, number];

const ROOM_COL: Record<string, string> = {
  lobby: '#e9dfcf',
  wood: '#d9b48a',
  carpet: '#8796ab',
  carpetBlue: '#6d8fbf',
  tile: '#efe9dc',
  concrete: '#b5bac0',
  hall: '#b88761',
};

export function drawMap(g: CanvasRenderingContext2D, w: number, h: number, tf: Tf, scale: number, opts: { labels?: boolean; npcs?: boolean } = {}) {
  g.fillStyle = '#6fae55';
  g.fillRect(0, 0, w, h);
  const rect = (x0: number, z0: number, x1: number, z1: number, color: string) => {
    const pts = [tf(x0, z0), tf(x1, z0), tf(x1, z1), tf(x0, z1)];
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
    g.closePath();
    g.fill();
  };
  // đường, vỉa hè, sân
  rect(-80, 40.6, 80, 47, '#4a4e55');
  rect(-80, 34.2, 80, 40.6, '#d8d2c6');
  rect(-3, 14, 3, 34, '#d8d2c6');
  rect(-23, -26, 23, 16, '#cfc8bb');
  rect(-28, 18, -12, 31, '#59606a');
  // phòng
  for (const r of ROOMS) rect(r.rect[0], r.rect[1], r.rect[2], r.rect[3], ROOM_COL[r.floor] ?? '#ddd');
  // tường
  g.strokeStyle = '#1b2a41';
  g.lineCap = 'round';
  for (const wd of WALLS) {
    const gaps = [...wd.gaps].sort((a, b) => a[0] - b[0]);
    let start = wd.from;
    const segs: [number, number][] = [];
    for (const [a, b] of gaps) {
      if (a > start) segs.push([start, a]);
      start = b;
    }
    if (wd.to > start) segs.push([start, wd.to]);
    g.lineWidth = Math.max(1.5, WALL_T * scale * (wd.ext ? 1.6 : 1.2));
    for (const [a, b] of segs) {
      const p0 = wd.axis === 'x' ? tf(a, wd.at) : tf(wd.at, a);
      const p1 = wd.axis === 'x' ? tf(b, wd.at) : tf(wd.at, b);
      g.beginPath();
      g.moveTo(p0[0], p0[1]);
      g.lineTo(p1[0], p1[1]);
      g.stroke();
    }
  }
  // hàng rào
  g.strokeStyle = 'rgba(30,30,30,0.6)';
  g.lineWidth = 1.5;
  for (const [a, b] of [
    [-30, -4],
    [4, 30],
  ]) {
    const p0 = tf(a, 34);
    const p1 = tf(b, 34);
    g.beginPath();
    g.moveTo(p0[0], p0[1]);
    g.lineTo(p1[0], p1[1]);
    g.stroke();
  }
  if (opts.labels) {
    g.font = `800 ${Math.max(10, scale * 1.15)}px "Be Vietnam Pro", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const r of ROOMS) {
      const [cx, cy] = tf((r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2);
      g.fillStyle = 'rgba(15,27,45,0.85)';
      g.fillText(r.name, cx, cy);
    }
    const [gx, gy] = tf(0, 36.5);
    g.fillText('Cổng chính', gx, gy);
    const [bx, by] = tf(7.2, 30.6);
    g.fillText('Bốt bảo vệ', bx, by);
    const [px, py] = tf(-20, 24.5);
    g.fillStyle = '#fff';
    g.fillText('Bãi xe', px, py);
  }
  // NPC
  if (opts.npcs) {
    for (const n of NPCS) {
      const p = runtime.npcPos[n.id];
      if (!p) continue;
      const [x, y] = tf(p.x, p.z);
      g.fillStyle = n.color;
      g.strokeStyle = '#fff';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(x, y, Math.max(3, scale * 0.45), 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }
  // mục tiêu
  const tp = targetPosition(currentTarget());
  if (tp) {
    const [x, y] = tf(tp[0], tp[2]);
    const t = performance.now() / 1000;
    g.fillStyle = '#ffb703';
    g.strokeStyle = '#7a3e00';
    g.lineWidth = 2;
    const s = Math.max(6, scale * 0.9) * (1 + Math.sin(t * 5) * 0.12);
    g.beginPath();
    g.moveTo(x, y - s);
    g.lineTo(x + s * 0.75, y);
    g.lineTo(x, y + s);
    g.lineTo(x - s * 0.75, y);
    g.closePath();
    g.fill();
    g.stroke();
  }
}

export function drawPlayerArrow(g: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = '#F37021';
  g.strokeStyle = '#fff';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -size);
  g.lineTo(size * 0.7, size * 0.75);
  g.lineTo(0, size * 0.35);
  g.lineTo(-size * 0.7, size * 0.75);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

/** Chỉ hướng mục tiêu ở viền minimap khi mục tiêu ở ngoài khung */
export function roomNameAt(x: number, z: number): string {
  const r = ROOMS.find((rm) => x >= rm.rect[0] && x <= rm.rect[2] && z >= rm.rect[1] && z <= rm.rect[3]);
  if (r) return r.name;
  if (z > 34) return 'Ngoài cổng';
  return 'Sân trước';
}
