// ===== Canvas 3D chính =====
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { World } from './World';
import { Player } from './Player';
import { NPCs } from './NPCs';
import { CameraRig } from './CameraRig';
import { Lighting, QuestMarker } from './Environment';
import { useGame } from '../game/store';
import { requestLock, startDrag, isTouchDevice } from '../game/input';
import { uiBlocking } from './Player';
import { useFrame, useThree } from '@react-three/fiber';
import { runtime } from '../game/runtime';

function FpsMeter() {
  const gl = useThree((s) => s.gl);
  useFrame((_, dt) => {
    runtime.fps = runtime.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
    runtime.drawCalls = gl.info.render.calls;
    runtime.triangles = gl.info.render.triangles;
  });
  return null;
}

export function GameCanvas({ onLost }: { onLost: () => void }) {
  const quality = useGame((s) => s.settings.quality);
  return (
    <Canvas
      shadows={quality === 'high' ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={quality === 'high' ? [1, 1.75] : [0.75, 1]}
      camera={{ fov: 55, near: 0.1, far: 600, position: [0, 15, 50] }}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance', preserveDrawingBuffer: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onLost();
        });
      }}
      onPointerDown={(e) => {
        if (useGame.getState().screen !== 'playing' || uiBlocking()) return;
        if (e.button === 0 && !isTouchDevice()) requestLock(e.target as Element);
        startDrag();
      }}
    >
      <Lighting />
      <World />
      <NPCs />
      <Player />
      <QuestMarker />
      <CameraRig />
      <FpsMeter />
    </Canvas>
  );
}
