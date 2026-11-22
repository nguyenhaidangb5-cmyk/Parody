// ===== Nhân vật người chơi: di chuyển, nhảy, va chạm, tương tác, vùng kích hoạt =====
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Character, makeAnimState } from './Character';
import { PLAYER_LOOK, NPCS, NPC_MAP } from '../data/npcs';
import { INTERACTABLES, ZONES } from '../data/interactables';
import { runtime } from '../game/runtime';
import { consumePress, isDown, touch } from '../game/input';
import { groundHeight, resolveCircle, resolveCircleVsCircle } from '../game/collision';
import { checkCond, useGame, resolveText } from '../game/store';
import { sfx } from '../game/audio';
import { BUILDING, WORLD } from '../data/layout';

const WALK = 3.3;
const RUN = 6.0;
const RADIUS = 0.32;
const NPC_RADIUS = 0.33;
const TALK_RANGE = 2.4;
const MAX_STEP = 0.3;

export function uiBlocking(): boolean {
  const s = useGame.getState();
  const u = s.ui;
  return s.screen !== 'playing' || !!(u.dialogue || u.careerSelect || u.minigame || u.chat || u.card || u.map || u.pause);
}

export function Player() {
  const root = useRef<THREE.Group>(null!);
  const anim = useRef(makeAnimState('player'));
  const vel = useRef(new THREE.Vector2());
  const stepT = useRef(0);
  const zoneT = useRef(0);
  const lastBlocked = useRef(0);
  const hasCard = useGame((s) => !!s.save.flags.hasCard);
  const screen = useGame((s) => s.screen);
  const extra = useMemo(() => (hasCard ? ['lanyard'] : []), [hasCard]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const p = runtime.player;
    runtime.time += dt;

    if (runtime.teleport) {
      p.x = runtime.teleport.x;
      p.z = runtime.teleport.z;
      p.y = groundHeight(p.x, p.z);
      if (runtime.teleport.rotY !== undefined) p.rotY = runtime.teleport.rotY;
      vel.current.set(0, 0);
      runtime.teleport = null;
    }

    const blocked = uiBlocking();
    if (blocked) lastBlocked.current = runtime.time;
    const cooling = runtime.time - lastBlocked.current < 0.25;
    if (blocked || cooling) {
      consumePress('KeyE');
      consumePress('Enter');
      consumePress('Space');
    }
    let ix = 0;
    let iz = 0;
    if (!blocked) {
      if (isDown('KeyW') || isDown('ArrowUp')) iz += 1;
      if (isDown('KeyS') || isDown('ArrowDown')) iz -= 1;
      if (isDown('KeyA') || isDown('ArrowLeft')) ix -= 1;
      if (isDown('KeyD') || isDown('ArrowRight')) ix += 1;
      if (touch.active) {
        ix += touch.moveX;
        iz += touch.moveY;
      }
    }
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    const running = !blocked && (isDown('ShiftLeft') || isDown('ShiftRight') || touch.run);
    const speed = running ? RUN : WALK;
    const yaw = runtime.camYaw;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const rx = -Math.cos(yaw);
    const rz = Math.sin(yaw);
    const tx = (fx * iz + rx * ix) * speed;
    const tz = (fz * iz + rz * ix) * speed;
    const acc = len > 0.01 ? 12 : 14;
    vel.current.x += (tx - vel.current.x) * Math.min(1, dt * acc);
    vel.current.y += (tz - vel.current.y) * Math.min(1, dt * acc);

    // di chuyển + bậc thềm
    const ox = p.x;
    const oz = p.z;
    p.x += vel.current.x * dt;
    p.z += vel.current.y * dt;
    resolveCircle(p, RADIUS, p.y);
    for (const n of NPCS) {
      const np = runtime.npcPos[n.id];
      if (np && Math.abs(np.y - p.y) < 1.2) resolveCircleVsCircle(p, RADIUS, np.x, np.z, NPC_RADIUS);
    }
    const g = groundHeight(p.x, p.z);
    if (g - p.y > MAX_STEP + 0.01 && p.grounded) {
      p.x = ox;
      p.z = oz;
    }
    p.x = Math.max(WORLD.minX, Math.min(WORLD.maxX, p.x));
    p.z = Math.max(WORLD.minZ, Math.min(WORLD.maxZ, p.z));

    // nhảy / trọng lực
    if (!blocked && consumePress('Space') && p.grounded) {
      p.vy = 4.3;
      p.grounded = false;
    }
    const gh = groundHeight(p.x, p.z);
    p.vy -= 13 * dt;
    p.y += p.vy * dt;
    if (p.y <= gh) {
      if (!p.grounded && p.vy < -2) sfx('step');
      p.y = gh;
      p.vy = 0;
      p.grounded = true;
    } else if (p.y - gh > 0.05) {
      p.grounded = false;
    }

    const actual = Math.hypot(p.x - ox, p.z - oz) / Math.max(dt, 1e-4);
    p.speed = actual;
    p.running = running && actual > WALK + 0.3;
    if (actual > 0.3 && len > 0.01) {
      const target = Math.atan2(vel.current.x, vel.current.y);
      let d = target - p.rotY;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      p.rotY += d * Math.min(1, dt * 12);
    }
    // bước chân
    if (p.grounded && actual > 0.5) {
      stepT.current -= dt * (actual / 1.6);
      if (stepT.current <= 0) {
        stepT.current = 0.5;
        sfx('step');
      }
    }

    root.current.position.set(p.x, p.y, p.z);
    root.current.rotation.y = p.rotY;
    runtime.insideBuilding = p.x > BUILDING.minX - 0.3 && p.x < BUILDING.maxX + 0.3 && p.z > BUILDING.minZ - 0.3 && p.z < BUILDING.maxZ + 0.1;

    // hoạt ảnh
    const a = anim.current;
    a.speed = actual;
    a.running = p.running;
    a.airborne = !p.grounded;
    a.talking = false;
    const pe = runtime.playerEmote;
    a.emote = pe.until > runtime.time ? pe.emote : 'none';
    // quay đầu về phía người đang nói chuyện
    a.lookYaw = 0;
    const tn = runtime.talkingNpc ? runtime.npcPos[runtime.talkingNpc] : null;
    if (tn) {
      let d = Math.atan2(tn.x - p.x, tn.z - p.z) - p.rotY;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      a.lookYaw = d;
      const dlg = useGame.getState().ui.dialogue;
      if (dlg) {
        // xoay người về phía NPC
        p.rotY += d * Math.min(1, dt * 4) * 0.6;
      }
    }

    if (screen !== 'playing') return;
    // ---------- Tìm đối tượng tương tác gần nhất ----------
    updateNearest(blocked);
    if (!blocked && (consumePress('KeyE') || consumePress('Enter'))) interact();

    // ---------- Vùng kích hoạt ----------
    zoneT.current -= dt;
    if (zoneT.current <= 0 && !blocked) {
      zoneT.current = 0.2;
      checkZones();
    }
  });

  return (
    <group ref={root} visible={screen !== 'menu' || true}>
      <Character look={PLAYER_LOOK} state={anim} extraAcc={extra} />
    </group>
  );
}

function npcActive(id: string) {
  const n = NPC_MAP[id];
  const spot = n.spots.find((s) => checkCond(s.cond));
  return spot && !spot.hidden;
}

function updateNearest(blocked: boolean) {
  const p = runtime.player;
  let best: typeof runtime.nearest = null;
  let bestScore = Infinity;
  if (!blocked) {
    const fx = Math.sin(p.rotY);
    const fz = Math.cos(p.rotY);
    for (const n of NPCS) {
      const np = runtime.npcPos[n.id];
      if (!np) continue;
      const dx = np.x - p.x;
      const dz = np.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > TALK_RANGE || Math.abs(np.y - p.y) > 1.2) continue;
      const facing = (dx * fx + dz * fz) / Math.max(d, 0.01);
      const score = d - facing * 0.8;
      if (score < bestScore && npcActive(n.id)) {
        bestScore = score;
        best = { kind: 'npc', id: n.id, label: `nói chuyện với ${n.name}` };
      }
    }
    for (const it of INTERACTABLES) {
      if (it.cond && !checkCond(it.cond)) continue;
      const dx = it.pos[0] - p.x;
      const dz = it.pos[1] - p.z;
      const d = Math.hypot(dx, dz);
      const r = it.radius ?? 1.6;
      if (d > r) continue;
      const facing = (dx * fx + dz * fz) / Math.max(d, 0.01);
      const score = d - facing * 0.8 + 0.15;
      if (score < bestScore) {
        bestScore = score;
        const lbl = it.label.find((l) => checkCond(l.cond)) ?? it.label[it.label.length - 1];
        best = { kind: 'inter', id: it.id, label: resolveText(lbl.text) };
      }
    }
  }
  const prev = runtime.nearest;
  runtime.nearest = best;
  if (prev?.id !== best?.id || prev?.label !== best?.label) {
    useGame.setState({ prompt: best ? best.label : null });
  }
}

export function interact() {
  const near = runtime.nearest;
  if (!near) return;
  const st = useGame.getState();
  if (near.kind === 'npc') {
    const n = NPC_MAP[near.id];
    const rule = n.talk.find((t) => checkCond(t.cond));
    if (rule) st.startDialogue(rule.dialogue, n.id);
  } else {
    const it = INTERACTABLES.find((i) => i.id === near.id);
    if (!it) return;
    const action = it.actions.find((a) => checkCond(a.cond));
    if (!action) return;
    sfx('click');
    if (action.effects) st.applyEffects(action.effects);
    if (action.dialogue) st.startDialogue(action.dialogue, null);
  }
}

function checkZones() {
  const p = runtime.player;
  const st = useGame.getState();
  for (const z of ZONES) {
    const [x0, z0, x1, z1] = z.rect;
    if (p.x < x0 || p.x > x1 || p.z < z0 || p.z > z1) continue;
    if (z.once && st.save.firedZones.includes(z.id)) continue;
    if (!checkCond(z.cond)) continue;
    if (z.once) useGame.setState({ save: { ...st.save, firedZones: [...st.save.firedZones, z.id] } });
    if (z.effects) useGame.getState().applyEffects(z.effects);
    if (z.dialogue && !useGame.getState().ui.dialogue) useGame.getState().startDialogue(z.dialogue, null);
    break;
  }
}
