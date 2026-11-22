// ===== Camera góc nhìn thứ ba: xoay bằng chuột, thu phóng bằng cuộn, chống xuyên tường, khung hình hội thoại =====
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../game/runtime';
import { consumeMouse } from '../game/input';
import { raycastCamera } from '../game/collision';
import { useGame } from '../game/store';
import { uiBlocking } from './Player';

const tmpTarget = new THREE.Vector3();
const tmpPos = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.5, 30));
  const init = useRef(false);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = useGame.getState();
    const settings = st.settings;
    const m = consumeMouse();

    if (st.screen === 'menu' || st.screen === 'ending') {
      // camera giới thiệu bay quanh khuôn viên
      const t = performance.now() / 1000;
      if (st.screen === 'menu') {
        const r = 34;
        tmpPos.set(Math.sin(t * 0.05) * r, 15 + Math.sin(t * 0.13) * 2, 14 + Math.cos(t * 0.05) * r);
        tmpTarget.set(0, 1, 4);
      } else {
        tmpPos.set(14.5 + Math.sin(t * 0.18) * 4.6, 2.9, -12.5 + Math.cos(t * 0.18) * 2.2);
        tmpTarget.set(14.5, 1.3, -19);
      }
      camera.position.lerp(tmpPos, init.current ? Math.min(1, dt * 1.5) : 1);
      look.current.lerp(tmpTarget, init.current ? Math.min(1, dt * 2) : 1);
      camera.lookAt(look.current);
      init.current = true;
      return;
    }

    const blocked = uiBlocking();
    if (!blocked) {
      const sens = 0.0024 * settings.sensitivity;
      runtime.camYaw -= m.dx * sens;
      runtime.camPitch += m.dy * sens * (settings.invertY ? -1 : 1);
      runtime.camPitch = Math.max(-0.2, Math.min(1.15, runtime.camPitch));
      runtime.camDist = Math.max(2.2, Math.min(8, runtime.camDist + m.wheel * 0.45));
    }

    const p = runtime.player;
    const head = new THREE.Vector3(p.x, p.y + 1.55, p.z);
    let desired: THREE.Vector3;
    let target: THREE.Vector3;
    const dlg = st.ui.dialogue;
    const npc = dlg?.npc ? runtime.npcPos[dlg.npc] : null;

    if (npc && dlg) {
      // khung hình hội thoại: đặt camera chéo vai người chơi
      const mid = new THREE.Vector3((p.x + npc.x) / 2, p.y + 1.35, (p.z + npc.z) / 2);
      const dx = npc.x - p.x;
      const dz = npc.z - p.z;
      const d = Math.max(0.5, Math.hypot(dx, dz));
      const nx = dx / d;
      const nz = dz / d;
      // vuông góc
      const px = -nz;
      const pz = nx;
      const side = 1;
      desired = new THREE.Vector3(p.x - nx * 2.2 + px * 1.3 * side, p.y + 1.9, p.z - nz * 2.2 + pz * 1.3 * side);
      target = mid;
    } else {
      const yaw = runtime.camYaw;
      const pitch = runtime.camPitch;
      const dist = runtime.camDist;
      const off = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
      desired = head.clone().addScaledVector(off, dist);
      target = head.clone().add(new THREE.Vector3(Math.sin(yaw) * 0.6, 0, Math.cos(yaw) * 0.6));
    }

    // chống xuyên tường
    const dir = desired.clone().sub(head);
    const len = dir.length();
    dir.normalize();
    const hit = raycastCamera(head.x, head.y, head.z, dir.x, dir.y, dir.z, len);
    const safe = Math.max(0.6, hit - 0.25);
    const final = head.clone().addScaledVector(dir, Math.min(len, safe));
    if (final.y < 0.3) final.y = 0.3;

    if (!init.current) {
      camera.position.copy(final);
      look.current.copy(target);
      init.current = true;
    } else {
      const k = hit < len ? 1 - Math.pow(0.0001, dt) : 1 - Math.pow(0.002, dt);
      camera.position.lerp(final, k);
      look.current.lerp(target, 1 - Math.pow(0.001, dt));
    }
    camera.lookAt(look.current);
  });
  return null;
}
