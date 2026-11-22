// ===== Kiểu dữ liệu dùng chung cho toàn bộ game =====

export type Career = 'sales' | 'tech' | 'care' | 'mkt';

/** Sáu giá trị văn hóa + chỉ số "kỳ quặc" (ẩn) */
export type StatKey =
  | 'tonTrong'
  | 'doiMoi'
  | 'dongDoi'
  | 'chiCong'
  | 'guongMau'
  | 'sangSuot'
  | 'kyQuac';

export type Emote = 'none' | 'happy' | 'surprised' | 'confused' | 'sad' | 'angry' | 'love' | 'think';

export type TextSpec = string | ({ default: string } & Partial<Record<Career, string>>);

/** Điều kiện: mọi trường được khai báo phải đúng (AND). `any` = OR. */
export interface Cond {
  flag?: string | string[];
  notFlag?: string | string[];
  questActive?: string;
  questDone?: string;
  questNotDone?: string;
  questStarted?: string;
  questNotStarted?: string;
  objDone?: [string, string];
  objNotDone?: [string, string];
  /** Mục tiêu hiện tại của quest đúng bằng obj */
  currentObj?: [string, string];
  clue?: string;
  notClue?: string;
  career?: Career;
  secretGte?: number;
  cakeCluesGte?: number;
  statGte?: [StatKey, number];
  hasCard?: boolean;
  any?: Cond[];
  not?: Cond;
}

export type SfxName =
  | 'click'
  | 'hover'
  | 'quest'
  | 'complete'
  | 'door'
  | 'printer'
  | 'chat'
  | 'surprise'
  | 'ending'
  | 'error'
  | 'pickup'
  | 'clue'
  | 'phone'
  | 'coffee'
  | 'type'
  | 'step'
  | 'boot'
  | 'success'
  | 'fail'
  | 'whoosh'
  | 'party';

export type UiOpen = 'careerSelect' | 'minigame' | 'chat' | 'card' | 'ending' | 'map';

export type Effect =
  | { stat: StatKey; add: number }
  | { setFlag: string }
  | { clearFlag: string }
  | { startQuest: string }
  | { obj: [string, string] }
  | { clue: string }
  | { open: UiOpen; arg?: string }
  | { sfx: SfxName }
  | { toast: string; icon?: string }
  | { decision: string; text: string }
  | { emote: { npc: string; emote: Emote } }
  | { achievement: string }
  | { dialogue: string }
  | { teleport: [number, number, number] }
  | { music: 'calm' | 'tense' | 'party' }
  | { event: string };

export interface DChoice {
  text: TextSpec;
  to?: string;
  effects?: Effect[];
  cond?: Cond;
  /** Gợi ý nhỏ hiển thị kèm lựa chọn (vd. "hỏi thêm") */
  hint?: string;
}

export interface DBranch {
  cond?: Cond;
  to: string;
}

export interface DNode {
  /** id NPC | 'player' | 'narrator' | '#Tên đồ vật' */
  who: string;
  text: TextSpec;
  emote?: Emote;
  effects?: Effect[];
  choices?: DChoice[];
  next?: string | DBranch[];
}

export type Target = { npc: string } | { inter: string } | { point: [number, number] };

export interface QuestObjective {
  id: string;
  text: TextSpec;
  target?: Target;
  /** Mục tiêu thay thế theo điều kiện (marker chỉ tới manh mối còn thiếu…) */
  alt?: { cond: Cond; target: Target }[];
  hint?: string;
}

export interface QuestDef {
  id: string;
  title: string;
  time: string;
  chapterLabel: string;
  desc: string;
  objectives: QuestObjective[];
  onStart?: Effect[];
  onComplete?: Effect[];
  next?: string;
}

export interface QuestState {
  status: 'active' | 'done';
  done: string[];
}

export type HairStyle =
  | 'short'
  | 'spiky'
  | 'bob'
  | 'long'
  | 'bun'
  | 'ponytail'
  | 'bald'
  | 'curly'
  | 'sidepart'
  | 'buzz';

export type TopStyle = 'polo' | 'shirt' | 'blouse' | 'uniform' | 'tee' | 'hoodie' | 'vest';

export type Accessory =
  | 'glasses'
  | 'roundGlasses'
  | 'cap'
  | 'lanyard'
  | 'headset'
  | 'mustache'
  | 'tie'
  | 'camera'
  | 'apron'
  | 'earrings'
  | 'bowtie'
  | 'watch'
  | 'hairclip'
  | 'beanie'
  | 'backpack';

export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  topStyle: TopStyle;
  accent?: string;
  bottom: string;
  skirt?: boolean;
  shoes: string;
  acc?: Accessory[];
  height?: number; // hệ số chiều cao
  build?: number; // hệ số bề ngang
  cheeks?: boolean;
}

export type NpcAnim = 'idle' | 'sit' | 'type' | 'stare' | 'wave' | 'dj' | 'cheer';

export interface NpcSpot {
  cond?: Cond;
  pos: [number, number];
  rot?: number;
  y?: number;
  patrol?: [number, number][];
  anim?: NpcAnim;
  hidden?: boolean;
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  color: string;
  look: Look;
  spots: NpcSpot[];
  talk: { cond?: Cond; dialogue: string }[];
  /** Câu nói vu vơ khi người chơi đi ngang (không bắt buộc) */
  barks?: string[];
}

export interface InteractDef {
  id: string;
  pos: [number, number];
  y?: number;
  radius?: number;
  cond?: Cond;
  label: { cond?: Cond; text: string }[];
  actions: { cond?: Cond; dialogue?: string; effects?: Effect[] }[];
}

export interface ZoneDef {
  id: string;
  rect: [number, number, number, number]; // x0,z0,x1,z1
  cond?: Cond;
  effects?: Effect[];
  dialogue?: string;
  once?: boolean;
}

export interface SaveData {
  v: number;
  name: string;
  career: Career | null;
  stats: Record<StatKey, number>;
  flags: Record<string, boolean>;
  clues: string[];
  quests: Record<string, QuestState>;
  mainQuest: string | null;
  decisions: { id: string; text: string }[];
  achievements: string[];
  pos: [number, number];
  rotY: number;
  playTime: number;
  ending: string | null;
  firedZones: string[];
  talkedTo: string[];
}

export interface Settings {
  music: number;
  sfx: number;
  sensitivity: number;
  invertY: boolean;
  quality: 'high' | 'low';
  muted: boolean;
}

export type EndingId = 'A' | 'B' | 'C' | 'SECRET';
