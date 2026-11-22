// ===== Hệ thống va chạm nhẹ: AABB tĩnh + hình tròn động =====
// Không dùng engine vật lý đầy đủ để giữ game nhẹ và ổn định trên máy yếu.

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  id?: string;
  /** Va chạm động (cửa, barie) có thể bật/tắt */
  enabled?: () => boolean;
  /** Chặn camera? (mặc định: true nếu cao > 1.4m) */
  blocksCamera?: boolean;
}

export interface HeightRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  h: number;
}

export const colliders: AABB[] = [];
export const heightRects: HeightRect[] = [];

export function clearCollision() {
  colliders.length = 0;
  heightRects.length = 0;
}

export function addBox(
  cx: number,
  cz: number,
  sx: number,
  sz: number,
  y0 = 0,
  y1 = 3,
  extra: Partial<AABB> = {},
): AABB {
  const b: AABB = {
    minX: cx - sx / 2,
    maxX: cx + sx / 2,
    minZ: cz - sz / 2,
    maxZ: cz + sz / 2,
    minY: y0,
    maxY: y1,
    ...extra,
  };
  if (b.blocksCamera === undefined) b.blocksCamera = y1 - y0 > 1.4;
  colliders.push(b);
  return b;
}

export function addHeight(cx: number, cz: number, sx: number, sz: number, h: number) {
  heightRects.push({ minX: cx - sx / 2, maxX: cx + sx / 2, minZ: cz - sz / 2, maxZ: cz + sz / 2, h });
}

export function groundHeight(x: number, z: number): number {
  let h = 0;
  for (const r of heightRects) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ && r.h > h) h = r.h;
  }
  return h;
}

/** Đẩy hình tròn (x,z,r) ra khỏi mọi AABB; trả về true nếu có va chạm */
export function resolveCircle(p: { x: number; z: number }, r: number, y: number, height = 1.6): boolean {
  let hit = false;
  for (let iter = 0; iter < 3; iter++) {
    let moved = false;
    for (const b of colliders) {
      if (b.enabled && !b.enabled()) continue;
      if (y + height < b.minY || y + 0.3 > b.maxY) continue; // bước qua vật thấp
      const cx = Math.max(b.minX, Math.min(p.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
      const dx = p.x - cx;
      const dz = p.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          const push = r - d;
          p.x += (dx / d) * push;
          p.z += (dz / d) * push;
        } else {
          // tâm nằm trong hộp: đẩy theo trục gần nhất
          const l = p.x - b.minX;
          const rr = b.maxX - p.x;
          const t = p.z - b.minZ;
          const bb = b.maxZ - p.z;
          const m = Math.min(l, rr, t, bb);
          if (m === l) p.x = b.minX - r;
          else if (m === rr) p.x = b.maxX + r;
          else if (m === t) p.z = b.minZ - r;
          else p.z = b.maxZ + r;
        }
        moved = true;
        hit = true;
      }
    }
    if (!moved) break;
  }
  return hit;
}

export function resolveCircleVsCircle(p: { x: number; z: number }, r: number, ox: number, oz: number, or: number) {
  const dx = p.x - ox;
  const dz = p.z - oz;
  const d2 = dx * dx + dz * dz;
  const R = r + or;
  if (d2 < R * R && d2 > 1e-8) {
    const d = Math.sqrt(d2);
    p.x += (dx / d) * (R - d);
    p.z += (dz / d) * (R - d);
  }
}

/** Raycast từ origin theo dir (đã chuẩn hóa) – trả về khoảng cách gần nhất tới vật chặn camera */
export function raycastCamera(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
): number {
  let best = maxDist;
  for (const b of colliders) {
    if (!b.blocksCamera) continue;
    if (b.enabled && !b.enabled()) continue;
    const t = rayAABB(ox, oy, oz, dx, dy, dz, b);
    if (t !== null && t < best) best = t;
  }
  return best;
}

function rayAABB(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  b: AABB,
): number | null {
  let tmin = 0;
  let tmax = Infinity;
  const axes: [number, number, number, number][] = [
    [ox, dx, b.minX, b.maxX],
    [oy, dy, b.minY, b.maxY],
    [oz, dz, b.minZ, b.maxZ],
  ];
  for (const [o, d, mn, mx] of axes) {
    if (Math.abs(d) < 1e-8) {
      if (o < mn || o > mx) return null;
    } else {
      let t1 = (mn - o) / d;
      let t2 = (mx - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}
