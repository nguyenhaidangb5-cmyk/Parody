// ===== Nhân vật stylized dựng hoàn toàn bằng code, có khung xương và hoạt ảnh thủ tục =====
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Emote, Look, NpcAnim } from '../game/types';
import { G, mat, shade } from './cache';
import { EmoteBubble } from './EmoteBubble';

export interface AnimState {
  speed: number;
  running: boolean;
  talking: boolean;
  mode: NpcAnim | 'player';
  /** góc quay đầu mong muốn (rad, tương đối với thân) */
  lookYaw: number;
  emote: Emote;
  airborne: boolean;
}

export function makeAnimState(mode: AnimState['mode'] = 'idle'): AnimState {
  return { speed: 0, running: false, talking: false, mode, lookYaw: 0, emote: 'none', airborne: false };
}

type V3 = [number, number, number];

function Part({
  g,
  color,
  p,
  r,
  s,
  shadow,
  m,
}: {
  g: THREE.BufferGeometry;
  color?: string;
  p?: V3;
  r?: V3;
  s?: V3 | number;
  shadow?: boolean;
  m?: THREE.Material;
}) {
  const scale: V3 | undefined = typeof s === 'number' ? [s, s, s] : s;
  return (
    <mesh geometry={g} material={m ?? mat(color ?? '#ff00ff')} position={p} rotation={r} scale={scale} castShadow={shadow} />
  );
}

const SHORT_SLEEVE = new Set(['polo', 'tee']);

export function Character({
  look,
  state,
  extraAcc,
  showBubble = true,
}: {
  look: Look;
  state: React.MutableRefObject<AnimState>;
  extraAcc?: string[];
  showBubble?: boolean;
}) {
  const body = useRef<THREE.Group>(null!);
  const hips = useRef<THREE.Group>(null!);
  const spine = useRef<THREE.Group>(null!);
  const neck = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const kneeL = useRef<THREE.Group>(null!);
  const kneeR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const elbowL = useRef<THREE.Group>(null!);
  const elbowR = useRef<THREE.Group>(null!);
  const eyes = useRef<THREE.Group>(null!);
  const browL = useRef<THREE.Mesh>(null!);
  const browR = useRef<THREE.Mesh>(null!);
  const mouthSmile = useRef<THREE.Mesh>(null!);
  const mouthO = useRef<THREE.Mesh>(null!);
  const mouthFlat = useRef<THREE.Mesh>(null!);
  const mouthBig = useRef<THREE.Mesh>(null!);

  const anim = useRef({ phase: Math.random() * 6, t: Math.random() * 10, blinkAt: 2 + Math.random() * 3, emoteT: 0, lastEmote: 'none' as Emote });

  const acc = useMemo(() => new Set([...(look.acc ?? []), ...(extraAcc ?? [])]), [look.acc, extraAcc]);
  const build = look.build ?? 1;
  const h = look.height ?? 1;
  const skin = look.skin;
  const skinDark = shade(skin, -0.08);
  const hairCol = look.hair;
  const browCol = shade(hairCol === '#a3a3a3' ? '#555555' : hairCol, -0.05);
  const top = look.top;
  const longSleeve = !SHORT_SLEEVE.has(look.topStyle);
  const sleeveCol = look.topStyle === 'blouse' ? top : top;
  const forearmCol = longSleeve ? sleeveCol : skin;
  const legLower = look.skirt ? skin : look.bottom;

  // Geometry dùng chung
  const torsoGeo = useMemo(() => {
    const key = `torso_${build}`;
    void key;
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.165, 0.0),
      new THREE.Vector2(0.175, 0.08),
      new THREE.Vector2(0.18, 0.2),
      new THREE.Vector2(0.2, 0.33),
      new THREE.Vector2(0.205, 0.42),
      new THREE.Vector2(0.17, 0.5),
      new THREE.Vector2(0.09, 0.545),
      new THREE.Vector2(0.0, 0.55),
    ];
    return new THREE.LatheGeometry(pts, 20);
  }, [build]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = state.current;
    const a = anim.current;
    a.t += dt;
    const t = a.t;
    const sitting = st.mode === 'sit' || st.mode === 'type';
    const moveAmt = Math.min(1, st.speed / 3);
    a.phase += dt * (st.speed * (st.running ? 2.2 : 2.9) + 0.0001);
    const ph = a.phase;
    const amp = moveAmt * (st.running ? 1.15 : 0.8);

    if (st.emote !== a.lastEmote) {
      a.lastEmote = st.emote;
      a.emoteT = 0;
    }
    a.emoteT += dt;
    const e = st.emote;
    const ek = Math.min(1, a.emoteT * 6);

    // ---- Thân, hông
    let bodyY = 0;
    let spineX = 0;
    let spineZ = 0;
    let headX = 0;
    let headZ = 0;
    const lerp = (cur: number, target: number, k = 12) => cur + (target - cur) * Math.min(1, dt * k);

    let lHip = 0,
      rHip = 0,
      lKnee = 0,
      rKnee = 0,
      lArmX = 0,
      rArmX = 0,
      lArmZ = 0.08,
      rArmZ = -0.08,
      lElbow = -0.18,
      rElbow = -0.18;

    if (sitting) {
      bodyY = -0.34 * h;
      lHip = rHip = -1.45;
      lKnee = rKnee = 1.45;
      if (st.mode === 'type' && !st.talking) {
        lArmX = rArmX = -0.75;
        lElbow = -0.75 + Math.sin(t * 14) * 0.08;
        rElbow = -0.75 + Math.sin(t * 14 + 2) * 0.08;
        lArmZ = -0.05;
        rArmZ = 0.05;
        headX = 0.12 + Math.sin(t * 0.7) * 0.03;
      } else {
        lArmX = rArmX = -0.4;
        lElbow = rElbow = -0.6;
      }
    } else if (st.speed > 0.05 && !st.airborne) {
      lHip = -Math.sin(ph) * 0.8 * amp;
      rHip = Math.sin(ph) * 0.8 * amp;
      lKnee = Math.max(0, Math.sin(ph + 1.7)) * 1.1 * amp + 0.05;
      rKnee = Math.max(0, Math.sin(ph + 1.7 + Math.PI)) * 1.1 * amp + 0.05;
      lArmX = Math.sin(ph) * 0.7 * amp;
      rArmX = -Math.sin(ph) * 0.7 * amp;
      lElbow = rElbow = st.running ? -1.1 : -0.3;
      bodyY = Math.abs(Math.sin(ph)) * 0.04 * amp;
      spineX = st.running ? 0.16 : 0.04;
      spineZ = Math.sin(ph) * 0.03 * amp;
    } else if (st.airborne) {
      lHip = -0.5;
      rHip = 0.2;
      lKnee = 0.9;
      rKnee = 0.5;
      lArmX = rArmX = -0.3;
      lArmZ = 0.6;
      rArmZ = -0.6;
    } else {
      // đứng yên – thở nhẹ
      const br = Math.sin(t * 2.1);
      lArmZ = 0.09 + br * 0.015;
      rArmZ = -0.09 - br * 0.015;
      lArmX = Math.sin(t * 0.9) * 0.03;
      rArmX = Math.sin(t * 0.9 + 1) * 0.03;
      if (st.mode === 'stare') {
        headX = -0.05;
        lArmX = rArmX = 0.05;
        lElbow = rElbow = -0.1;
      }
    }

    // nói chuyện – cử chỉ tay
    if (st.talking && !sitting) {
      rArmX = -0.55 - Math.sin(t * 3.2) * 0.35;
      rElbow = -1.0 - Math.sin(t * 2.3) * 0.25;
      rArmZ = -0.25;
      lArmX = -0.15 + Math.sin(t * 2.1 + 1) * 0.15;
      lElbow = -0.5;
      headX = Math.sin(t * 4.1) * 0.05;
    } else if (st.talking && sitting) {
      rArmX = -0.8 - Math.sin(t * 3) * 0.25;
      rElbow = -0.9;
      headX = Math.sin(t * 4) * 0.05;
    }

    if (!sitting && st.speed < 0.05) {
      if (st.mode === 'cheer') {
        const b = Math.abs(Math.sin(t * 5));
        bodyY = b * 0.08;
        lArmX = rArmX = -2.6 + Math.sin(t * 5) * 0.2;
        lArmZ = 0.35;
        rArmZ = -0.35;
        lElbow = rElbow = -0.3;
      } else if (st.mode === 'wave') {
        rArmX = -2.7;
        rArmZ = -0.3 + Math.sin(t * 8) * 0.35;
        rElbow = -0.4;
      } else if (st.mode === 'dj') {
        bodyY = Math.abs(Math.sin(t * 7)) * 0.04;
        headX = Math.sin(t * 7) * 0.12;
        lArmX = -2.4;
        lArmZ = 0.9;
        lElbow = -1.9;
        rArmX = -0.9 + Math.sin(t * 9) * 0.25;
        rElbow = -0.7;
        rArmZ = -0.4 + Math.sin(t * 9) * 0.2;
      }
    }

    // biểu cảm cơ thể
    if (e === 'surprised') {
      bodyY += Math.max(0, Math.sin(Math.min(a.emoteT, 0.4) * Math.PI / 0.4)) * 0.12;
      if (!sitting && st.speed < 0.1) {
        lArmZ = 0.6 * ek;
        rArmZ = -0.6 * ek;
        lElbow = rElbow = -0.7;
      }
      headX -= 0.12 * ek;
    } else if (e === 'happy') {
      bodyY += Math.abs(Math.sin(t * 8)) * 0.04;
      if (!sitting && st.speed < 0.1 && !st.talking) {
        lArmZ = 0.35;
        rArmZ = -0.35;
      }
    } else if (e === 'confused' || e === 'think') {
      headZ = 0.22 * ek;
      if (!st.talking) {
        rArmX = -2.1;
        rElbow = -2.0;
        rArmZ = -0.25;
      }
    } else if (e === 'sad') {
      headX = 0.3 * ek;
      spineX += 0.08;
      lArmZ = 0.02;
      rArmZ = -0.02;
    } else if (e === 'angry') {
      if (!st.talking && !sitting) {
        lArmX = rArmX = -0.6;
        lElbow = rElbow = -1.9;
        lArmZ = -0.3;
        rArmZ = 0.3;
      }
      bodyY += Math.abs(Math.sin(t * 20)) * 0.01;
    } else if (e === 'love') {
      bodyY += Math.abs(Math.sin(t * 6)) * 0.05;
    }

    body.current.position.y = lerp(body.current.position.y, bodyY, 18);
    spine.current.rotation.x = lerp(spine.current.rotation.x, spineX, 10);
    spine.current.rotation.z = lerp(spine.current.rotation.z, spineZ, 10);
    spine.current.scale.y = 1 + Math.sin(t * 2.1) * 0.012;
    legL.current.rotation.x = lerp(legL.current.rotation.x, lHip, 20);
    legR.current.rotation.x = lerp(legR.current.rotation.x, rHip, 20);
    kneeL.current.rotation.x = lerp(kneeL.current.rotation.x, lKnee, 20);
    kneeR.current.rotation.x = lerp(kneeR.current.rotation.x, rKnee, 20);
    armL.current.rotation.x = lerp(armL.current.rotation.x, lArmX, 14);
    armR.current.rotation.x = lerp(armR.current.rotation.x, rArmX, 14);
    armL.current.rotation.z = lerp(armL.current.rotation.z, lArmZ, 14);
    armR.current.rotation.z = lerp(armR.current.rotation.z, rArmZ, 14);
    elbowL.current.rotation.x = lerp(elbowL.current.rotation.x, lElbow, 14);
    elbowR.current.rotation.x = lerp(elbowR.current.rotation.x, rElbow, 14);

    const look = Math.max(-1.1, Math.min(1.1, st.lookYaw));
    neck.current.rotation.y = lerp(neck.current.rotation.y, look, 6);
    head.current.rotation.x = lerp(head.current.rotation.x, headX, 10);
    head.current.rotation.z = lerp(head.current.rotation.z, headZ, 8);

    // ---- Khuôn mặt
    a.blinkAt -= dt;
    let eyeS = 1;
    if (a.blinkAt < 0) {
      eyeS = 0.12;
      if (a.blinkAt < -0.12) a.blinkAt = 2.5 + Math.random() * 3.5;
    }
    if (e === 'surprised') eyeS *= 1.25;
    if (e === 'happy' || e === 'love') eyeS *= 0.55;
    eyes.current.scale.y = lerp(eyes.current.scale.y, eyeS, 30);

    let browY = 0;
    let browRot = 0;
    if (e === 'surprised') browY = 0.03;
    else if (e === 'angry') {
      browRot = 0.45;
      browY = -0.01;
    } else if (e === 'sad') browRot = -0.4;
    else if (e === 'confused' || e === 'think') browY = 0.015;
    browL.current.position.y = lerp(browL.current.position.y, 0.272 + browY, 15);
    browR.current.position.y = lerp(browR.current.position.y, 0.272 + (e === 'confused' ? -0.012 : browY), 15);
    browL.current.rotation.z = lerp(browL.current.rotation.z, -browRot, 15);
    browR.current.rotation.z = lerp(browR.current.rotation.z, browRot, 15);

    const talkOpen = st.talking && Math.sin(t * 18) > 0;
    mouthSmile.current.visible = !talkOpen && (e === 'none' || e === 'love' || e === 'think');
    mouthBig.current.visible = !talkOpen && (e === 'happy');
    mouthO.current.visible = talkOpen || e === 'surprised';
    mouthFlat.current.visible = !talkOpen && (e === 'confused' || e === 'sad' || e === 'angry');
    if (talkOpen) mouthO.current.scale.set(1, 0.6 + Math.abs(Math.sin(t * 9)) * 0.5, 0.6);
    else mouthO.current.scale.set(1.15, 1.25, 0.6);
    mouthFlat.current.rotation.z = e === 'sad' ? 0.25 : e === 'confused' ? -0.2 : 0;
  });

  const hipY = 0.78;
  const hairShell = look.hairStyle === 'bob' || look.hairStyle === 'long';
  const hasCap = acc.has('cap');
  const hasBeanie = acc.has('beanie');

  return (
    <group scale={[h, h, h]}>
      <group ref={body}>
        <group ref={hips} position={[0, hipY, 0]}>
          {/* Hông */}
          <Part g={G.sphere(0.16, 16, 10)} color={look.bottom} p={[0, 0.02, 0]} s={[1.05 * build, 0.62, 0.8]} shadow />
          {look.skirt && (
            <Part g={G.cyl(0.175 * build, 0.25 * build, 0.38, 18, true)} m={mat(look.bottom, { side: THREE.DoubleSide })} p={[0, -0.13, 0]} shadow />
          )}
          {/* Chân trái / phải */}
          {[1, -1].map((side) => (
            <group key={side} ref={side === 1 ? legL : legR} position={[0.092 * side * build, -0.02, 0]}>
              <Part g={G.capsule(0.075, 0.26)} color={look.skirt ? skin : look.bottom} p={[0, -0.18, 0]} shadow />
              <group ref={side === 1 ? kneeL : kneeR} position={[0, -0.37, 0]}>
                <Part g={G.capsule(0.064, 0.25)} color={legLower} p={[0, -0.17, 0]} shadow />
                {/* giày */}
                <Part g={G.sphere(0.08, 14, 10)} color={look.shoes} p={[0, -0.35, 0.045]} s={[0.95, 0.6, 1.55]} shadow />
                <Part g={G.box(0.13, 0.025, 0.22)} color={shade(look.shoes, -0.1)} p={[0, -0.385, 0.045]} />
              </group>
            </group>
          ))}

          {/* Thân trên */}
          <group ref={spine} position={[0, 0.02, 0]}>
            <mesh geometry={torsoGeo} material={mat(top)} scale={[1.0 * build, 1, 0.74]} castShadow />
            <Torso look={look} acc={acc} build={build} />

            {/* Tay */}
            {[1, -1].map((side) => (
              <group key={side} ref={side === 1 ? armL : armR} position={[0.215 * side * build, 0.455, 0]}>
                <Part g={G.sphere(0.068, 14, 10)} color={sleeveCol} />
                <Part g={G.capsule(0.056, 0.17)} color={sleeveCol} p={[0, -0.13, 0]} shadow />
                {!longSleeve && <Part g={G.cyl(0.066, 0.066, 0.05, 14)} color={look.accent && look.topStyle === 'polo' ? sleeveCol : sleeveCol} p={[0, -0.2, 0]} />}
                {look.topStyle === 'uniform' && (
                  <Part g={G.cyl(0.059, 0.059, 0.025, 14)} color={look.accent ?? '#f2c230'} p={[0, -0.1, 0]} />
                )}
                <group ref={side === 1 ? elbowL : elbowR} position={[0, -0.255, 0]}>
                  <Part g={G.capsule(0.048, 0.17)} color={forearmCol} p={[0, -0.11, 0]} />
                  {longSleeve && <Part g={G.cyl(0.054, 0.054, 0.035, 12)} color={shade(sleeveCol, 0.04)} p={[0, -0.2, 0]} />}
                  <Part g={G.sphere(0.058, 12, 10)} color={skin} p={[0, -0.255, 0.005]} s={[0.85, 1.05, 0.75]} />
                  {acc.has('watch') && side === 1 && <Part g={G.cyl(0.052, 0.052, 0.03, 12)} color="#2b2b2b" p={[0, -0.19, 0]} />}
                </group>
              </group>
            ))}

            {/* Cổ + đầu */}
            <group ref={neck} position={[0, 0.53, 0]}>
              <Part g={G.cyl(0.055, 0.062, 0.1, 12)} color={skinDark} p={[0, 0.03, 0]} />
              <group ref={head} position={[0, 0.07, 0]}>
                <Part g={G.sphere(0.235, 28, 20)} color={skin} p={[0, 0.2, 0]} s={[1, 0.97, 0.95]} shadow />
                {/* hàm dưới mềm */}
                <Part g={G.sphere(0.17, 18, 12)} color={skin} p={[0, 0.1, 0.03]} s={[1.05, 0.7, 1]} />
                {/* tai */}
                {[1, -1].map((s) => (
                  <Part key={s} g={G.sphere(0.045, 10, 8)} color={skinDark} p={[0.228 * s, 0.18, 0]} s={[0.5, 1, 0.8]} />
                ))}
                {acc.has('earrings') &&
                  [1, -1].map((s) => <Part key={s} g={G.sphere(0.016, 8, 6)} color="#f5c542" m={mat('#f5c542', { metal: 0.6, rough: 0.3 })} p={[0.232 * s, 0.13, 0.01]} />)}

                {/* mắt */}
                <group ref={eyes} position={[0, 0.205, 0]}>
                  {[1, -1].map((s) => (
                    <group key={s} position={[0.083 * s, 0, 0.205]}>
                      <Part g={G.sphere(0.034, 14, 10)} color="#1d1a22" s={[0.82, 1.15, 0.5]} />
                      <Part g={G.sphere(0.011, 8, 6)} color="#ffffff" m={mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 })} p={[0.011, 0.016, 0.014]} />
                    </group>
                  ))}
                </group>
                {/* lông mày */}
                <mesh ref={browL} geometry={G.capsule(0.011, 0.05)} material={mat(browCol)} position={[0.085, 0.272, 0.2]} rotation={[0, 0, Math.PI / 2]} />
                <mesh ref={browR} geometry={G.capsule(0.011, 0.05)} material={mat(browCol)} position={[-0.085, 0.272, 0.2]} rotation={[0, 0, Math.PI / 2]} />
                {/* mũi */}
                <Part g={G.sphere(0.022, 10, 8)} color={skinDark} p={[0, 0.15, 0.228]} s={[1, 0.8, 0.8]} />
                {/* má hồng */}
                {(look.cheeks ?? true) &&
                  [1, -1].map((s) => (
                    <Part key={s} g={G.sphere(0.035, 10, 8)} m={mat('#ff8a8a', { transparent: true, opacity: 0.38 })} p={[0.135 * s, 0.125, 0.175]} s={[1, 0.6, 0.4]} />
                  ))}
                {/* miệng */}
                <mesh ref={mouthSmile} geometry={G.torus(0.032, 0.008, Math.PI, 6, 12)} material={mat('#7a2f2f')} position={[0, 0.098, 0.198]} rotation={[0.25, 0, Math.PI]} />
                <mesh ref={mouthBig} geometry={G.sphere(0.04, 14, 10, )} material={mat('#7a2f2f')} position={[0, 0.095, 0.19]} scale={[1, 0.6, 0.4]} visible={false} />
                <mesh ref={mouthO} geometry={G.sphere(0.022, 12, 8)} material={mat('#5a1f24')} position={[0, 0.092, 0.198]} visible={false} />
                <mesh ref={mouthFlat} geometry={G.capsule(0.007, 0.04)} material={mat('#7a2f2f')} position={[0, 0.098, 0.2]} rotation={[0, 0, Math.PI / 2]} visible={false} />
                {acc.has('mustache') && (
                  <>
                    <Part g={G.capsule(0.017, 0.05)} color="#3b3b3b" p={[0.035, 0.125, 0.215]} r={[0, 0, Math.PI / 2 - 0.25]} />
                    <Part g={G.capsule(0.017, 0.05)} color="#3b3b3b" p={[-0.035, 0.125, 0.215]} r={[0, 0, Math.PI / 2 + 0.25]} />
                  </>
                )}

                {!hasCap && !hasBeanie && <Hair look={look} />}
                {(hasCap || hasBeanie) && hairShell && <Hair look={look} />}
                {hasCap && (
                  <group position={[0, 0.3, 0]}>
                    <Part g={G.cap(0.252, 1.35)} color={look.topStyle === 'uniform' ? '#24406e' : look.top} p={[0, -0.02, -0.01]} shadow />
                    <Part g={G.cyl(0.16, 0.16, 0.018, 20)} color={look.topStyle === 'uniform' ? '#1b2f52' : shade(look.top, -0.15)} p={[0, 0.0, 0.2]} s={[1, 1, 0.75]} />
                    {look.topStyle === 'uniform' && <Part g={G.sphere(0.03, 10, 8)} m={mat('#f2c230', { metal: 0.5, rough: 0.35 })} p={[0, 0.1, 0.225]} s={[1, 1, 0.4]} />}
                  </group>
                )}
                {hasBeanie && (
                  <group position={[0, 0.22, -0.01]}>
                    <Part g={G.cap(0.262, 1.3)} color={look.accent ?? '#e03131'} shadow />
                    <Part g={G.torus(0.22, 0.035, Math.PI * 2, 8, 24)} color={shade(look.accent ?? '#e03131', -0.12)} p={[0, 0.06, 0]} r={[Math.PI / 2, 0, 0]} />
                    <Part g={G.sphere(0.05, 10, 8)} color="#ffffff" p={[0, 0.27, 0]} />
                  </group>
                )}
                {(acc.has('glasses') || acc.has('roundGlasses')) && (
                  <group position={[0, 0.205, 0.228]}>
                    {[1, -1].map((s) => (
                      <group key={s}>
                        <Part g={G.torus(acc.has('roundGlasses') ? 0.052 : 0.045, 0.007, Math.PI * 2, 6, 20)} color="#222222" p={[0.083 * s, 0, 0]} />
                        <Part g={G.sphere(acc.has('roundGlasses') ? 0.05 : 0.043, 12, 8)} m={mat('#cfe8ff', { transparent: true, opacity: 0.25, rough: 0.1 })} p={[0.083 * s, 0, -0.004]} s={[1, 1, 0.12]} />
                        <Part g={G.box(0.11, 0.008, 0.008)} color="#222222" p={[0.17 * s, 0.01, -0.06]} r={[0, s * 1.2, 0]} />
                      </group>
                    ))}
                    <Part g={G.box(0.06, 0.008, 0.008)} color="#222222" p={[0, 0.008, 0]} />
                  </group>
                )}
                {acc.has('headset') && (
                  <group position={[0, 0.2, 0]}>
                    <Part g={G.torus(0.25, 0.014, Math.PI, 6, 20)} color="#2d2d2d" r={[0, 0, 0]} />
                    {[1, -1].map((s) => (
                      <Part key={s} g={G.cyl(0.055, 0.055, 0.04, 14)} color="#2d2d2d" p={[0.245 * s, -0.02, 0]} r={[0, 0, Math.PI / 2]} />
                    ))}
                    <Part g={G.capsule(0.008, 0.15)} color="#2d2d2d" p={[0.2, -0.13, 0.11]} r={[1.2, 0.4, 0]} />
                    <Part g={G.sphere(0.018, 8, 6)} color="#555" p={[0.15, -0.16, 0.19]} />
                  </group>
                )}
                {acc.has('hairclip') && <Part g={G.box(0.06, 0.02, 0.025)} color={look.accent ?? '#ff6b9a'} p={[0.17, 0.37, 0.1]} r={[0, 0.5, 0.5]} />}
              </group>
            </group>
          </group>
        </group>
      </group>
      {showBubble && <EmoteBubble state={state} />}
    </group>
  );
}

// ---------------- Áo và phụ kiện trên thân ----------------
function Torso({ look, acc, build }: { look: Look; acc: Set<string>; build: number }) {
  const accent = look.accent ?? '#ffffff';
  const parts: JSX.Element[] = [];
  const front = 0.152; // bề mặt trước thân (đã nén z)
  switch (look.topStyle) {
    case 'shirt':
    case 'uniform':
    case 'vest':
      // cổ áo
      parts.push(
        <Part key="cl" g={G.box(0.09, 0.05, 0.02)} color={look.topStyle === 'vest' ? '#ffffff' : shade(look.top, 0.06)} p={[0.05, 0.52, 0.1]} r={[0.5, 0.3, -0.5]} />,
        <Part key="cr" g={G.box(0.09, 0.05, 0.02)} color={look.topStyle === 'vest' ? '#ffffff' : shade(look.top, 0.06)} p={[-0.05, 0.52, 0.1]} r={[0.5, -0.3, 0.5]} />,
      );
      for (let i = 0; i < 4; i++) parts.push(<Part key={'b' + i} g={G.sphere(0.009, 6, 4)} color={shade(look.top, -0.2)} p={[0, 0.44 - i * 0.1, front + 0.003 - (i === 0 ? 0.004 : 0)]} />);
      break;
    case 'polo':
      parts.push(
        <Part key="pc" g={G.torus(0.085, 0.022, Math.PI * 2, 6, 18)} color={accent} p={[0, 0.535, 0.01]} r={[Math.PI / 2 - 0.15, 0, 0]} s={[1.1, 1, 1]} />,
        <Part key="pp" g={G.box(0.03, 0.12, 0.01)} color={shade(look.top, -0.08)} p={[0, 0.45, front]} />,
      );
      break;
    case 'blouse':
      parts.push(<Part key="bn" g={G.torus(0.08, 0.018, Math.PI * 2, 6, 18)} color={shade(look.top, -0.05)} p={[0, 0.535, 0.01]} r={[Math.PI / 2 - 0.15, 0, 0]} />);
      parts.push(
        <group key="bow" position={[0, 0.49, front + 0.01]}>
          <Part g={G.sphere(0.03, 8, 6)} color={accent} p={[0.03, 0, 0]} s={[1.2, 0.8, 0.5]} />
          <Part g={G.sphere(0.03, 8, 6)} color={accent} p={[-0.03, 0, 0]} s={[1.2, 0.8, 0.5]} />
          <Part g={G.sphere(0.015, 8, 6)} color={shade(accent, -0.1)} />
        </group>,
      );
      break;
    case 'tee':
      parts.push(<Part key="tn" g={G.torus(0.075, 0.016, Math.PI * 2, 6, 18)} color={shade(look.top, -0.12)} p={[0, 0.535, 0.01]} r={[Math.PI / 2 - 0.15, 0, 0]} />);
      if (look.accent && !acc.has('apron'))
        parts.push(<Part key="tp" g={G.cyl(0.06, 0.06, 0.01, 5)} color={look.accent} p={[0, 0.34, front + 0.04]} r={[Math.PI / 2, 0, 0]} />);
      break;
    case 'hoodie':
      parts.push(
        <Part key="hd" g={G.torus(0.13, 0.05, Math.PI * 2, 8, 20)} color={shade(look.top, -0.06)} p={[0, 0.53, -0.04]} r={[Math.PI / 2 + 0.3, 0, 0]} />,
        <Part key="hp" g={G.box(0.2, 0.09, 0.02)} color={shade(look.top, -0.07)} p={[0, 0.16, front + 0.02]} />,
        <Part key="s1" g={G.capsule(0.006, 0.08)} color={look.accent ?? '#ddd'} p={[0.035, 0.42, front + 0.02]} />,
        <Part key="s2" g={G.capsule(0.006, 0.08)} color={look.accent ?? '#ddd'} p={[-0.035, 0.42, front + 0.02]} />,
      );
      break;
  }
  if (look.topStyle === 'uniform') {
    parts.push(
      <Part key="e1" g={G.box(0.11, 0.02, 0.07)} color={accent} p={[0.15 * build, 0.535, 0]} r={[0, 0, -0.35]} />,
      <Part key="e2" g={G.box(0.11, 0.02, 0.07)} color={accent} p={[-0.15 * build, 0.535, 0]} r={[0, 0, 0.35]} />,
      <Part key="bd" g={G.cyl(0.028, 0.028, 0.01, 6)} m={mat('#f2c230', { metal: 0.6, rough: 0.3 })} p={[0.09, 0.42, front + 0.012]} r={[Math.PI / 2, 0, 0]} />,
      <Part key="pk" g={G.box(0.08, 0.07, 0.01)} color={shade(look.top, -0.08)} p={[-0.09, 0.4, front + 0.005]} />,
      <Part key="bl" g={G.box(0.4 * build, 0.04, 0.3)} color="#1c1c1c" p={[0, 0.03, 0]} />,
    );
  }
  if (look.topStyle === 'vest') {
    parts.push(<Part key="vv" g={G.box(0.3 * build, 0.38, 0.03)} color={accent} p={[0, 0.27, front]} />);
  }
  if (acc.has('tie')) {
    parts.push(
      <group key="tie" position={[0, 0.0, front + 0.012]}>
        <Part g={G.box(0.035, 0.03, 0.015)} color={accent} p={[0, 0.5, 0]} />
        <Part g={G.box(0.045, 0.2, 0.012)} color={accent} p={[0, 0.38, 0]} r={[0, 0, 0]} />
        <Part g={G.box(0.032, 0.032, 0.012)} color={accent} p={[0, 0.27, 0]} r={[0, 0, Math.PI / 4]} />
      </group>,
    );
  }
  if (acc.has('lanyard')) {
    parts.push(
      <group key="lan">
        <Part g={G.torus(0.11, 0.008, Math.PI, 6, 16)} color="#F37021" p={[0, 0.5, 0.06]} r={[0.35, 0, Math.PI]} s={[1, 1.5, 1]} />
        <Part g={G.box(0.07, 0.095, 0.008)} color="#ffffff" p={[0.0, 0.28, front + 0.022]} />
        <Part g={G.box(0.07, 0.022, 0.009)} color="#0A6FC2" p={[0.0, 0.31, front + 0.023]} />
      </group>,
    );
  }
  if (acc.has('apron')) {
    parts.push(
      <Part key="ap" g={G.box(0.27 * build, 0.42, 0.015)} color="#ffffff" p={[0, 0.14, front + 0.012]} />,
      <Part key="ap2" g={G.box(0.12, 0.06, 0.008)} color="#ffd6e0" p={[0, 0.08, front + 0.022]} />,
      <Part key="as" g={G.torus(0.11, 0.008, Math.PI, 6, 16)} color="#ffffff" p={[0, 0.45, 0.07]} r={[0.35, 0, Math.PI]} s={[1, 1.2, 1]} />,
    );
  }
  if (acc.has('camera')) {
    parts.push(
      <group key="cam" position={[0.02, 0.28, front + 0.05]}>
        <Part g={G.box(0.13, 0.08, 0.06)} color="#222" />
        <Part g={G.cyl(0.03, 0.03, 0.05, 14)} color="#444" p={[0, 0, 0.04]} r={[Math.PI / 2, 0, 0]} />
        <Part g={G.cyl(0.02, 0.02, 0.01, 12)} m={mat('#8ec5ff', { metal: 0.4, rough: 0.1 })} p={[0, 0, 0.066]} r={[Math.PI / 2, 0, 0]} />
        <Part g={G.torus(0.13, 0.006, Math.PI, 6, 14)} color="#333" p={[0, 0.12, -0.08]} r={[0.4, 0, 0]} s={[1, 1.4, 1]} />
      </group>,
    );
  }
  if (acc.has('backpack')) {
    parts.push(
      <group key="bp" position={[0, 0.28, -0.17]}>
        <Part g={G.box(0.3 * build, 0.36, 0.16)} color="#F37021" shadow />
        <Part g={G.sphere(0.15, 12, 8)} color="#F37021" p={[0, 0.17, 0]} s={[1 * build, 0.45, 0.55]} />
        <Part g={G.box(0.22, 0.12, 0.04)} color="#d9581a" p={[0, -0.07, -0.09]} />
        <Part g={G.box(0.04, 0.3, 0.03)} color="#1b2a41" p={[0.11, 0.06, 0.1]} />
        <Part g={G.box(0.04, 0.3, 0.03)} color="#1b2a41" p={[-0.11, 0.06, 0.1]} />
      </group>,
    );
  }
  if (acc.has('bowtie')) {
    parts.push(<Part key="bt" g={G.box(0.07, 0.03, 0.02)} color={accent} p={[0, 0.5, front + 0.01]} />);
  }
  return <>{parts}</>;
}

// ---------------- Tóc ----------------
function Hair({ look }: { look: Look }) {
  const c = look.hair;
  const m = mat(c, { rough: 0.6 });
  const mD = mat(c, { rough: 0.6, side: THREE.DoubleSide });
  const dark = mat(shade(c, -0.06), { rough: 0.6 });
  const tilt = 0.44;
  const capP: V3 = [0, 0.205, -0.008];
  const base = <mesh geometry={G.cap(0.252, 1.56)} material={m} position={capP} rotation={[-tilt, 0, 0]} castShadow />;
  switch (look.hairStyle) {
    case 'bald':
      return null;
    case 'buzz':
      return <mesh geometry={G.cap(0.243, 1.45)} material={m} position={[0, 0.205, -0.01]} rotation={[-0.5, 0, 0]} />;
    case 'short':
      return (
        <group>
          {base}
          <mesh geometry={G.sphere(0.09, 12, 8)} material={m} position={[0.08, 0.36, 0.15]} scale={[1.3, 0.55, 0.8]} rotation={[0.4, 0, -0.3]} />
          <mesh geometry={G.sphere(0.09, 12, 8)} material={m} position={[-0.07, 0.365, 0.15]} scale={[1.3, 0.55, 0.8]} rotation={[0.4, 0, 0.35]} />
        </group>
      );
    case 'sidepart':
      return (
        <group>
          {base}
          <mesh geometry={G.sphere(0.12, 14, 10)} material={m} position={[0.05, 0.37, 0.12]} scale={[1.55, 0.55, 1]} rotation={[0.35, 0.1, -0.28]} castShadow />
          <mesh geometry={G.sphere(0.08, 12, 8)} material={dark} position={[-0.15, 0.33, 0.1]} scale={[0.7, 0.8, 1]} />
        </group>
      );
    case 'spiky':
      return (
        <group>
          {base}
          {[
            [0, 0.46, 0.05, 0, 0],
            [0.1, 0.44, 0.08, -0.4, 0.3],
            [-0.1, 0.44, 0.08, 0.4, 0.3],
            [0.05, 0.43, -0.1, -0.2, -0.5],
            [-0.06, 0.43, -0.1, 0.2, -0.5],
            [0.16, 0.38, -0.02, -0.8, 0],
            [-0.16, 0.38, -0.02, 0.8, 0],
            [0, 0.38, 0.19, 0, 0.9],
          ].map(([x, y, z, rz, rx], i) => (
            <mesh key={i} geometry={G.cone(0.065, 0.16, 6)} material={m} position={[x, y, z]} rotation={[rx, 0, rz]} />
          ))}
        </group>
      );
    case 'curly':
      return (
        <group>
          {base}
          {Array.from({ length: 16 }).map((_, i) => {
            const th = (i / 16) * Math.PI * 2;
            const ring = i % 2 === 0 ? 0.6 : 0.95;
            const r = 0.25;
            const x = Math.sin(th) * Math.sin(ring) * r;
            const z = Math.cos(th) * Math.sin(ring) * r - 0.02;
            const y = Math.cos(ring) * r + 0.22;
            if (z > 0.15 && y < 0.36) return null;
            return <mesh key={i} geometry={G.sphere(0.075, 10, 8)} material={m} position={[x, y, z]} />;
          })}
          <mesh geometry={G.sphere(0.09, 10, 8)} material={m} position={[0, 0.46, 0]} />
        </group>
      );
    case 'bun':
      return (
        <group>
          {base}
          <mesh geometry={G.sphere(0.1, 14, 10)} material={m} position={[0, 0.43, -0.12]} castShadow />
          <mesh geometry={G.torus(0.07, 0.018, Math.PI * 2, 6, 16)} material={mat(look.accent ?? '#6741d9')} position={[0, 0.39, -0.1]} rotation={[0.9, 0, 0]} />
          <mesh geometry={G.sphere(0.1, 12, 8)} material={m} position={[0, 0.35, 0.14]} scale={[1.8, 0.45, 0.8]} rotation={[0.45, 0, 0]} />
        </group>
      );
    case 'ponytail':
      return (
        <group>
          {base}
          <mesh geometry={G.sphere(0.1, 12, 8)} material={m} position={[0.03, 0.36, 0.14]} scale={[1.7, 0.5, 0.85]} rotation={[0.45, 0, -0.15]} />
          <mesh geometry={G.sphere(0.06, 10, 8)} material={m} position={[0, 0.33, -0.235]} />
          <mesh geometry={G.capsule(0.055, 0.22)} material={m} position={[0, 0.16, -0.27]} rotation={[0.25, 0, 0]} castShadow />
          <mesh geometry={G.torus(0.05, 0.016, Math.PI * 2, 6, 14)} material={mat('#F37021')} position={[0, 0.3, -0.25]} rotation={[1.3, 0, 0]} />
        </group>
      );
    case 'bob':
    case 'long': {
      // vỏ tóc hở phía trước để lộ khuôn mặt
      const open = 1.7;
      return (
        <group>
          {base}
          <mesh
            geometry={G.cap(0.262, look.hairStyle === 'long' ? 2.25 : 2.05, Math.PI / 2 + open / 2, Math.PI * 2 - open)}
            material={mD}
            position={[0, 0.215, -0.01]}
            rotation={[-0.15, 0, 0]}
            castShadow
          />
          <mesh geometry={G.sphere(0.11, 12, 8)} material={m} position={[0.06, 0.36, 0.14]} scale={[1.6, 0.5, 0.85]} rotation={[0.45, 0, -0.2]} />
          <mesh geometry={G.sphere(0.1, 12, 8)} material={m} position={[-0.08, 0.355, 0.14]} scale={[1.4, 0.5, 0.85]} rotation={[0.45, 0, 0.25]} />
          {look.hairStyle === 'long' && (
            <mesh geometry={G.box(0.4, 0.42, 0.09)} material={m} position={[0, -0.08, -0.17]} castShadow />
          )}
        </group>
      );
    }
  }
  return base;
}
