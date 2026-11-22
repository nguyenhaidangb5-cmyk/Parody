import { useEffect, useState } from 'react';
import { useGame } from '../../game/store';
import { CAREERS } from '../../data/careers';
import type { Career } from '../../game/types';
import { SalesGame } from './SalesGame';
import { TechGame } from './TechGame';
import { CareGame } from './CareGame';
import { EventGame } from './EventGame';
import { sfx } from '../../game/audio';

export interface MgProps {
  onWin: () => void;
}

export function MinigameHost() {
  const id = (useGame((s) => s.ui.minigame) ?? 'sales') as Career;
  const c = CAREERS[id];
  const [secs, setSecs] = useState(0);
  const [won, setWon] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const onWin = () => {
    if (won) return;
    setWon(true);
    sfx('success');
    setTimeout(() => useGame.getState().finishMinigame(true), 1400);
  };
  const Game = { sales: SalesGame, tech: TechGame, care: CareGame, mkt: EventGame }[id];
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return (
    <div className="fullscreen">
      <div className="mg">
        <div className="mg-head">
          <div className="ic" style={{ background: c.color }}>
            {c.icon}
          </div>
          <div>
            <h2>{c.mission}</h2>
            <p>Nhiệm vụ nghề {c.name} · "Chỉ năm phút thôi" – chị Mai</p>
          </div>
          <div className="timer" title="Thời gian thật đã trôi qua">
            ⏱ {mm}:{ss} {secs > 300 ? '(quá 5 phút rồi 😅)' : ''}
          </div>
          <button className="btn small" style={{ marginLeft: 8 }} onClick={() => useGame.getState().finishMinigame(false)}>
            Để sau ✕
          </button>
        </div>
        <Game onWin={onWin} />
      </div>
    </div>
  );
}
