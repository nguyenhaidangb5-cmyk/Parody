// ===== Minigame Kỹ thuật: xoay các đoạn cáp để nối modem tới Wi-Fi phòng họp và máy chiếu =====
import { useMemo, useState } from 'react';
import type { MgProps } from './MinigameHost';
import { sfx } from '../../game/audio';
import { useGame } from '../../game/store';

const ROWS = 4;
const COLS = 5;
const N = 1,
  E = 2,
  S = 4,
  W = 8;
const SOURCE_ROW = 1;
const SINKS = [0, 3];

const SOLUTION: Record<string, number> = {
  '1,0': W | E,
  '1,1': W | E | S,
  '1,2': W | N,
  '0,2': S | E,
  '0,3': W | E,
  '0,4': W | E,
  '2,1': N | S,
  '3,1': N | E,
  '3,2': W | E,
  '3,3': W | E,
  '3,4': W | E,
};
const DECOYS = [N | E, E | S, N | S, W | E, N | E | S, 0, S | W];

const rot = (m: number) => ((m << 1) | (m >> 3)) & 15;

function makeBoard(): number[] {
  const b: number[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      let m = SOLUTION[key] ?? DECOYS[(r * 7 + c * 3 + Math.floor(Math.random() * 3)) % DECOYS.length];
      const turns = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < turns; i++) m = rot(m);
      b.push(m);
    }
  return b;
}

function lit(board: number[]) {
  const on = new Set<number>();
  const start = SOURCE_ROW * COLS;
  if (!(board[start] & W)) return on;
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    if (on.has(i)) continue;
    on.add(i);
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const m = board[i];
    const tryN = (nr: number, nc: number, out: number, inn: number) => {
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
      const j = nr * COLS + nc;
      if (m & out && board[j] & inn) stack.push(j);
    };
    tryN(r - 1, c, N, S);
    tryN(r + 1, c, S, N);
    tryN(r, c + 1, E, W);
    tryN(r, c - 1, W, E);
  }
  return on;
}

function TileSvg({ m, on }: { m: number; on: boolean }) {
  const col = on ? '#51cf66' : '#8796ab';
  const w = 16;
  return (
    <svg viewBox="0 0 100 100">
      {m & N ? <rect x={50 - w / 2} y={0} width={w} height={50} rx={3} fill={col} /> : null}
      {m & S ? <rect x={50 - w / 2} y={50} width={w} height={50} rx={3} fill={col} /> : null}
      {m & E ? <rect x={50} y={50 - w / 2} width={50} height={w} rx={3} fill={col} /> : null}
      {m & W ? <rect x={0} y={50 - w / 2} width={50} height={w} rx={3} fill={col} /> : null}
      {m ? <circle cx={50} cy={50} r={13} fill={col} /> : <circle cx={50} cy={50} r={6} fill="#3d4d66" />}
    </svg>
  );
}

export function TechGame({ onWin }: MgProps) {
  const [board, setBoard] = useState<number[]>(() => {
    let b = makeBoard();
    while (isSolved(b)) b = makeBoard();
    return b;
  });
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const on = useMemo(() => lit(board), [board]);

  function isSolved(b: number[]) {
    const l = lit(b);
    return SINKS.every((r) => {
      const i = r * COLS + COLS - 1;
      return l.has(i) && b[i] & E;
    });
  }
  const sinkOn = (r: number) => {
    const i = r * COLS + COLS - 1;
    return on.has(i) && !!(board[i] & E);
  };

  const click = (i: number) => {
    if (done) return;
    const nb = board.slice();
    nb[i] = rot(nb[i]);
    setBoard(nb);
    setMoves((m) => m + 1);
    sfx('click');
    if (isSolved(nb)) {
      setDone(true);
      if (moves + 1 <= 30) useGame.getState().applyEffects([{ stat: 'sangSuot', add: 1 }]);
      onWin();
    }
  };

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    cells.push(
      <div key={`l${r}`} className={`endpoint ${r === SOURCE_ROW ? 'on' : ''}`} style={{ position: 'static', visibility: r === SOURCE_ROW ? 'visible' : 'hidden' }}>
        <div className="dot">📡</div>Modem
      </div>,
    );
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      cells.push(
        <button key={i} className="tile" data-mask={board[i]} data-goal={SOLUTION[`${r},${c}`] ?? ''} onClick={() => click(i)} aria-label={`Ô ${r + 1}-${c + 1}`}>
          <TileSvg m={board[i]} on={on.has(i)} />
        </button>,
      );
    }
    const isSink = SINKS.includes(r);
    cells.push(
      <div key={`r${r}`} className={`endpoint ${isSink && sinkOn(r) ? 'on' : ''}`} style={{ position: 'static', visibility: isSink ? 'visible' : 'hidden' }}>
        <div className="dot">{r === 0 ? '📶' : '📽️'}</div>
        {r === 0 ? 'Wi-Fi họp' : 'Máy chiếu'}
      </div>,
    );
  }

  return (
    <>
      <div className="mg-body">
        <p style={{ marginTop: 0, fontWeight: 600 }}>
          Bấm vào từng ô để <b>xoay đoạn cáp</b>. Nối tín hiệu từ <b>Modem</b> tới cả <b>Wi-Fi phòng họp</b> và <b>Máy chiếu</b>. Đoạn nào có điện sẽ sáng xanh.
        </p>
        <div className="grid-puzzle" style={{ gridTemplateColumns: `64px repeat(${COLS}, auto) 64px`, padding: 14, alignItems: 'center' }}>
          {cells}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#868e96', marginBottom: 0 }}>
          Số lần xoay: <b>{moves}</b> · Mẹo của anh Tùng: "Không được thì… khởi động lại" (nút bên dưới)
        </p>
      </div>
      <div className="mg-foot">
        {done && <span className="mg-result good">Kết nối thành công! Phòng họp vừa có mạng – và mọi người lập tức mở mạng xã hội.</span>}
        <button
          className="btn"
          disabled={done}
          onClick={() => {
            let b = makeBoard();
            while (isSolved(b)) b = makeBoard();
            setBoard(b);
            setMoves(0);
            sfx('boot');
          }}
        >
          🔄 Khởi động lại (xáo lại)
        </button>
      </div>
    </>
  );
}
