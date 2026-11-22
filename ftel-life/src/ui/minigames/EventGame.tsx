// ===== Minigame Marketing/Sự kiện: sắp xếp đúng trình tự chuẩn bị chương trình =====
import { useState } from 'react';
import type { MgProps } from './MinigameHost';
import { sfx } from '../../game/audio';
import { useGame } from '../../game/store';

const STEPS = [
  { id: 1, text: '🎯 Xác định mục tiêu & danh sách khách mời' },
  { id: 2, text: '💰 Trình duyệt ngân sách với chị Hạnh (kèm hóa đơn đỏ)' },
  { id: 3, text: '🏛️ Đặt hội trường & thiết bị âm thanh' },
  { id: 4, text: '✉️ Thiết kế và gửi thư mời' },
  { id: 5, text: '🎤 Viết kịch bản MC' },
  { id: 6, text: '🔁 Tổng duyệt chương trình' },
  { id: 7, text: '🎉 Tổ chức sự kiện & chụp ảnh lên fanpage' },
];

function shuffled() {
  let a = STEPS.slice();
  do {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } while (a.every((s, i) => s.id === i + 1));
  return a;
}

export function EventGame({ onWin }: MgProps) {
  const [items, setItems] = useState(shuffled);
  const [checked, setChecked] = useState(false);
  const [tries, setTries] = useState(0);
  const [won, setWon] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length || won) return;
    const a = items.slice();
    [a[i], a[j]] = [a[j], a[i]];
    setItems(a);
    setChecked(false);
    sfx('click');
  };

  const check = () => {
    setChecked(true);
    setTries((t) => t + 1);
    const correct = items.filter((s, i) => s.id === i + 1).length;
    if (correct === items.length) {
      setWon(true);
      useGame.getState().applyEffects([{ stat: 'doiMoi', add: 1 }]);
      onWin();
    } else sfx('fail');
  };

  const correct = items.filter((s, i) => s.id === i + 1).length;
  return (
    <>
      <div className="mg-body">
        <p style={{ marginTop: 0, fontWeight: 600 }}>
          Bắp đã viết kế hoạch… theo thứ tự ý tưởng xuất hiện trong đầu. Hãy <b>kéo thả</b> hoặc dùng nút ▲▼ để sắp xếp lại các bước theo đúng trình tự, rồi bấm{' '}
          <b>Kiểm tra</b>.
        </p>
        <div className="sortlist">
          {items.map((s, i) => (
            <div
              key={s.id}
              className={`sortitem ${checked ? (s.id === i + 1 ? 'ok' : 'wrong') : ''} ${drag === i ? 'drag' : ''}`}
              draggable={!won}
              onDragStart={() => setDrag(i)}
              onDragEnd={() => setDrag(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag === null || drag === i) return;
                const a = items.slice();
                const [m] = a.splice(drag, 1);
                a.splice(i, 0, m);
                setItems(a);
                setDrag(null);
                setChecked(false);
                sfx('click');
              }}
            >
              <span className="num">{i + 1}</span>
              <span>{s.text}</span>
              <span className="arrows">
                <button onClick={() => move(i, -1)} aria-label="Lên">
                  ▲
                </button>
                <button onClick={() => move(i, 1)} aria-label="Xuống">
                  ▼
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mg-foot">
        {checked && !won && (
          <span className="mg-result bad">
            Đúng {correct}/{items.length} vị trí (ô xanh là đúng). {tries >= 2 ? 'Gợi ý: tiền phải được duyệt trước khi đặt bất cứ thứ gì!' : ''}
          </span>
        )}
        {won && <span className="mg-result good">Hoàn hảo! Kế hoạch gọn gàng tới mức Bắp không chen thêm được ý tưởng nào.</span>}
        <button
          className="btn"
          disabled={won}
          onClick={() => {
            setItems(shuffled());
            setChecked(false);
          }}
        >
          Xáo lại
        </button>
        <button className="btn primary" disabled={won} onClick={check}>
          Kiểm tra
        </button>
      </div>
    </>
  );
}
