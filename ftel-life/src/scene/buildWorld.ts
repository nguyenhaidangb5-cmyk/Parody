// ===== Dựng toàn bộ khuôn viên FTEL (tĩnh) – chạy một lần khi vào game =====
import * as THREE from 'three';
import { StaticBuilder } from './StaticBuilder';
import { BUILDING, DESK_CLUSTERS, POS, ROOMS, WALLS, WALL_H, WALL_T, deskSeat } from '../data/layout';
import { addBox, addHeight, clearCollision } from '../game/collision';
import { corkTexture, floorTexture, logoTexture, photoTexture, signTexture, skyTexture, whiteboardTexture } from './textures';

const ORANGE = '#F37021';
const BLUE = '#0A6FC2';
const GREEN = '#18A558';
const NAVY = '#1b2a41';
const WOOD = '#b8875a';
const WOOD_D = '#8a5f3c';
const WHITE = '#f7f5f0';
const METAL = '#9aa3ad';
const DARK = '#2f343b';
const GLASS = { transparent: true, opacity: 0.28, rough: 0.05, metal: 0.1 };

function floorMat(kind: string, w: number, d: number, tile: number) {
  const t = floorTexture(kind).clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w / tile, d / tile);
  return new THREE.MeshStandardMaterial({ map: t, roughness: kind === 'lobby' || kind === 'tile' ? 0.35 : 0.85 });
}

export interface WorldBuild {
  group: THREE.Group;
  roof: THREE.Group;
}

export function buildWorld(): WorldBuild {
  clearCollision();
  const sb = new StaticBuilder();

  ground(sb);
  outdoor(sb);
  building(sb);
  lobby(sb);
  interview(sb);
  pantry(sb);
  corridor(sb);
  office(sb);
  meeting(sb);
  storage(sb);
  hall(sb);
  boundaries();

  const group = sb.build();
  const roof = buildRoof();
  return { group, roof };
}

// ---------------------------------------------------------------- Nền
function ground(sb: StaticBuilder) {
  sb.plane(0, -0.02, 6, 220, 220, floorMat('grass', 220, 220, 6));
  // vỉa hè ngoài cổng + đường
  sb.plane(0, 0.005, 37.4, 140, 6.4, floorMat('paving', 140, 6.4, 2));
  sb.plane(0, 0.004, 43.8, 160, 6.4, floorMat('asphalt', 160, 6.4, 4));
  sb.plane(0, 0.005, 48.2, 160, 2.4, floorMat('paving', 160, 2.4, 2));
  for (let x = -76; x < 76; x += 4) sb.box(x, 0.006, 43.8, 2, 0.01, 0.15, '#f1f1f1', { cast: false });
  // lối đi + sân quanh tòa nhà
  sb.plane(0, 0.006, 24, 6, 20, floorMat('paving', 6, 20, 2));
  sb.plane(0, 0.004, -5, 46, 42, floorMat('paving', 46, 42, 2));
  sb.plane(-20, 0.006, 24.5, 16, 13, floorMat('asphalt', 16, 13, 4));
  for (let x = -27; x <= -13; x += 1.6) sb.box(x, 0.008, 22.3, 0.06, 0.01, 2.2, '#ffffff', { cast: false });
  for (let x = -27; x <= -13; x += 1.6) sb.box(x, 0.008, 26.7, 0.06, 0.01, 2.2, '#ffffff', { cast: false });
  // sàn từng phòng
  const tiles: Record<string, number> = { lobby: 2, wood: 2.4, carpet: 1.2, carpetBlue: 1.4, tile: 0.9, concrete: 2, hall: 3 };
  for (const r of ROOMS) {
    const [x0, z0, x1, z1] = r.rect;
    const w = x1 - x0;
    const d = z1 - z0;
    sb.plane((x0 + x1) / 2, 0.012, (z0 + z1) / 2, w, d, floorMat(r.floor, w, d, tiles[r.floor] ?? 2));
  }
}

// ---------------------------------------------------------------- Ngoài trời
function tree(sb: StaticBuilder, x: number, z: number, s = 1, kind = 0) {
  sb.cyl(x, 0, z, 0.12 * s, 0.18 * s, 1.6 * s, '#7a5233', 8, { collide: [0, 3] });
  const greens = ['#4f9a43', '#5fae4b', '#3f8a3a', '#6dbb55'];
  if (kind === 1) {
    sb.cone(x, 1.2 * s, z, 1.2 * s, 2.4 * s, greens[2], 8, { m: { flat: true } });
    sb.cone(x, 2.2 * s, z, 0.9 * s, 1.8 * s, greens[0], 8, { m: { flat: true } });
    return;
  }
  sb.ico(x, 2.3 * s, z, 1.15 * s, greens[(Math.abs(Math.round(x * 3 + z)) % 4)]);
  sb.ico(x + 0.6 * s, 2.0 * s, z + 0.3 * s, 0.75 * s, greens[1]);
  sb.ico(x - 0.55 * s, 2.05 * s, z - 0.25 * s, 0.7 * s, greens[3]);
  sb.ico(x, 2.95 * s, z - 0.1 * s, 0.6 * s, greens[0]);
}

function bush(sb: StaticBuilder, x: number, z: number, s = 1) {
  sb.ico(x, 0.35 * s, z, 0.5 * s, '#4c9a45', { scale: [1.2, 0.8, 1] });
  sb.ico(x + 0.35 * s, 0.3 * s, z + 0.1, 0.35 * s, '#5aad4e');
}

function bench(sb: StaticBuilder, x: number, z: number, ry: number) {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (lx: number, lz: number): [number, number] => [x + lx * c + lz * s, z - lx * s + lz * c];
  for (const lx of [-0.75, 0.75]) {
    const [px, pz] = at(lx, 0);
    sb.box(px, 0, pz, 0.08, 0.42, 0.5, DARK, { ry });
  }
  const [sx, sz] = at(0, 0);
  sb.box(sx, 0.42, sz, 1.8, 0.06, 0.5, WOOD, { ry });
  const [bx, bz] = at(0, -0.22);
  sb.box(bx, 0.55, bz, 1.8, 0.35, 0.06, WOOD, { ry, rx: 0 });
  addBox(sx, sz, Math.abs(c) * 1.8 + Math.abs(s) * 0.55, Math.abs(s) * 1.8 + Math.abs(c) * 0.55, 0, 0.9);
}

function lamp(sb: StaticBuilder, x: number, z: number) {
  sb.cyl(x, 0, z, 0.06, 0.09, 3.6, DARK, 8, { collide: [0, 3] });
  sb.box(x, 3.55, z, 0.5, 0.12, 0.25, DARK);
  sb.box(x, 3.5, z, 0.42, 0.04, 0.2, '#fff7d6', { m: { emissive: '#fff2c0', emissiveIntensity: 0.8 }, cast: false });
}

function scooter(sb: StaticBuilder, x: number, z: number, ry: number, color: string) {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const at = (lz: number): [number, number] => [x + lz * s, z + lz * c];
  const [f1, f2] = at(0.55);
  const [b1, b2] = at(-0.55);
  sb.cyl(f1, 0.0, f2, 0.22, 0.22, 0.1, '#222', 14, { rz: Math.PI / 2, ry });
  sb.cyl(b1, 0.0, b2, 0.22, 0.22, 0.1, '#222', 14, { rz: Math.PI / 2, ry });
  const [m1, m2] = at(-0.1);
  sb.rbox(m1, 0.18, m2, 0.42, 0.42, 1.1, color, 0.12, { ry });
  const [s1, s2] = at(-0.2);
  sb.rbox(s1, 0.6, s2, 0.36, 0.1, 0.62, '#2b2b2b', 0.04, { ry });
  const [h1, h2] = at(0.55);
  sb.rbox(h1, 0.35, h2, 0.32, 0.65, 0.18, color, 0.08, { ry });
  sb.box(h1, 1.0, h2, 0.62, 0.04, 0.05, '#333', { ry });
  addBox(x, z, Math.abs(c) * 0.5 + Math.abs(s) * 1.4, Math.abs(s) * 0.5 + Math.abs(c) * 1.4, 0, 1.0);
}

function outdoor(sb: StaticBuilder) {
  // Hàng rào + cổng
  const fenceZ = 34;
  for (const [a, b] of [
    [-30, -4.05],
    [4.05, 30],
  ]) {
    for (let x = a; x <= b + 0.01; x += 2) sb.box(x, 0, fenceZ, 0.12, 1.3, 0.12, DARK, { cast: true });
    sb.box((a + b) / 2, 0.45, fenceZ, b - a, 0.06, 0.06, DARK);
    sb.box((a + b) / 2, 1.15, fenceZ, b - a, 0.06, 0.06, DARK);
    sb.box((a + b) / 2, 0, fenceZ, b - a, 0.25, 0.25, '#c9c1b2');
    addBox((a + b) / 2, fenceZ, b - a, 0.4, 0, 1.4, { blocksCamera: false });
  }
  for (const side of [-1, 1]) {
    for (let z = -26; z <= 34; z += 2) sb.box(30 * side, 0, z, 0.12, 1.3, 0.12, DARK);
    sb.box(30 * side, 0.45, 4, 0.06, 0.06, 60, DARK);
    sb.box(30 * side, 1.15, 4, 0.06, 0.06, 60, DARK);
  }
  for (let x = -30; x <= 30; x += 2) sb.box(x, 0, -26, 0.12, 1.3, 0.12, DARK);
  sb.box(0, 0.45, -26, 60, 0.06, 0.06, DARK);
  sb.box(0, 1.15, -26, 60, 0.06, 0.06, DARK);
  // trụ cổng + cổng chào
  for (const side of [-1, 1]) {
    sb.rbox(3.75 * side, 0, fenceZ, 0.7, 3.4, 0.7, WHITE, 0.06, { collide: true });
    sb.box(3.75 * side, 3.4, fenceZ, 0.8, 0.15, 0.8, ORANGE);
  }
  sb.rbox(0, 3.0, fenceZ, 8.4, 0.7, 0.5, NAVY, 0.08);
  sb.sign(0, 3.35, fenceZ + 0.26, 6.6, 0.62, signTexture('gate', ['FTEL TOWER · Ngày mới, kết nối mới'], 1024, 96, { bg: NAVY, fg: '#ffffff', size: 54, radius: 8 }));
  sb.sign(0, 3.35, fenceZ - 0.26, 6.6, 0.62, signTexture('gate2', ['Chúc một ngày làm việc "năm phút"!'], 1024, 96, { bg: NAVY, fg: '#ffd9bf', size: 50, radius: 8 }), Math.PI);
  // đế barie
  sb.rbox(3.35, 0, fenceZ, 0.4, 1.0, 0.4, '#ffd43b', 0.05, { collide: true });

  // Bốt bảo vệ
  const [bx, bz] = POS.booth;
  sb.box(bx, 0, bz, 2.6, 0.15, 2.4, '#d8d2c6', { cast: false });
  sb.box(bx, 0.15, bz + 1.15, 2.6, 0.9, 0.1, '#2f5d9e');
  sb.box(bx, 1.05, bz + 1.15, 2.6, 1.0, 0.06, '#cfe8ff', { m: GLASS, cast: false });
  sb.box(bx, 0.15, bz - 1.15, 2.6, 2.1, 0.1, '#2f5d9e');
  sb.box(bx + 1.25, 0.15, bz, 0.1, 2.1, 2.4, '#2f5d9e');
  sb.box(bx - 1.25, 0.15, bz - 0.55, 0.1, 2.1, 1.3, '#2f5d9e');
  sb.box(bx - 1.25, 1.05, bz + 0.65, 0.06, 1.0, 1.1, '#cfe8ff', { m: GLASS, cast: false });
  sb.box(bx - 1.25, 0.15, bz + 0.65, 0.1, 0.9, 1.1, '#2f5d9e');
  sb.rbox(bx, 2.25, bz, 3.2, 0.22, 3.0, WHITE, 0.05);
  sb.box(bx, 2.47, bz, 3.0, 0.06, 2.8, ORANGE);
  addBox(bx, bz, 2.7, 2.5, 0, 2.5);
  sb.sign(bx, 1.85, bz + 1.21, 1.3, 0.32, signTexture('booth', ['BẢO VỆ'], 256, 64, { bg: '#ffffff', fg: '#2f5d9e', size: 40, radius: 6 }));
  sb.box(bx + 0.6, 0.15, bz + 0.6, 0.6, 0.8, 0.5, WOOD);
  sb.box(bx + 0.6, 0.95, bz + 0.6, 0.18, 0.02, 0.24, '#f1e3c6', { cast: false });

  // Biển chỉ dẫn
  sb.cyl(-4.6, 0, 27, 0.05, 0.05, 1.3, DARK, 8, { collide: [0, 2] });
  sb.rbox(-4.6, 1.2, 27, 1.4, 0.9, 0.08, NAVY, 0.04);
  sb.sign(-4.6, 1.65, 27.045, 1.3, 0.8, signTexture('dir', ['↑ Sảnh chính', '↑ Hội trường', '← Bãi xe'], 256, 160, { bg: NAVY, fg: '#ffffff', size: 28, align: 'left', padding: 20 }));

  // Cây xanh, bụi cây, đèn, ghế đá
  const trees: [number, number, number, number][] = [
    [-9, 21, 1.1, 0], [-8, 30.5, 1, 0], [9, 24, 1.15, 0], [17, 30, 1, 0], [24, 20, 1.2, 0], [14, 17.5, 0.9, 1],
    [26, 30.5, 1, 1], [-24, 32, 1, 1], [24, 32, 0.95, 0], [-27, 16, 1.1, 0], [27, 15, 1, 0], [-16, 37.6, 0.9, 0],
    [16, 37.6, 0.9, 0], [-26, 37.6, 1, 0], [26, 37.6, 1, 0], [-25, -12, 1.2, 0], [25, -12, 1.2, 0], [-25, 2, 1, 1],
    [25, 2, 1, 1], [-10, -25, 1, 0], [10, -25, 1, 0], [0, 50.5, 1, 0], [-20, 50.5, 1, 0], [20, 50.5, 1, 0],
  ];
  trees.forEach(([x, z, s, k]) => tree(sb, x, z, s, k));
  for (const z of [16.5, 19, 28.5, 31.5]) {
    bush(sb, 4.2, z);
    bush(sb, -4.2, z, 0.9);
  }
  for (const z of [18, 24, 30]) {
    lamp(sb, 3.6, z);
    lamp(sb, -3.6, z);
  }
  bench(sb, 5.2, 22, -Math.PI / 2);
  bench(sb, -5.4, 23.5, Math.PI / 2);
  bench(sb, 20, 37.0, Math.PI);
  // bồn hoa
  for (const [x, z, w, d] of [
    [8, 27, 4, 1.2],
    [-12, 33, 5, 0.9],
    [12, 33, 5, 0.9],
  ]) {
    sb.box(x, 0, z, w, 0.35, d, '#c9c1b2', { collide: true });
    sb.box(x, 0.35, z, w - 0.2, 0.05, d - 0.2, '#6b4a2b', { cast: false });
    const cols = ['#ff6b9a', '#ffd43b', '#ff922b', '#ffffff', '#cc5de8'];
    for (let i = 0; i < w * 4; i++) sb.sphere(x - w / 2 + 0.2 + Math.random() * (w - 0.4), 0.46, z - d / 2 + 0.15 + Math.random() * (d - 0.3), 0.07, cols[i % cols.length], { cast: false }, 6);
  }
  // cột cờ
  [ORANGE, BLUE, GREEN].forEach((c, i) => {
    const x = -8 - i * 1.2;
    sb.cyl(x, 0, 16.6, 0.04, 0.05, 6, METAL, 8, { collide: [0, 3] });
    sb.box(x + 0.5, 5.2, 16.6, 1.0, 0.65, 0.02, c, { cast: false });
  });
  // bãi xe máy
  const sc = ['#e03131', '#1971c2', '#f8f9fa', '#2b8a3e', '#fab005', '#212529', '#e64980'];
  let k = 0;
  for (let x = -26.5; x <= -13.5; x += 1.6) {
    if (Math.random() < 0.8) scooter(sb, x, 22.3, 0.08 - Math.random() * 0.16, sc[k++ % sc.length]);
    if (Math.random() < 0.7) scooter(sb, x, 26.7, Math.PI + 0.1 - Math.random() * 0.2, sc[k++ % sc.length]);
  }
  sb.box(-20, 0, 30.2, 16, 2.4, 0.1, '#cfd4da', { collide: true, cam: false });
  sb.box(-20, 2.4, 29.2, 16.4, 0.08, 2.4, '#0A6FC2', { cast: false });
  for (const x of [-27.8, -12.2]) sb.box(x, 0, 28.2, 0.1, 2.4, 0.1, METAL);

  // Xe bánh mì
  sb.rbox(-9, 0.3, 38.6, 1.8, 0.8, 0.9, '#f5f0e6', 0.05, { collide: [0, 1.4] });
  sb.box(-9, 1.1, 38.6, 1.6, 0.6, 0.75, '#cfe8ff', { m: GLASS, cast: false });
  sb.box(-9, 1.7, 38.6, 1.8, 0.05, 0.9, '#e03131');
  for (const dx of [-0.65, 0.65]) sb.cyl(-9 + dx, 0.05, 38.15, 0.25, 0.25, 0.08, '#222', 12, { rx: Math.PI / 2 });
  sb.cyl(-9, 0.3, 38.6, 0.03, 0.03, 2.4, '#888', 6);
  sb.cone(-9, 2.5, 38.6, 1.4, 0.5, '#ff922b', 8);
  sb.sign(-9, 0.75, 39.06, 1.6, 0.42, signTexture('banhmi', ['BÁNH MÌ CÔ BA'], 512, 128, { bg: '#e03131', fg: '#fff', size: 62, radius: 10 }));
  for (let i = 0; i < 5; i++) sb.rbox(-9.5 + i * 0.25, 1.15, 38.6, 0.2, 0.09, 0.5, '#e8b04b', 0.04, { cast: false });

  // Dãy nhà phía xa
  const winTex = skyTexture();
  for (let i = 0; i < 9; i++) {
    const x = -64 + i * 16;
    const h = 8 + ((i * 7) % 5) * 3;
    const w = 11;
    sb.box(x, 0, 56, w, h, 8, ['#d9d4cc', '#c8d0d8', '#e6dccf', '#cfd6cf'][i % 4], { cast: false });
    const t = winTex.clone();
    t.needsUpdate = true;
    t.repeat.set(2, h / 6);
    sb.sign(x, h / 2, 51.95, w - 1, h - 1, t, Math.PI);
  }
}

// ---------------------------------------------------------------- Tòa nhà
function building(sb: StaticBuilder) {
  for (const w of WALLS) {
    const gaps = [...w.gaps].sort((a, b) => a[0] - b[0]);
    const segs: [number, number][] = [];
    let start = w.from;
    for (const [g0, g1] of gaps) {
      if (g0 > start) segs.push([start, g0]);
      start = g1;
    }
    if (w.to > start) segs.push([start, w.to]);
    const color = w.ext ? '#f6f2ea' : w.color ?? '#f4efe6';

    for (const [a, b] of segs) {
      // tách thành đoạn đặc / kính
      const cuts = new Set<number>([a, b]);
      (w.glass ?? []).forEach(([g0, g1]) => {
        if (g0 > a && g0 < b) cuts.add(g0);
        if (g1 > a && g1 < b) cuts.add(g1);
      });
      const pts = [...cuts].sort((p, q) => p - q);
      for (let i = 0; i < pts.length - 1; i++) {
        const s0 = pts[i];
        const s1 = pts[i + 1];
        const mid = (s0 + s1) / 2;
        const len = s1 - s0;
        const isGlass = (w.glass ?? []).some(([g0, g1]) => mid > g0 && mid < g1);
        const [cx, cz, sx, sz] = w.axis === 'x' ? [mid, w.at, len, WALL_T] : [w.at, mid, WALL_T, len];
        if (isGlass) {
          sb.box(cx, 0, cz, sx, 0.12, sz, '#5b6470');
          sb.box(cx, 2.7, cz, sx, WALL_H - 2.7, sz, color);
          sb.box(cx, 0.12, cz, w.axis === 'x' ? len : 0.05, 2.58, w.axis === 'x' ? 0.05 : len, '#cfe8ff', { m: GLASS, cast: false });
          const n = Math.max(1, Math.round(len / 1.5));
          for (let k = 0; k <= n; k++) {
            const p = s0 + (len * k) / n;
            const [mx, mz] = w.axis === 'x' ? [p, w.at] : [w.at, p];
            sb.box(mx, 0.12, mz, 0.06, 2.58, 0.06, '#5b6470');
          }
          addBox(cx, cz, sx, sz, 0, WALL_H, { blocksCamera: false });
        } else {
          sb.box(cx, 0, cz, sx, WALL_H, sz, color, { collide: true });
          // chân tường
          const [bsx, bsz] = w.axis === 'x' ? [len, WALL_T + 0.04] : [WALL_T + 0.04, len];
          sb.box(cx, 0, cz, bsx, 0.12, bsz, w.ext ? '#4a4f57' : '#8d8478', { cast: false });
        }
        if (w.ext) exteriorDecor(sb, w.axis, w.at, s0, s1);
      }
    }
    // khung cửa (lanh tô) phía trên các khoảng trống
    for (const [g0, g1] of gaps) {
      const mid = (g0 + g1) / 2;
      const len = g1 - g0;
      const [cx, cz, sx, sz] = w.axis === 'x' ? [mid, w.at, len, WALL_T] : [w.at, mid, WALL_T, len];
      if (w.ext) continue;
      sb.box(cx, 2.55, cz, sx, WALL_H - 2.55, sz, color);
      for (const p of [g0, g1]) {
        const [px, pz] = w.axis === 'x' ? [p, w.at] : [w.at, p];
        sb.box(px, 0, pz, w.axis === 'x' ? 0.1 : WALL_T + 0.06, 2.6, w.axis === 'x' ? WALL_T + 0.06 : 0.1, '#5b6470');
      }
      sb.box(cx, 2.5, cz, w.axis === 'x' ? len : WALL_T + 0.06, 0.1, w.axis === 'x' ? WALL_T + 0.06 : len, '#5b6470');
    }
  }

  // Lối vào chính: mái hiên, khung kính, bảng tên
  sb.box(0, 2.4, 14, 4, WALL_H - 2.4, WALL_T, '#f6f2ea');
  for (const x of [-2, 2]) sb.box(x, 0, 14, 0.14, 2.45, 0.32, DARK);
  sb.rbox(0, 3.05, 15.6, 7.2, 0.2, 3.4, WHITE, 0.05);
  sb.box(0, 3.0, 17.25, 7.2, 0.08, 0.06, ORANGE);
  for (const x of [-3.3, 3.3]) sb.cyl(x, 0, 17.0, 0.11, 0.11, 3.05, DARK, 10, { collide: true });
  sb.rbox(0, 3.25, 14.15, 8.4, 1.5, 0.3, BLUE, 0.06);
  sb.sign(0, 4.0, 14.31, 5.2, 1.3, logoTexture(), 0, { transparent: true });
  sb.sign(0, 4.0, 13.99, 5.2, 1.3, logoTexture(), Math.PI, { transparent: true });
  sb.box(0, 0.006, 13.1, 3.4, 0.015, 1.4, '#3a3f47', { cast: false });
  sb.sign(0, 0.025, 13.1, 3.0, 1.0, signTexture('mat', ['CHÀO MỪNG'], 512, 160, { bg: '#3a3f47', fg: '#ffd9bf', size: 64, radius: 4 }), 0).rotation.set(-Math.PI / 2, 0, 0);

  // biển tên phòng ở hành lang
  const roomSign = (key: string, label: string, x: number, z: number, ry: number) => {
    sb.sign(x, 2.86, z, 1.9, 0.42, signTexture('rs_' + key, [label], 512, 112, { bg: NAVY, fg: '#ffffff', size: 50, radius: 10 }), ry);
  };
  roomSign('iv', 'PHỎNG VẤN', -14, 1.85, Math.PI);
  roomSign('pt', 'PANTRY ☕', 14, 1.85, Math.PI);
  roomSign('of', 'VĂN PHÒNG MỞ', -10.5, -2.85, 0);
  roomSign('mt', 'PHÒNG HỌP', 2, -2.85, 0);
  roomSign('ha', 'HỘI TRƯỜNG', 14, -2.85, 0);
  roomSign('st', 'KHO · SERVER', -4.15, 2.86 - 0.0, Math.PI / 2);
  // chỉnh biển kho: đặt trên tường phía văn phòng
  sb.extra[sb.extra.length - 1].position.set(-4.15, 2.75, -19);
  sb.extra[sb.extra.length - 1].rotation.y = -Math.PI / 2;
}

function exteriorDecor(sb: StaticBuilder, axis: 'x' | 'z', at: number, s0: number, s1: number) {
  // hướng ra ngoài
  const out = axis === 'x' ? (at > 0 ? 1 : -1) : at > 0 ? 1 : -1;
  const len = s1 - s0;
  const mid = (s0 + s1) / 2;
  const off = WALL_T / 2 + 0.02;
  const P = (along: number, y: number, depth: number, sAlong: number, sy: number, sDepth: number, color: string, o = {}) => {
    if (axis === 'x') sb.box(along, y, at + out * depth, sAlong, sy, sDepth, color, o);
    else sb.box(at + out * depth, y, along, sDepth, sy, sAlong, color, o);
  };
  P(mid, 2.85, off, len, 0.35, 0.04, ORANGE, { cast: false });
  P(mid, 0, off, len, 0.4, 0.04, '#4a4f57', { cast: false });
  const n = Math.floor(len / 3.2);
  for (let i = 0; i < n; i++) {
    const c = s0 + (len - n * 3.2) / 2 + 1.6 + i * 3.2;
    P(c, 0.95, off + 0.01, 1.9, 1.5, 0.05, '#5b6470', { cast: false });
    P(c, 1.0, off + 0.04, 1.75, 1.4, 0.03, '#8fb8dc', { cast: false, m: { rough: 0.15, metal: 0.3 } });
    P(c, 1.0, -off - 0.04, 1.75, 1.4, 0.03, '#bfe0f7', { cast: false, m: { emissive: '#bfe0f7', emissiveIntensity: 0.35, rough: 0.2 } });
    P(c, 0.95, -off - 0.01, 1.9, 1.5, 0.02, '#e3dfd6', { cast: false });
  }
}

function buildRoof(): THREE.Group {
  const sb = new StaticBuilder();
  const w = BUILDING.maxX - BUILDING.minX + 0.6;
  const d = BUILDING.maxZ - BUILDING.minZ + 0.6;
  const cx = (BUILDING.maxX + BUILDING.minX) / 2;
  const cz = (BUILDING.maxZ + BUILDING.minZ) / 2;
  sb.box(cx, WALL_H, cz, w, 0.25, d, '#dcd8d0', { cast: false });
  sb.box(cx, WALL_H + 0.25, cz + d / 2 - 0.1, w, 0.45, 0.2, ORANGE, { cast: false });
  sb.box(cx, WALL_H + 0.25, cz - d / 2 + 0.1, w, 0.45, 0.2, '#e8e4dc', { cast: false });
  sb.box(cx - w / 2 + 0.1, WALL_H + 0.25, cz, 0.2, 0.45, d, '#e8e4dc', { cast: false });
  sb.box(cx + w / 2 - 0.1, WALL_H + 0.25, cz, 0.2, 0.45, d, '#e8e4dc', { cast: false });
  for (const [x, z] of [
    [-12, -10],
    [-8, -10],
    [10, -14],
    [14, 4],
  ]) {
    sb.rbox(x, WALL_H + 0.25, z, 1.6, 0.9, 1.2, '#c4c9cf', 0.05, { cast: false });
    sb.cyl(x, WALL_H + 1.15, z, 0.45, 0.45, 0.05, '#555', 16, { cast: false });
  }
  for (let i = 0; i < 6; i++) sb.box(-4 + i * 1.8, WALL_H + 0.25, -18, 1.5, 0.05, 2.4, '#2d3d5a', { cast: false, rx: 0, m: { rough: 0.2, metal: 0.4 } });
  return sb.build();
}

// ---------------------------------------------------------------- Đồ nội thất dùng lại
function plant(sb: StaticBuilder, x: number, z: number, s = 1) {
  sb.cyl(x, 0, z, 0.24 * s, 0.18 * s, 0.45 * s, '#e9e3d8', 12, { collide: [0, 1] });
  sb.cyl(x, 0.44 * s, z, 0.22 * s, 0.22 * s, 0.03, '#5a3d24', 12, { cast: false });
  sb.ico(x, 0.9 * s, z, 0.38 * s, '#3f8f45', { scale: [1, 1.2, 1] });
  sb.ico(x + 0.15 * s, 1.25 * s, z, 0.25 * s, '#55a94f');
  sb.ico(x - 0.12 * s, 1.2 * s, z + 0.1, 0.22 * s, '#4c9a45');
}

function officeChair(sb: StaticBuilder, x: number, z: number, ry: number, color = '#2f343b') {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    sb.box(x + Math.cos(a) * 0.17, 0.04, z + Math.sin(a) * 0.17, 0.34, 0.04, 0.05, '#3a3a3a', { ry: -a, cast: false });
    sb.sphere(x + Math.cos(a) * 0.32, 0.04, z + Math.sin(a) * 0.32, 0.04, '#222', { cast: false }, 6);
  }
  sb.cyl(x, 0.06, z, 0.03, 0.03, 0.36, METAL, 8);
  sb.rbox(x, 0.42, z, 0.5, 0.08, 0.48, color, 0.03, { ry });
  // tựa lưng (phía sau người ngồi, ngược hướng nhìn)
  sb.rbox(x - s * 0.24, 0.52, z - c * 0.24, 0.46, 0.55, 0.07, color, 0.03, { ry });
}

function desk(sb: StaticBuilder, x: number, z: number, w: number, d: number, top = '#e9e1d3', h = 0.74) {
  sb.box(x, h - 0.04, z, w, 0.04, d, top);
  for (const sx of [-1, 1]) sb.box(x + sx * (w / 2 - 0.04), 0, z, 0.05, h - 0.04, d - 0.06, '#7d8590', { cast: false });
}

function monitor(sb: StaticBuilder, x: number, y: number, z: number, ry: number, glow = '#7cc4ff') {
  const s = Math.sin(ry);
  const c = Math.cos(ry);
  sb.box(x, y, z, 0.2, 0.02, 0.14, '#333', { ry, cast: false });
  sb.box(x, y, z, 0.04, 0.18, 0.04, '#333', { ry, cast: false });
  sb.box(x, y + 0.14, z, 0.56, 0.34, 0.03, '#1f2329', { ry });
  sb.box(x + s * 0.017, y + 0.155, z + c * 0.017, 0.52, 0.3, 0.005, glow, { ry, cast: false, m: { emissive: glow, emissiveIntensity: 0.55, rough: 0.3 } });
}

function bookshelf(sb: StaticBuilder, x: number, z: number, w: number, ry: number, h = 2.0) {
  const rot = Math.abs(Math.sin(ry)) > 0.7;
  sb.box(x, 0, z, rot ? 0.4 : w, h, rot ? w : 0.4, WOOD_D, { collide: true });
  const cols = ['#e03131', '#1971c2', '#fab005', '#2b8a3e', '#f8f9fa', '#7048e8', '#e8590c'];
  for (let lv = 0; lv < 4; lv++) {
    const y = 0.15 + lv * (h / 4);
    let p = -w / 2 + 0.1;
    let i = lv * 3;
    while (p < w / 2 - 0.15) {
      const bw = 0.05 + ((i * 37) % 7) / 100;
      const bh = 0.24 + ((i * 13) % 5) / 50;
      const out = rot ? Math.sign(-Math.sin(ry)) * 0.21 : Math.sign(Math.cos(ry)) * 0.21;
      if (rot) sb.box(x + out, y, z + p, 0.03, bh, bw, cols[i % cols.length], { cast: false });
      else sb.box(x + p, y, z + out, bw, bh, 0.03, cols[i % cols.length], { cast: false });
      p += bw + 0.01;
      i++;
    }
  }
}

function sofa(sb: StaticBuilder, x: number, z: number, ry: number, color: string, len = 2.0) {
  const rot = Math.abs(Math.sin(ry)) > 0.7;
  const fw = rot ? 0.9 : len;
  const fd = rot ? len : 0.9;
  sb.rbox(x, 0.08, z, fw, 0.36, fd, color, 0.08, { collide: [0, 0.9] });
  // lưng ghế nằm phía sau (ngược hướng nhìn)
  const bx = x - Math.sin(ry) * 0.36;
  const bz = z - Math.cos(ry) * 0.36;
  sb.rbox(bx, 0.3, bz, rot ? 0.2 : len, 0.55, rot ? len : 0.2, color, 0.08);
  for (const sgn of [-1, 1]) {
    const ax = rot ? x : x + sgn * (len / 2 - 0.1);
    const az = rot ? z + sgn * (len / 2 - 0.1) : z;
    sb.rbox(ax, 0.3, az, rot ? 0.9 : 0.2, 0.32, rot ? 0.2 : 0.9, color, 0.08);
  }
  sb.rbox(x + Math.sin(ry) * 0.05, 0.42, z + Math.cos(ry) * 0.05, rot ? 0.6 : len - 0.35, 0.1, rot ? len - 0.35 : 0.6, '#ffffff', 0.04, { cast: false, m: { rough: 0.9 } });
  for (const sgn of [-1, 1]) sb.box(x + (rot ? 0 : sgn * (len / 2 - 0.15)), 0, z + (rot ? sgn * (len / 2 - 0.15) : 0), 0.06, 0.08, 0.06, '#333', { cast: false });
}

function roundTable(sb: StaticBuilder, x: number, z: number, r = 0.5, top = WHITE) {
  sb.cyl(x, 0.72, z, r, r, 0.04, top, 20);
  sb.cyl(x, 0, z, 0.05, 0.05, 0.72, METAL, 8);
  sb.cyl(x, 0, z, 0.28, 0.3, 0.03, METAL, 14, { cast: false });
  addBox(x, z, r * 1.6, r * 1.6, 0, 0.8);
}

function stool(sb: StaticBuilder, x: number, z: number, color: string) {
  sb.cyl(x, 0.44, z, 0.19, 0.19, 0.06, color, 14);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    sb.box(x + Math.cos(a) * 0.12, 0, z + Math.sin(a) * 0.12, 0.03, 0.44, 0.03, METAL, { cast: false });
  }
}

function foldingChair(sb: StaticBuilder, x: number, z: number, color: string) {
  sb.box(x, 0.43, z, 0.42, 0.04, 0.42, color);
  sb.box(x, 0.47, z - 0.2, 0.42, 0.4, 0.04, color);
  for (const dx of [-0.19, 0.19]) for (const dz of [-0.19, 0.19]) sb.box(x + dx, 0, z + dz, 0.03, dz < 0 ? 0.87 : 0.43, 0.03, '#555', { cast: false });
}

function cabinet(sb: StaticBuilder, x: number, z: number, ry: number, color = '#c3c8ce', h = 1.3) {
  const rot = Math.abs(Math.sin(ry)) > 0.7;
  sb.box(x, 0, z, rot ? 0.6 : 0.8, h, rot ? 0.8 : 0.6, color, { collide: true });
  const n = Math.round(h / 0.33);
  const fx = rot ? Math.sign(Math.sin(ry)) * 0.305 : 0;
  const fz = rot ? 0 : Math.sign(Math.cos(ry)) * 0.305;
  for (let i = 0; i < n; i++) {
    sb.box(x + fx, 0.1 + i * 0.32, z + fz, rot ? 0.01 : 0.7, 0.26, rot ? 0.7 : 0.01, '#aeb4bb', { cast: false });
    sb.box(x + fx * 1.04, 0.2 + i * 0.32, z + fz * 1.04, rot ? 0.02 : 0.2, 0.03, rot ? 0.2 : 0.02, '#555', { cast: false });
  }
}

// ---------------------------------------------------------------- Sảnh
function lobby(sb: StaticBuilder) {
  // quầy lễ tân
  sb.rbox(0, 0, 6.35, 3.4, 1.05, 0.7, WHITE, 0.05);
  for (const s of [-1, 1]) sb.rbox(s * 2.25, 0, 6.0, 1.4, 1.05, 0.7, WHITE, 0.05, { ry: -s * 0.45 });
  sb.box(0, 1.05, 6.35, 3.6, 0.05, 0.85, '#d9cbb5');
  for (const s of [-1, 1]) sb.box(s * 2.25, 1.05, 6.0, 1.55, 0.05, 0.85, '#d9cbb5', { ry: -s * 0.45 });
  sb.box(0, 0.35, 6.71, 3.4, 0.1, 0.02, ORANGE, { cast: false });
  addBox(0, 6.2, 5.6, 1.2, 0, 1.2);
  monitor(sb, -0.6, 1.1, 6.15, Math.PI);
  sb.box(0.7, 1.1, 6.3, 0.25, 0.15, 0.18, '#333');
  sb.sign(0, 0.7, 6.72, 2.0, 0.42, signTexture('recv', ['LỄ TÂN · RECEPTION'], 512, 108, { bg: '#ffffff', fg: NAVY, size: 46, radius: 6 }));
  // tường logo
  sb.box(0, 0, 3.3, 8, 3.0, 0.3, NAVY, { collide: true });
  sb.sign(0, 1.8, 3.46, 4.6, 1.44, logoTexture(), 0, { transparent: true });
  sb.sign(0, 1.8, 3.14, 4.6, 1.44, logoTexture(), Math.PI, { transparent: true });
  sb.sign(0, 0.75, 3.46, 4.6, 0.4, signTexture('slogan', ['Tôn trọng · Đổi mới · Đồng đội · Chí công · Gương mẫu · Sáng suốt'], 1024, 90, { bg: NAVY, fg: '#ffd9bf', size: 36, radius: 0 }));
  for (let i = 0; i < 3; i++) sb.box(-3.2 + i * 0.25, 2.6, 3.47, 0.18, 0.18, 0.02, [ORANGE, BLUE, GREEN][i], { cast: false });
  // sofa + bàn
  sofa(sb, -6.6, 10.6, Math.PI / 2, '#3d5a80', 2.2);
  sofa(sb, -3.6, 10.6, -Math.PI / 2, '#3d5a80', 2.2);
  sb.rbox(-5.1, 0.0, 10.6, 1.0, 0.42, 1.6, WOOD, 0.04, { collide: true });
  sb.box(-5.3, 0.42, 10.4, 0.3, 0.02, 0.4, '#fff', { cast: false });
  sb.cyl(-4.9, 0.42, 10.9, 0.08, 0.06, 0.12, ORANGE, 10, { cast: false });
  sb.box(-5.1, 0.008, 10.6, 4.4, 0.01, 3.2, '#d9cdb8', { cast: false });
  // bảng thông báo + tủ cúp (tường x = -8)
  sb.box(-7.83, 1.0, 4.6, 0.06, 1.3, 2.0, WOOD_D);
  sb.sign(-7.79, 1.65, 4.6, 1.85, 1.15, corkTexture(), Math.PI / 2);
  sb.sign(-7.78, 2.45, 4.6, 1.6, 0.3, signTexture('nb', ['BẢNG THÔNG BÁO'], 512, 96, { bg: ORANGE, fg: '#fff', size: 48, radius: 6 }), Math.PI / 2);
  sb.box(-7.55, 0, 7.0, 0.5, 2.0, 1.6, WOOD_D, { collide: true });
  sb.box(-7.3, 0.2, 7.0, 0.04, 1.75, 1.5, '#cfe8ff', { m: GLASS, cast: false });
  for (let lv = 0; lv < 3; lv++) {
    sb.box(-7.55, 0.55 + lv * 0.5, 7.0, 0.45, 0.03, 1.5, '#e9e1d3', { cast: false });
    for (let i = 0; i < 3; i++) {
      const z = 6.55 + i * 0.45;
      const y = 0.58 + lv * 0.5;
      sb.cyl(-7.55, y, z, 0.05, 0.07, 0.06, '#c9a227', 10, { m: { metal: 0.7, rough: 0.3 }, cast: false });
      sb.cyl(-7.55, y + 0.06, z, 0.025, 0.025, 0.12, '#d4af37', 8, { m: { metal: 0.7, rough: 0.3 }, cast: false });
      sb.sphere(-7.55, y + 0.24, z, 0.08, '#e5c158', { m: { metal: 0.7, rough: 0.25 }, cast: false, scale: [1, 0.9, 1] }, 10);
    }
  }
  // thang máy (tường x = 8)
  sb.box(7.85, 0, 10.5, 0.08, 2.6, 2.0, '#8d96a0', { m: { metal: 0.6, rough: 0.3 } });
  sb.box(7.8, 0, 10.0, 0.04, 2.4, 0.9, '#c9d0d8', { m: { metal: 0.8, rough: 0.2 } });
  sb.box(7.8, 0, 11.0, 0.04, 2.4, 0.9, '#c9d0d8', { m: { metal: 0.8, rough: 0.2 } });
  sb.box(7.78, 1.1, 11.75, 0.03, 0.3, 0.14, '#333');
  sb.sphere(7.76, 1.25, 11.75, 0.03, '#ffd43b', { m: { emissive: '#ffd43b' }, cast: false }, 8);
  sb.sign(7.79, 2.75, 10.5, 0.6, 0.25, signTexture('elev', ['▲ 47'], 256, 96, { bg: '#111', fg: '#ff6b35', size: 60, radius: 4 }), -Math.PI / 2, { emissive: 0.8 });
  // máy cấp thẻ
  const [kx, kz] = POS.kiosk;
  sb.rbox(kx + 0.2, 0, kz, 0.55, 1.45, 0.6, '#eef1f4', 0.06, { collide: true });
  sb.box(kx + 0.05, 1.45, kz, 0.3, 0.12, 0.62, ORANGE);
  sb.box(kx - 0.1, 0.65, kz, 0.06, 0.15, 0.35, '#333');
  sb.sign(kx - 0.08, 1.85, kz, 0.62, 0.22, signTexture('kiosk', ['CẤP THẺ'], 256, 90, { bg: BLUE, fg: '#fff', size: 52, radius: 6 }), -Math.PI / 2);
  // cây cảnh
  plant(sb, -7.25, 13.25, 1.1);
  plant(sb, 7.25, 13.25, 1.1);
  plant(sb, 7.3, 2.7, 0.9);
  plant(sb, -7.3, 2.7, 0.9);
  plant(sb, 3.2, 12.8, 0.8);
}

// ---------------------------------------------------------------- Phòng phỏng vấn
function interview(sb: StaticBuilder) {
  desk(sb, -14.5, 8.8, 3.0, 1.3, '#f4ede2', 0.75);
  sb.box(-14.5, 0, 9.3, 2.8, 0.7, 0.04, '#d6c8b2', { cast: false });
  addBox(-14.5, 8.8, 3.0, 1.3, 0, 0.8);
  officeChair(sb, -14.5, 10.15, Math.PI, '#e8590c');
  officeChair(sb, -15.3, 7.45, 0, '#3d5a80');
  officeChair(sb, -13.7, 7.45, 0, '#3d5a80');
  // laptop + hồ sơ
  sb.box(-14.5, 0.75, 9.2, 0.38, 0.02, 0.26, '#adb5bd');
  sb.box(-14.5, 0.77, 9.33, 0.38, 0.24, 0.015, '#495057', { rx: -0.2 });
  for (let i = 0; i < 4; i++) sb.box(-13.6, 0.75 + i * 0.025, 8.9, 0.3, 0.02, 0.4, ['#fff', '#ffe066', '#fff', '#a5d8ff'][i], { ry: 0.1 * i, cast: false });
  sb.box(-15.5, 0.75, 8.8, 0.28, 0.08, 0.1, NAVY);
  sb.cyl(-15.2, 0.75, 8.5, 0.035, 0.035, 0.2, '#74c0fc', 8, { m: { transparent: true, opacity: 0.6 }, cast: false });
  bookshelf(sb, -17.5, 13.6, 3.0, Math.PI);
  plant(sb, -20.3, 13.3, 1.1);
  plant(sb, -9.0, 2.7, 0.9);
  sb.box(-20.84, 0.9, 7.5, 0.04, 1.2, 2.4, '#ffffff');
  sb.sign(-20.81, 1.5, 7.5, 2.3, 1.1, signTexture('ivwb', ['**QUY TRÌNH PHỎNG VẤN', '1. Cười', '2. Hỏi', '3. Cười tiếp', '4. "Em có câu hỏi gì không?"'], 512, 256, { bg: '#ffffff', fg: '#1c4e8c', size: 32, align: 'left' }), Math.PI / 2);
  sb.sign(-18, 1.7, 2.14, 2.2, 1.1, signTexture('values', ['**6 GIÁ TRỊ FTEL', 'Tôn trọng · Đổi mới · Đồng đội', 'Chí công · Gương mẫu · Sáng suốt'], 512, 256, { bg: ORANGE, fg: '#ffffff', size: 34 }), 0);
  cabinet(sb, -9.0, 12.5, -Math.PI / 2, '#d0d5db', 1.0);
}

// ---------------------------------------------------------------- Pantry
function pantry(sb: StaticBuilder) {
  const cx = POS.counterX;
  sb.box(cx, 0, 8, 0.8, 0.98, 7.6, '#f1ece2', { collide: [0, 1.1] });
  sb.box(cx, 0.98, 8, 0.95, 0.05, 7.8, '#3a3f47');
  sb.box(cx - 0.41, 0.2, 8, 0.02, 0.15, 7.6, ORANGE, { cast: false });
  // quầy sau + kệ
  sb.box(20.45, 0, 8, 0.8, 0.9, 8, '#e9e3d8', { collide: [0, 1.0] });
  sb.box(20.45, 0.9, 8, 0.85, 0.05, 8, '#3a3f47');
  sb.box(20.7, 1.6, 8, 0.4, 0.04, 7, WOOD);
  sb.box(20.7, 2.1, 8, 0.4, 0.04, 7, WOOD);
  for (let i = 0; i < 12; i++) sb.cyl(20.7, 1.64 + (i % 2) * 0.5, 4.8 + i * 0.55, 0.06, 0.05, 0.14, ['#fff', ORANGE, BLUE, '#ffd43b'][i % 4], 8, { cast: false });
  // lò vi sóng, bồn rửa
  sb.box(20.4, 0.95, 10.6, 0.5, 0.32, 0.6, '#dee2e6');
  sb.box(20.14, 1.0, 10.6, 0.01, 0.22, 0.4, '#222', { cast: false });
  sb.box(20.4, 0.94, 6.8, 0.5, 0.02, 0.6, '#adb5bd', { m: { metal: 0.7, rough: 0.3 } });
  sb.cyl(20.6, 0.95, 6.8, 0.02, 0.02, 0.35, METAL, 6);
  // máy pha cà phê trên quầy trước
  const [, cfz] = POS.coffee;
  sb.rbox(cx, 1.03, cfz, 0.45, 0.6, 0.45, '#2b2b2b', 0.04);
  sb.box(cx - 0.23, 1.35, cfz, 0.02, 0.15, 0.28, '#7cc4ff', { cast: false, m: { emissive: '#7cc4ff', emissiveIntensity: 0.6 } });
  sb.cyl(cx - 0.12, 1.06, cfz, 0.05, 0.04, 0.1, '#fff', 10, { cast: false });
  sb.cyl(cx, 1.63, cfz, 0.12, 0.12, 0.08, '#555', 12);
  // trái cây + ly
  sb.cyl(cx, 1.03, 9.6, 0.2, 0.12, 0.08, '#e9e3d8', 14, { cast: false });
  for (let i = 0; i < 5; i++) sb.sphere(cx - 0.08 + (i % 3) * 0.08, 1.15, 9.55 + Math.floor(i / 3) * 0.1, 0.06, ['#ff922b', '#ffd43b', '#e03131'][i % 3], { cast: false }, 8);
  sb.sign(cx - 0.42, 0.62, 8, 2.2, 0.35, signTexture('pantrySign', ['CÔ THU · PANTRY'], 512, 80, { bg: '#e64980', fg: '#fff', size: 42, radius: 6 }), -Math.PI / 2);
  // tủ lạnh
  const [fx, fz] = POS.fridge;
  sb.rbox(fx, 0, fz, 1.0, 2.0, 0.8, '#e9edf2', 0.05, { collide: true });
  sb.box(fx, 1.25, fz - 0.41, 0.98, 0.01, 0.01, '#9aa3ad', { cast: false });
  sb.box(fx + 0.38, 0.6, fz - 0.42, 0.04, 0.5, 0.04, METAL);
  sb.box(fx + 0.38, 1.4, fz - 0.42, 0.04, 0.4, 0.04, METAL);
  sb.box(fx - 0.2, 1.5, fz - 0.41, 0.15, 0.15, 0.005, '#fff8c4', { cast: false });
  // bình nước
  sb.box(9.0, 0, 13.4, 0.4, 1.0, 0.4, '#f1f3f5', { collide: true });
  sb.cyl(9.0, 1.0, 13.4, 0.15, 0.15, 0.45, '#74c0fc', 12, { m: { transparent: true, opacity: 0.55 }, cast: false });
  // thực đơn
  sb.box(13, 1.25, 13.86, 1.6, 1.0, 0.04, '#2b2b2b');
  sb.sign(13, 1.75, 13.83, 1.5, 0.9, signTexture('menu', ['**THỰC ĐƠN', 'Cơm gà xối mỡ', 'Canh chua cá lóc', 'Rau muống xào tỏi', 'Tráng miệng: BÍ MẬT'], 384, 240, { bg: '#2b2b2b', fg: '#f8f9fa', size: 28 }), Math.PI);
  // bàn ăn
  const stc = ['#ff922b', '#4dabf7', '#69db7c', '#ffd43b'];
  [
    [10.8, 6.4],
    [14.4, 6.4],
    [10.8, 10.0],
    [14.4, 10.0],
  ].forEach(([x, z], i) => {
    roundTable(sb, x, z, 0.5);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + i;
      stool(sb, x + Math.cos(a) * 0.85, z + Math.sin(a) * 0.85, stc[(i + k) % 4]);
    }
  });
  plant(sb, 9.0, 2.7, 0.9);
  plant(sb, 12.2, 2.7, 0.8);
}

// ---------------------------------------------------------------- Hành lang
function corridor(sb: StaticBuilder) {
  // máy bán hàng
  sb.rbox(-20.45, 0, -0.5, 0.8, 1.9, 0.95, '#e03131', 0.05, { collide: true });
  sb.box(-20.04, 0.7, -0.6, 0.02, 1.0, 0.6, '#cfe8ff', { m: { ...GLASS, opacity: 0.5 }, cast: false });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) sb.cyl(-20.15, 0.78 + r * 0.24, -0.82 + c * 0.15, 0.04, 0.04, 0.14, ['#ffd43b', '#4dabf7', '#69db7c', '#ff922b'][(r + c) % 4], 8, { cast: false });
  sb.box(-20.04, 1.45, -0.05, 0.02, 0.18, 0.18, '#222', { cast: false });
  // cây nước
  sb.box(20.5, 0, -0.5, 0.45, 1.0, 0.45, '#f1f3f5', { collide: true });
  sb.cyl(20.5, 1.0, -0.5, 0.16, 0.16, 0.48, '#74c0fc', 12, { m: { transparent: true, opacity: 0.55 }, cast: false });
  // cây cảnh, ghế chờ
  plant(sb, -7.0, 1.55, 0.9);
  plant(sb, 7.0, 1.55, 0.9);
  plant(sb, 20.3, 1.4, 0.9);
  plant(sb, -20.3, 1.4, 0.9);
  sb.box(-2.2, 0, -2.55, 1.6, 0.45, 0.45, WOOD, { collide: true });
  sb.box(-6.8, 0, -2.55, 1.6, 0.45, 0.45, WOOD, { collide: true });
  // mũi tên trên sàn
  for (const [x, ry] of [
    [-9, Math.PI / 2],
    [9, -Math.PI / 2],
  ] as [number, number][]) {
    sb.box(x, 0.014, -0.5, 1.2, 0.005, 0.25, ORANGE, { ry, cast: false });
  }
}

// ---------------------------------------------------------------- Văn phòng mở
function office(sb: StaticBuilder) {
  const tops = ['#ece4d6', '#e8e0d0'];
  DESK_CLUSTERS.forEach(([cx, cz], ci) => {
    for (const sx of [-0.85, 0.85]) for (const sz of [-0.42, 0.42]) desk(sb, cx + sx, cz + sz, 1.62, 0.82, tops[ci % 2]);
    sb.box(cx, 0.74, cz, 3.3, 0.42, 0.05, ci % 2 ? BLUE : ORANGE);
    sb.box(cx, 0, cz, 3.3, 0.74, 0.04, '#9aa3ad', { cast: false });
    addBox(cx, cz, 3.34, 1.7, 0, 1.2);
    for (let i = 0; i < 4; i++) {
      const seat = deskSeat(ci, i);
      const front = i < 2;
      const mz = cz + (front ? 0.2 : -0.2);
      monitor(sb, seat.x, 0.74, mz, front ? 0 : Math.PI, ['#7cc4ff', '#9be7a5', '#ffd8a8', '#d0bfff'][(ci + i) % 4]);
      sb.box(seat.x, 0.74, cz + (front ? 0.55 : -0.55), 0.42, 0.02, 0.14, '#3a3f47', { cast: false });
      officeChair(sb, seat.x, seat.z, seat.rot, ['#2f343b', '#3d5a80', '#495057'][(ci + i) % 3]);
      if ((ci + i) % 3 === 0) sb.cyl(seat.x + 0.55, 0.74, cz + (front ? 0.5 : -0.5), 0.045, 0.04, 0.1, ['#fff', ORANGE, '#ffd43b'][i % 3], 10, { cast: false });
      if ((ci * 4 + i) % 5 === 1) {
        sb.cyl(seat.x - 0.6, 0.74, cz + (front ? 0.55 : -0.55), 0.06, 0.05, 0.08, '#c08457', 8, { cast: false });
        sb.ico(seat.x - 0.6, 0.88, cz + (front ? 0.55 : -0.55), 0.08, '#4c9a45', { cast: false });
      }
    }
  });
  // số bàn 7
  const my = POS.myDesk;
  sb.sign(my.x, 1.05, DESK_CLUSTERS[2][1] + 0.03, 0.34, 0.2, signTexture('desk7', ['BÀN 7'], 256, 128, { bg: '#ffd43b', fg: NAVY, size: 64, radius: 10 }), 0);
  sb.box(my.x + 0.3, 0.76, my.z - 0.55, 0.12, 0.12, 0.005, '#fff3bf', { cast: false, rx: -Math.PI / 2 });
  sb.cyl(my.x - 0.45, 0.74, my.z - 0.6, 0.05, 0.045, 0.11, '#ffffff', 10, { cast: false });
  sb.cyl(my.x - 0.62, 0.74, my.z - 0.62, 0.05, 0.05, 0.06, '#c08457', 8, { cast: false });
  sb.cone(my.x - 0.62, 0.8, my.z - 0.62, 0.035, 0.12, '#5c940d', 6, { cast: false });
  // điện thoại bàn
  const ph = POS.deskPhone;
  sb.rbox(ph.x + 0.35, 0.74, ph.z + 0.75, 0.22, 0.07, 0.18, '#212529', 0.02);
  sb.rbox(ph.x + 0.35, 0.81, ph.z + 0.75, 0.2, 0.04, 0.06, '#343a40', 0.02);
  // máy in
  const [px, pz] = POS.printer;
  sb.rbox(px + 0.15, 0, pz, 0.7, 0.75, 0.9, '#dee2e6', 0.04, { collide: [0, 1.2] });
  sb.rbox(px + 0.15, 0.75, pz, 0.7, 0.3, 0.9, '#f1f3f5', 0.04);
  sb.box(px - 0.22, 0.68, pz, 0.08, 0.04, 0.55, '#adb5bd', { cast: false });
  sb.box(px + 0.1, 1.05, pz + 0.2, 0.25, 0.02, 0.2, '#343a40', { cast: false });
  sb.box(px - 0.19, 0.95, pz - 0.3, 0.02, 0.06, 0.12, '#7cc4ff', { cast: false, m: { emissive: '#7cc4ff' } });
  sb.sign(px - 0.21, 0.4, pz, 0.6, 0.22, signTexture('printer', ['MÁY IN'], 256, 90, { bg: '#495057', fg: '#fff', size: 52, radius: 6 }), -Math.PI / 2);
  // tủ hồ sơ
  for (const z of [-6.2, -7.0, -10.6, -11.4]) cabinet(sb, -20.55, z, Math.PI / 2, '#c3c8ce', 1.3);
  // góc IT
  desk(sb, -18.2, -21.45, 2.0, 0.85, '#dfe3e8');
  addBox(-18.2, -21.45, 2.0, 0.85, 0, 1.0);
  monitor(sb, -18.8, 0.74, -21.65, 0.25, '#9be7a5');
  monitor(sb, -18.2, 0.74, -21.7, 0, '#7cc4ff');
  monitor(sb, -17.6, 0.74, -21.65, -0.25, '#3bc9db');
  officeChair(sb, -18.2, -20.6, Math.PI, '#212529');
  sb.box(-20.45, 0, -22.9, 0.8, 1.8, 0.8, '#212529', { collide: true });
  for (let i = 0; i < 8; i++) sb.box(-20.04, 0.2 + i * 0.2, -22.9 + ((i % 3) - 1) * 0.2, 0.02, 0.03, 0.05, i % 2 ? '#51cf66' : '#ffd43b', { cast: false, m: { emissive: i % 2 ? '#51cf66' : '#ffd43b' } });
  sb.sign(-18.2, 2.2, -23.84, 2.2, 0.5, signTexture('it', ['IT HELPDESK'], 512, 112, { bg: '#212529', fg: '#69db7c', size: 56, radius: 8 }), 0, { emissive: 0.4 });
  sb.sign(-18.2, 1.55, -23.84, 1.8, 0.4, signTexture('it2', ['"Khởi động lại chưa?"'], 512, 112, { bg: '#ffffff', fg: '#212529', size: 44, radius: 8 }), 0);
  // bàn kế toán chị Hạnh
  desk(sb, -9.2, -21.45, 2.0, 0.85, '#efe6d5');
  addBox(-9.2, -21.45, 2.0, 0.85, 0, 1.0);
  monitor(sb, -9.5, 0.74, -21.7, 0, '#d0bfff');
  officeChair(sb, -9.2, -20.6, Math.PI, '#6741d9');
  sb.rbox(-8.55, 0.74, -21.35, 0.28, 0.04, 0.36, '#495057', 0.02);
  for (let i = 0; i < 6; i++) sb.box(-10.0, 0.74 + i * 0.03, -21.4, 0.3, 0.025, 0.4, '#ffffff', { ry: i * 0.05, cast: false });
  cabinet(sb, -6.3, -23.4, 0, '#d0bfff', 1.6);
  sb.sign(-6.3, 1.85, -23.09, 0.75, 0.24, signTexture('a4', ['GIẤY A4'], 256, 80, { bg: '#6741d9', fg: '#fff', size: 46, radius: 6 }), 0);
  // đồng hồ treo tường + bảng
  sb.cyl(-20.86, 2.3, -16, 0.32, 0.32, 0.05, '#ffffff', 24, { rz: Math.PI / 2 });
  sb.torus(-20.83, 2.3, -16, 0.32, 0.03, DARK, { ry: Math.PI / 2 });
  sb.box(-20.8, 2.3, -16.08, 0.01, 0.2, 0.025, DARK, { cast: false, rx: 0.5 });
  sb.box(-20.8, 2.3, -15.95, 0.01, 0.025, 0.25, '#e03131', { cast: false, rx: 0.2 });
  sb.box(-13.5, 0.9, -23.86, 2.6, 1.2, 0.04, '#ffffff');
  sb.sign(-13.5, 1.5, -23.83, 2.5, 1.1, signTexture('ofwb', ['**DEADLINE TUẦN NÀY', '☐ Báo cáo quý 3 (bản final_v9)', '☐ Họp "5 phút" lúc 16:59', '☑ Uống cà phê'], 512, 240, { bg: '#ffffff', fg: '#c92a2a', size: 30, align: 'left' }), 0);
  plant(sb, -20.2, -4.0, 1.1);
  plant(sb, -4.7, -23.3, 1.0);
  plant(sb, -13.0, -4.0, 0.9);
  plant(sb, -4.7, -11.5, 0.9);
}

// ---------------------------------------------------------------- Phòng họp
function meeting(sb: StaticBuilder) {
  sb.rbox(2, 0.71, -8.5, 6.4, 0.06, 2.0, '#6b4a2b', 0.03);
  for (const x of [-0.6, 4.6]) sb.box(x, 0, -8.5, 0.12, 0.71, 1.4, '#3a3f47', { cast: false });
  addBox(2, -8.5, 6.4, 2.0, 0, 0.9);
  for (const x of [-0.4, 1.2, 2.8, 4.4]) {
    officeChair(sb, x, -7.05, Math.PI, '#212529');
    officeChair(sb, x, -9.95, 0, '#212529');
  }
  for (let i = 0; i < 5; i++) sb.box(-0.2 + i * 1.1, 0.77, -8.4 + ((i % 2) - 0.5) * 0.6, 0.3, 0.01, 0.22, '#ffffff', { cast: false, ry: i * 0.3 });
  sb.cyl(2, 0.77, -8.5, 0.12, 0.14, 0.05, '#212529', 16, { cast: false });
  // màn hình
  sb.box(2, 0.85, -13.84, 3.4, 1.95, 0.06, '#111');
  sb.sign(2, 1.82, -13.8, 3.2, 1.8, signTexture('mscreen', ['**KẾ HOẠCH QUÝ 4', 'Mục tiêu: không còn cuộc họp', 'nào kéo dài quá 5 phút', '(slide 1/94)'], 640, 360, { bg: '#0A6FC2', fg: '#ffffff', size: 40 }), 0, { emissive: 0.6 });
  // bảng trắng
  sb.box(7.84, 0.85, -8, 0.04, 1.3, 2.6, '#ffffff');
  sb.sign(7.81, 1.5, -8, 2.5, 1.25, whiteboardTexture(), -Math.PI / 2);
  plant(sb, -3.4, -13.4, 0.9);
  plant(sb, 7.4, -13.4, 0.9);
  plant(sb, 7.4, -3.6, 0.8);
}

// ---------------------------------------------------------------- Kho & server
function storage(sb: StaticBuilder) {
  // kệ dọc tường x=-4
  for (const [z0, z1] of [
    [-17.6, -14.4],
    [-23.8, -20.6],
  ]) {
    const zc = (z0 + z1) / 2;
    const len = z1 - z0;
    sb.box(-3.55, 0, zc, 0.6, 0.04, len, METAL);
    for (let lv = 0; lv < 4; lv++) sb.box(-3.55, 0.05 + lv * 0.55, zc, 0.6, 0.04, len, METAL, { cast: false });
    for (const z of [z0 + 0.05, z1 - 0.05]) for (const x of [-3.83, -3.27]) sb.box(x, 0, z, 0.04, 2.2, 0.04, '#6c757d', { cast: false });
    addBox(-3.55, zc, 0.65, len, 0, 2.2);
    for (let lv = 0; lv < 4; lv++)
      for (let i = 0; i < 4; i++) {
        if ((lv + i) % 3 === 2) continue;
        const z = z0 + 0.45 + i * (len - 0.6) / 4;
        sb.box(-3.55, 0.09 + lv * 0.55, z, 0.5, 0.36, 0.55, ['#c9a46b', '#b8925a', '#d4b483'][(lv + i) % 3], { cast: false });
      }
  }
  // hộp thiết bị (micro)
  sb.box(-3.0, 0, -16.2, 0.6, 0.45, 0.5, '#4a4f57', { collide: true });
  sb.box(-3.0, 0.45, -16.2, 0.62, 0.03, 0.06, '#ffd43b', { cast: false });
  sb.sign(-2.69, 0.25, -16.2, 0.5, 0.16, signTexture('equip', ['THIẾT BỊ'], 256, 80, { bg: '#ffd43b', fg: '#222', size: 46, radius: 4 }), Math.PI / 2);
  // tủ server
  for (let i = 0; i < 5; i++) {
    const x = 3.4 + i * 0.95;
    sb.box(x, 0, -23.35, 0.85, 2.2, 0.9, '#1d2127', { collide: true });
    for (let k = 0; k < 9; k++) {
      sb.box(x, 0.2 + k * 0.21, -22.89, 0.75, 0.15, 0.02, '#2c323a', { cast: false });
      sb.box(x - 0.28 + ((k * 3 + i) % 4) * 0.05, 0.27 + k * 0.21, -22.875, 0.025, 0.025, 0.01, ['#51cf66', '#4dabf7', '#ffd43b'][(k + i) % 3], { cast: false, m: { emissive: ['#51cf66', '#4dabf7', '#ffd43b'][(k + i) % 3] } });
    }
  }
  // ảnh cũ trên tường z=-14 (mặt hướng vào kho)
  const [phx] = POS.oldPhoto;
  sb.box(phx, 1.2, -14.17, 0.95, 0.8, 0.05, '#6b4a2b');
  sb.sign(phx, 1.6, -14.2, 0.82, 0.66, photoTexture(), Math.PI);
  // bàn máy tính cũ
  desk(sb, 2, -19.2, 1.6, 0.8, '#c9b896');
  addBox(2, -19.2, 1.6, 0.8, 0, 1.0);
  sb.rbox(2, 0.74, -19.3, 0.5, 0.42, 0.45, '#e6dcc4', 0.05);
  sb.box(2, 0.83, -19.07, 0.38, 0.28, 0.01, '#2b8a3e', { cast: false, m: { emissive: '#2b8a3e', emissiveIntensity: 0.5 } });
  // thùng carton, bóng bay dự trữ
  for (const [x, z, h] of [
    [6.8, -15.0, 0.5],
    [7.2, -15.8, 0.9],
    [6.6, -16.6, 0.5],
    [0.4, -23.2, 0.6],
  ]) sb.box(x, 0, z, 0.7, h, 0.6, '#c9a46b', { collide: true });
  for (let i = 0; i < 6; i++) sb.sphere(6.2 + (i % 3) * 0.3, 1.2 + Math.floor(i / 3) * 0.35, -17.4, 0.18, ['#ff6b6b', '#4dabf7', '#ffd43b'][i % 3], { cast: false, m: { rough: 0.3 } }, 10);
}

// ---------------------------------------------------------------- Hội trường
function hall(sb: StaticBuilder) {
  const st = POS.stage;
  const sw = st.x1 - st.x0;
  const sd = st.z1 - st.z0;
  sb.box((st.x0 + st.x1) / 2, 0, (st.z0 + st.z1) / 2, sw, st.h, sd, '#7a4f2c');
  sb.box((st.x0 + st.x1) / 2, st.h - 0.02, st.z1 - 0.06, sw, 0.04, 0.12, ORANGE, { cast: false });
  addHeight((st.x0 + st.x1) / 2, (st.z0 + st.z1) / 2, sw, sd, st.h);
  sb.box(14.5, 0, st.z1 + 0.3, 2.0, 0.25, 0.6, '#6b4426');
  addHeight(14.5, st.z1 + 0.3, 2.0, 0.6, 0.25);
  // chặn mép sân khấu (chỉ lên bằng bậc)
  addBox(st.x0 + (14.5 - 1 - st.x0) / 2, st.z1 + 0.05, 14.5 - 1 - st.x0, 0.1, 0, 0.45, { blocksCamera: false });
  addBox(15.5 + (st.x1 - 15.5) / 2, st.z1 + 0.05, st.x1 - 15.5, 0.1, 0, 0.45, { blocksCamera: false });
  addBox(st.x0 - 0.05, (st.z0 + st.z1) / 2, 0.1, sd, 0, 0.45, { blocksCamera: false });
  addBox(st.x1 + 0.05, (st.z0 + st.z1) / 2, 0.1, sd, 0, 0.45, { blocksCamera: false });
  // phông nền
  sb.box(14.5, st.h, -23.84, 8.4, WALL_H - st.h, 0.04, '#13294b', { cast: false });
  for (let i = 0; i < 26; i++) sb.sphere(10.6 + ((i * 37) % 80) / 10, 0.8 + ((i * 53) % 24) / 10, -23.8, 0.03, '#ffe066', { cast: false, m: { emissive: '#ffe066', emissiveIntensity: 1 } }, 6);
  // cột treo băng rôn
  for (const x of [10.3, 18.7]) sb.cyl(x, st.h, -19.75, 0.05, 0.05, 2.7, METAL, 8);
  // loa
  for (const x of [10.6, 18.4]) {
    sb.rbox(x, st.h, -20.3, 0.6, 1.2, 0.5, '#1d1d1d', 0.04, { collide: [st.h, st.h + 1.2] });
    sb.cyl(x, st.h + 0.75, -20.04, 0.18, 0.18, 0.02, '#444', 16, { rx: Math.PI / 2, cast: false });
    sb.cyl(x, st.h + 0.3, -20.04, 0.1, 0.1, 0.02, '#444', 16, { rx: Math.PI / 2, cast: false });
  }
  // micro chân đứng trên sân khấu
  sb.cyl(14.5, st.h, -20.6, 0.15, 0.15, 0.02, '#222', 12);
  sb.cyl(14.5, st.h, -20.6, 0.015, 0.015, 1.4, '#555', 6);
  // hàng ghế khán giả
  const rows = [-14.4, -13.0, -11.6, -10.2];
  const cols = ['#F37021', '#0A6FC2'];
  rows.forEach((z, ri) => {
    for (let x = 9.4; x <= 13.6; x += 0.6) foldingChair(sb, x, z, cols[ri % 2]);
    for (let x = 15.4; x <= 19.6; x += 0.6) foldingChair(sb, x, z, cols[(ri + 1) % 2]);
    addBox(11.5, z, 4.7, 0.5, 0, 0.9);
    addBox(17.5, z, 4.7, 0.5, 0, 0.9);
  });
  // bàn tiệc
  const [tx, tz] = POS.cakeTable;
  desk(sb, tx, tz, 1.6, 0.8, '#ffffff', 0.78);
  sb.box(tx, 0.2, tz, 1.62, 0.56, 0.82, '#ffffff', { cast: false, m: { rough: 0.95 } });
  addBox(tx, tz, 1.6, 0.8, 0, 1.0);
  for (let i = 0; i < 6; i++) sb.cyl(tx - 0.6 + i * 0.12, 0.78, tz + 0.25, 0.08, 0.08, 0.01 + i * 0.004, '#ffd8a8', 12, { cast: false });
  for (let i = 0; i < 5; i++) sb.cyl(tx + 0.45, 0.78, tz - 0.25 + i * 0.001, 0.035, 0.03, 0.1, ['#ff6b6b', '#4dabf7', '#ffd43b', '#69db7c', '#fff'][i], 8, { cast: false });
  // máy chiếu trên chân đứng giữa lối đi
  sb.box(14.5, 0, -16.1, 0.08, 0.9, 0.08, '#555', { cast: false });
  sb.box(14.5, 0.9, -16.1, 0.6, 0.04, 0.5, '#333');
  sb.rbox(14.5, 0.94, -16.1, 0.42, 0.18, 0.34, '#e9ecef', 0.04);
  sb.cyl(14.5, 1.03, -16.29, 0.06, 0.06, 0.05, '#222', 12, { rx: Math.PI / 2, cast: false });
  addBox(14.5, -16.1, 0.6, 0.5, 0, 1.2);
  // thùng DJ (bí mật)
  const [djx, djz] = POS.djCase;
  sb.rbox(djx, 0, djz, 0.9, 0.7, 0.6, '#ced4da', 0.04, { collide: true, m: { metal: 0.7, rough: 0.35 } });
  for (const y of [0.1, 0.6]) sb.box(djx, y, djz, 0.92, 0.04, 0.62, '#495057', { cast: false });
  sb.sign(djx - 0.46, 0.38, djz, 0.55, 0.22, signTexture('dj', ['DJ TƯ – CẤM ĐỤNG'], 384, 140, { bg: '#212529', fg: '#ffd43b', size: 40, radius: 4 }), -Math.PI / 2);
  // bóng bay
  const bcol = ['#ff6b6b', '#4dabf7', '#ffd43b', '#69db7c', '#f783ac', '#ffffff', ORANGE];
  const cluster = (x: number, z: number, y0: number) => {
    for (let i = 0; i < 7; i++) {
      const a = i * 1.7;
      const bx = x + Math.cos(a) * 0.25;
      const bz = z + Math.sin(a) * 0.25;
      const by = y0 + 1.5 + (i % 3) * 0.25;
      sb.sphere(bx, by, bz, 0.2, bcol[i % bcol.length], { cast: false, m: { rough: 0.25 }, scale: [1, 1.15, 1] }, 12);
      sb.box((bx + x) / 2, y0 + 0.75, (bz + z) / 2, 0.006, by - y0 - 0.2, 0.006, '#ddd', { cast: false });
    }
    sb.box(x, y0, z, 0.15, 0.1, 0.15, '#555', { cast: false });
  };
  cluster(10.4, -19.2, 0);
  cluster(18.6, -19.2, 0);
  cluster(11.5, -3.6, 0);
  cluster(16.5, -3.6, 0);
  // dây đèn trang trí
  for (let x = 8.6; x <= 20.6; x += 0.5) {
    const y = 2.85 - Math.sin(((x - 8.6) / 12) * Math.PI) * 0.25;
    const c = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c'][Math.round(x * 2) % 4];
    sb.sphere(x, y, -3.35, 0.05, c, { cast: false, m: { emissive: c, emissiveIntensity: 1 } }, 6);
    sb.sphere(x, y, -23.6, 0.05, c, { cast: false, m: { emissive: c, emissiveIntensity: 1 } }, 6);
  }
  for (let z = -23.4; z <= -3.4; z += 0.5) {
    const c = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c'][Math.round(z * 2 + 40) % 4];
    sb.sphere(20.65, 2.75, z, 0.05, c, { cast: false, m: { emissive: c, emissiveIntensity: 1 } }, 6);
    sb.sphere(8.35, 2.75, z, 0.05, c, { cast: false, m: { emissive: c, emissiveIntensity: 1 } }, 6);
  }
  plant(sb, 20.3, -3.6, 0.9);
  plant(sb, 8.7, -9.0, 0.9);
}

// ---------------------------------------------------------------- Biên giới bản đồ
function boundaries() {
  const add = (x0: number, z0: number, x1: number, z1: number) => addBox((x0 + x1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0) || 0.4, Math.abs(z1 - z0) || 0.4, 0, 4, { blocksCamera: false });
  add(-30, -26.5, -30, 34); // trái
  add(30, -26.5, 30, 34); // phải
  add(-30, -26.5, 30, -26.5); // sau
  add(-34, 34, -34, 47); // ngoài cổng trái
  add(34, 34, 34, 47);
  add(-34, 47, 34, 47); // mép đường
  add(-34, 34, -30, 34);
  add(30, 34, 34, 34);
}
