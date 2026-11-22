// ===== Thế giới: phần tĩnh (gộp) + các vật thể động (barie, cửa, bánh, băng rôn, màn chiếu…) =====
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildWorld } from './buildWorld';
import { useGame } from '../game/store';
import { runtime } from '../game/runtime';
import { addBox } from '../game/collision';
import { POS } from '../data/layout';
import { G, mat } from './cache';
import { signTexture, FONT, logoTexture } from './textures';
import { sfx } from '../game/audio';
import { Confetti } from './Confetti';

export function World() {
  const built = useMemo(() => buildWorld(), []);
  const roofRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (roofRef.current) roofRef.current.visible = !runtime.insideBuilding;
  });

  return (
    <group>
      <primitive object={built.group} />
      <group ref={roofRef}>
        <primitive object={built.roof} />
      </group>
      <GateBarrier />
      <EntranceDoors />
      <StorageDoor />
      <SpinChair />
      <PhoneLight />
      <PrinterPaper />
      <Kiosk />
      <HallBanner />
      <HallScreen />
      <Cake />
      <DjBooth />
      <Confetti />
    </group>
  );
}

function useFlag(f: string) {
  return useGame((s) => !!s.save.flags[f]);
}

function GateBarrier() {
  const pivot = useRef<THREE.Group>(null!);
  const open = useFlag('gateOpen');
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const b = addBox(0, 34, 6.8, 0.3, 0, 1.4, { enabled: () => !openRef.current, blocksCamera: false, id: 'barrier' });
    return () => {
      b.enabled = () => false;
    };
  }, []);
  useFrame((_, dt) => {
    const target = open ? Math.PI / 2 - 0.08 : 0;
    pivot.current.rotation.z += (target - pivot.current.rotation.z) * Math.min(1, dt * 3);
  });
  return (
    <group ref={pivot} position={[3.35, 0.95, 34]}>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} geometry={G.box(0.95, 0.1, 0.1)} material={mat(i % 2 ? '#ffffff' : '#e03131')} position={[-0.5 - i * 0.95, 0, 0]} castShadow />
      ))}
    </group>
  );
}

function EntranceDoors() {
  const l = useRef<THREE.Mesh>(null!);
  const r = useRef<THREE.Mesh>(null!);
  const st = useRef({ open: 0, was: false });
  useFrame((_, dt) => {
    const p = runtime.player;
    const near = Math.abs(p.x) < 3.5 && Math.abs(p.z - 14) < 3.5;
    if (near !== st.current.was) {
      st.current.was = near;
      sfx('door');
    }
    st.current.open += ((near ? 1 : 0) - st.current.open) * Math.min(1, dt * 5);
    const o = st.current.open * 1.9;
    l.current.position.x = -1 - o;
    r.current.position.x = 1 + o;
  });
  const glass = mat('#bfe0f7', { transparent: true, opacity: 0.35, rough: 0.05, metal: 0.2 });
  return (
    <group position={[0, 0, 14]}>
      <mesh ref={l} geometry={G.box(2, 2.4, 0.06)} material={glass} position={[-1, 1.2, 0.05]} />
      <mesh ref={r} geometry={G.box(2, 2.4, 0.06)} material={glass} position={[1, 1.2, 0.05]} />
    </group>
  );
}

function StorageDoor() {
  const pivot = useRef<THREE.Group>(null!);
  const open = useFlag('storageOpen');
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const b = addBox(-4, -19, 0.25, 2, 0, 3.2, { enabled: () => !openRef.current, id: 'storageDoor' });
    return () => {
      b.enabled = () => false;
    };
  }, []);
  useFrame((_, dt) => {
    const target = open ? -Math.PI / 2 + 0.1 : 0;
    pivot.current.rotation.y += (target - pivot.current.rotation.y) * Math.min(1, dt * 4);
  });
  return (
    <group ref={pivot} position={[-4, 0, -20]}>
      <mesh geometry={G.box(0.08, 2.5, 1.96)} material={mat('#8a5f3c')} position={[0, 1.25, 1]} castShadow />
      <mesh geometry={G.box(0.12, 0.04, 0.2)} material={mat('#c0c6cc', { metal: 0.8, rough: 0.3 })} position={[0, 1.05, 1.75]} />
      <mesh geometry={G.box(0.1, 0.22, 0.14)} material={mat('#333')} position={[-0.07, 1.25, 1.75]} />
    </group>
  );
}

function SpinChair() {
  const g = useRef<THREE.Group>(null!);
  const vel = useRef(0);
  const last = useRef(-1);
  useFrame((_, dt) => {
    const ev = runtime.events.chairSpin;
    if (ev !== undefined && ev !== last.current) {
      last.current = ev;
      vel.current = 14;
    }
    vel.current *= Math.pow(0.86, dt * 4);
    g.current.rotation.y += vel.current * dt;
  });
  const c = mat('#e8590c');
  return (
    <group ref={g} position={[-17.35, 0, -19.2]}>
      <mesh geometry={G.cyl(0.03, 0.03, 0.4, 8)} material={mat('#9aa3ad')} position={[0, 0.25, 0]} />
      <mesh geometry={G.cyl(0.3, 0.3, 0.03, 5)} material={mat('#333')} position={[0, 0.05, 0]} />
      <mesh geometry={G.box(0.5, 0.08, 0.48)} material={c} position={[0, 0.46, 0]} castShadow />
      <mesh geometry={G.box(0.46, 0.55, 0.07)} material={c} position={[0, 0.8, -0.24]} castShadow />
    </group>
  );
}

function PhoneLight() {
  const m = useRef<THREE.Mesh>(null!);
  const answered = useFlag('phoneAnswered');
  const lastRing = useRef(0);
  const ph = POS.deskPhone;
  useFrame(() => {
    const on = !answered && Math.sin(runtime.time * 8) > 0;
    m.current.visible = !answered;
    (m.current.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 2 : 0.2;
    if (!answered) {
      const p = runtime.player;
      const d = Math.hypot(p.x - ph.x, p.z - ph.z);
      if (d < 7 && runtime.time - lastRing.current > 5) {
        lastRing.current = runtime.time;
        sfx('phone');
      }
    }
  });
  return (
    <mesh ref={m} geometry={G.sphere(0.03, 8, 6)} material={new THREE.MeshStandardMaterial({ color: '#ff2b2b', emissive: '#ff2b2b' })} position={[ph.x + 0.45, 0.83, ph.z + 0.75]} />
  );
}

function PrinterPaper() {
  const m = useRef<THREE.Mesh>(null!);
  const [px, pz] = POS.printer;
  useFrame(() => {
    const ev = runtime.events.printer;
    const t = ev === undefined ? 99 : runtime.time - ev;
    const active = t < 3.5;
    m.current.visible = active;
    if (active) {
      const k = (t % 0.9) / 0.9;
      m.current.position.set(px - 0.25 - k * 0.3, 0.72, pz);
    }
  });
  return <mesh ref={m} geometry={G.box(0.3, 0.005, 0.42)} material={mat('#ffffff')} visible={false} />;
}

function Kiosk() {
  const m = useRef<THREE.Mesh>(null!);
  const hasCard = useFlag('hasCard');
  const q3 = useGame((s) => s.save.quests.q3);
  const error = q3 && q3.status === 'active' && q3.done.includes('kiosk');
  const tex = useMemo(() => {
    if (hasCard) return signTexture('k_ok', ['XIN CHÀO!', 'Bạn đã tồn tại ✓'], 256, 320, { bg: '#18A558', fg: '#fff', size: 30 });
    if (error) return signTexture('k_err', ['LỖI 404', 'NHÂN VIÊN', 'KHÔNG TỒN TẠI'], 256, 320, { bg: '#c92a2a', fg: '#fff', size: 30 });
    return signTexture('k_idle', ['CHẠM ĐỂ', 'NHẬN THẺ', '👆'], 256, 320, { bg: '#0A6FC2', fg: '#fff', size: 32 });
  }, [hasCard, error]);
  const [kx, kz] = POS.kiosk;
  return (
    <mesh ref={m} position={[kx - 0.08, 1.05, kz]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[0.42, 0.52]} />
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.7} />
    </mesh>
  );
}

function bannerState(s: ReturnType<typeof useGame.getState>['save']) {
  const f = s.flags;
  const name = s.name.toUpperCase();
  if (f.surprise) {
    if (f.banner_bye) return { text: 'TẠM BIỆT VÀ HẸN GẶP LẠI!', bg: '#5f3dc4' };
    if (f.banner_creative) return { text: `TẠM BIỆT THẤT NGHIỆP – CHÀO MỪNG ${name}!`, bg: '#F37021' };
    return { text: `CHÀO MỪNG ${name}!`, bg: '#F37021' };
  }
  if (f.banner_team) return { text: 'CHÀO MỪNG!', bg: '#F37021' };
  if (f.banner_creative) return { text: 'TẠM BIỆT THẤT NGHIỆP – CHÀO MỪNG ĐI LÀM!', bg: '#F37021' };
  if (f.banner_bye) return { text: 'TẠM BIỆT VÀ HẸN GẶP LẠI!', bg: '#5f3dc4' };
  if (s.quests.q7?.done.includes('hall')) return { text: 'TẠM BIỆT VÀ HẸN GẶP LẠI!', bg: '#5f3dc4' };
  return null;
}

function HallBanner() {
  const save = useGame((s) => s.save);
  const st = bannerState(save);
  const tex = useMemo(() => {
    if (!st) return null;
    return signTexture('banner_' + st.text, [st.text], 1024, 128, { bg: st.bg, fg: '#ffffff', size: st.text.length > 30 ? 46 : 64, radius: 6 });
  }, [st?.text, st?.bg]);
  const [bx, bz] = POS.banner;
  if (!tex) {
    return <mesh key="rolled" geometry={G.cyl(0.12, 0.12, 6.6, 12)} material={mat('#5f3dc4')} position={[bx, 3.05, bz]} rotation={[0, 0, Math.PI / 2]} />;
  }
  return (
    <mesh key="flat" position={[bx, 2.75, bz]}>
      <planeGeometry args={[7.6, 0.95]} />
      <meshStandardMaterial map={tex} side={THREE.DoubleSide} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.15} />
    </mesh>
  );
}

function catTexture() {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffe066';
  g.fillRect(0, 0, 640, 320);
  g.fillStyle = '#f08c00';
  g.beginPath();
  g.arc(320, 180, 95, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(240, 120);
  g.lineTo(255, 40);
  g.lineTo(300, 100);
  g.moveTo(400, 120);
  g.lineTo(385, 40);
  g.lineTo(340, 100);
  g.fill();
  g.fillStyle = '#111';
  g.fillRect(250, 150, 140, 34);
  g.fillRect(300, 155, 40, 8);
  g.fillStyle = '#c2255c';
  g.beginPath();
  g.arc(320, 210, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#111';
  g.font = `900 34px ${FONT}`;
  g.textAlign = 'center';
  g.fillText('CHÀO MỪNG (MÈO DUYỆT)', 320, 305);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function HallScreen() {
  const save = useGame((s) => s.save);
  const q7 = save.quests.q7;
  const f = save.flags;
  const name = save.name.toUpperCase();
  const key = f.catSlide ? 'cat' : f.surprise ? 'welcome' : q7?.done.includes('screen') ? 'logo' : q7 ? 'glitch' : 'off';
  const tex = useMemo(() => {
    switch (key) {
      case 'cat':
        return catTexture();
      case 'welcome':
        return signTexture('scr_w_' + name, ['**CHÀO MỪNG', name, 'ĐẾN VỚI FTEL! 🎉'], 640, 320, { bg: '#0A6FC2', fg: '#fff', size: 52 });
      case 'logo':
        return logoTexture();
      case 'glitch':
        return signTexture('scr_g_' + name, ['CHÀO MỪNG TÂN BINH:', name, '▓▒░ lỗi hiển thị ░▒▓'], 640, 320, { bg: '#1c1c3c', fg: '#69db7c', size: 46 });
      default:
        return signTexture('scr_off', ['(máy chiếu đang tắt)'], 640, 320, { bg: '#2b2f36', fg: '#6c757d', size: 36 });
    }
  }, [key, name]);
  const [sx, sz] = POS.hallScreen;
  return (
    <group position={[sx, 2.0, sz + 0.02]}>
      <mesh geometry={G.box(4.8, 2.4, 0.04)} material={mat('#111')} position={[0, 0, -0.03]} />
      <mesh>
        <planeGeometry args={[4.6, 2.2]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={key === 'off' ? 0.1 : 0.85} color={key === 'logo' ? '#0A6FC2' : '#ffffff'} />
      </mesh>
    </group>
  );
}

function Cake() {
  const found = useFlag('cakeFound');
  const surprise = useFlag('surprise');
  const name = useGame((s) => s.save.name);
  const g = useRef<THREE.Group>(null!);
  const flames = useRef<THREE.Group>(null!);
  const tex = useMemo(() => signTexture('cake_' + name, [surprise ? `Chào mừng ${name}!` : `Chào mừng ${name[0] ?? 'K'}…`], 256, 64, { bg: '#fff0f6', fg: '#c2255c', size: 30, radius: 30 }), [name, surprise]);
  useFrame(() => {
    if (flames.current) flames.current.children.forEach((c, i) => (c.scale.y = 1 + Math.sin(runtime.time * 20 + i) * 0.2));
  });
  if (!found && !surprise) return null;
  const [tx, tz] = POS.cakeTable;
  return (
    <group ref={g} position={[tx, 0.78, tz]}>
      <mesh geometry={G.cyl(0.3, 0.3, 0.16, 24)} material={mat('#fff0f6')} position={[0, 0.08, 0]} castShadow />
      <mesh geometry={G.cyl(0.31, 0.31, 0.03, 24)} material={mat('#f783ac')} position={[0, 0.03, 0]} />
      <mesh geometry={G.cyl(0.22, 0.22, 0.14, 24)} material={mat('#ffdeeb')} position={[0, 0.23, 0]} castShadow />
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} geometry={G.sphere(0.035, 8, 6)} material={mat(i % 2 ? '#e03131' : '#ffffff')} position={[Math.cos(i * 0.785) * 0.26, 0.17, Math.sin(i * 0.785) * 0.26]} />
      ))}
      <group ref={flames}>
        {[-0.08, 0, 0.08].map((x, i) => (
          <group key={i} position={[x, 0.3, 0]}>
            <mesh geometry={G.cyl(0.012, 0.012, 0.1, 6)} material={mat(['#4dabf7', '#ffd43b', '#69db7c'][i])} position={[0, 0.05, 0]} />
            <mesh geometry={G.sphere(0.018, 6, 6)} material={mat('#ffa94d', { emissive: '#ffa94d', emissiveIntensity: 2 })} position={[0, 0.12, 0]} scale={[1, 1.6, 1]} />
          </group>
        ))}
      </group>
      <mesh position={[0, 0.12, 0.315]}>
        <planeGeometry args={[0.42, 0.1]} />
        <meshStandardMaterial map={tex} transparent />
      </mesh>
      {!surprise && (
        <mesh geometry={G.box(0.3, 0.002, 0.42)} material={mat('#ffffff')} position={[0.05, 0.305, 0]} rotation={[0, 0.3, 0]} />
      )}
      <mesh geometry={G.box(0.12, 0.05, 0.002)} material={mat('#ffd43b')} position={[0.22, 0.1, 0.27]} rotation={[0, 0.7, 0]} />
    </group>
  );
}

function DjBooth() {
  const on = useFlag('djtu');
  const lights = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!lights.current) return;
    const t = runtime.time;
    lights.current.children.forEach((c, i) => {
      const l = c as THREE.PointLight;
      l.position.set(14.5 + Math.sin(t * 1.3 + i * 2.1) * 4, 2.6, -15 + Math.cos(t * 1.1 + i * 1.7) * 5);
      l.intensity = 6 + Math.sin(t * 6 + i) * 3;
    });
  });
  if (!on) return null;
  return (
    <group>
      <group position={[18.1, 0.5, -22.7]}>
        <mesh geometry={G.box(1.4, 0.9, 0.6)} material={mat('#212529')} position={[0, 0.45, 0]} castShadow />
        <mesh geometry={G.box(1.3, 0.04, 0.5)} material={mat('#343a40')} position={[0, 0.92, 0]} />
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} geometry={G.cyl(0.17, 0.17, 0.03, 20)} material={mat('#111')} position={[x, 0.95, 0]} />
        ))}
        <mesh geometry={G.box(1.4, 0.1, 0.02)} material={mat('#f783ac', { emissive: '#f783ac', emissiveIntensity: 2 })} position={[0, 0.6, 0.31]} />
      </group>
      <group ref={lights}>
        {['#ff3b7f', '#3bc9db', '#ffd43b'].map((c) => (
          <pointLight key={c} color={c} intensity={6} distance={12} decay={1.6} />
        ))}
      </group>
    </group>
  );
}
