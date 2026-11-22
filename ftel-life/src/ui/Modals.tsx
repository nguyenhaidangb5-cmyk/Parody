import { useGame } from '../game/store';
import { sfx } from '../game/audio';

export function HelpModal({ onClose }: { onClose: () => void }) {
  const rows: [string[], string][] = [
    [['W', 'A', 'S', 'D'], 'Di chuyển (hoặc phím mũi tên)'],
    [['Chuột'], 'Xoay camera (nhấp vào màn hình để khóa chuột)'],
    [['Cuộn'], 'Thu / phóng camera'],
    [['Shift'], 'Chạy nhanh'],
    [['E'], 'Tương tác / nói chuyện'],
    [['Space'], 'Nhảy · bỏ qua hội thoại'],
    [['1', '2', '3'], 'Chọn nhanh lựa chọn hội thoại'],
    [['Tab', 'M'], 'Bản đồ & nhật ký nhiệm vụ'],
    [['Esc'], 'Tạm dừng'],
  ];
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Hướng dẫn</h2>
        <p className="lead">
          Đi theo dấu ◆ màu cam để tìm mục tiêu. Mỗi lựa chọn trong hội thoại đều có hậu quả – có những lựa chọn rất… đáng nhớ. Game có 3 kết thúc thường và 1 kết thúc
          bí mật. Tiến độ được tự động lưu.
        </p>
        <div className="controls-grid">
          {rows.map(([keys, desc]) => (
            <div key={desc} style={{ display: 'contents' }}>
              <div className="keys">
                {keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </div>
              <div>{desc}</div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn primary" onClick={onClose}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useGame((st) => st.settings);
  const set = useGame((st) => st.setSettings);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Cài đặt</h2>
        <p className="lead">Thiết lập được lưu trên trình duyệt này.</p>
        <div className="row">
          <span>Âm thanh</span>
          <div className="seg">
            <button className={!s.muted ? 'on' : ''} onClick={() => set({ muted: false })}>
              Bật
            </button>
            <button className={s.muted ? 'on' : ''} onClick={() => set({ muted: true })}>
              Tắt
            </button>
          </div>
        </div>
        <div className="row">
          <span>Nhạc nền</span>
          <input type="range" min={0} max={1} step={0.05} value={s.music} onChange={(e) => set({ music: +e.target.value })} />
        </div>
        <div className="row">
          <span>Hiệu ứng</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.sfx}
            onChange={(e) => {
              set({ sfx: +e.target.value });
              sfx('click');
            }}
          />
        </div>
        <div className="row">
          <span>Độ nhạy chuột</span>
          <input type="range" min={0.3} max={2.5} step={0.1} value={s.sensitivity} onChange={(e) => set({ sensitivity: +e.target.value })} />
        </div>
        <div className="row">
          <span>Đảo trục dọc</span>
          <div className="seg">
            <button className={!s.invertY ? 'on' : ''} onClick={() => set({ invertY: false })}>
              Không
            </button>
            <button className={s.invertY ? 'on' : ''} onClick={() => set({ invertY: true })}>
              Có
            </button>
          </div>
        </div>
        <div className="row">
          <span>Chất lượng đồ họa</span>
          <div className="seg">
            <button className={s.quality === 'high' ? 'on' : ''} onClick={() => set({ quality: 'high' })}>
              Cao (bóng đổ)
            </button>
            <button className={s.quality === 'low' ? 'on' : ''} onClick={() => set({ quality: 'low' })}>
              Thấp (máy yếu)
            </button>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn primary" onClick={onClose}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
