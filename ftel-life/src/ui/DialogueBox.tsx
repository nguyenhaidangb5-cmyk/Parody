import { useEffect, useRef, useState } from 'react';
import { useGame, resolveText, visibleChoices } from '../game/store';
import { DIALOGUES } from '../data/dialogues';
import { NPC_MAP } from '../data/npcs';
import { sfx } from '../game/audio';

const OBJ_ICON: Record<string, string> = {
  'Máy in': '🖨️',
  'Máy cấp thẻ': '🪪',
  'Tủ lạnh': '🧊',
  'Máy pha cà phê': '☕',
  'Bảng thông báo': '📌',
  'Thang máy': '🛗',
  'Đồng hồ': '🕰️',
  'Máy chiếu': '📽️',
  'Người gọi': '📞',
  'Cả hội trường': '🎉',
};

export function speakerInfo(who: string, playerName: string) {
  if (who === 'player') return { name: playerName, title: 'Tân binh', color: '#F37021', initial: playerName[0]?.toUpperCase() ?? 'T', kind: 'npc' as const };
  if (who === 'narrator') return { name: '', title: '', color: '#22385a', initial: '…', kind: 'narr' as const };
  if (who.startsWith('#')) {
    const n = who.slice(1);
    return { name: n, title: '', color: '#495057', initial: OBJ_ICON[n] ?? '🔎', kind: 'obj' as const };
  }
  const npc = NPC_MAP[who];
  return { name: npc?.name ?? who, title: npc?.title ?? '', color: npc?.color ?? '#555', initial: npc?.name.split(' ').pop()?.[0] ?? '?', kind: 'npc' as const };
}

export function DialogueBox() {
  const d = useGame((s) => s.ui.dialogue)!;
  const save = useGame((s) => s.save);
  const node = DIALOGUES[d.nodeId];
  const full = node ? resolveText(node.text, save) : '';
  const [shown, setShown] = useState(0);
  const [sel, setSel] = useState(0);
  const lastKey = useRef(0);
  const choices = node ? visibleChoices(node) : [];
  const done = shown >= full.length;

  useEffect(() => {
    setShown(0);
    setSel(0);
  }, [d.nodeId]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setShown((n) => {
        const next = Math.min(full.length, n + 2);
        if (next % 6 === 0) sfx('type');
        return next;
      });
    }, 22);
    return () => clearInterval(id);
  }, [d.nodeId, done, full.length]);

  const advance = () => {
    if (!done) {
      setShown(full.length);
      return;
    }
    if (choices.length) return;
    sfx('click');
    useGame.getState().advance();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const now = performance.now();
      if (now - lastKey.current < 60) return;
      lastKey.current = now;
      if (['Space', 'Enter', 'KeyE'].includes(e.code)) {
        e.preventDefault();
        if (done && choices.length) {
          useGame.getState().choose(sel);
          return;
        }
        advance();
      }
      if (done && choices.length) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= choices.length) useGame.getState().choose(n - 1);
        if (e.code === 'ArrowDown' || e.code === 'KeyS') setSel((v) => (v + 1) % choices.length);
        if (e.code === 'ArrowUp' || e.code === 'KeyW') setSel((v) => (v - 1 + choices.length) % choices.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!node) return null;
  const sp = speakerInfo(node.who, save.name);
  const cls = sp.kind === 'narr' ? 'narr' : sp.kind === 'obj' ? 'obj' : '';

  return (
    <div className="dialogue">
      <div className={`dialogue-box ${cls}`} onClick={advance}>
        {sp.kind === 'npc' && (
          <div className="portrait" style={{ background: sp.color }}>
            {sp.initial}
          </div>
        )}
        {sp.name && (
          <div className="nameplate" style={sp.kind === 'npc' ? { background: sp.color } : undefined}>
            {sp.kind === 'obj' && <span>{sp.initial}</span>}
            {sp.name}
            {sp.title && <small>{sp.title}</small>}
          </div>
        )}
        <div className="dialogue-text">{full.slice(0, shown)}</div>
        {done && !choices.length && (
          <div className="dialogue-next">
            <kbd>E</kbd> / <kbd>Space</kbd> tiếp tục ▸
          </div>
        )}
      </div>
      {done && choices.length > 0 && (
        <div className="choices">
          {choices.map((c, i) => (
            <button
              key={i}
              className={`choice ${i === sel ? 'sel' : ''}`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onMouseEnter={() => {
                setSel(i);
                sfx('hover');
              }}
              onClick={(e) => {
                e.stopPropagation();
                useGame.getState().choose(i);
              }}
            >
              <span className="n">{i + 1}</span>
              <span>{resolveText(c.text, save)}</span>
              {c.hint && <span className="tag">✦ {c.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
