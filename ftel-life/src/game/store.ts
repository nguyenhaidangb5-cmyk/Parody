// ===== Trạng thái game (Zustand) + logic hiệu ứng, điều kiện, nhiệm vụ, hội thoại =====
import { create } from 'zustand';
import type {
  Career,
  Cond,
  DNode,
  Effect,
  EndingId,
  SaveData,
  Settings,
  StatKey,
  TextSpec,
  UiOpen,
} from './types';
import { DIALOGUES } from '../data/dialogues';
import { QUESTS, FIRST_QUEST, AUTO_OBJECTIVES } from '../data/quests';
import { CAREERS } from '../data/careers';
import { ACHIEVEMENTS } from '../data/endings';
import { INTER_MAP } from '../data/interactables';
import { runtime, setNpcEmote } from './runtime';
import { resolveCircle, groundHeight, colliders } from './collision';
import { sfx, setVolumes, setMusicMood } from './audio';

const SAVE_KEY = 'ftel-life-save-v1';
const META_KEY = 'ftel-life-meta-v1';

export const START_POS: [number, number] = [0, 39];

export function freshSave(name = 'Khoa'): SaveData {
  return {
    v: 1,
    name,
    career: null,
    stats: { tonTrong: 0, doiMoi: 0, dongDoi: 0, chiCong: 0, guongMau: 0, sangSuot: 0, kyQuac: 0 },
    flags: {},
    clues: [],
    quests: {},
    mainQuest: null,
    decisions: [],
    achievements: [],
    pos: [...START_POS],
    rotY: Math.PI,
    playTime: 0,
    ending: null,
    firedZones: [],
    talkedTo: [],
  };
}

const defaultSettings: Settings = {
  music: 0.5,
  sfx: 0.8,
  sensitivity: 1,
  invertY: false,
  quality: 'high',
  muted: false,
};

function loadMeta(): { endings: EndingId[]; settings: Settings } {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const m = JSON.parse(raw);
      return { endings: m.endings ?? [], settings: { ...defaultSettings, ...(m.settings ?? {}) } };
    }
  } catch {
    /* bỏ qua */
  }
  return { endings: [], settings: { ...defaultSettings } };
}

export function hasSave(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    return s && s.v === 1 && !s.ending;
  } catch {
    return false;
  }
}

function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SaveData;
    if (s.v !== 1) return null;
    return { ...freshSave(s.name), ...s };
  } catch {
    return null;
  }
}

export interface Toast {
  id: number;
  text: string;
  icon: string;
  kind: 'quest' | 'done' | 'clue' | 'info' | 'stat' | 'ach';
}

export interface DialogueUi {
  nodeId: string;
  npc: string | null;
}

export interface UiState {
  dialogue: DialogueUi | null;
  careerSelect: boolean;
  minigame: string | null;
  chat: string | null;
  card: boolean;
  map: boolean;
  pause: boolean;
}

const emptyUi: UiState = {
  dialogue: null,
  careerSelect: false,
  minigame: null,
  chat: null,
  card: false,
  map: false,
  pause: false,
};

interface Store {
  screen: 'menu' | 'playing' | 'ending';
  save: SaveData;
  settings: Settings;
  endingsUnlocked: EndingId[];
  ui: UiState;
  toasts: Toast[];
  banner: { title: string; sub: string; time: string } | null;
  endingId: EndingId | null;
  pendingExit: Effect[];
  saveExists: boolean;
  prompt: string | null;

  newGame: (name: string) => void;
  continueGame: () => void;
  toMenu: () => void;
  saveNow: () => void;
  setUi: (p: Partial<UiState>) => void;
  closeAllUi: () => void;
  toast: (text: string, icon?: string, kind?: Toast['kind']) => void;
  setSettings: (p: Partial<Settings>) => void;

  startDialogue: (id: string, npc?: string | null) => void;
  choose: (index: number) => void;
  advance: () => void;
  endDialogue: () => void;

  applyEffects: (effects: Effect[] | undefined) => void;
  chooseCareer: (c: Career) => void;
  finishMinigame: (success: boolean) => void;
  closeChat: () => void;
  triggerEnding: () => void;
  wipeSave: () => void;
}

let toastId = 1;
const meta = loadMeta();
setVolumes(meta.settings.sfx, meta.settings.music, meta.settings.muted);

export const useGame = create<Store>()((set, get) => ({
  screen: 'menu',
  save: freshSave(),
  settings: meta.settings,
  endingsUnlocked: meta.endings,
  ui: { ...emptyUi },
  toasts: [],
  banner: null,
  endingId: null,
  pendingExit: [],
  saveExists: hasSave(),
  prompt: null,

  newGame: (name) => {
    const s = freshSave(name.trim() || 'Khoa');
    runtime.teleport = { x: s.pos[0], z: s.pos[1], rotY: s.rotY };
    runtime.camYaw = Math.PI;
    set({ save: s, screen: 'playing', ui: { ...emptyUi }, endingId: null, toasts: [], banner: null, pendingExit: [] });
    setMusicMood('calm');
    startQuest(FIRST_QUEST);
    get().saveNow();
  },

  continueGame: () => {
    const s = readSave();
    if (!s) return get().newGame('Khoa');
    runtime.teleport = { x: s.pos[0], z: s.pos[1], rotY: s.rotY };
    runtime.camYaw = s.rotY;
    set({ save: s, screen: 'playing', ui: { ...emptyUi }, endingId: null, toasts: [], banner: null, pendingExit: [] });
    setMusicMood(s.flags.chaos_start ? 'tense' : 'calm');
    const q = s.mainQuest ? QUESTS[s.mainQuest] : null;
    if (q) set({ banner: { title: q.title, sub: 'Tiếp tục hành trình', time: q.time } });
    if (!s.mainQuest) startQuest(FIRST_QUEST);
    // Khôi phục các bước "tự động" để không bao giờ bị kẹt khi tải lại giữa cảnh
    setTimeout(() => {
      const cur = useGame.getState().save;
      if (cur.quests.q7?.status === 'active' && !cur.quests.q7.done.includes('readChat')) openUi('chat', 'urgent');
      if (cur.quests.q8?.status === 'active') {
        runtime.teleport = { x: 14.5, z: -13.6, rotY: Math.PI };
        useGame.getState().startDialogue('finale.start', null);
      }
    }, 600);
  },

  toMenu: () => {
    if (get().screen === 'playing') get().saveNow();
    set({ screen: 'menu', ui: { ...emptyUi }, saveExists: hasSave(), banner: null });
    setMusicMood('calm');
  },

  saveNow: () => {
    const s = get().save;
    if (get().screen !== 'playing' && !s.ending) return;
    const data: SaveData = {
      ...s,
      pos: [runtime.player.x, runtime.player.z],
      rotY: runtime.player.rotY,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      /* hết dung lượng hoặc chế độ riêng tư */
    }
  },

  setUi: (p) => set({ ui: { ...get().ui, ...p } }),
  closeAllUi: () => set({ ui: { ...emptyUi } }),

  toast: (text, icon = '✦', kind = 'info') => {
    const t: Toast = { id: toastId++, text, icon, kind };
    set({ toasts: [...get().toasts, t].slice(-4) });
    setTimeout(() => set({ toasts: get().toasts.filter((x) => x.id !== t.id) }), 4200);
  },

  setSettings: (p) => {
    const settings = { ...get().settings, ...p };
    set({ settings });
    setVolumes(settings.sfx, settings.music, settings.muted);
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ endings: get().endingsUnlocked, settings }));
    } catch {
      /* bỏ qua */
    }
  },

  // ---------- Hội thoại ----------
  startDialogue: (id, npc = null) => {
    if (!DIALOGUES[id]) {
      console.warn('[dialogue] missing', id);
      return;
    }
    runtime.talkingNpc = npc;
    if (npc) {
      const s = get().save;
      if (!s.talkedTo.includes(npc)) set({ save: { ...s, talkedTo: [...s.talkedTo, npc] } });
    }
    set({ ui: { ...get().ui, dialogue: { nodeId: id, npc } }, pendingExit: [] });
    enterNode(id);
  },

  choose: (index) => {
    const d = get().ui.dialogue;
    if (!d) return;
    const node = DIALOGUES[d.nodeId];
    const choices = visibleChoices(node);
    const c = choices[index];
    if (!c) return;
    sfx('click');
    get().applyEffects(c.effects);
    const to = c.to ?? resolveNext(node);
    gotoNode(to);
  },

  advance: () => {
    const d = get().ui.dialogue;
    if (!d) return;
    const node = DIALOGUES[d.nodeId];
    if (node.choices && visibleChoices(node).length) return;
    gotoNode(resolveNext(node));
  },

  endDialogue: () => {
    const pending = get().pendingExit;
    runtime.talkingNpc = null;
    set({ ui: { ...get().ui, dialogue: null }, pendingExit: [] });
    if (pending.length) runEffects(pending, true);
    get().saveNow();
  },

  applyEffects: (effects) => runEffects(effects ?? [], false),

  chooseCareer: (c) => {
    const s = get().save;
    set({ save: { ...s, career: c }, ui: { ...get().ui, careerSelect: false } });
    sfx('success');
    get().toast(`Bạn đã chọn nghề: ${CAREERS[c].name}`, CAREERS[c].icon, 'done');
    get().startDialogue('linh.afterCareer', 'linh');
  },

  finishMinigame: (success) => {
    set({ ui: { ...get().ui, minigame: null } });
    if (success) {
      get().applyEffects([{ obj: ['q5', 'minigame'] }]);
      get().startDialogue('mai.afterMinigame', 'mai');
    }
  },

  closeChat: () => {
    const id = get().ui.chat;
    set({ ui: { ...get().ui, chat: null } });
    if (id === 'urgent') get().applyEffects([{ obj: ['q7', 'readChat'] }]);
  },

  triggerEnding: () => {
    const s = get().save;
    const e = computeEnding(s);
    const endings = get().endingsUnlocked.includes(e) ? get().endingsUnlocked : [...get().endingsUnlocked, e];
    const save = { ...s, ending: e };
    set({ endingId: e, endingsUnlocked: endings, save, screen: 'ending', ui: { ...emptyUi } });
    sfx('ending');
    setMusicMood('party');
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ endings, settings: get().settings }));
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      /* bỏ qua */
    }
  },

  wipeSave: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* bỏ qua */
    }
    set({ saveExists: false });
  },
}));

// ---------------- Helpers ----------------

export function countPrefix(clues: string[], prefix: string) {
  return clues.filter((c) => c.startsWith(prefix)).length;
}

export function checkCond(c: Cond | undefined, s: SaveData = useGame.getState().save): boolean {
  if (!c) return true;
  const arr = (v: string | string[]) => (Array.isArray(v) ? v : [v]);
  if (c.flag && !arr(c.flag).every((f) => s.flags[f])) return false;
  if (c.notFlag && arr(c.notFlag).some((f) => s.flags[f])) return false;
  if (c.questActive && s.quests[c.questActive]?.status !== 'active') return false;
  if (c.questDone && s.quests[c.questDone]?.status !== 'done') return false;
  if (c.questNotDone && s.quests[c.questNotDone]?.status === 'done') return false;
  if (c.questStarted && !s.quests[c.questStarted]) return false;
  if (c.questNotStarted && s.quests[c.questNotStarted]) return false;
  if (c.objDone && !s.quests[c.objDone[0]]?.done.includes(c.objDone[1])) return false;
  if (c.objNotDone && s.quests[c.objNotDone[0]]?.done.includes(c.objNotDone[1])) return false;
  if (c.currentObj && currentObjective(s, c.currentObj[0]) !== c.currentObj[1]) return false;
  if (c.clue && !s.clues.includes(c.clue)) return false;
  if (c.notClue && s.clues.includes(c.notClue)) return false;
  if (c.career && s.career !== c.career) return false;
  if (c.secretGte !== undefined && countPrefix(s.clues, 'tu_') < c.secretGte) return false;
  if (c.cakeCluesGte !== undefined && countPrefix(s.clues, 'cake_') < c.cakeCluesGte) return false;
  if (c.statGte && (s.stats[c.statGte[0]] ?? 0) < c.statGte[1]) return false;
  if (c.hasCard !== undefined && !!s.flags.hasCard !== c.hasCard) return false;
  if (c.any && !c.any.some((x) => checkCond(x, s))) return false;
  if (c.not && checkCond(c.not, s)) return false;
  return true;
}

export function currentObjective(s: SaveData, questId: string): string | null {
  const q = QUESTS[questId];
  const st = s.quests[questId];
  if (!q || !st || st.status !== 'active') return null;
  const o = q.objectives.find((ob) => !st.done.includes(ob.id));
  return o ? o.id : null;
}

export function resolveText(t: TextSpec, s: SaveData = useGame.getState().save): string {
  let str = typeof t === 'string' ? t : (s.career && t[s.career]) || t.default;
  str = str.replace(/\{initial\}/g, (s.name.trim()[0] ?? 'K').toUpperCase()).replace(/\{name\}/g, s.name).replace(/\{career\}/g, s.career ? CAREERS[s.career].name : 'chưa chọn nghề')
    .replace(/\{time\}/g, (s.mainQuest && QUESTS[s.mainQuest]?.time) || '08:00');
  return str;
}

export function visibleChoices(node: DNode) {
  return (node.choices ?? []).filter((c) => checkCond(c.cond));
}

function resolveNext(node: DNode): string | null {
  if (!node.next) return null;
  if (typeof node.next === 'string') return node.next;
  for (const b of node.next) if (checkCond(b.cond)) return b.to;
  return null;
}

function enterNode(id: string) {
  const node = DIALOGUES[id];
  if (!node) return;
  if (node.emote && node.who !== 'player' && !node.who.startsWith('#') && node.who !== 'narrator') {
    setNpcEmote(node.who, node.emote, 3);
  }
  if (node.emote && node.who === 'player') runtime.playerEmote = { emote: node.emote, until: runtime.time + 2.5 };
  runEffects(node.effects ?? [], false);
}

function gotoNode(to: string | null) {
  const st = useGame.getState();
  if (!to || !DIALOGUES[to]) {
    if (to && !DIALOGUES[to]) console.warn('[dialogue] missing node', to);
    st.endDialogue();
    return;
  }
  const d = st.ui.dialogue;
  useGame.setState({ ui: { ...st.ui, dialogue: { nodeId: to, npc: d?.npc ?? null } } });
  enterNode(to);
}

function startQuest(id: string) {
  const st = useGame.getState();
  const q = QUESTS[id];
  if (!q || st.save.quests[id]) return;
  const save = { ...st.save, quests: { ...st.save.quests, [id]: { status: 'active' as const, done: [] } }, mainQuest: id };
  useGame.setState({ save, banner: { title: q.title, sub: q.desc, time: q.time } });
  sfx('quest');
  st.toast(`Nhiệm vụ mới: ${q.title}`, '📋', 'quest');
  runEffects(q.onStart ?? [], false);
  setTimeout(() => {
    if (useGame.getState().banner?.title === q.title) useGame.setState({ banner: null });
  }, 4200);
}

function completeObjective(qid: string, oid: string) {
  const st = useGame.getState();
  const qs = st.save.quests[qid];
  const q = QUESTS[qid];
  if (!q || !qs || qs.status !== 'active' || qs.done.includes(oid)) return;
  const done = [...qs.done, oid];
  const save = { ...st.save, quests: { ...st.save.quests, [qid]: { ...qs, done } } };
  useGame.setState({ save });
  const ob = q.objectives.find((o) => o.id === oid);
  if (ob) st.toast(resolveText(ob.text), '✓', 'done');
  sfx('pickup');
  if (q.objectives.every((o) => done.includes(o.id))) completeQuest(qid);
}

function completeQuest(qid: string) {
  const st = useGame.getState();
  const qs = st.save.quests[qid];
  const q = QUESTS[qid];
  const save = { ...st.save, quests: { ...st.save.quests, [qid]: { ...qs, status: 'done' as const } } };
  useGame.setState({ save });
  sfx('complete');
  st.toast(`Hoàn thành: ${q.title}`, '★', 'done');
  runEffects(q.onComplete ?? [], false);
  if (q.next) {
    const next = q.next;
    setTimeout(() => startQuest(next), 900);
  }
  setTimeout(() => useGame.getState().saveNow(), 1000);
}

const STAT_LABEL: Record<StatKey, string> = {
  tonTrong: 'Tôn trọng',
  doiMoi: 'Đổi mới',
  dongDoi: 'Đồng đội',
  chiCong: 'Chí công',
  guongMau: 'Gương mẫu',
  sangSuot: 'Sáng suốt',
  kyQuac: 'Kỳ quặc',
};
export { STAT_LABEL };

function checkAuto() {
  const s = useGame.getState().save;
  for (const a of AUTO_OBJECTIVES) {
    if (s.quests[a.quest]?.status === 'active' && !s.quests[a.quest].done.includes(a.obj) && checkCond(a.cond, s)) {
      completeObjective(a.quest, a.obj);
    }
  }
}

function runEffects(effects: Effect[], fromExit: boolean) {
  runEffectList(effects, fromExit);
  if (effects.length) checkAuto();
}

function runEffectList(effects: Effect[], fromExit: boolean) {
  for (const e of effects) {
    const st = useGame.getState();
    if ('open' in e || 'dialogue' in e) {
      if (!fromExit && st.ui.dialogue) {
        useGame.setState({ pendingExit: [...useGame.getState().pendingExit, e] });
        continue;
      }
      if ('dialogue' in e) {
        st.startDialogue(e.dialogue, runtime.talkingNpc);
        continue;
      }
      openUi(e.open, e.arg);
      continue;
    }
    if ('stat' in e) {
      const save = { ...st.save, stats: { ...st.save.stats, [e.stat]: (st.save.stats[e.stat] ?? 0) + e.add } };
      useGame.setState({ save });
      if (e.stat !== 'kyQuac' && e.add > 0) st.toast(`+ ${STAT_LABEL[e.stat]}`, '◆', 'stat');
    } else if ('setFlag' in e) {
      useGame.setState({ save: { ...st.save, flags: { ...st.save.flags, [e.setFlag]: true } } });
    } else if ('clearFlag' in e) {
      const flags = { ...st.save.flags };
      delete flags[e.clearFlag];
      useGame.setState({ save: { ...st.save, flags } });
    } else if ('startQuest' in e) {
      startQuest(e.startQuest);
    } else if ('obj' in e) {
      completeObjective(e.obj[0], e.obj[1]);
    } else if ('clue' in e) {
      if (!st.save.clues.includes(e.clue)) {
        useGame.setState({ save: { ...st.save, clues: [...st.save.clues, e.clue] } });
        sfx('clue');
        st.toast(e.clue.startsWith('tu_') ? 'Bạn phát hiện một bí mật nho nhỏ…' : 'Đã ghi nhận manh mối mới', '🔍', 'clue');
      }
    } else if ('sfx' in e) {
      sfx(e.sfx);
    } else if ('toast' in e) {
      st.toast(e.toast, e.icon ?? '✦', 'info');
    } else if ('decision' in e) {
      const decisions = st.save.decisions.filter((d) => d.id !== e.decision);
      useGame.setState({ save: { ...st.save, decisions: [...decisions, { id: e.decision, text: e.text }] } });
    } else if ('emote' in e) {
      if (e.emote.npc === 'player') runtime.playerEmote = { emote: e.emote.emote, until: runtime.time + 2.5 };
      else setNpcEmote(e.emote.npc, e.emote.emote, 3);
    } else if ('teleport' in e) {
      runtime.teleport = { x: e.teleport[0], z: e.teleport[1], rotY: e.teleport[2] };
      runtime.camYaw = e.teleport[2];
    } else if ('event' in e) {
      runtime.events[e.event] = runtime.time;
    } else if ('music' in e) {
      setMusicMood(e.music);
    } else if ('achievement' in e) {
      if (!st.save.achievements.includes(e.achievement)) {
        useGame.setState({ save: { ...st.save, achievements: [...st.save.achievements, e.achievement] } });
        const a = ACHIEVEMENTS[e.achievement];
        if (a) st.toast(`Thành tựu: ${a.name}`, a.icon, 'ach');
      }
    }
  }
}

function openUi(which: UiOpen, arg?: string) {
  const st = useGame.getState();
  switch (which) {
    case 'careerSelect':
      st.setUi({ careerSelect: true });
      break;
    case 'minigame':
      st.setUi({ minigame: arg ?? st.save.career ?? 'sales' });
      break;
    case 'chat':
      sfx('chat');
      st.setUi({ chat: arg ?? 'urgent' });
      break;
    case 'card':
      st.setUi({ card: true });
      break;
    case 'map':
      st.setUi({ map: true });
      break;
    case 'ending':
      setTimeout(() => useGame.getState().triggerEnding(), 400);
      break;
  }
}

export function computeEnding(s: SaveData): EndingId {
  if (s.flags.final_tu && countPrefix(s.clues, 'tu_') >= 4) return 'SECRET';
  const st = s.stats;
  if (st.kyQuac >= 6) return 'C';
  if (st.doiMoi >= 3 && st.doiMoi >= st.dongDoi) return 'B';
  return 'A';
}

// Công cụ kiểm thử tự động / debug
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__ftelInterData = INTER_MAP;
  (window as unknown as Record<string, unknown>).__ftel = {
    store: useGame,
    runtime,
    checkCond,
    computeEnding,
    resolveCircle,
    groundHeight,
    colliders,
  };
}
