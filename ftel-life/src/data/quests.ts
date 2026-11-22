// ===== Chuỗi nhiệm vụ Chương 1 – "Ngày đầu đi làm – Chỉ có 5 phút thôi!" =====
// Thêm nhiệm vụ mới: khai báo QuestDef, nối bằng `next`, và dùng effect { obj: [quest, objective] }
// trong hội thoại/đồ vật để hoàn thành mục tiêu.
import type { Cond, QuestDef } from '../game/types';

export const FIRST_QUEST = 'q1';

export const QUESTS: Record<string, QuestDef> = {
  q1: {
    id: 'q1',
    title: 'Ngày đầu tiên tại FTEL',
    time: '08:00',
    chapterLabel: 'Cảnh 1',
    desc: 'Đi vào công ty. Nghe nói bảo vệ ở đây "biết hết mọi chuyện".',
    objectives: [
      { id: 'talkGuard', text: 'Chào hỏi chú bảo vệ ở cổng', target: { npc: 'tu' } },
      { id: 'enterLobby', text: 'Đi vào sảnh chính tòa nhà', target: { point: [0, 9] } },
    ],
    next: 'q2',
  },
  q2: {
    id: 'q2',
    title: 'Buổi phỏng vấn',
    time: '08:30',
    chapterLabel: 'Cảnh 2',
    desc: 'Chị Linh bên Nhân sự đang chờ ở phòng phỏng vấn (phía tây sảnh).',
    objectives: [
      { id: 'interview', text: 'Phỏng vấn với chị Linh (Nhân sự)', target: { npc: 'linh' } },
      { id: 'career', text: 'Chọn nghề nghiệp', target: { npc: 'linh' } },
    ],
    next: 'q3',
  },
  q3: {
    id: 'q3',
    title: 'Thẻ nhân viên',
    time: '09:30',
    chapterLabel: 'Cảnh 3',
    desc: 'Lấy thẻ ở máy cấp thẻ trong sảnh. Đơn giản thôi… phải không?',
    objectives: [
      { id: 'kiosk', text: 'Lấy thẻ ở máy cấp thẻ (sảnh chính)', target: { inter: 'kiosk' } },
      { id: 'tung', text: 'Tìm anh Tùng IT ở văn phòng mở', target: { npc: 'tung' } },
      { id: 'restart', text: 'Khởi động lại máy cấp thẻ', target: { inter: 'kiosk' } },
    ],
    onComplete: [{ setFlag: 'hasCard' }],
    next: 'q4',
  },
  q4: {
    id: 'q4',
    title: 'Năm phút thôi mà',
    time: '10:30',
    chapterLabel: 'Cảnh 4',
    desc: 'Làm quen đồng nghiệp ở văn phòng mở. Ai đó cần in một tài liệu.',
    objectives: [
      { id: 'nam', text: 'Làm quen với Nam ở văn phòng mở', target: { npc: 'nam' } },
      { id: 'printer1', text: 'In tài liệu ở máy in', target: { inter: 'printer' } },
      { id: 'paper', text: 'Xin giấy A4 từ chị Hạnh (Kế toán)', target: { npc: 'hanh' } },
      { id: 'printer2', text: 'Thử in lại', target: { inter: 'printer' } },
      { id: 'tung2', text: 'Hỏi anh Tùng về lỗi máy in', target: { npc: 'tung' } },
      { id: 'printer3', text: 'Khởi động lại máy in', target: { inter: 'printer' } },
      { id: 'deliver', text: 'Mang tài liệu cho Nam', target: { npc: 'nam' } },
    ],
    next: 'q5',
  },
  q5: {
    id: 'q5',
    title: 'Nhiệm vụ nghề nghiệp',
    time: '13:30',
    chapterLabel: 'Cảnh 5',
    desc: 'Chị Mai – trưởng nhóm – có việc cho bạn. "Chỉ năm phút thôi."',
    objectives: [
      { id: 'mai', text: 'Gặp chị Mai ở phòng họp', target: { npc: 'mai' } },
      {
        id: 'minigame',
        text: {
          default: 'Làm nhiệm vụ ở bàn làm việc số 7',
          sales: 'Tư vấn gói cước ở bàn số 7',
          tech: 'Sửa kết nối mạng ở bàn số 7',
          care: 'Hỗ trợ khách hàng ở bàn số 7',
          mkt: 'Lên kế hoạch sự kiện ở bàn số 7',
        },
        target: { inter: 'myDesk' },
      },
    ],
    next: 'q6',
  },
  q6: {
    id: 'q6',
    title: 'Bí ẩn chiếc bánh kem',
    time: '15:00',
    chapterLabel: 'Cảnh 6',
    desc: 'Pantry có biến. Cô Thu cần một "thám tử" đầu óc tỉnh táo.',
    onStart: [{ setFlag: 'cakeMissing' }],
    objectives: [
      { id: 'thu', text: 'Đến pantry gặp cô Thu', target: { npc: 'thu' } },
      {
        id: 'clues',
        text: 'Tìm ít nhất 3 manh mối về chiếc bánh',
        hint: 'Kiểm tra tủ lạnh, hỏi Nam, Bắp và chị Hạnh.',
        alt: [
          { cond: { notClue: 'cake_fridge' }, target: { inter: 'fridge' } },
          { cond: { notClue: 'cake_nam' }, target: { npc: 'nam' } },
          { cond: { notClue: 'cake_bap' }, target: { npc: 'bap' } },
          { cond: { notClue: 'cake_hanh' }, target: { npc: 'hanh' } },
        ],
      },
      { id: 'accuse', text: 'Trở lại pantry và nói kết luận với cô Thu', target: { npc: 'thu' } },
    ],
    next: 'q7',
  },
  q7: {
    id: 'q7',
    title: '16:59 – Có việc gấp!',
    time: '16:59',
    chapterLabel: 'Cảnh 7',
    desc: '"Anh chị em ơi, có việc này gấp lắm. Chỉ 5 phút thôi!"',
    onStart: [{ setFlag: 'chaos_start' }, { open: 'chat', arg: 'urgent' }],
    objectives: [
      { id: 'readChat', text: 'Đọc tin nhắn nhóm' },
      { id: 'hall', text: 'Đến hội trường gặp Bắp', target: { npc: 'bap' } },
      { id: 'mic', text: 'Tìm micro trong phòng kho (cạnh văn phòng mở)', target: { inter: 'micBox' } },
      { id: 'banner', text: 'Xử lý băng rôn Nam vừa treo', target: { inter: 'banner' } },
      { id: 'screen', text: 'Kiểm tra màn chiếu đang hiện thông tin lạ', target: { inter: 'hallScreen' } },
      { id: 'budget', text: 'Chốt quỹ phong trào với chị Hạnh', target: { npc: 'hanh' } },
      { id: 'ready', text: 'Báo chị Mai: mọi thứ đã sẵn sàng', target: { npc: 'mai' } },
    ],
    next: 'q8',
  },
  q8: {
    id: 'q8',
    title: 'Chương trình 17:00',
    time: '17:00',
    chapterLabel: 'Cảnh 8',
    desc: 'Chương trình bắt đầu. Đèn tắt. Mọi người đều đang nhìn… bạn?',
    onStart: [{ setFlag: 'finale' }, { dialogue: 'finale.start' }],
    objectives: [{ id: 'party', text: 'Tham dự chương trình ở hội trường', target: { npc: 'mai' } }],
  },
};

export const QUEST_ORDER = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];

/** Mục tiêu tự hoàn thành khi điều kiện đúng (kiểm tra sau mỗi lần thay đổi trạng thái) */
export const AUTO_OBJECTIVES: { quest: string; obj: string; cond: Cond }[] = [
  { quest: 'q6', obj: 'clues', cond: { cakeCluesGte: 3 } },
];
