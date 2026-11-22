// ===== Pháo giấy trong hội trường khi "SURPRISE!" =====
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../game/store';

const COUNT = 360;

export function Confetti() {
  const active = useGame((s) => !!s.save.flags.surprise || s.screen === 'ending');
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        x: 9 + Math.random() * 11.5,
        y: Math.random() * 6 + 3,
        z: -23 + Math.random() * 19,
        vy: 0.6 + Math.random() * 0.9,
        rx: Math.random() * 6,
        ry: Math.random() * 6,
        sp: 2 + Math.random() * 5,
        sway: Math.random() * 6,
      });
    }
    return arr;
  }, []);
  useLayoutEffect(() => {
    const pal = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#f783ac', '#F37021', '#ffffff'].map((h) => new THREE.Color(h));
    for (let i = 0; i < COUNT; i++) mesh.current.setColorAt(i, pal[i % pal.length]);
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, dt) => {
    if (!mesh.current) return;
    mesh.current.visible = active;
    if (!active) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const p = data[i];
      p.y -= p.vy * dt;
      if (p.y < 0.05) p.y = 3.2 + Math.random() * 1.5;
      dummy.position.set(p.x + Math.sin(t + p.sway) * 0.3, p.y, p.z + Math.cos(t * 0.8 + p.sway) * 0.3);
      dummy.rotation.set(p.rx + t * p.sp, p.ry + t * p.sp * 0.7, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} visible={false} frustumCulled={false}>
      <planeGeometry args={[0.07, 0.11]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
