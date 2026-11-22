import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import '@fontsource/be-vietnam-pro/900.css';
import './styles.css';
import { App } from './App';
import { initInput } from './game/input';

initInput();

async function boot() {
  // Đợi font tiếng Việt sẵn sàng để chữ trên bảng hiệu 3D hiển thị đúng
  try {
    await Promise.race([
      Promise.all(['400', '600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 32px "Be Vietnam Pro"`, 'Tiếng Việt ạ'))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* bỏ qua – dùng font dự phòng */
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
boot();
