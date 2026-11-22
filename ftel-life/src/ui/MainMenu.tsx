import { useState } from 'react';
import { useGame } from '../game/store';
import { sfx, unlockAudio, startMusic } from '../game/audio';
import { SettingsModal, HelpModal } from './Modals';

export function MainMenu() {
  const saveExists = useGame((s) => s.saveExists);
  const endings = useGame((s) => s.endingsUnlocked);
  const muted = useGame((s) => s.settings.muted);
  const setSettings = useGame((s) => s.setSettings);
  const [modal, setModal] = useState<null | 'name' | 'help' | 'settings' | 'confirm'>(null);
  const [name, setName] = useState('Khoa');

  const click = () => {
    unlockAudio();
    startMusic();
    sfx('click');
  };

  const start = () => {
    click();
    useGame.getState().newGame(name);
  };

  return (
    <div className="menu">
      <div className="menu-panel">
        <div>
          <div className="logo">
            <div className="logo-bars">
              <span />
              <span />
              <span />
            </div>
            <h1>
              FTEL <em>LIFE</em>
            </h1>
          </div>
          <div className="subtitle" style={{ marginTop: 14 }}>
            Ngày đầu đi làm – Chỉ có 5 phút thôi!
          </div>
        </div>
        <p className="tagline">
          Một ngày đầu tiên rất bình thường tại công ty viễn thông FTEL. Phỏng vấn, nhận thẻ, in tài liệu, tìm bánh kem… và một chương trình lúc 17:00 mà ai
          cũng biết, trừ bạn.
        </p>
        <div className="menu-buttons">
          <button
            className="btn primary"
            onClick={() => {
              click();
              setModal(saveExists ? 'confirm' : 'name');
            }}
          >
            <span className="ico">▶</span> Bắt đầu
          </button>
          <button
            className="btn"
            disabled={!saveExists}
            onClick={() => {
              click();
              useGame.getState().continueGame();
            }}
          >
            <span className="ico">⟳</span> Tiếp tục
          </button>
          <button
            className="btn"
            onClick={() => {
              click();
              setModal('help');
            }}
          >
            <span className="ico">?</span> Hướng dẫn
          </button>
          <button
            className="btn"
            onClick={() => {
              click();
              setModal('settings');
            }}
          >
            <span className="ico">⚙</span> Cài đặt
          </button>
          <button
            className="btn"
            onClick={() => {
              setSettings({ muted: !muted });
              click();
            }}
          >
            <span className="ico">{muted ? '🔇' : '🔊'}</span> Âm thanh: {muted ? 'Tắt' : 'Bật'}
          </button>
        </div>
        <div className="menu-foot">
          <span>
            Kết thúc đã mở: <b>{endings.length}/4</b>
          </span>
          <span className="endings-dots">
            {(['A', 'B', 'C', 'SECRET'] as const).map((e) => (
              <i key={e} className={endings.includes(e) ? 'on' : ''} title={endings.includes(e) ? e : '???'} />
            ))}
          </span>
          <span>· Bàn phím + chuột · Chrome / Edge</span>
        </div>
      </div>

      {modal === 'confirm' && (
        <div className="modal-back" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Bắt đầu ngày mới?</h2>
            <p className="lead">Bạn đang có tiến độ đã lưu. Bắt đầu lại sẽ ghi đè tiến độ hiện tại (các kết thúc đã mở vẫn được giữ).</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModal(null)}>
                Quay lại
              </button>
              <button className="btn primary" onClick={() => setModal('name')}>
                Bắt đầu lại
              </button>
            </div>
          </div>
        </div>
      )}
      {modal === 'name' && (
        <div className="modal-back" onClick={() => setModal(null)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            <h2>Tên của bạn là gì?</h2>
            <p className="lead">Chú bảo vệ sẽ ghi tên này vào sổ. Bằng chữ in hoa. Gạch chân hai lần.</p>
            <div className="field">
              <label htmlFor="pname">Tên nhân viên mới</label>
              <input id="pname" type="text" autoFocus maxLength={16} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Khoa" />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button type="submit" className="btn primary" disabled={!name.trim()}>
                Vào ngày đầu đi làm →
              </button>
            </div>
          </form>
        </div>
      )}
      {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
    </div>
  );
}
