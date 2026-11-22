// ===== Ánh sáng theo thời gian trong ngày, bầu trời, đánh dấu mục tiêu nhiệm vụ =====
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../game/runtime';
import { useGame, checkCond, currentObjective } from '../game/store';
import { QUESTS, QUEST_ORDER } from '../data/quests';
import { INTER_MAP } from '../data/interactables';
import type { Target } from '../game/types';
import { G, mat } from './cache';

interface TimeLook {
  sun: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  top: string;
  horizon: string;
  elev: number;
  azim: number;
}

const TIMES: TimeLook[] = [
  { sun: '#fff1d6', sunI: 2.4, hemiSky: '#cfe6ff', hemiGround: '#b7a58a', hemiI: 1.05, top: '#5aa9e6', horizon: '#dff1ff', elev: 0.75, azim: 2.4 }, // sáng
  { sun: '#ffffff', sunI: 2.6, hemiSky: '#d6ecff', hemiGround: '#b3a487', hemiI: 1.1, top: '#4a9be0', horizon: '#e6f4ff', elev: 1.1, azim: 3.3 }, // trưa
  { sun: '#ffe2b8', sunI: 2.3, hemiSky: '#d9e4f5', hemiGround: '#b89f80', hemiI: 1.0, top: '#5b95d6', horizon: '#ffe9cf', elev: 0.7, azim: 4.0 }, // chiều
  { sun: '#ffb070', sunI: 2.0, hemiSky: '#f3c7a5', hemiGround: '#8c6f5a', hemiI: 0.95, top: '#5f6fb8', horizon: '#ffb37a', elev: 0.32, azim: 4.5 }, // hoàng hôn
];

function timeIndex(q: string | null): number {
  const i = q ? QUEST_ORDER.indexOf(q) : 0;
  if (i <= 2) return 0;
  if (i <= 4) return 1;
  if (i === 5) return 2;
  return 3;
}

export function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const amb = useRef<THREE.AmbientLight>(null!);
  const { scene } = useThree();
  const quality = useGame((s) => s.settings.quality);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sky = useMemo(() => makeSky(), []);
  const cur = useRef<TimeLook>({ ...TIMES[0] });

  useFrame((_, dt) => {
    const st = useGame.getState();
    const idx = st.screen === 'menu' ? 0 : timeIndex(st.save.mainQuest);
    const T = TIMES[idx];
    const c = cur.current;
    const k = Math.min(1, dt * 1.2);
    c.sunI += (T.sunI - c.sunI) * k;
    c.hemiI += (T.hemiI - c.hemiI) * k;
    c.elev += (T.elev - c.elev) * k;
    c.azim += (T.azim - c.azim) * k;
    const lightsOff = !!st.save.flags.lightsOff && st.screen === 'playing';
    const dim = lightsOff ? 0.06 : 1;
    sun.current.color.lerp(new THREE.Color(T.sun), k);
    hemi.current.color.lerp(new THREE.Color(T.hemiSky), k);
    hemi.current.groundColor.lerp(new THREE.Color(T.hemiGround), k);
    sun.current.intensity = c.sunI * dim;
    hemi.current.intensity = c.hemiI * dim;
    amb.current.intensity = 0.25 * dim;
    (sky.material as THREE.ShaderMaterial).uniforms.top.value.lerp(new THREE.Color(lightsOff ? '#05070d' : T.top), k * 2);
    (sky.material as THREE.ShaderMaterial).uniforms.horizon.value.lerp(new THREE.Color(lightsOff ? '#0b0e18' : T.horizon), k * 2);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy((sky.material as THREE.ShaderMaterial).uniforms.horizon.value);

    const p = runtime.player;
    const focus = st.screen === 'menu' ? new THREE.Vector3(0, 0, 6) : new THREE.Vector3(p.x, 0, p.z);
    const dir = new THREE.Vector3(Math.cos(c.azim) * Math.cos(c.elev), Math.sin(c.elev), Math.sin(c.azim) * Math.cos(c.elev));
    sun.current.position.copy(focus).addScaledVector(dir, 40);
    target.position.copy(focus);
    target.updateMatrixWorld();
    sky.position.set(focus.x, 0, focus.z);
  });

  const shadowSize = 26;
  return (
    <>
      <primitive object={sky} />
      <primitive object={target} />
      <hemisphereLight ref={hemi} args={['#cfe6ff', '#b7a58a', 1.05]} />
      <ambientLight ref={amb} intensity={0.25} />
      <directionalLight
        ref={sun}
        target={target}
        castShadow={quality === 'high'}
        intensity={2.4}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <fog attach="fog" args={['#dff1ff', 70, 190]} />
      <HallPartyLights />
    </>
  );
}

function makeSky() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new THREE.Color('#5aa9e6') }, horizon: { value: new THREE.Color('#dff1ff') } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6, 0.0, 1.0); vec3 c = mix(horizon, top, pow(h, 0.7)); gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), m);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return sky;
}

function HallPartyLights() {
  const on = useGame((s) => !!s.save.flags.surprise || s.screen === 'ending');
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!g.current) return;
    g.current.children.forEach((c, i) => {
      (c as THREE.PointLight).intensity = 3 + Math.sin(runtime.time * 3 + i * 2) * 1.5;
    });
  });
  if (!on) return null;
  return (
    <group ref={g}>
      <pointLight color="#ff8ad8" position={[11, 2.8, -18]} intensity={3} distance={10} decay={1.5} />
      <pointLight color="#7cd4ff" position={[18, 2.8, -18]} intensity={3} distance={10} decay={1.5} />
      <pointLight color="#ffe066" position={[14.5, 2.9, -11]} intensity={3} distance={12} decay={1.5} />
    </group>
  );
}

// ---------------- Đánh dấu mục tiêu ----------------
export function targetPosition(t: Target | undefined): [number, number, number] | null {
  if (!t) return null;
  if ('npc' in t) {
    const p = runtime.npcPos[t.npc];
    return p ? [p.x, p.y + 2.55, p.z] : null;
  }
  if ('inter' in t) {
    const it = INTER_MAP[t.inter];
    return it ? [it.pos[0], (it.y ?? 0) + 2.1, it.pos[1]] : null;
  }
  return [t.point[0], 1.8, t.point[1]];
}

export function currentTarget(): Target | undefined {
  const s = useGame.getState().save;
  const q = s.mainQuest ? QUESTS[s.mainQuest] : null;
  if (!q) return undefined;
  const oid = currentObjective(s, q.id);
  const ob = q.objectives.find((o) => o.id === oid);
  if (!ob) return undefined;
  const alt = ob.alt?.find((a) => checkCond(a.cond, s));
  return alt ? alt.target : ob.target;
}

export function QuestMarker() {
  const g = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const st = useGame.getState();
    const t = currentTarget();
    const pos = st.screen === 'playing' && !st.ui.dialogue ? targetPosition(t) : null;
    g.current.visible = !!pos;
    ring.current.visible = !!pos;
    if (!pos) return;
    const tt = runtime.time;
    g.current.position.set(pos[0], pos[1] + Math.sin(tt * 3) * 0.12, pos[2]);
    g.current.rotation.y = tt * 2;
    const ground = t && 'npc' in t ? (runtime.npcPos[t.npc]?.y ?? 0) : 0;
    ring.current.position.set(pos[0], ground + 0.03, pos[2]);
    const s = 0.8 + ((tt * 0.8) % 1) * 0.7;
    ring.current.scale.set(s, s, s);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - ((tt * 0.8) % 1));
  });
  return (
    <>
      <group ref={g}>
        <mesh geometry={useMemo(() => new THREE.OctahedronGeometry(0.2, 0), [])} material={mat('#ffb703', { emissive: '#ff8c00', emissiveIntensity: 1.2 })} scale={[1, 1.5, 1]} />
        <mesh geometry={G.cone(0.1, 0.18, 4)} material={mat('#ffb703', { emissive: '#ff8c00', emissiveIntensity: 1.2 })} position={[0, -0.52, 0]} rotation={[Math.PI, 0, 0]} />
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.68, 32]} />
        <meshBasicMaterial color="#ffb703" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </>
  );
}
