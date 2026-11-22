// ===== Bộ đệm geometry/material dùng chung để giảm bộ nhớ và thời gian tạo =====
import * as THREE from 'three';

const geoCache = new Map<string, THREE.BufferGeometry>();
const matCache = new Map<string, THREE.Material>();

export function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g as T;
}

export interface MatOpts {
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  flat?: boolean;
}

export function mat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.rough ?? 0.72}|${o.metal ?? 0}|${o.emissive ?? ''}|${o.emissiveIntensity ?? 1}|${o.transparent ? o.opacity : ''}|${o.side ?? 0}|${o.flat ? 1 : 0}`;
  let m = matCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    const params: THREE.MeshStandardMaterialParameters = {
      color,
      roughness: o.rough ?? 0.72,
      metalness: o.metal ?? 0,
      transparent: !!o.transparent,
      opacity: o.opacity ?? 1,
      side: o.side ?? THREE.FrontSide,
      flatShading: !!o.flat,
    };
    if (o.emissive) {
      params.emissive = new THREE.Color(o.emissive);
      params.emissiveIntensity = o.emissiveIntensity ?? 1;
    }
    m = new THREE.MeshStandardMaterial(params);
    if (o.transparent) m.depthWrite = false;
    matCache.set(key, m);
  }
  return m;
}

export const G = {
  sphere: (r: number, w = 20, h = 14) => geo(`s${r}_${w}_${h}`, () => new THREE.SphereGeometry(r, w, h)),
  capsule: (r: number, len: number) => geo(`c${r}_${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 12)),
  box: (x: number, y: number, z: number) => geo(`b${x}_${y}_${z}`, () => new THREE.BoxGeometry(x, y, z)),
  cyl: (rt: number, rb: number, h: number, s = 16, open = false) =>
    geo(`y${rt}_${rb}_${h}_${s}_${open}`, () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open)),
  torus: (r: number, t: number, arc = Math.PI * 2, rs = 8, ts = 20) =>
    geo(`t${r}_${t}_${arc}_${rs}_${ts}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)),
  cone: (r: number, h: number, s = 10) => geo(`k${r}_${h}_${s}`, () => new THREE.ConeGeometry(r, h, s)),
  cap: (r: number, theta: number, phiStart = 0, phiLen = Math.PI * 2) =>
    geo(`cap${r}_${theta}_${phiStart}_${phiLen}`, () => new THREE.SphereGeometry(r, 24, 14, phiStart, phiLen, 0, theta)),
};

export function shade(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return '#' + c.getHexString();
}
