# FTEL LIFE – Ngày đầu đi làm

> Game 3D phiêu lưu – kể chuyện – hài hước về ngày đầu đi làm tại một công ty viễn thông hư cấu (lấy cảm hứng từ FPT Telecom). Chạy trực tiếp trên trình duyệt.

**Chương 1: "Ngày đầu đi làm – Chỉ có 5 phút thôi!"** · 15–25 phút chơi · 4 nghề · 3 kết thúc + 1 kết thúc bí mật.

---

## 1. Chạy game trên Windows (cực đơn giản)

**Cách 1 – bấm đúp (khuyên dùng)**

1. Cài **Node.js bản LTS** (một lần duy nhất): https://nodejs.org → tải bản "LTS" → Next liên tục.
2. Mở thư mục `ftel-life`, **bấm đúp `CHAY_GAME.bat`**.
3. Lần đầu sẽ tự cài thư viện (1–2 phút). Sau đó trình duyệt tự mở `http://localhost:5173`.
4. Bấm **Bắt đầu**, nhập tên, chơi.

**Cách 2 – dòng lệnh** (PowerShell / CMD trong thư mục `ftel-life`):

```bash
npm install      # chỉ lần đầu
npm start        # chạy game và tự mở trình duyệt (http://localhost:5173)
```

Trình duyệt: **Chrome hoặc Edge** bản mới, bật "Tăng tốc phần cứng" (mặc định đã bật). Máy yếu: vào **Cài đặt → Chất lượng: Thấp**.

### Build bản production (chạy không cần môi trường dev)

```bash
npm run build     # kiểm tra TypeScript + build vào thư mục dist/
npm run preview   # chạy thử bản build tại http://localhost:4173
```

Thư mục `dist/` là web tĩnh hoàn chỉnh (font, âm thanh, đồ họa đều nằm trong bundle). Có thể đặt lên bất kỳ máy chủ web tĩnh nào. *(Chưa triển khai công khai – theo yêu cầu.)*

---

## 2. Điều khiển

| Phím | Chức năng |
|---|---|
| **W A S D** / mũi tên | Di chuyển (theo hướng camera) |
| **Chuột** | Xoay camera – nhấp vào màn hình để khóa chuột, hoặc giữ chuột trái & kéo |
| **Cuộn chuột** | Thu / phóng camera |
| **Shift** | Chạy nhanh |
| **E** (hoặc Enter) | Tương tác / nói chuyện |
| **Space** | Nhảy · lướt nhanh hội thoại |
| **1 2 3 4** | Chọn nhanh lựa chọn hội thoại (hoặc ↑↓ + E) |
| **Tab / M** | Bản đồ + nhật ký nhiệm vụ + manh mối |
| **Esc** | Tạm dừng (Lưu game, Cài đặt, Về menu) |

Màn hình cảm ứng: có joystick ảo, vùng vuốt xoay camera, nút **E**, nhảy và bản đồ.

Đi theo **dấu ◆ màu cam** (trên đầu NPC/đồ vật và trên minimap) để không bị lạc.

---

## 3. Tính năng đã triển khai

### Gameplay 3D
- Thế giới 3D thật: nhân vật di chuyển, chạy, nhảy, camera góc nhìn thứ ba xoay 360° bằng chuột, thu phóng, **chống xuyên tường** (raycast).
- **Va chạm**: tường, bàn ghế, quầy, kệ, hàng rào, NPC… (hệ va chạm AABB + hình tròn tự viết, nhẹ và ổn định). Sân khấu có bậc thềm, chỉ lên được bằng bậc.
- **7 khu vực** liên thông trên một bản đồ: Sân trước (cổng, bốt bảo vệ, barie, bãi xe máy, xe bánh mì, cây, ghế đá, cột cờ) · Sảnh chính (lễ tân, tường logo, sofa, tủ cúp, bảng thông báo, thang máy, máy cấp thẻ) · Phòng phỏng vấn · Văn phòng mở (4 cụm bàn, máy in, góc IT, bàn kế toán, tủ hồ sơ, đồng hồ) · Phòng họp (vách kính, màn chiếu, bảng ghi chú) · Pantry (quầy, máy pha cà phê, tủ lạnh, bàn ăn) · Hội trường (sân khấu, phông nền, băng rôn, màn chiếu, ghế khán giả, bóng bay, dây đèn) + Kho & phòng server (cửa quẹt thẻ).
- Cửa kính tự động ở sảnh, barie cổng mở sau khi chào bảo vệ, cửa kho mở bằng thẻ, ghế văn phòng xoay được, điện thoại reo, máy in nhả giấy, máy cấp thẻ đổi màn hình theo trạng thái, nến trên bánh kem lung linh, pháo giấy, đèn sân khấu.
- **Ánh sáng theo thời gian trong ngày**: sáng → trưa → chiều → hoàng hôn 16:59, kèm cảnh "tắt đèn – SURPRISE!".

### Nhân vật
- 13 nhân vật dựng hoàn toàn bằng code theo phong cách stylized: đầu–thân–tay–chân có **khớp xương** (vai, khuỷu, hông, gối, cổ), mắt chớp, lông mày, miệng thay đổi theo biểu cảm, má hồng, 10 kiểu tóc, 7 kiểu áo, váy/quần, phụ kiện (mũ bảo vệ, ria mép, kính, tai nghe, máy ảnh, tạp dề, cà vạt, thẻ đeo, đồng hồ, mũ len…).
- **Hoạt ảnh thủ tục**: đứng thở, đi bộ, chạy, nhảy, ngồi gõ phím, nói chuyện (cử chỉ tay + khẩu hình), quay đầu nhìn người chơi, xoay người khi nói chuyện, cổ vũ, DJ, nhìn đồng hồ.
- **Biểu cảm**: vui, ngạc nhiên (nhảy giật mình), bối rối (nghiêng đầu, gãi đầu), suy nghĩ, buồn, giận – kèm bong bóng biểu cảm (!, ?, …, ♪, #).
- NPC có lịch trình: vị trí thay đổi theo cảnh, một số đi tuần (anh Huy đi tìm phòng họp, Bắp đi dạo hành lang, nhân viên ngoài sân), bảng tên hiện khi lại gần. Người chơi được đeo thẻ nhân viên sau khi nhận thẻ.

### Cốt truyện – 8 nhiệm vụ nối tiếp (Quest System thật)
| # | Giờ | Nhiệm vụ |
|---|---|---|
| 1 | 08:00 | Ngày đầu tiên – chào chú Tư ở cổng (3 cách trả lời), vào sảnh |
| 2 | 08:30 | Phỏng vấn với chị Linh (3 câu hỏi có hệ quả) → **chọn nghề** |
| 3 | 09:30 | Máy cấp thẻ báo "nhân viên không tồn tại" → tìm anh Tùng → khởi động lại → nhận thẻ |
| 4 | 10:30 | "In giúp anh 5 phút thôi": hết giấy → xin chị Hạnh (phiếu đề xuất in trên giấy A4) → máy in "đang buồn" → anh Tùng → khởi động lại (tiếng vịt) → in nhầm `FINAL_CHOT_THAT_LAN_NAY_7.pdf` |
| 5 | 13:30 | **Minigame theo nghề** ở bàn số 7 |
| 6 | 15:00 | Bí ẩn chiếc bánh kem: điều tra tủ lạnh, Nam, Bắp, chị Hạnh (+ manh mối ẩn ở bốt bảo vệ) → buộc tội (5 lựa chọn, có đúng – có sai, đều có hậu quả hài) |
| 7 | 16:59 | Group chat "Chỉ 5 phút thôi!" → mất micro, băng rôn "TẠM BIỆT", màn chiếu hiện tên lạ, chia quỹ phong trào → báo chị Mai |
| 8 | 17:00 | Tắt đèn – **cú twist**: chương trình là tiệc chào mừng chính bạn; bạn đã cả chiều chuẩn bị tiệc cho mình |

Mỗi nhiệm vụ có ID, tên, mô tả, mục tiêu, tiến độ, điều kiện hoàn thành, hiệu ứng, nhiệm vụ kế tiếp; hiển thị trên HUD + marker + minimap + nhật ký (Tab). Thứ tự làm sai không gây kẹt (NPC/đồ vật luôn có phản hồi phù hợp; các bước tự động được khôi phục khi tải lại save).

**Cú twist được cài manh mối từ đầu**: chú Tư ghi tên bạn "chiều nay còn nghe nhiều", lễ tân "nghe tên bạn từ sáng", chị Linh "danh sách có tên em", bảng thông báo bị che tên, kịch bản in nhầm "Nhân vật trung tâm: TÂN BINH", bảng ghi chú phòng họp "TÂN BINH: KHÔNG ĐƯỢC BIẾT!!!", ảnh bánh kem "Chào mừng K…", màn chiếu hiện tên bạn…

### 4 minigame nghề nghiệp (có điều kiện thắng/thua, thử lại được)
- **Kinh doanh**: hỏi đúng câu để mở nhu cầu khách (hỏi thừa → mất kiên nhẫn), chọn gói + dịch vụ cộng thêm phải thỏa tốc độ, số điểm phát Wi-Fi, truyền hình 4K và ngân sách.
- **Kỹ thuật**: xoay các đoạn cáp để nối Modem tới Wi-Fi phòng họp và Máy chiếu (mạch sáng xanh khi có tín hiệu).
- **Chăm sóc khách hàng**: hội thoại 4 lượt với khách đang giận, thanh "hài lòng" phải ≥ 75 (lắng nghe → xác minh → hỗ trợ).
- **Marketing/Sự kiện**: kéo-thả/▲▼ sắp xếp 7 bước chuẩn bị chương trình đúng trình tự.

### Văn hóa FPT – không phải bài giảng
Sáu giá trị (Tôn trọng, Đổi mới, Đồng đội, Chí công, Gương mẫu, Sáng suốt) được cộng **ẩn** qua lựa chọn trong tình huống (giúp Nam, đề xuất phiếu điện tử, kiểm tra dây nguồn, chia quỹ công bằng, nhận trách nhiệm khi in nhầm…). Chỉ hiện thông báo nhỏ "+ Đồng đội"; bảng chỉ số đầy đủ chỉ xuất hiện ở màn tổng kết. Có thêm chỉ số ẩn "Kỳ quặc".

### Kết thúc (4)
| Kết thúc | Điều kiện |
|---|---|
| **A – Tân binh xuất sắc** | Mặc định khi chơi hợp lý, hợp tác |
| **B – Chiến thần chữa cháy** | Đổi mới ≥ 3 và ≥ Đồng đội (nhiều giải pháp sáng tạo) |
| **C – Ngày đầu huyền thoại** | Kỳ quặc ≥ 6 (nhiều lựa chọn "khó đỡ") |
| **★ Bí mật của chú Tư** | Tìm ≥ 4/6 bí mật về chú Tư **và** chọn "mời chú Tư lên sân khấu" ở cảnh cuối |

6 bí mật: hỏi chú Tư "làm ở đây lâu chưa", tủ cúp ở sảnh, bức ảnh 1998 trong kho, tin đồn của cô Thu (sau vụ bánh), thùng "DJ TƯ" cạnh sân khấu, mật khẩu Wi-Fi của anh Tùng.
Mỗi kết thúc có đoạn kết, phản ứng NPC, màn tổng kết (nghề, 6 chỉ số, thành tựu, các quyết định đáng nhớ, kết thúc đã mở), nút **Chơi lại** / **Về menu**. Kết thúc đã mở được lưu vĩnh viễn (hiện trên menu chính).

### Tình huống phụ hài hước (đều có phản hồi thật)
Máy pha cà phê muốn tâm sự · máy in báo lỗi xoay vòng ("giấy quá trắng", "tôi ngại") · bảng thông báo đổi nội dung theo từng cảnh · anh Huy đi tìm phòng họp "Sao Hỏa, tầng 12" (tòa nhà 1 tầng) · điện thoại gọi nhầm đặt phở · thang máy "tầng 47 → 48" · file tên siêu dài · ghế xoay không dừng · tủ lạnh "ai lấy sữa chua của tôi" · anh Đức đếm giờ về theo từng cảnh · cây kim tiền "đang bơi" · máy bán hàng (đá máy → chú Tư ghi nhận) · xe bánh mì ngoài cổng · 8 thành tựu ẩn.

### Giao diện & âm thanh
- Menu chính có nền 3D bay quanh khuôn viên; Bắt đầu (nhập tên), Tiếp tục (chỉ bật khi có save), Hướng dẫn, Cài đặt (nhạc, hiệu ứng, độ nhạy chuột, đảo trục, chất lượng đồ họa), bật/tắt âm thanh.
- HUD: thẻ nhiệm vụ + giờ + tiến độ, minimap xoay theo camera (tên khu vực), lời nhắc "Nhấn E để…", thông báo nhiệm vụ/manh mối/thành tựu, banner chương. Hội thoại kiểu chữ chạy, chân dung + bảng tên theo màu NPC, lựa chọn đánh số. Màn chọn nghề, điện thoại group chat, thẻ nhân viên, nhật ký + bản đồ lớn + manh mối, menu tạm dừng, màn kết thúc.
- Font **Be Vietnam Pro** (đóng gói kèm, hỗ trợ đầy đủ tiếng Việt, không tải từ internet).
- **Âm thanh tổng hợp 100% bằng Web Audio API** (không có file âm thanh bên ngoài): bước chân, click, gõ chữ hội thoại, nhiệm vụ mới, hoàn thành, cửa, máy in, chuông chat, điện thoại, ngạc nhiên, manh mối, máy pha cà phê, pháo giấy, mở kết thúc; **nhạc nền lo-fi tự sáng tác bằng code** đổi tâm trạng (nhẹ nhàng → gấp gáp 16:59 → tiệc).

### Lưu game
Tự động lưu (localStorage) sau mỗi hội thoại, mỗi nhiệm vụ và mỗi 15 giây; lưu tay trong menu tạm dừng. Lưu: tên, nghề, 7 chỉ số, nhiệm vụ hiện tại + đã xong + tiến độ từng mục tiêu, cờ sự kiện/quyết định quan trọng, manh mối, thành tựu, vị trí và hướng nhân vật, thời gian chơi; kết thúc đã mở + cài đặt lưu riêng.

---

## 4. Kết quả kiểm thử

Kiểm thử tự động bằng **Playwright + Chromium headless** (render WebGL bằng CPU – SwiftShader), chơi **thật** bằng bàn phím/chuột: dịch chuyển tới gần NPC, nhấn **E**, chọn lựa chọn bằng phím số, giải minigame qua giao diện. Script: `tests/playthrough.cjs`.

Xem mục **"Kết quả lần chạy cuối"** ở cuối file (được cập nhật sau mỗi lần kiểm thử).

Đã kiểm chứng:
1. `npm install` thành công · 2. TypeScript không lỗi (`npm run typecheck`) · 3. `npm run build` thành công
4. Màn hình chính hiển thị · 5. Nút Bắt đầu · 6. Di chuyển WASD + chạy Shift · 7. Camera xoay bằng chuột · Barie chặn đường trước khi chào bảo vệ
8. Tương tác bảo vệ · 9. Hội thoại HR · 10. Chọn nghề · 11. Hoàn thành nhiệm vụ đầu tiên
12. Cả 4 minigame (bao gồm kiểm tra trường hợp chọn sai bị từ chối) · 13. Tiến tới nhiệm vụ cuối
14. **Cả 4 kết thúc A, B, C, SECRET** được kích hoạt đúng theo lựa chọn · 15. Lưu & tải lại tiến độ
16. Không có lỗi JavaScript nghiêm trọng trong suốt quá trình chơi
- Kiểm tra toàn vẹn dữ liệu (`npm run validate`): mọi tham chiếu hội thoại/nhiệm vụ/NPC/đồ vật tồn tại, mọi mục tiêu đều có nơi hoàn thành, không có nút hội thoại "mồ côi".

**Hiệu năng**: ~250 draw call, ~115k tam giác (tường/nội thất tĩnh được gộp geometry theo vật liệu, 1 đèn đổ bóng, NPC ở xa tự ẩn). Trong môi trường kiểm thử không có GPU (render CPU) game chạy 3–6 FPS – con số này **không đại diện**; trên PC có card đồ họa (kể cả card tích hợp) dự kiến đạt 60 FPS. **Chưa đo được FPS trên GPU thật** trong môi trường này.

---

## 5. Những phần chưa hoàn thành / giới hạn

- **Chưa kiểm chứng trên máy Windows thật và GPU thật** (môi trường phát triển là Linux headless). Lệnh và file `.bat` được viết theo chuẩn Windows nhưng chưa chạy thử trên Windows.
- Nhân vật dựng bằng hình khối + hoạt ảnh thủ tục (không có mô hình rig chuyên nghiệp) – đẹp kiểu "đồ chơi stylized", chưa có biểu cảm khuôn mặt chi tiết hay hoạt ảnh tay cầm đồ vật.
- Không có trần nhà khi đứng trong tòa nhà (mái tự ẩn để camera nhìn rõ – kiểu game mô phỏng).
- Cảnh cuối là chuỗi hội thoại trong hội trường + hiệu ứng (tắt đèn, pháo giấy, đèn màu, DJ), chưa có camera điện ảnh dựng cảnh riêng.
- Điều khiển cảm ứng ở mức cơ bản (chưa tối ưu giao diện cho màn hình điện thoại nhỏ).
- Chỉ có Chương 1.

---

## 6. Cấu trúc thư mục

```
ftel-life/
├─ CHAY_GAME.bat            # bấm đúp để chạy trên Windows
├─ index.html · vite.config.ts · tsconfig.json · package.json
├─ src/
│  ├─ main.tsx · App.tsx · styles.css
│  ├─ game/                 # "engine" logic, không phụ thuộc giao diện
│  │  ├─ types.ts           # kiểu dữ liệu: Quest, Dialogue, NPC, Effect, Cond…
│  │  ├─ store.ts           # Zustand: trạng thái, lưu/tải, hiệu ứng, điều kiện, quest, ending
│  │  ├─ collision.ts       # va chạm AABB/hình tròn, độ cao nền, raycast camera
│  │  ├─ input.ts           # bàn phím, chuột, khóa con trỏ, cảm ứng
│  │  ├─ audio.ts           # âm thanh + nhạc nền tổng hợp (Web Audio)
│  │  └─ runtime.ts         # dữ liệu tần suất cao (vị trí người chơi, NPC…)
│  ├─ data/                 # NỘI DUNG GAME – sửa ở đây để mở rộng
│  │  ├─ dialogues.ts       # toàn bộ kịch bản hội thoại (≈360 nút)
│  │  ├─ quests.ts          # chuỗi nhiệm vụ
│  │  ├─ npcs.ts            # NPC: ngoại hình, vị trí theo cảnh, luật hội thoại
│  │  ├─ interactables.ts   # đồ vật tương tác + vùng kích hoạt
│  │  ├─ careers.ts · endings.ts · layout.ts
│  ├─ scene/                # thế giới 3D (React Three Fiber)
│  │  ├─ buildWorld.ts      # dựng toàn bộ bản đồ + va chạm
│  │  ├─ StaticBuilder.ts   # gộp geometry tĩnh theo vật liệu
│  │  ├─ Character.tsx      # nhân vật stylized + khung xương + hoạt ảnh
│  │  ├─ Player.tsx · NPCs.tsx · CameraRig.tsx · World.tsx · Environment.tsx
│  │  └─ textures.ts · cache.ts · Confetti.tsx · EmoteBubble.tsx · GameCanvas.tsx
│  └─ ui/                   # giao diện HTML/CSS
│     ├─ MainMenu · HUD · DialogueBox · Screens · EndingScreen · Modals · TouchControls
│     └─ minigames/         # Sales · Tech · Care · Event
└─ tests/
   ├─ validate-data.ts + run-validate.mjs   # kiểm tra toàn vẹn dữ liệu
   └─ playthrough.cjs                        # chơi tự động 4 tuyến + lưu/tải
```

**Công nghệ**: React 18 · TypeScript · Vite 5 · Three.js · React Three Fiber · Zustand · Web Audio API · localStorage. *(Không dùng Rapier: hệ va chạm tự viết đủ cho game đi bộ/khám phá, nhẹ hơn và không có lỗi rơi xuyên sàn.)*

---

## 7. Tài nguyên bên ngoài & giấy phép

| Tài nguyên | Nguồn | Giấy phép |
|---|---|---|
| Font Be Vietnam Pro | `@fontsource/be-vietnam-pro` (đóng gói vào bản build) | SIL Open Font License 1.1 |
| three.js, React, React Three Fiber, Zustand, Vite | npm | MIT |

**Không dùng** mô hình 3D, hình ảnh, âm thanh hay nhạc tải từ bên ngoài. Toàn bộ nhân vật, môi trường, texture (vẽ bằng canvas), âm thanh và nhạc nền đều được tạo bằng code trong dự án. Logo "FTEL", tên công ty và mọi nhân vật đều là hư cấu; không dùng logo/nhạc/tài sản có bản quyền của FPT hay của game "Tiệm Phở Của Anh Hai".

---

## 8. Mở rộng game bằng ngôn ngữ tự nhiên (gợi ý cho AI)

Nội dung tách khỏi engine nên có thể nhờ AI mở rộng mà không viết lại dự án. Ví dụ câu lệnh:

- *"Thêm NPC 'Anh Khang – bảo trì' đứng ở pantry, tính cách lầm lì, có 2 câu thoại và một nhiệm vụ phụ sửa vòi nước. Làm theo cấu trúc trong `src/data/npcs.ts` và `src/data/dialogues.ts`."*
- *"Thêm nghề thứ 5 'Nhân sự' với minigame sàng lọc CV, theo mẫu `src/ui/minigames/` và `src/data/careers.ts`."*
- *"Viết Chương 2 'Tuần đầu tiên': thêm quest `q9`…`q12` nối sau `q8` trong `src/data/quests.ts`, đổi `finale` để không kết thúc game mà chuyển chương."*
- *"Thêm kết thúc E 'Nhân viên của tháng' khi chỉ số Chí công ≥ 3 – sửa `computeEnding` trong `src/game/store.ts` và thêm nội dung vào `src/data/endings.ts`."*
- *"Thêm phòng 'Thư viện' phía đông hội trường – sửa `WALLS`/`ROOMS` trong `src/data/layout.ts` và thêm nội thất trong `src/scene/buildWorld.ts`."*

Quy ước nhanh:
- **Hội thoại**: `chain('id', [[người nói, lời thoại, {emote, effects, next}], ...], {choices})`. Người nói: id NPC, `'player'`, `'narrator'`, hoặc `'#Tên đồ vật'`. Dùng `{name}`, `{career}`, `{time}`, `{initial}` trong lời thoại; lời thoại riêng theo nghề: `{ default: '...', sales: '...', tech: '...' }`.
- **Hiệu ứng** (`effects`): `{stat}`, `{setFlag}`, `{obj: [quest, mục tiêu]}`, `{clue}`, `{open: 'minigame'|'chat'|'card'|'ending'}`, `{sfx}`, `{achievement}`, `{teleport}`…
- **Điều kiện** (`cond`): `{flag}`, `{questActive}`, `{currentObj}`, `{objDone}`, `{clue}`, `{career}`, `{secretGte}`, `{any: [...]}`…
- Sau khi sửa: chạy `npm run validate` để bắt lỗi tham chiếu, rồi `npm run build`.

Chạy lại kiểm thử tự động (cần Playwright + Chromium): `npm run build && npm run preview` (cửa sổ 1) → `npm run test:e2e` (cửa sổ 2).
