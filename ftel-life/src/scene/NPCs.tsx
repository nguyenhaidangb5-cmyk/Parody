// ===== NPC: vị trí theo tiến độ, đi tuần, quay đầu nhìn người chơi, biểu cảm, bảng tên =====
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NPCS } from '../data/npcs';
import type { NpcDef, NpcSpot } from '../game/types';
import { Character, makeAnimState } from './Character';
import { runtime } from '../game/runtime';
import { checkCond, useGame } from '../game/store';
import { FONT } from './textures';

export function NPCs() {
  return (
    <group>
      {NPCS.map((n) => (
        <NPC key={n.id} def={n} />
      ))}
    </group>
  );
}

function nameTagTexture(name: string, title: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.font = `800 50px ${FONT}`;
  const w1 = g.measureText(name).width;
  g.font = `600 30px ${FONT}`;
  const w2 = g.measureText(title).width;
  const w = Math.min(500, Math.max(w1, w2) + 60);
  const x0 = (512 - w) / 2;
  g.fillStyle = 'rgba(15,27,45,0.78)';
  g.beginPath();
  g.roundRect(x0, 6, w, 116, 26);
  g.fill();
  g.fillStyle = color;
  g.fillRect(x0 + 18, 22, 8, 84);
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = `800 50px ${FONT}`;
  g.fillText(name, 256 + 6, 62);
  g.fillStyle = '#ffd9bf';
  g.font = `600 30px ${FONT}`;
  g.fillText(title, 256 + 6, 102);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function NPC({ def }: { def: NpcDef }) {
  const save = useGame((s) => s.save);
  const spot: NpcSpot | undefined = useMemo(() => def.spots.find((s) => checkCond(s.cond, save)), [def, save]);
  const root = useRef<THREE.Group>(null!);
  const tag = useRef<THREE.Sprite>(null!);
  const anim = useRef(makeAnimState(spot?.anim ?? 'idle'));
  const st = useRef({ x: 0, z: 0, y: 0, rot: 0, wp: 0, wait: 0, spotKey: '' });
  const tagMat = useMemo(() => new THREE.SpriteMaterial({ map: nameTagTexture(def.name, def.title, def.color), transparent: true, depthTest: true }), [def]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (!spot || spot.hidden) {
      delete runtime.npcPos[def.id];
      if (root.current) root.current.visible = false;
      return;
    }
    const s = st.current;
    const key = `${spot.pos[0]},${spot.pos[1]},${spot.anim}`;
    if (s.spotKey !== key) {
      s.spotKey = key;
      s.x = spot.pos[0];
      s.z = spot.pos[1];
      s.y = spot.y ?? 0;
      s.rot = spot.rot ?? 0;
      s.wp = 0;
      s.wait = 0;
    }
    const p = runtime.player;
    const dxp = p.x - s.x;
    const dzp = p.z - s.z;
    const distP = Math.hypot(dxp, dzp);
    const talking = runtime.talkingNpc === def.id && !!useGame.getState().ui.dialogue;
    const a = anim.current;
    a.mode = spot.anim ?? 'idle';
    a.talking = talking;
    const em = runtime.npcEmote[def.id];
    a.emote = em && em.until > runtime.time ? em.emote : 'none';

    // ẩn NPC ở rất xa để tiết kiệm hiệu năng
    const far = distP > 45;
    root.current.visible = !far;

    let moving = false;
    if (spot.patrol && spot.patrol.length > 1 && !talking && distP > 2.2) {
      if (s.wait > 0) s.wait -= dt;
      else {
        const target = spot.patrol[s.wp % spot.patrol.length];
        const dx = target[0] - s.x;
        const dz = target[1] - s.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.1) {
          s.wp++;
          s.wait = 1 + Math.random() * 2.5;
        } else {
          const sp = 1.25;
          s.x += (dx / d) * Math.min(d, sp * dt);
          s.z += (dz / d) * Math.min(d, sp * dt);
          const tr = Math.atan2(dx, dz);
          let dr = tr - s.rot;
          while (dr > Math.PI) dr -= Math.PI * 2;
          while (dr < -Math.PI) dr += Math.PI * 2;
          s.rot += dr * Math.min(1, dt * 6);
          moving = true;
        }
      }
    }
    a.speed = moving ? 1.25 : 0;
    a.running = false;

    // quay về phía người chơi khi nói chuyện / khi đứng gần
    const sitting = a.mode === 'sit' || a.mode === 'type';
    let toP = Math.atan2(dxp, dzp) - s.rot;
    while (toP > Math.PI) toP -= Math.PI * 2;
    while (toP < -Math.PI) toP += Math.PI * 2;
    if (talking && !sitting && a.mode !== 'dj') {
      s.rot += toP * Math.min(1, dt * 5);
      a.lookYaw = 0;
    } else if (distP < 4.5 && !moving && a.mode !== 'stare' && a.mode !== 'cheer' && a.mode !== 'dj') {
      a.lookYaw = toP;
    } else if (talking) {
      a.lookYaw = toP;
    } else {
      a.lookYaw = a.mode === 'stare' ? 0 : Math.sin(runtime.time * 0.3 + def.id.length) * 0.35;
    }
    if (a.mode === 'cheer' && useGame.getState().screen === 'playing') {
      // trong cảnh cuối: nhìn người chơi
      s.rot += toP * Math.min(1, dt * 3);
    }

    root.current.position.set(s.x, s.y, s.z);
    root.current.rotation.y = s.rot;
    runtime.npcPos[def.id] = { x: s.x, z: s.z, y: s.y };

    // bảng tên
    const showTag = distP < 7 && !far && !useGame.getState().ui.dialogue;
    tag.current.visible = showTag;
    if (showTag) {
      const o = Math.min(1, (7 - distP) / 2);
      tagMat.opacity = o;
    }
  });

  if (!spot || spot.hidden) return null;
  return (
    <group ref={root} position={[spot.pos[0], spot.y ?? 0, spot.pos[1]]} rotation={[0, spot.rot ?? 0, 0]}>
      <Character look={def.look} state={anim} />
      <sprite ref={tag} material={tagMat} position={[0, (def.look.height ?? 1) * 1.98 + 0.42, 0]} scale={[1.25, 0.31, 1]} />
    </group>
  );
}
