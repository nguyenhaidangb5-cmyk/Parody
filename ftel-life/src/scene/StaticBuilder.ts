// ===== Gom hình học tĩnh theo vật liệu rồi gộp (merge) để giảm draw call =====
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mat, type MatOpts } from './cache';
import { addBox } from '../game/collision';

export interface PartOpts {
  rx?: number;
  ry?: number;
  rz?: number;
  cast?: boolean;
  /** true: va chạm từ 0 tới đỉnh vật; [y0,y1]: tùy chỉnh */
  collide?: boolean | [number, number];
  cam?: boolean;
  m?: MatOpts;
  scale?: [number, number, number];
}

interface Bucket {
  material: THREE.Material;
  geos: THREE.BufferGeometry[];
  cast: boolean;
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();

const baseGeo = new Map<string, THREE.BufferGeometry>();
function cachedGeo(key: string, make: () => THREE.BufferGeometry) {
  let g = baseGeo.get(key);
  if (!g) {
    g = make();
    if (g.index) g = g.toNonIndexed();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) {
      const n = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    }
    baseGeo.set(key, g);
  }
  return g;
}

export class StaticBuilder {
  buckets = new Map<string, Bucket>();
  extra: THREE.Object3D[] = [];

  private push(geo: THREE.BufferGeometry, color: string, x: number, y: number, z: number, o: PartOpts = {}) {
    const cast = o.cast ?? true;
    const m = o.m ?? {};
    const key = `${color}|${JSON.stringify(m)}|${cast}`;
    let b = this.buckets.get(key);
    if (!b) {
      b = { material: mat(color, m), geos: [], cast };
      this.buckets.set(key, b);
    }
    tmpE.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    tmpQ.setFromEuler(tmpE);
    tmpP.set(x, y, z);
    tmpS.set(...(o.scale ?? [1, 1, 1]));
    tmpM.compose(tmpP, tmpQ, tmpS);
    const g = geo.clone();
    g.applyMatrix4(tmpM);
    b.geos.push(g);
  }

  /** hộp: (x,z) tâm, y = đáy */
  box(x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, o: PartOpts = {}) {
    const g = cachedGeo('box', () => new THREE.BoxGeometry(1, 1, 1));
    this.push(g, color, x, y + sy / 2, z, { ...o, scale: [sx, sy, sz] });
    if (o.collide) {
      const rotated = Math.abs(Math.sin(o.ry ?? 0)) > 0.7;
      const [cx, cz] = rotated ? [sz, sx] : [sx, sz];
      const [y0, y1] = Array.isArray(o.collide) ? o.collide : [y, y + sy];
      addBox(x, z, cx, cz, y0, y1, o.cam !== undefined ? { blocksCamera: o.cam } : {});
    }
  }

  rbox(x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, radius = 0.05, o: PartOpts = {}) {
    const key = `rb${sx}_${sy}_${sz}_${radius}`;
    const g = cachedGeo(key, () => new RoundedBoxGeometry(sx, sy, sz, 2, Math.min(radius, sx / 2, sy / 2, sz / 2)));
    this.push(g, color, x, y + sy / 2, z, o);
    if (o.collide) {
      const rotated = Math.abs(Math.sin(o.ry ?? 0)) > 0.7;
      const [cx, cz] = rotated ? [sz, sx] : [sx, sz];
      const [y0, y1] = Array.isArray(o.collide) ? o.collide : [y, y + sy];
      addBox(x, z, cx, cz, y0, y1, o.cam !== undefined ? { blocksCamera: o.cam } : {});
    }
  }

  /** trụ: y = đáy */
  cyl(x: number, y: number, z: number, rt: number, rb: number, h: number, color: string, seg = 12, o: PartOpts = {}) {
    const g = cachedGeo(`cy${rt}_${rb}_${seg}`, () => new THREE.CylinderGeometry(rt, rb, 1, seg));
    this.push(g, color, x, y + h / 2, z, { ...o, scale: [1, h, 1] });
    if (o.collide) {
      const [y0, y1] = Array.isArray(o.collide) ? o.collide : [y, y + h];
      addBox(x, z, Math.max(rt, rb) * 1.8, Math.max(rt, rb) * 1.8, y0, y1, o.cam !== undefined ? { blocksCamera: o.cam } : {});
    }
  }

  sphere(x: number, y: number, z: number, r: number, color: string, o: PartOpts = {}, seg = 12) {
    const g = cachedGeo(`sp${seg}`, () => new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.7))));
    const s = o.scale ?? [1, 1, 1];
    this.push(g, color, x, y, z, { ...o, scale: [r * s[0], r * s[1], r * s[2]] });
  }

  ico(x: number, y: number, z: number, r: number, color: string, o: PartOpts = {}) {
    const g = cachedGeo('ico', () => new THREE.IcosahedronGeometry(1, 1));
    const s = o.scale ?? [1, 1, 1];
    this.push(g, color, x, y, z, { ...o, scale: [r * s[0], r * s[1], r * s[2]], m: { flat: true, ...(o.m ?? {}) } });
  }

  cone(x: number, y: number, z: number, r: number, h: number, color: string, seg = 8, o: PartOpts = {}) {
    const g = cachedGeo(`co${seg}`, () => new THREE.ConeGeometry(1, 1, seg));
    this.push(g, color, x, y + h / 2, z, { ...o, scale: [r, h, r] });
  }

  torus(x: number, y: number, z: number, r: number, t: number, color: string, o: PartOpts = {}) {
    const g = cachedGeo(`to${t / r}`, () => new THREE.TorusGeometry(1, t / r, 8, 24));
    this.push(g, color, x, y, z, { ...o, scale: [r, r, r] });
  }

  /** mặt phẳng nằm ngang có texture riêng (không gộp) */
  plane(x: number, y: number, z: number, w: number, d: number, material: THREE.Material, receive = true) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = receive;
    this.extra.push(m);
    return m;
  }

  /** bảng chữ / tranh thẳng đứng (không gộp) */
  sign(x: number, y: number, z: number, w: number, h: number, tex: THREE.Texture, ry = 0, opts: { emissive?: number; transparent?: boolean } = {}) {
    const params: THREE.MeshStandardMaterialParameters = { map: tex, roughness: 0.6, transparent: !!opts.transparent };
    if (opts.emissive) {
      params.emissive = new THREE.Color('#ffffff');
      params.emissiveMap = tex;
      params.emissiveIntensity = opts.emissive;
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial(params));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    this.extra.push(m);
    return m;
  }

  build(): THREE.Group {
    const group = new THREE.Group();
    for (const b of this.buckets.values()) {
      if (!b.geos.length) continue;
      const merged = mergeGeometries(b.geos, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, b.material);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
      b.geos.forEach((g) => g.dispose());
    }
    for (const e of this.extra) group.add(e);
    return group;
  }
}
