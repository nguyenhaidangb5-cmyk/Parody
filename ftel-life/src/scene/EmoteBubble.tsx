// ===== Bong bóng biểu cảm trên đầu nhân vật (!, ?, ♥, …) =====
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Emote } from '../game/types';
import type { AnimState } from './Character';

const SYMBOL: Partial<Record<Emote, { ch: string; color: string }>> = {
  surprised: { ch: '!', color: '#ff6b35' },
  confused: { ch: '?', color: '#4c6ef5' },
  think: { ch: '…', color: '#495057' },
  happy: { ch: '♪', color: '#18A558' },
  love: { ch: '♥', color: '#e64980' },
  angry: { ch: '#', color: '#e03131' },
  sad: { ch: '~', color: '#5c7cfa' },
};

const texCache = new Map<string, THREE.Texture>();
function bubbleTex(e: Emote): THREE.Texture | null {
  const s = SYMBOL[e];
  if (!s) return null;
  let t = texCache.get(e);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.strokeStyle = 'rgba(0,0,0,0.18)';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(64, 58, 48, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(52, 100);
  g.lineTo(64, 122);
  g.lineTo(76, 100);
  g.fill();
  g.fillStyle = s.color;
  g.font = '900 72px "Be Vietnam Pro", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(s.ch, 64, 62);
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(e, t);
  return t;
}

export function EmoteBubble({ state }: { state: React.MutableRefObject<AnimState> }) {
  const sprite = useRef<THREE.Sprite>(null!);
  const material = useMemo(() => new THREE.SpriteMaterial({ transparent: true, depthTest: false }), []);
  const cur = useRef<{ e: Emote; t: number }>({ e: 'none', t: 0 });
  useFrame((_, dt) => {
    const e = state.current.emote;
    const c = cur.current;
    if (e !== c.e) {
      c.e = e;
      c.t = 0;
      const tex = bubbleTex(e);
      material.map = tex;
      material.needsUpdate = true;
    }
    c.t += dt;
    const visible = !!SYMBOL[e];
    sprite.current.visible = visible;
    if (visible) {
      const pop = Math.min(1, c.t * 7);
      const s = 0.42 * (pop < 1 ? 0.6 + pop * 0.55 : 1 + Math.sin(c.t * 6) * 0.03);
      sprite.current.scale.set(s, s, s);
      sprite.current.position.y = 2.15 + Math.sin(c.t * 3) * 0.03;
    }
  });
  return <sprite ref={sprite} material={material} position={[0.25, 2.15, 0]} renderOrder={10} visible={false} />;
}
