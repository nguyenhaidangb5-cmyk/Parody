// Kiểm thử tự động: chơi từ đầu tới cuối bằng bàn phím/chuột thật trên trình duyệt headless.
// Chạy: node tests/playthrough.cjs [url] [route]
//   route: A | B | C | SECRET | all (mặc định all)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = process.argv[2] || 'http://localhost:4173';
const ROUTE = process.argv[3] || 'all';
const OUT = process.env.SHOTS || path.join(__dirname, '..', 'test-results');
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = {
  // Tân binh xuất sắc: hợp tác, hợp lý
  A: {
    name: 'Lan',
    career: 'Kinh doanh',
    prefer: ['em vào phỏng vấn', 'Hỏi rõ là việc gì', 'Lắng nghe và làm quen', 'Nhanh vậy', 'Dạ em nhớ', 'Đi tìm bộ phận IT', 'Kiểm tra dây nguồn', 'Em kiểm tra dây nguồn', 'Dạ được ạ, em đi in', 'Dạ em điền đầy đủ', 'Lần này em hỏi trước', 'Gom tài liệu', 'Để em in lại bản đúng', 'Dạ, em làm ngay', 'Cô bình tĩnh', 'Là chú Tư', 'Bình tĩnh. Mình chia', 'Kiểm tra pin', 'mình làm lại cùng nhau', 'Chắc trùng tên', 'Xem nhu cầu thực tế', 'Dạ.', 'Cảm ơn mọi người', 'Dạ cảm ơn chú'],
    expect: 'A',
    secrets: false,
  },
  // Chiến thần chữa cháy: nhiều giải pháp sáng tạo
  B: {
    name: 'Minh',
    career: 'Kỹ thuật',
    prefer: ['em là nhân viên mới', 'Đề xuất làm một công cụ', 'Lắng nghe và làm quen', 'Em biết mà', 'Dạ em nhớ', 'Đi tìm bộ phận IT', 'Bấm nút', 'Dạ em thử rồi', 'Dạ được ạ, em đi in', 'phiếu điện tử', 'năng lượng mặt trời', 'Gom tài liệu', 'gửi link file', 'Dạ, em làm ngay', 'Từ trưa tới giờ', 'Là chú Tư', 'loa kéo', 'Ôm micro chạy', 'TẠM BIỆT THẤT NGHIỆP', 'ảnh mèo', 'Chia đều', 'Dạ.', 'Cảm ơn mọi người', 'Dạ cảm ơn chú'],
    expect: 'B',
    secrets: false,
  },
  // Ngày đầu huyền thoại: kỳ quặc
  C: {
    name: 'Tí',
    career: 'Chăm sóc khách hàng',
    prefer: ['làm việc tại nhà', 'Áp lực có được tính OT', 'Giúp ngay', 'Gây ấn tượng', 'Em biết mà', 'Dạ em nhớ', 'Vẫy tay', 'Thì thầm', 'máy hay khởi động lại em', 'Năm phút thật hay', 'Em lấy tạm vài tờ', 'năng lượng mặt trời', 'Gom tài liệu', 'Để em in lại bản đúng', 'phút thường hay phút trưởng nhóm', 'Cô bình tĩnh', 'Là Nam', 'Năm phút thì làm sao', 'Ôm micro chạy', 'Để nguyên đi', 'ảnh mèo', 'trà sữa', 'Dạ.', 'có được tính OT', 'Dạ cảm ơn chú'],
    expect: 'C',
    secrets: false,
  },
  // Bí mật của chú Tư
  SECRET: {
    name: 'Vy',
    career: 'Marketing',
    prefer: ['em vào phỏng vấn', 'Chú làm ở đây lâu chưa', 'Hỏi rõ là việc gì', 'Lắng nghe và làm quen', 'Nhanh vậy', 'Dạ em nhớ', 'Đi tìm bộ phận IT', 'Kiểm tra dây nguồn', 'Em kiểm tra dây nguồn', 'Dạ được ạ, em đi in', 'Dạ em điền đầy đủ', 'Lần này em hỏi trước', 'Đọc kỹ thêm trang 2', 'Để em in lại bản đúng', 'Dạ, em làm ngay', 'Cô bình tĩnh', 'Là chú Tư', 'Bình tĩnh. Mình chia', 'Kiểm tra pin', 'mình làm lại cùng nhau', 'Hỏi thẳng', 'Xem nhu cầu thực tế', 'Dạ.', 'mời một người lên sân khấu', 'mật khẩu Wi-Fi', 'Dạ cảm ơn chú'],
    expect: 'SECRET',
    secrets: true,
  },
};

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ' – ' + detail : ''}`);
}

async function run(routeKey, opts = {}) {
  const R = ROUTES[routeKey];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${routeKey}-${n}.png`) });
  const st = () => page.evaluate(() => {
    const s = window.__ftel.store.getState();
    return { screen: s.screen, ui: s.ui, save: s.save, prompt: s.prompt, endingId: s.endingId };
  });
  const wait = (ms) => page.waitForTimeout(ms);

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ftel && document.querySelector('canvas'), null, { timeout: 30000 });
  await wait(2500);

  // ----- Menu -----
  const hasMenu = await page.isVisible('text=Bắt đầu');
  if (routeKey === 'A') ok('Màn hình chính hiển thị', hasMenu);
  const contDisabled = await page.isDisabled('text=Tiếp tục');
  if (routeKey === 'A') ok('Nút "Tiếp tục" bị khóa khi chưa có dữ liệu lưu', contDisabled);
  await page.click('text=Bắt đầu');
  await page.fill('#pname', R.name);
  await page.click('text=Vào ngày đầu đi làm');
  await page.waitForFunction(() => window.__ftel.store.getState().screen === 'playing');
  await wait(1500);
  if (routeKey === 'A') ok('Nút Bắt đầu vào game', (await st()).screen === 'playing');

  // ----- Di chuyển thật bằng phím W + camera chuột -----
  if (routeKey === 'A') {
    const p0 = await page.evaluate(() => ({ ...window.__ftel.runtime.player }));
    await page.keyboard.down('KeyW');
    await wait(1600);
    await page.keyboard.up('KeyW');
    const p1 = await page.evaluate(() => ({ ...window.__ftel.runtime.player }));
    ok('Nhân vật di chuyển bằng WASD', Math.hypot(p1.x - p0.x, p1.z - p0.z) > 0.5, `dịch ${Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2)}m`);
    ok('Barie chặn người chơi trước khi chào bảo vệ', p1.z > 34.1, `z=${p1.z.toFixed(2)}`);
    const yaw0 = await page.evaluate(() => window.__ftel.runtime.camYaw);
    await page.mouse.move(640, 360);
    await page.mouse.down();
    await page.mouse.move(800, 360, { steps: 8 });
    await page.mouse.up();
    await wait(600);
    const yaw1 = await page.evaluate(() => window.__ftel.runtime.camYaw);
    ok('Camera xoay bằng chuột', Math.abs(yaw1 - yaw0) > 0.05, `Δyaw=${(yaw1 - yaw0).toFixed(2)}`);
    await page.keyboard.down('ShiftLeft');
    await page.keyboard.down('KeyD');
    await wait(900);
    const run = await page.evaluate(() => window.__ftel.runtime.player.running);
    await page.keyboard.up('KeyD');
    await page.keyboard.up('ShiftLeft');
    ok('Shift để chạy nhanh', run === true);
    await shot('01-gate');
  }

  // ----- Helpers -----
  async function approach(kind, id) {
    for (let attempt = 0; attempt < 14; attempt++) {
      const placed = await page.evaluate(
        ({ kind, id, attempt }) => {
          const F = window.__ftel;
          let tx, tz;
          if (kind === 'npc') {
            const p = F.runtime.npcPos[id];
            if (!p) return 'no-npc';
            tx = p.x;
            tz = p.z;
          } else {
            const it = window.__ftelInter[id];
            tx = it.pos[0];
            tz = it.pos[1];
          }
          const dist = kind === 'npc' ? 1.25 : 0.9 + (attempt % 3) * 0.25;
          const a = (attempt * Math.PI) / 4 + (attempt > 7 ? 0.4 : 0);
          const c = { x: tx + Math.sin(a) * dist, z: tz + Math.cos(a) * dist };
          const before = { ...c };
          F.resolveCircle(c, 0.32, F.groundHeight(c.x, c.z));
          if (Math.hypot(c.x - before.x, c.z - before.z) > 0.05) return 'blocked';
          const rot = Math.atan2(tx - c.x, tz - c.z);
          F.runtime.teleport = { x: c.x, z: c.z, rotY: rot };
          F.runtime.camYaw = rot;
          return 'ok';
        },
        { kind, id, attempt },
      );
      if (placed !== 'ok') continue;
      await wait(450);
      const near = await page.evaluate(() => window.__ftel.runtime.nearest);
      if (near && near.id === id) return true;
    }
    return false;
  }

  function pickIndex(texts) {
    for (const pref of R.prefer) {
      const i = texts.findIndex((t) => t.toLowerCase().includes(pref.toLowerCase()));
      if (i >= 0) return i;
    }
    return 0;
  }

  async function runDialogue(maxSteps = 120) {
    for (let i = 0; i < maxSteps; i++) {
      const s = await st();
      if (s.ui.careerSelect) {
        await page.click(`.career-card:has-text("${R.career}")`);
        await wait(300);
        continue;
      }
      if (s.ui.card) {
        await shot('card');
        await page.click('.idcard .btn');
        await wait(200);
        continue;
      }
      if (s.ui.minigame) return 'minigame';
      if (s.ui.chat) return 'chat';
      if (!s.ui.dialogue) return 'done';
      const choices = await page.$$eval('.choice', (els) => els.map((e) => e.textContent));
      if (choices.length) {
        const idx = pickIndex(choices);
        await page.keyboard.press(String(idx + 1));
      } else {
        await page.keyboard.press('Space');
        await wait(70);
        if ((await page.$$('.choice')).length === 0 && (await st()).ui.dialogue) await page.keyboard.press('Space');
      }
      await wait(110);
    }
    return 'timeout';
  }

  async function engage(kind, id) {
    for (let k = 0; k < 4; k++) {
      const near = await approach(kind, id);
      await wait(500);
      if ((await st()).ui.dialogue) {
        await runDialogue();
        continue;
      }
      const n = await page.evaluate(() => window.__ftel.runtime.nearest);
      if (!near || !n || n.id !== id) continue;
      await page.keyboard.press('KeyE');
      await wait(250);
      return runDialogue();
    }
    throw new Error('Không tương tác được với ' + id);
  }
  const talk = (npc) => engage('npc', npc);
  const use = (inter) => engage('inter', inter);
  const objDone = async (q, o) => (await st()).save.quests[q]?.done.includes(o);
  const questDone = async (q) => (await st()).save.quests[q]?.status === 'done';

  // Lấy vị trí đồ vật qua module dữ liệu (được gắn sẵn)
  await page.evaluate(() => {
    window.__ftelInter = window.__ftelInterData;
  });

  // ===== CẢNH 1 =====
  await talk('tu');
  ok(`[${routeKey}] Tương tác với bảo vệ`, await objDone('q1', 'talkGuard'));
  if (R.secrets) {
    // hỏi thêm để lấy bí mật 1 (nếu chưa có)
    if (!(await st()).save.clues.includes('tu_1')) await talk('tu');
  }
  // đi bộ thật qua barie vào sảnh
  await page.evaluate(() => {
    window.__ftel.runtime.teleport = { x: 0, z: 30, rotY: Math.PI };
    window.__ftel.runtime.camYaw = Math.PI;
  });
  await wait(400);
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => window.__ftel.runtime.player.z < 12, null, { timeout: 30000 }).catch(() => {});
  await page.keyboard.up('KeyW');
  await wait(700);
  ok(`[${routeKey}] Hoàn thành nhiệm vụ đầu tiên (vào sảnh)`, await questDone('q1'));
  if (routeKey === 'A') await shot('02-lobby');
  await wait(1200);

  // ===== CẢNH 2 =====
  await talk('linh');
  ok(`[${routeKey}] Mở hội thoại HR & phỏng vấn`, await objDone('q2', 'interview'));
  const career = (await st()).save.career;
  ok(`[${routeKey}] Chọn được nghề nghiệp`, !!career, career);
  await wait(1200);

  // ===== CẢNH 3 =====
  await use('kiosk');
  await talk('tung');
  await use('kiosk');
  ok(`[${routeKey}] Nhận thẻ nhân viên sau khi khởi động lại`, (await st()).save.flags.hasCard === true);
  await wait(1200);

  if (R.secrets) {
    await use('showcase');
    await talk('tung'); // mật khẩu wifi
  }

  // ===== CẢNH 4 =====
  await talk('nam');
  await use('printer');
  await talk('hanh');
  await use('printer');
  await talk('tung');
  await use('printer');
  if (routeKey === 'A') await shot('03-office');
  await talk('nam');
  ok(`[${routeKey}] Chuỗi nhiệm vụ máy in hoàn tất`, await questDone('q4'));
  await wait(1200);

  // ===== CẢNH 5 – minigame =====
  await talk('mai');
  const r = await use('myDesk');
  ok(`[${routeKey}] Mở minigame nghề nghiệp`, r === 'minigame' || (await st()).ui.minigame);
  await page.waitForSelector('.mg');
  await shot('04-minigame');
  await solveMinigame(page, career, wait);
  await page.waitForFunction(() => !window.__ftel.store.getState().ui.minigame, null, { timeout: 20000 });
  await wait(300);
  await runDialogue();
  ok(`[${routeKey}] Hoàn thành minigame "${career}"`, await questDone('q5'));
  await wait(1200);

  // ===== CẢNH 6 – bánh kem =====
  await talk('thu');
  await use('fridge');
  await talk('nam');
  await talk('bap');
  if (routeKey === 'A') await shot('05-hall-bap');
  const cakeClues = (await st()).save.clues.filter((c) => c.startsWith('cake_')).length;
  ok(`[${routeKey}] Tìm được ≥3 manh mối bánh`, cakeClues >= 3, `${cakeClues}`);
  await talk('thu');
  ok(`[${routeKey}] Phá án bánh kem`, await questDone('q6'));
  await wait(1500);
  if (R.secrets) await talk('thu'); // tin đồn về chú Tư

  // ===== CẢNH 7 – 16:59 =====
  await page.waitForFunction(() => window.__ftel.store.getState().ui.chat, null, { timeout: 10000 });
  await shot('06-chat');
  await page.click('.phone-foot .btn'); // đọc nhanh
  await wait(300);
  await page.click('.phone-foot .btn'); // chạy qua hội trường
  await wait(500);
  ok(`[${routeKey}] Group chat 16:59 hoạt động`, await objDone('q7', 'readChat'));
  await talk('bap');
  // vào kho lấy micro
  await use('storageDoor');
  await wait(800);
  if (R.secrets) await use('oldPhoto');
  await use('micBox');
  await use('banner');
  await use('hallScreen');
  if (R.secrets) await use('djCase');
  await talk('hanh');
  if (routeKey === 'A') await shot('07-hall-prep');
  await talk('mai');
  ok(`[${routeKey}] Hoàn thành chuẩn bị chương trình`, await questDone('q7'));

  // ===== CẢNH 8 – twist & kết =====
  await page.waitForFunction(() => window.__ftel.store.getState().ui.dialogue || window.__ftel.store.getState().screen === 'ending', null, { timeout: 15000 });
  let twistShot = false;
  for (let i = 0; i < 80; i++) {
    const s = await st();
    if (s.screen === 'ending') break;
    if (!twistShot && s.save.flags.surprise) {
      await wait(600);
      await shot('08-surprise');
      twistShot = true;
    }
    await runDialogue(1);
    await wait(60);
  }
  await page.waitForFunction(() => window.__ftel.store.getState().screen === 'ending', null, { timeout: 15000 }).catch(() => {});
  const fin = await st();
  ok(`[${routeKey}] Kích hoạt đúng kết thúc ${R.expect}`, fin.endingId === R.expect, `nhận được ${fin.endingId}, stats=${JSON.stringify(fin.save.stats)}, tu=${fin.save.clues.filter((c) => c.startsWith('tu_')).length}`);
  await wait(1800);
  await shot('09-ending');
  const perf = await page.evaluate(() => ({ fps: window.__ftel.runtime.fps, calls: window.__ftel.runtime.drawCalls, tris: window.__ftel.runtime.triangles }));
  console.log(`   perf (headless SwiftShader – CPU): ${perf.fps.toFixed(1)} fps, ${perf.calls} draw calls, ${perf.tris} triangles`);
  const hard = errors.filter((e) => !/GPU stall|WebGL-|swiftshader|Automatic fallback/i.test(e));
  ok(`[${routeKey}] Không có lỗi JavaScript nghiêm trọng`, hard.length === 0, hard.slice(0, 3).join(' | '));
  await browser.close();
}

async function solveMinigame(page, career, wait) {
  if (career === 'sales') {
    for (const q of ['Nhà mình có mấy tầng', 'Cả nhà thường dùng mạng', 'Ngân sách hàng tháng']) {
      await page.click(`.qbtn:has-text("${q}")`);
      await wait(150);
    }
    // thử sai trước để kiểm tra điều kiện thất bại
    await page.click('.plan:has-text("Giga Tiết Kiệm")');
    await page.click('text=Tư vấn & chốt gói');
    await wait(200);
    const bad = await page.isVisible('.mg-result.bad');
    ok('Minigame Kinh doanh: chọn sai bị từ chối', bad);
    await page.click('.plan:has-text("Sky + Truyền hình")');
    await page.click('.addon:has-text("Wi-Fi Mesh") input');
    await page.click('text=Tư vấn & chốt gói');
  } else if (career === 'tech') {
    // xoay từng ô thuộc lời giải cho tới khi khớp hướng
    for (let guard = 0; guard < 80; guard++) {
      const tiles = await page.$$eval('.tile', (els) => els.map((e) => ({ m: +e.dataset.mask, g: e.dataset.goal === '' ? -1 : +e.dataset.goal })));
      const i = tiles.findIndex((t) => t.g >= 0 && t.m !== t.g);
      if (i < 0) break;
      await page.click(`.tile >> nth=${i}`);
      await wait(60);
    }
  } else if (career === 'care') {
    // thử một lượt sai để kiểm tra thất bại & thử lại
    const goods = ['Dạ em rất hiểu', 'Dạ em đã xác minh', 'Dạ chị cho em kiểm tra số thiết bị', 'Dạ em hướng dẫn chị đổi mật khẩu'];
    for (const g of goods) {
      await page.click(`.qbtn:has-text("${g}")`);
      await wait(200);
    }
  } else {
    // sắp xếp bằng nút ▲ (bubble sort theo đáp án)
    const ORDER = ['Xác định mục tiêu', 'Trình duyệt ngân sách', 'Đặt hội trường', 'Thiết kế và gửi thư mời', 'Viết kịch bản MC', 'Tổng duyệt', 'Tổ chức sự kiện'];
    await page.click('text=Kiểm tra');
    await wait(200);
    ok('Minigame Sự kiện: thứ tự sai bị báo lỗi', await page.isVisible('.mg-result.bad'));
    for (let target = 0; target < ORDER.length; target++) {
      for (let g = 0; g < 10; g++) {
        const items = await page.$$eval('.sortitem', (els) => els.map((e) => e.textContent));
        const cur = items.findIndex((t) => t.includes(ORDER[target]));
        if (cur <= target) break;
        await page.click(`.sortitem >> nth=${cur} >> button[aria-label="Lên"]`);
        await wait(50);
      }
    }
    await page.click('text=Kiểm tra');
  }
  await wait(400);
  ok(`Minigame ${career}: hoàn thành có điều kiện`, await page.isVisible('.mg-result.good'));
}

async function saveLoadTest() {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ftel);
  await page.waitForTimeout(1500);
  await page.click('text=Bắt đầu');
  await page.fill('#pname', 'Lưu');
  await page.click('text=Vào ngày đầu đi làm');
  await page.waitForTimeout(1200);
  // tiến tới giữa game bằng hiệu ứng logic, rồi lưu
  await page.evaluate(() => {
    const s = window.__ftel.store.getState();
    s.applyEffects([{ obj: ['q1', 'talkGuard'] }, { setFlag: 'gateOpen' }, { obj: ['q1', 'enterLobby'] }]);
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const s = window.__ftel.store.getState();
    s.applyEffects([{ obj: ['q2', 'interview'] }, { stat: 'doiMoi', add: 2 }, { clue: 'tu_2' }]);
    window.__ftel.store.getState().chooseCareer('tech');
    window.__ftel.store.getState().endDialogue();
    window.__ftel.runtime.teleport = { x: -14, z: 6, rotY: 0 };
  });
  await page.waitForTimeout(800);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('text=Lưu game');
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => {
    const s = window.__ftel.store.getState().save;
    return { career: s.career, q2: s.quests.q2, main: s.mainQuest, stats: s.stats.doiMoi, clues: s.clues, decisions: s.decisions.length, x: window.__ftel.runtime.player.x };
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__ftel);
  await page.waitForTimeout(1500);
  const contEnabled = !(await page.isDisabled('text=Tiếp tục'));
  ok('Nút "Tiếp tục" khả dụng khi có dữ liệu lưu', contEnabled);
  await page.click('text=Tiếp tục');
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => {
    const s = window.__ftel.store.getState().save;
    return { career: s.career, q2: s.quests.q2, main: s.mainQuest, stats: s.stats.doiMoi, clues: s.clues, decisions: s.decisions.length, x: window.__ftel.runtime.player.x };
  });
  ok('Lưu & tải lại tiến độ (nghề, nhiệm vụ, chỉ số, manh mối, vị trí)', after.career === before.career && after.main === before.main && after.stats === before.stats && JSON.stringify(after.clues) === JSON.stringify(before.clues) && Math.abs(after.x - before.x) < 0.5, JSON.stringify(after));
  await browser.close();
}

(async () => {
  const routes = ROUTE === 'all' ? ['A', 'B', 'C', 'SECRET'] : ROUTE.split(',');
  for (const r of routes) {
    try {
      await run(r);
    } catch (e) {
      ok(`[${r}] chạy hết tuyến`, false, e.message);
    }
  }
  if (ROUTE === 'all' || ROUTE.includes('save')) {
    try {
      await saveLoadTest();
    } catch (e) {
      ok('Lưu & tải lại', false, e.message);
    }
  }
  const fail = results.filter((r) => !r.pass);
  console.log(`\nKẾT QUẢ: ${results.length - fail.length}/${results.length} kiểm tra đạt`);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  process.exit(fail.length ? 1 : 0);
})();
