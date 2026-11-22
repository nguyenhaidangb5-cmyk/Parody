// ===== Minigame Kinh doanh: hỏi đúng nhu cầu rồi chọn gói cước phù hợp =====
import { useState } from 'react';
import type { MgProps } from './MinigameHost';
import { sfx } from '../../game/audio';
import { useGame } from '../../game/store';

interface Q {
  id: string;
  text: string;
  answer: string;
  reveals?: 'floors' | 'usage' | 'budget';
}
const QUESTIONS: Q[] = [
  { id: 'floors', text: 'Nhà mình có mấy tầng ạ?', answer: 'Nhà 3 tầng em ơi. Phòng tụi nhỏ ở tận tầng 3, Wi-Fi lên tới đó là thoi thóp.', reveals: 'floors' },
  { id: 'zodiac', text: 'Anh thuộc cung hoàng đạo gì ạ?', answer: 'Xử Nữ. Mà… liên quan gì tới Internet vậy em?' },
  { id: 'usage', text: 'Cả nhà thường dùng mạng để làm gì ạ?', answer: 'Hai đứa học online, vợ anh họp video cả ngày, còn anh tối nào cũng xem bóng đá 4K.', reveals: 'usage' },
  { id: 'expensive', text: 'Anh có muốn lấy luôn gói đắt nhất không ạ?', answer: 'Em đang tư vấn hay đang đọc bảng giá vậy em?' },
  { id: 'budget', text: 'Ngân sách hàng tháng anh dự tính khoảng bao nhiêu ạ?', answer: 'Tối đa 350 nghìn. Hơn là vợ anh sẽ… hỏi thăm sức khỏe anh.', reveals: 'budget' },
  { id: 'first', text: 'Anh có biết hôm nay là ngày đầu em đi làm không?', answer: 'Giờ thì anh biết rồi. Cố lên em!' },
];

interface Plan {
  id: string;
  name: string;
  speed: number;
  aps: number;
  tv: boolean;
  price: number;
  desc: string;
}
const PLANS: Plan[] = [
  { id: 'giga', name: 'Giga Tiết Kiệm', speed: 150, aps: 1, tv: false, price: 180, desc: '150 Mbps · 1 modem Wi-Fi' },
  { id: 'sky', name: 'Sky Gia Đình', speed: 300, aps: 2, tv: false, price: 245, desc: '300 Mbps · modem + 1 điểm Mesh' },
  { id: 'skytv', name: 'Sky + Truyền hình', speed: 300, aps: 2, tv: true, price: 300, desc: '300 Mbps · modem + 1 Mesh · Truyền hình 4K (có thể thao)' },
  { id: 'meta', name: 'Meta Siêu Tốc', speed: 1000, aps: 3, tv: false, price: 399, desc: '1 Gbps · modem + 2 điểm Mesh' },
];

export function SalesGame({ onWin }: MgProps) {
  const [asked, setAsked] = useState<string[]>([]);
  const [patience, setPatience] = useState(3);
  const [plan, setPlan] = useState<string | null>(null);
  const [mesh, setMesh] = useState(false);
  const [tvAdd, setTvAdd] = useState(false);
  const [cam, setCam] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const know = (k: string) => asked.includes(k);
  const p = PLANS.find((x) => x.id === plan);
  const total = (p?.price ?? 0) + (mesh ? 40 : 0) + (tvAdd && !p?.tv ? 60 : 0) + (cam ? 50 : 0);
  const left = patience <= 0;

  const ask = (q: Q) => {
    if (asked.includes(q.id) || left) return;
    setAsked([...asked, q.id]);
    if (!q.reveals) {
      setPatience((v) => v - 1);
      sfx('error');
    } else sfx('pickup');
  };

  const submit = () => {
    if (!p) return;
    const aps = p.aps + (mesh ? 1 : 0);
    const tv = p.tv || tvAdd;
    const fails: string[] = [];
    if (p.speed < 300) fails.push(know('usage') ? 'Tốc độ không đủ cho cả nhà vừa học, vừa họp, vừa xem bóng đá.' : 'Anh Bình: "Tối nhà anh dùng nhiều lắm, gói này chịu sao nổi?" (Bạn chưa hỏi nhu cầu sử dụng)');
    if (aps < 3) fails.push(know('floors') ? 'Nhà 3 tầng mà chỉ có ' + aps + ' điểm phát Wi-Fi – tầng 3 vẫn "thoi thóp".' : 'Anh Bình: "Phòng tụi nhỏ ở tầng 3 thì sao em?" (Bạn chưa hỏi nhà mấy tầng)');
    if (!tv) fails.push(know('usage') ? 'Thiếu truyền hình 4K để anh Bình xem bóng đá.' : 'Anh Bình: "Ủa, còn bóng đá của anh?" (Bạn chưa hỏi nhu cầu sử dụng)');
    if (total > 350) fails.push(know('budget') ? `Tổng ${total}k vượt ngân sách 350k.` : `Anh Bình: "${total} nghìn?! Vợ anh sẽ hỏi thăm anh mất!" (Bạn chưa hỏi ngân sách)`);
    if (cam) fails.push('Anh Bình: "Camera chi vậy em? Nhà anh chỉ có con mèo, nó không cần bị quay."');
    if (fails.length) {
      sfx('fail');
      setResult({ ok: false, text: fails[0] });
    } else {
      const good = asked.filter((a) => QUESTIONS.find((q) => q.id === a)?.reveals).length;
      if (good >= 2) useGame.getState().applyEffects([{ stat: 'tonTrong', add: 1 }]);
      setResult({ ok: true, text: 'Anh Bình: "Chuẩn quá em! Chốt đơn! Để anh giới thiệu thêm hai nhà hàng xóm."' });
      onWin();
    }
  };

  const reset = () => {
    setAsked([]);
    setPatience(3);
    setPlan(null);
    setMesh(false);
    setTvAdd(false);
    setCam(false);
    setResult(null);
  };

  return (
    <>
      <div className="mg-body">
        <div className="mg-cols">
          <div>
            <div className="mg-card">
              <h4>Khách hàng: anh Bình 👨‍👩‍👧‍👦</h4>
              <div style={{ fontSize: 13, marginBottom: 6 }}>Độ kiên nhẫn: {'❤️'.repeat(Math.max(0, patience))}{'🖤'.repeat(3 - Math.max(0, patience))}</div>
              <div className={`need ${know('floors') ? '' : 'hidden'}`}>🏠 {know('floors') ? 'Nhà 3 tầng → cần ít nhất 3 điểm phát Wi-Fi' : 'Chưa rõ: nhà bao nhiêu tầng?'}</div>
              <div className={`need ${know('usage') ? '' : 'hidden'}`}>📺 {know('usage') ? 'Học online + họp video + bóng đá 4K → ≥ 300 Mbps & truyền hình 4K' : 'Chưa rõ: dùng mạng để làm gì?'}</div>
              <div className={`need ${know('budget') ? '' : 'hidden'}`}>💰 {know('budget') ? 'Ngân sách tối đa 350.000đ/tháng' : 'Chưa rõ: ngân sách bao nhiêu?'}</div>
            </div>
            <div className="mg-card" style={{ marginTop: 12 }}>
              <h4>Đặt câu hỏi (hỏi đúng, đừng hỏi thừa)</h4>
              {QUESTIONS.map((q) => (
                <div key={q.id}>
                  <button className={`qbtn ${asked.includes(q.id) ? 'asked' : ''}`} disabled={asked.includes(q.id) || left} onClick={() => ask(q)}>
                    {q.text}
                  </button>
                  {asked.includes(q.id) && <div className="answer">💬 {q.answer}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="mg-card">
            <h4>Chọn gói cước</h4>
            <div className="plans">
              {PLANS.map((pl) => (
                <button key={pl.id} className={`plan ${plan === pl.id ? 'sel' : ''}`} onClick={() => setPlan(pl.id)} disabled={left}>
                  <b>{pl.name}</b>
                  <span className="price">{pl.price}k</span>
                  <small>{pl.desc}</small>
                </button>
              ))}
            </div>
            <h4 style={{ marginTop: 16 }}>Dịch vụ cộng thêm</h4>
            <label className="addon">
              <input type="checkbox" checked={mesh} onChange={(e) => setMesh(e.target.checked)} /> Thêm 1 điểm phát Wi-Fi Mesh (+40k)
            </label>
            <label className="addon">
              <input type="checkbox" checked={tvAdd} disabled={!!p?.tv} onChange={(e) => setTvAdd(e.target.checked)} /> Truyền hình 4K gói thể thao (+60k)
            </label>
            <label className="addon">
              <input type="checkbox" checked={cam} onChange={(e) => setCam(e.target.checked)} /> Camera an ninh (+50k)
            </label>
            <div className={`total ${total > 350 && know('budget') ? 'over' : ''}`}>
              <span>Tổng / tháng</span>
              <span>{total}.000đ</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mg-foot">
        {left && <span className="mg-result bad">Anh Bình đã cúp máy vì hết kiên nhẫn. Thử lại nhé!</span>}
        {result && <span className={`mg-result ${result.ok ? 'good' : 'bad'}`}>{result.text}</span>}
        <button className="btn" onClick={reset}>
          Làm lại
        </button>
        <button className="btn primary" disabled={!p || left || result?.ok} onClick={submit}>
          Tư vấn & chốt gói
        </button>
      </div>
    </>
  );
}
