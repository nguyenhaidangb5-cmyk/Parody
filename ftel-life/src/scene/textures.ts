// ===== Texture tạo bằng canvas (không tải file ngoài) =====
import * as THREE from 'three';

export const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

const cache = new Map<string, THREE.CanvasTexture>();

function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = true) {
  let t = cache.get(key);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  cache.set(key, t);
  return t;
}

function noise(g: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number, dark = true) {
  for (let i = 0; i < n; i++) {
    const v = dark ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * alpha})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

export function floorTexture(kind: string): THREE.CanvasTexture {
  switch (kind) {
    case 'lobby':
      return canvasTex('f_lobby', 256, 256, (g, w, h) => {
        g.fillStyle = '#ece6dc';
        g.fillRect(0, 0, w, h);
        noise(g, w, h, 1800, 0.05);
        for (let i = 0; i < 6; i++) {
          g.strokeStyle = `rgba(160,150,140,${0.12 + Math.random() * 0.1})`;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(Math.random() * w, Math.random() * h);
          g.bezierCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h);
          g.stroke();
        }
        g.strokeStyle = 'rgba(120,110,100,0.35)';
        g.lineWidth = 2;
        g.strokeRect(0, 0, w, h);
      });
    case 'wood':
      return canvasTex('f_wood', 256, 256, (g, w, h) => {
        const cols = ['#c89b6d', '#c29264', '#cfa375', '#bb8a5c'];
        for (let i = 0; i < 8; i++) {
          g.fillStyle = cols[i % cols.length];
          g.fillRect(0, i * 32, w, 32);
          g.fillStyle = 'rgba(80,50,20,0.25)';
          g.fillRect(0, i * 32, w, 2);
          const off = (i * 97) % w;
          g.fillRect(off, i * 32, 2, 32);
          for (let k = 0; k < 6; k++) {
            g.strokeStyle = 'rgba(90,60,30,0.12)';
            g.beginPath();
            const y = i * 32 + 6 + k * 4;
            g.moveTo(0, y);
            g.bezierCurveTo(w * 0.3, y + 3, w * 0.6, y - 3, w, y + 1);
            g.stroke();
          }
        }
      });
    case 'carpet':
      return canvasTex('f_carpet', 128, 128, (g, w, h) => {
        g.fillStyle = '#5d6b7e';
        g.fillRect(0, 0, w, h);
        noise(g, w, h, 3000, 0.12);
        noise(g, w, h, 1500, 0.06, false);
        g.strokeStyle = 'rgba(30,40,55,0.35)';
        g.lineWidth = 2;
        g.strokeRect(0, 0, w, h);
      });
    case 'carpetBlue':
      return canvasTex('f_carpetB', 128, 128, (g, w, h) => {
        g.fillStyle = '#3f5f8f';
        g.fillRect(0, 0, w, h);
        noise(g, w, h, 3000, 0.12);
        g.strokeStyle = 'rgba(243,112,33,0.25)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(0, h / 2);
        g.lineTo(w, h / 2);
        g.stroke();
      });
    case 'tile':
      return canvasTex('f_tile', 128, 128, (g, w, h) => {
        for (let y = 0; y < 2; y++)
          for (let x = 0; x < 2; x++) {
            g.fillStyle = (x + y) % 2 ? '#f7f3ea' : '#e2ddd0';
            g.fillRect(x * 64, y * 64, 64, 64);
          }
        noise(g, w, h, 600, 0.05);
        g.strokeStyle = 'rgba(0,0,0,0.12)';
        g.strokeRect(0, 0, 64, 64);
        g.strokeRect(64, 64, 64, 64);
      });
    case 'concrete':
      return canvasTex('f_conc', 128, 128, (g, w, h) => {
        g.fillStyle = '#a9adb2';
        g.fillRect(0, 0, w, h);
        noise(g, w, h, 4000, 0.12);
        noise(g, w, h, 1000, 0.08, false);
      });
    case 'hall':
      return canvasTex('f_hall', 256, 256, (g, w, h) => {
        const cols = ['#a8714a', '#9f6942', '#ae7850'];
        for (let i = 0; i < 16; i++) {
          g.fillStyle = cols[i % 3];
          g.fillRect(i * 16, 0, 16, h);
          g.fillStyle = 'rgba(60,30,10,0.3)';
          g.fillRect(i * 16, 0, 1, h);
          g.fillRect(i * 16, ((i * 71) % h), 16, 1);
        }
      });
    case 'grass':
      return canvasTex('f_grass', 256, 256, (g, w, h) => {
        g.fillStyle = '#7cbf5a';
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 5000; i++) {
          const s = Math.random();
          g.fillStyle = s < 0.5 ? `rgba(70,140,50,${Math.random() * 0.5})` : `rgba(150,210,100,${Math.random() * 0.4})`;
          g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3);
        }
      });
    case 'paving':
      return canvasTex('f_pave', 128, 128, (g, w, h) => {
        g.fillStyle = '#d8d2c6';
        g.fillRect(0, 0, w, h);
        noise(g, w, h, 1200, 0.08);
        g.strokeStyle = 'rgba(110,100,90,0.35)';
        g.lineWidth = 2;
        for (let y = 0; y < 4; y++) {
          g.beginPath();
          g.moveTo(0, y * 32);
          g.lineTo(w, y * 32);
          g.stroke();
          for (let x = 0; x < 3; x++) {
            const xx = x * 64 + (y % 2) * 32;
            g.beginPath();
            g.moveTo(xx, y * 32);
            g.lineTo(xx, y * 32 + 32);
            g.stroke();
          }
        }
      });
    case 'asphalt':
      return canvasTex('f_asph', 128, 128, (g, w, h) => {
        g.fillStyle = '#4a4e55';
        g.fillRect(0, 0, w, h);
        noise(g, w, h, 4000, 0.18);
        noise(g, w, h, 1500, 0.08, false);
      });
  }
  return floorTexture('lobby');
}

export interface SignOpts {
  bg?: string;
  fg?: string;
  size?: number;
  weight?: number;
  border?: string;
  align?: CanvasTextAlign;
  lineGap?: number;
  padding?: number;
  radius?: number;
  sub?: string;
}

/** Bảng chữ canvas – vẽ lại khi font đã tải */
export function signTexture(key: string, lines: string[], w = 512, h = 256, o: SignOpts = {}): THREE.CanvasTexture {
  return canvasTex(
    'sign_' + key,
    w,
    h,
    (g) => {
      const r = o.radius ?? 18;
      g.fillStyle = o.bg ?? '#ffffff';
      g.beginPath();
      g.roundRect(0, 0, w, h, r);
      g.fill();
      if (o.border) {
        g.strokeStyle = o.border;
        g.lineWidth = 10;
        g.beginPath();
        g.roundRect(5, 5, w - 10, h - 10, r);
        g.stroke();
      }
      const size = o.size ?? 48;
      g.fillStyle = o.fg ?? '#1b2a41';
      g.textAlign = o.align ?? 'center';
      g.textBaseline = 'middle';
      const gap = o.lineGap ?? 1.25;
      const total = lines.length * size * gap;
      const pad = o.padding ?? 30;
      lines.forEach((ln, i) => {
        const bold = ln.startsWith('**');
        const text = bold ? ln.slice(2) : ln;
        const sz = bold ? size * 1.15 : size;
        g.font = `${bold ? 800 : o.weight ?? 600} ${sz}px ${FONT}`;
        const x = (o.align ?? 'center') === 'center' ? w / 2 : pad;
        g.fillText(text, x, h / 2 - total / 2 + size * gap * (i + 0.5), w - pad * 2);
      });
    },
    false,
  );
}

export function logoTexture(): THREE.CanvasTexture {
  return canvasTex(
    'logo',
    1024,
    320,
    (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const bars: [string, number][] = [
        ['#F37021', 0.45],
        ['#0A6FC2', 0.7],
        ['#18A558', 0.95],
      ];
      bars.forEach(([c, hh], i) => {
        g.fillStyle = c;
        g.beginPath();
        g.roundRect(40 + i * 72, h - 40 - hh * 220, 56, hh * 220, 12);
        g.fill();
      });
      g.fillStyle = '#ffffff';
      g.font = `900 190px ${FONT}`;
      g.textBaseline = 'middle';
      g.fillText('FTEL', 290, h / 2 + 10);
    },
    false,
  );
}

export function photoTexture(): THREE.CanvasTexture {
  return canvasTex(
    'oldphoto',
    256,
    200,
    (g, w, h) => {
      g.fillStyle = '#d9c39a';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#b89a6a';
      g.fillRect(20, 20, w - 40, h - 50);
      // băng rôn
      g.fillStyle = '#efe2c4';
      g.fillRect(40, 35, w - 80, 34);
      g.fillStyle = '#6b4a2a';
      g.font = `800 20px ${FONT}`;
      g.textAlign = 'center';
      g.fillText('CHÀO MỪNG TÔI', w / 2, 58);
      // người
      g.fillStyle = '#7a5a3a';
      g.beginPath();
      g.arc(w / 2, 100, 18, 0, Math.PI * 2);
      g.fill();
      g.fillRect(w / 2 - 22, 118, 44, 40);
      g.fillStyle = '#3b2a1a';
      g.fillRect(w / 2 - 10, 104, 20, 4);
      g.fillStyle = '#222';
      g.fillRect(w / 2 + 20, 112, 6, 22);
      g.fillStyle = '#6b4a2a';
      g.font = `600 14px ${FONT}`;
      g.fillText('Ngày đầu đi làm – 1998', w / 2, h - 12);
      noise(g, w, h, 1500, 0.15);
    },
    false,
  );
}

export function skyTexture(): THREE.CanvasTexture {
  return canvasTex(
    'windows',
    128,
    256,
    (g, w, h) => {
      g.fillStyle = '#c9d6e3';
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 4; x++) {
          g.fillStyle = Math.random() < 0.3 ? '#ffe9a8' : '#5f7d9c';
          g.fillRect(8 + x * 30, 8 + y * 15.5, 22, 10);
        }
    },
    true,
  );
}

export function corkTexture(): THREE.CanvasTexture {
  return canvasTex(
    'cork',
    256,
    192,
    (g, w, h) => {
      g.fillStyle = '#c99a5e';
      g.fillRect(0, 0, w, h);
      noise(g, w, h, 3000, 0.25);
      const papers = ['#fff8c4', '#ffffff', '#ffd6e0', '#d3f9d8', '#d0ebff'];
      for (let i = 0; i < 9; i++) {
        g.save();
        g.translate(20 + (i % 3) * 80 + Math.random() * 10, 20 + Math.floor(i / 3) * 58 + Math.random() * 6);
        g.rotate((Math.random() - 0.5) * 0.2);
        g.fillStyle = papers[i % papers.length];
        g.fillRect(0, 0, 62, 44);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        for (let l = 0; l < 4; l++) g.fillRect(6, 8 + l * 9, 30 + Math.random() * 20, 2);
        g.fillStyle = '#e03131';
        g.beginPath();
        g.arc(31, 3, 4, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    },
    false,
  );
}

export function whiteboardTexture(): THREE.CanvasTexture {
  return canvasTex(
    'wb',
    512,
    256,
    (g, w, h) => {
      g.fillStyle = '#fbfbfb';
      g.fillRect(0, 0, w, h);
      g.font = `700 26px ${FONT}`;
      g.fillStyle = '#c92a2a';
      g.fillText('CT 17h – CHÀO MỪNG TÂN BINH', 20, 40);
      g.font = `500 21px ${FONT}`;
      g.fillStyle = '#1c4e8c';
      const items = ['Bánh: Thu ✓', 'Băng rôn: Nam (??)', 'Âm thanh: Bắp', 'MC: ???'];
      items.forEach((t, i) => g.fillText('• ' + t, 30, 82 + i * 32));
      g.fillStyle = '#c92a2a';
      g.font = `800 24px ${FONT}`;
      g.fillText('TÂN BINH: KHÔNG ĐƯỢC BIẾT!!!', 20, 230);
      g.strokeStyle = '#2b8a3e';
      g.lineWidth = 3;
      g.strokeRect(330, 70, 150, 110);
      g.fillStyle = '#2b8a3e';
      g.font = `600 18px ${FONT}`;
      g.fillText('Chỉ 5 phút!', 350, 130);
    },
    false,
  );
}
