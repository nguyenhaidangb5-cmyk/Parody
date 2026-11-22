// ===== Âm thanh tổng hợp bằng Web Audio API (không dùng file nhạc bên ngoài) =====
import type { SfxName } from './types';

let ctx: AudioContext | null = null;
let master: GainNode;
let sfxBus: GainNode;
let musicBus: GainNode;
let noiseBuf: AudioBuffer;
let musicTimer: number | null = null;
let musicStep = 0;
let nextNoteTime = 0;
let musicMood: 'calm' | 'tense' | 'party' = 'calm';

const vol = { sfx: 0.8, music: 0.45, muted: false };

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus.connect(master);
    applyVolumes();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch {
    ctx = null;
  }
  return ctx;
}

function applyVolumes() {
  if (!ctx) return;
  master.gain.value = vol.muted ? 0 : 1;
  sfxBus.gain.value = vol.sfx;
  musicBus.gain.value = vol.music * 0.5;
}

export function setVolumes(sfx: number, music: number, muted: boolean) {
  vol.sfx = sfx;
  vol.music = music;
  vol.muted = muted;
  applyVolumes();
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.2,
  when = 0,
  slideTo?: number,
  bus?: GainNode,
) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus ?? sfxBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, gain = 0.2, freq = 1200, when = 0, q = 1, type: BiquadFilterType = 'bandpass', bus?: GainNode) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + when;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(bus ?? sfxBus);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

const N = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12); // semi: 0 = C4

export function sfx(name: SfxName) {
  if (!ensure()) return;
  switch (name) {
    case 'click':
      tone(880, 0.06, 'triangle', 0.12);
      break;
    case 'hover':
      tone(1320, 0.03, 'sine', 0.04);
      break;
    case 'type':
      tone(600 + Math.random() * 300, 0.025, 'square', 0.025);
      break;
    case 'step':
      noise(0.07, 0.07, 380 + Math.random() * 120, 0, 0.8, 'lowpass');
      break;
    case 'quest':
      [0, 4, 7, 12].forEach((s, i) => tone(N(s + 12), 0.25, 'triangle', 0.13, i * 0.08));
      break;
    case 'complete':
      [0, 4, 7].forEach((s, i) => tone(N(s + 12), 0.3, 'triangle', 0.12, i * 0.07));
      tone(N(24), 0.6, 'sine', 0.1, 0.24);
      tone(N(19), 0.6, 'sine', 0.06, 0.24);
      break;
    case 'success':
      [0, 7, 12, 16, 19].forEach((s, i) => tone(N(s + 12), 0.35, 'triangle', 0.11, i * 0.06));
      break;
    case 'fail':
      tone(N(4), 0.25, 'sawtooth', 0.06, 0, N(0));
      tone(N(-1), 0.4, 'sawtooth', 0.06, 0.2, N(-5));
      break;
    case 'error':
      tone(220, 0.15, 'square', 0.07);
      tone(180, 0.22, 'square', 0.07, 0.16);
      break;
    case 'door':
      noise(0.5, 0.12, 900, 0, 0.6, 'bandpass');
      tone(160, 0.3, 'sine', 0.05, 0, 120);
      break;
    case 'whoosh':
      noise(0.35, 0.1, 1800, 0, 0.7, 'bandpass');
      break;
    case 'printer':
      for (let i = 0; i < 8; i++) {
        noise(0.08, 0.08, 2500, i * 0.11, 3);
        tone(110, 0.08, 'square', 0.03, i * 0.11);
      }
      break;
    case 'chat':
      tone(N(19), 0.09, 'sine', 0.14);
      tone(N(24), 0.14, 'sine', 0.14, 0.09);
      break;
    case 'phone':
      for (let i = 0; i < 3; i++) {
        tone(N(16), 0.12, 'square', 0.05, i * 0.5);
        tone(N(19), 0.12, 'square', 0.05, i * 0.5 + 0.13);
      }
      break;
    case 'surprise':
      tone(N(0), 0.3, 'square', 0.06, 0, N(24));
      tone(N(24), 0.2, 'triangle', 0.1, 0.3);
      break;
    case 'pickup':
      tone(N(12), 0.1, 'triangle', 0.12);
      tone(N(19), 0.18, 'triangle', 0.12, 0.08);
      break;
    case 'clue':
      [7, 11, 14, 19].forEach((s, i) => tone(N(s + 12), 0.4, 'sine', 0.08, i * 0.09));
      break;
    case 'coffee':
      noise(1.2, 0.08, 600, 0, 0.5, 'lowpass');
      for (let i = 0; i < 6; i++) tone(300 + Math.random() * 200, 0.05, 'sine', 0.04, 0.2 + i * 0.15);
      break;
    case 'boot':
      [0, 7, 12, 19, 24].forEach((s, i) => tone(N(s), 0.5, 'sine', 0.08, i * 0.12));
      break;
    case 'party':
      for (let i = 0; i < 10; i++) noise(0.15, 0.1, 3000 + Math.random() * 3000, i * 0.06 + Math.random() * 0.05, 2);
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(N(s + 12), 0.3, 'triangle', 0.09, 0.2 + i * 0.07));
      break;
    case 'ending':
      [0, 4, 7, 12].forEach((s, i) => tone(N(s), 1.2, 'triangle', 0.08, i * 0.15));
      [12, 16, 19, 24].forEach((s, i) => tone(N(s + 12), 1.2, 'sine', 0.06, 0.7 + i * 0.12));
      break;
  }
}

// ===== Nhạc nền tổng hợp: một vòng lo-fi nhẹ nhàng, sáng tác bằng code =====
const PROG: Record<string, number[][]> = {
  calm: [
    [0, 4, 7, 11], // Cmaj7
    [-3, 0, 4, 7], // Am7
    [5, 9, 12, 16], // Fmaj7
    [7, 11, 14, 17], // G7
  ],
  tense: [
    [-3, 0, 4, 7],
    [5, 9, 12, 16],
    [2, 5, 9, 12],
    [4, 8, 11, 14],
  ],
  party: [
    [0, 4, 7, 12],
    [5, 9, 12, 17],
    [7, 11, 14, 19],
    [0, 4, 7, 12],
  ],
};
const MELODY = [12, -1, 16, 14, 12, -1, 9, -1, 11, 12, -1, 7, 9, -1, -1, -1];

export function setMusicMood(m: 'calm' | 'tense' | 'party') {
  musicMood = m;
}

export function startMusic() {
  const c = ensure();
  if (!c || musicTimer !== null) return;
  nextNoteTime = c.currentTime + 0.1;
  musicStep = 0;
  musicTimer = window.setInterval(scheduler, 50);
}

export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
}

function scheduler() {
  if (!ctx) return;
  const tempo = musicMood === 'tense' ? 118 : musicMood === 'party' ? 128 : 92;
  const stepDur = 60 / tempo / 2; // nốt móc đơn
  while (nextNoteTime < ctx.currentTime + 0.15) {
    playStep(musicStep, nextNoteTime - ctx.currentTime, stepDur);
    nextNoteTime += stepDur;
    musicStep = (musicStep + 1) % 64;
  }
}

function playStep(step: number, when: number, stepDur: number) {
  const bar = Math.floor(step / 16) % 4;
  const chord = PROG[musicMood][bar];
  const s16 = step % 16;
  // pad hợp âm
  if (s16 === 0) chord.forEach((n) => tone(N(n), stepDur * 15, 'sine', 0.035, when, undefined, musicBus));
  // bass
  if (s16 % 4 === 0) tone(N(chord[0] - 12), stepDur * 1.8, 'triangle', 0.09, when, undefined, musicBus);
  // giai điệu thưa
  const m = MELODY[s16];
  if (m >= 0 && (bar % 2 === 0 || s16 < 8)) tone(N(m + (bar === 2 ? 5 : 0) + (musicMood === 'tense' ? -3 : 0)), stepDur * 1.6, 'triangle', 0.035, when, undefined, musicBus);
  // trống nhẹ
  if (s16 % 8 === 4) noise(0.12, musicMood === 'party' ? 0.08 : 0.04, 1800, when, 0.8, 'bandpass', musicBus);
  if (s16 % 2 === 0) noise(0.03, musicMood === 'calm' ? 0.012 : 0.025, 8000, when, 1, 'highpass', musicBus);
  if (s16 === 0 || s16 === 10) tone(70, 0.18, 'sine', musicMood === 'calm' ? 0.08 : 0.14, when, 40, musicBus);
}
