// Kiểm tra toàn vẹn dữ liệu: mọi tham chiếu hội thoại / nhiệm vụ / NPC / đồ vật đều tồn tại.
import { DIALOGUES } from '../src/data/dialogues';
import { QUESTS } from '../src/data/quests';
import { NPCS, NPC_MAP } from '../src/data/npcs';
import { INTERACTABLES, INTER_MAP, ZONES } from '../src/data/interactables';
import type { Effect, Cond } from '../src/game/types';

const errors: string[] = [];
const err = (m: string) => errors.push(m);
const speakers = new Set(['player', 'narrator', ...NPCS.map((n) => n.id)]);

function checkEffects(where: string, effs?: Effect[]) {
  for (const e of effs ?? []) {
    if ('obj' in e) {
      const q = QUESTS[e.obj[0]];
      if (!q) err(`${where}: quest ${e.obj[0]} missing`);
      else if (!q.objectives.find((o) => o.id === e.obj[1])) err(`${where}: objective ${e.obj.join('.')} missing`);
    }
    if ('startQuest' in e && !QUESTS[e.startQuest]) err(`${where}: startQuest ${e.startQuest} missing`);
    if ('dialogue' in e && !DIALOGUES[e.dialogue]) err(`${where}: dialogue ${e.dialogue} missing`);
    if ('emote' in e && e.emote.npc !== 'player' && !NPC_MAP[e.emote.npc]) err(`${where}: emote npc ${e.emote.npc}`);
  }
}
function checkCond(where: string, c?: Cond) {
  if (!c) return;
  for (const k of ['questActive', 'questDone', 'questNotDone', 'questStarted', 'questNotStarted'] as const) {
    const v = c[k];
    if (v && !QUESTS[v]) err(`${where}: cond ${k} ${v}`);
  }
  for (const k of ['objDone', 'objNotDone', 'currentObj'] as const) {
    const v = c[k];
    if (v && !QUESTS[v[0]]?.objectives.find((o) => o.id === v[1])) err(`${where}: cond ${k} ${v.join('.')}`);
  }
  c.any?.forEach((x) => checkCond(where, x));
  if (c.not) checkCond(where, c.not);
}

for (const [id, n] of Object.entries(DIALOGUES)) {
  if (!speakers.has(n.who) && !n.who.startsWith('#')) err(`node ${id}: unknown speaker ${n.who}`);
  checkEffects(`node ${id}`, n.effects);
  if (typeof n.next === 'string' && !DIALOGUES[n.next]) err(`node ${id}: next ${n.next} missing`);
  if (Array.isArray(n.next)) n.next.forEach((b) => { if (!DIALOGUES[b.to]) err(`node ${id}: branch ${b.to} missing`); checkCond(`node ${id}`, b.cond); });
  n.choices?.forEach((c, i) => {
    if (c.to && !DIALOGUES[c.to]) err(`node ${id} choice ${i}: to ${c.to} missing`);
    checkEffects(`node ${id} choice ${i}`, c.effects);
    checkCond(`node ${id} choice ${i}`, c.cond);
  });
}
for (const n of NPCS) {
  n.talk.forEach((t) => { if (!DIALOGUES[t.dialogue]) err(`npc ${n.id}: dialogue ${t.dialogue} missing`); checkCond(`npc ${n.id}`, t.cond); });
  n.spots.forEach((s) => checkCond(`npc ${n.id} spot`, s.cond));
  if (n.talk.length && n.talk[n.talk.length - 1].cond) err(`npc ${n.id}: last talk rule should be unconditional`);
}
for (const i of INTERACTABLES) {
  i.actions.forEach((a) => { if (a.dialogue && !DIALOGUES[a.dialogue]) err(`inter ${i.id}: dialogue ${a.dialogue} missing`); checkEffects(`inter ${i.id}`, a.effects); checkCond(`inter ${i.id}`, a.cond); });
  if (i.actions[i.actions.length - 1].cond) err(`inter ${i.id}: last action should be unconditional`);
}
for (const z of ZONES) { if (z.dialogue && !DIALOGUES[z.dialogue]) err(`zone ${z.id}: dialogue missing`); checkEffects(`zone ${z.id}`, z.effects); checkCond(`zone ${z.id}`, z.cond); }
for (const q of Object.values(QUESTS)) {
  if (q.next && !QUESTS[q.next]) err(`quest ${q.id}: next missing`);
  checkEffects(`quest ${q.id} start`, q.onStart);
  checkEffects(`quest ${q.id} complete`, q.onComplete);
  for (const o of q.objectives) {
    const t = o.target;
    if (t && 'npc' in t && !NPC_MAP[t.npc]) err(`quest ${q.id}.${o.id}: npc target ${t.npc}`);
    if (t && 'inter' in t && !INTER_MAP[t.inter]) err(`quest ${q.id}.${o.id}: inter target ${t.inter}`);
  }
}
// Mọi mục tiêu nhiệm vụ phải có ít nhất một nơi hoàn thành nó
const completers = new Set<string>();
const collect = (effs?: Effect[]) => effs?.forEach((e) => { if ('obj' in e) completers.add(e.obj.join('.')); });
Object.values(DIALOGUES).forEach((n) => { collect(n.effects); n.choices?.forEach((c) => collect(c.effects)); });
INTERACTABLES.forEach((i) => i.actions.forEach((a) => collect(a.effects)));
ZONES.forEach((z) => collect(z.effects));
const special = new Set(['q5.minigame', 'q7.readChat', 'q6.clues', 'q8.party']);
for (const q of Object.values(QUESTS)) for (const o of q.objectives) {
  const k = `${q.id}.${o.id}`;
  if (!completers.has(k) && !special.has(k)) err(`objective ${k} has no completer`);
}
// Nút không thể tới được
const reach = new Set<string>();
const roots: string[] = [];
NPCS.forEach((n) => n.talk.forEach((t) => roots.push(t.dialogue)));
INTERACTABLES.forEach((i) => i.actions.forEach((a) => a.dialogue && roots.push(a.dialogue)));
ZONES.forEach((z) => z.dialogue && roots.push(z.dialogue));
Object.values(QUESTS).forEach((q) => q.onStart?.forEach((e) => 'dialogue' in e && roots.push(e.dialogue)));
roots.push('linh.afterCareer', 'mai.afterMinigame');
const stack = [...roots];
while (stack.length) {
  const id = stack.pop()!;
  if (reach.has(id) || !DIALOGUES[id]) continue;
  reach.add(id);
  const n = DIALOGUES[id];
  if (typeof n.next === 'string') stack.push(n.next);
  if (Array.isArray(n.next)) n.next.forEach((b) => stack.push(b.to));
  n.choices?.forEach((c) => c.to && stack.push(c.to));
}
const unreachable = Object.keys(DIALOGUES).filter((k) => !reach.has(k));

console.log(`Dialogue nodes: ${Object.keys(DIALOGUES).length}, NPCs: ${NPCS.length}, interactables: ${INTERACTABLES.length}, quests: ${Object.keys(QUESTS).length}`);
if (unreachable.length) console.log('Unreachable nodes:', unreachable.join(', '));
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('DATA OK');

// Cảnh báo: NPC đứng quá gần một đồ vật tương tác (dễ "giành" lời nhắc E)
for (const n of NPCS)
  for (const sp of n.spots)
    for (const it of INTERACTABLES) {
      const d = Math.hypot(sp.pos[0] - it.pos[0], sp.pos[1] - it.pos[1]);
      if (d < 1.3) console.log(`⚠ NPC ${n.id} (spot ${sp.pos.join(',')}) gần đồ vật ${it.id} (${d.toFixed(2)}m)`);
    }
