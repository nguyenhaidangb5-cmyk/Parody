import { Component, useEffect, useState, type ReactNode } from 'react';
import { GameCanvas } from './scene/GameCanvas';
import { useGame } from './game/store';
import { MainMenu } from './ui/MainMenu';
import { HUD } from './ui/HUD';
import { DialogueBox } from './ui/DialogueBox';
import { CareerSelect, PauseMenu, JournalMap, ChatPhone, CardView } from './ui/Screens';
import { EndingScreen } from './ui/EndingScreen';
import { MinigameHost } from './ui/minigames/MinigameHost';
import { TouchControls } from './ui/TouchControls';
import { consumePress, exitLock, isTouchDevice } from './game/input';
import { startMusic, unlockAudio } from './game/audio';
import { uiBlocking } from './scene/Player';

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  componentDidCatch(e: Error) {
    console.error(e);
  }
  render() {
    if (this.state.error)
      return (
        <div className="fatal">
          <h1>Ối! Có lỗi khi dựng thế giới 3D</h1>
          <p>{this.state.error}</p>
          <p>Hãy thử tải lại trang, cập nhật trình duyệt Chrome/Edge, hoặc chọn chất lượng "Thấp" trong Cài đặt.</p>
          <button className="btn primary" onClick={() => location.reload()}>
            Tải lại
          </button>
        </div>
      );
    return this.props.children;
  }
}

export function App() {
  const screen = useGame((s) => s.screen);
  const ui = useGame((s) => s.ui);
  const [lost, setLost] = useState(false);
  const [hasGL] = useState(webglAvailable);

  // Khởi động âm thanh sau tương tác đầu tiên
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      startMusic();
    };
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Phím tắt toàn cục: Esc / Tab / M
  useEffect(() => {
    let lastUnlock = 0;
    const onKey = (e: KeyboardEvent) => {
      const st = useGame.getState();
      if (st.screen !== 'playing') return;
      if (e.code === 'Escape' && performance.now() - lastUnlock > 400) {
        if (st.ui.map) st.setUi({ map: false });
        else if (st.ui.card) st.setUi({ card: false });
        else if (!st.ui.dialogue && !st.ui.minigame && !st.ui.careerSelect && !st.ui.chat) st.setUi({ pause: !st.ui.pause });
      }
      if ((e.code === 'Tab' || e.code === 'KeyM') && !st.ui.dialogue && !st.ui.minigame && !st.ui.careerSelect && !st.ui.chat && !st.ui.pause) {
        e.preventDefault();
        st.setUi({ map: !st.ui.map });
      }
    };
    window.addEventListener('keydown', onKey);
    // Esc khi đang khóa chuột: trình duyệt nhả khóa -> mở menu tạm dừng
    const onLock = () => {
      const st = useGame.getState();
      if (!document.pointerLockElement && st.screen === 'playing' && !uiBlocking()) {
        lastUnlock = performance.now();
        st.setUi({ pause: true });
      }
    };
    document.addEventListener('pointerlockchange', onLock);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerlockchange', onLock);
    };
  }, []);

  // Nhả chuột khi mở giao diện
  const anyUi = !!(ui.dialogue || ui.minigame || ui.careerSelect || ui.chat || ui.card || ui.map || ui.pause);
  useEffect(() => {
    if (anyUi || screen !== 'playing') exitLock();
    consumePress('KeyE');
  }, [anyUi, screen]);

  // Tự lưu định kỳ
  useEffect(() => {
    const id = setInterval(() => {
      const st = useGame.getState();
      if (st.screen === 'playing') {
        useGame.setState({ save: { ...st.save, playTime: st.save.playTime + 15 } });
        st.saveNow();
      }
    }, 15000);
    return () => clearInterval(id);
  }, []);

  if (!hasGL)
    return (
      <div className="fatal">
        <h1>Trình duyệt chưa hỗ trợ WebGL</h1>
        <p>FTEL LIFE cần WebGL để hiển thị 3D. Hãy dùng Chrome hoặc Edge bản mới, và bật "Tăng tốc phần cứng" trong cài đặt trình duyệt.</p>
      </div>
    );

  return (
    <div className="app">
      <ErrorBoundary>{!lost ? <GameCanvas onLost={() => setLost(true)} /> : <div className="fatal"><h1>Mất kết nối đồ họa</h1><p>Card đồ họa vừa bị đặt lại. Tiến độ đã được lưu.</p><button className="btn primary" onClick={() => location.reload()}>Tải lại</button></div>}</ErrorBoundary>
      {screen === 'menu' && <MainMenu />}
      {screen === 'playing' && (
        <>
          <HUD />
          {isTouchDevice() && !anyUi && <TouchControls />}
          {ui.dialogue && <DialogueBox />}
          {ui.careerSelect && <CareerSelect />}
          {ui.minigame && <MinigameHost />}
          {ui.chat && <ChatPhone />}
          {ui.card && <CardView />}
          {ui.map && <JournalMap />}
          {ui.pause && <PauseMenu />}
        </>
      )}
      {screen === 'ending' && <EndingScreen />}
    </div>
  );
}
