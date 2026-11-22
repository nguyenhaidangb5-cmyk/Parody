// ===== Đồ vật tương tác trong thế giới =====
import type { InteractDef, ZoneDef } from '../game/types';
import { POS } from './layout';

const q7Open = (obj: string) => ({ questActive: 'q7', objDone: ['q7', 'hall'] as [string, string], objNotDone: ['q7', obj] as [string, string] });

export const INTERACTABLES: InteractDef[] = [
  // ---------- Sân trước ----------
  {
    id: 'booth',
    pos: [6.2, 31.4],
    radius: 1.8,
    label: [{ text: 'xem sổ trực của bốt bảo vệ' }],
    actions: [
      { cond: { questActive: 'q6' }, dialogue: 'booth.cake' },
      { dialogue: 'booth.log' },
    ],
  },
  {
    id: 'banhmi',
    pos: [-9, 38.6],
    radius: 2,
    label: [{ text: 'ghé xe bánh mì' }],
    actions: [{ dialogue: 'banhmi' }],
  },
  {
    id: 'signboard',
    pos: [-4.6, 27],
    radius: 1.8,
    label: [{ text: 'đọc biển chỉ dẫn' }],
    actions: [{ dialogue: 'signboard' }],
  },
  // ---------- Sảnh ----------
  {
    id: 'kiosk',
    pos: POS.kiosk,
    radius: 1.7,
    label: [
      { cond: { currentObj: ['q3', 'restart'] }, text: 'khởi động lại máy cấp thẻ' },
      { text: 'dùng máy cấp thẻ' },
    ],
    actions: [
      { cond: { questNotStarted: 'q3' }, dialogue: 'kiosk.early' },
      { cond: { currentObj: ['q3', 'kiosk'] }, dialogue: 'kiosk.error' },
      { cond: { currentObj: ['q3', 'tung'] }, dialogue: 'kiosk.errorAgain' },
      { cond: { currentObj: ['q3', 'restart'] }, dialogue: 'kiosk.restart' },
      { dialogue: 'kiosk.done' },
    ],
  },
  {
    id: 'board',
    pos: [-7.3, 4.6],
    radius: 1.8,
    label: [{ text: 'đọc bảng thông báo' }],
    actions: [
      { cond: { questActive: 'q7' }, dialogue: 'board.q7' },
      { cond: { questActive: 'q6' }, dialogue: 'board.q6' },
      { cond: { any: [{ questActive: 'q4' }, { questActive: 'q5' }] }, dialogue: 'board.q4' },
      { cond: { any: [{ questActive: 'q2' }, { questActive: 'q3' }] }, dialogue: 'board.q2' },
      { dialogue: 'board.q1' },
    ],
  },
  {
    id: 'showcase',
    pos: [-7.2, 7.0],
    radius: 1.6,
    label: [{ text: 'xem tủ cúp' }],
    actions: [{ dialogue: 'showcase' }],
  },
  {
    id: 'elevator',
    pos: [7.4, 10.5],
    radius: 1.6,
    label: [{ text: 'bấm gọi thang máy' }],
    actions: [{ dialogue: 'elevator' }],
  },
  {
    id: 'sofa',
    pos: [-5, 11.6],
    radius: 1.6,
    label: [{ text: 'ngồi thử sofa' }],
    actions: [{ dialogue: 'sofa' }],
  },
  // ---------- Hành lang ----------
  {
    id: 'vending',
    pos: [-19.9, -0.5],
    radius: 1.6,
    label: [{ text: 'mua nước ở máy bán hàng' }],
    actions: [{ dialogue: 'vending' }],
  },
  {
    id: 'water',
    pos: [19.9, -0.5],
    radius: 1.5,
    label: [{ text: 'lấy nước' }],
    actions: [{ dialogue: 'water' }],
  },
  // ---------- Văn phòng mở ----------
  {
    id: 'printer',
    pos: POS.printer,
    radius: 1.7,
    label: [
      { cond: { currentObj: ['q4', 'printer3'] }, text: 'khởi động lại máy in' },
      { text: 'kiểm tra máy in' },
    ],
    actions: [
      { cond: { any: [{ currentObj: ['q4', 'printer1'] }, { currentObj: ['q4', 'paper'] }] }, dialogue: 'printer.noPaper' },
      { cond: { currentObj: ['q4', 'printer2'] }, dialogue: 'printer.weird' },
      { cond: { currentObj: ['q4', 'tung2'] }, dialogue: 'printer.weird2' },
      { cond: { currentObj: ['q4', 'printer3'] }, dialogue: 'printer.restart' },
      { cond: { currentObj: ['q4', 'nam'] }, dialogue: 'printer.beforeNam' },
      { dialogue: 'printer.idle' },
    ],
  },
  {
    id: 'myDesk',
    pos: [POS.myDesk.x, POS.myDesk.z - 0.25],
    radius: 1.5,
    label: [
      { cond: { questStarted: 'q5' }, text: 'ngồi vào bàn số 7' },
      { text: 'xem bàn làm việc số 7' },
    ],
    actions: [
      { cond: { currentObj: ['q5', 'minigame'] }, dialogue: 'desk.minigame' },
      { cond: { currentObj: ['q5', 'mai'] }, dialogue: 'desk.early' },
      { dialogue: 'desk.idle' },
    ],
  },
  {
    id: 'deskPhone',
    pos: [POS.deskPhone.x, POS.deskPhone.z + 0.3],
    radius: 1.4,
    label: [{ cond: { notFlag: 'phoneAnswered' }, text: 'nghe điện thoại đang reo' }, { text: 'xem điện thoại bàn' }],
    actions: [{ cond: { notFlag: 'phoneAnswered' }, dialogue: 'phone.call' }, { dialogue: 'phone.after' }],
  },
  {
    id: 'chair',
    pos: [-17.35, -19.2],
    radius: 1.3,
    label: [{ text: 'xoay ghế văn phòng' }],
    actions: [{ dialogue: 'chair.spin', effects: [{ event: 'chairSpin' }, { sfx: 'whoosh' }] }],
  },
  {
    id: 'longFile',
    pos: [-15.65, -6.9],
    radius: 1.3,
    label: [{ text: 'nhìn màn hình máy tính bên cạnh' }],
    actions: [{ dialogue: 'file.long' }],
  },
  {
    id: 'plant',
    pos: [-20.2, -4],
    radius: 1.4,
    label: [{ text: 'tưới cây kim tiền' }],
    actions: [{ dialogue: 'plant' }],
  },
  {
    id: 'clock',
    pos: [-20.3, -17.4],
    radius: 1.3,
    label: [{ text: 'nhìn đồng hồ treo tường' }],
    actions: [{ dialogue: 'clock' }],
  },
  {
    id: 'storageDoor',
    pos: [-4.6, -19],
    radius: 1.6,
    cond: { notFlag: 'storageOpen' },
    label: [{ text: 'mở cửa phòng kho' }],
    actions: [
      { cond: { hasCard: false }, dialogue: 'door.locked' },
      { effects: [{ setFlag: 'storageOpen' }, { sfx: 'door' }, { toast: 'Cửa phòng kho đã mở', icon: '🚪' }] },
    ],
  },
  // ---------- Phòng họp ----------
  {
    id: 'meetingBoard',
    pos: [7.4, -8],
    radius: 1.7,
    label: [{ text: 'đọc bảng ghi chú' }],
    actions: [{ dialogue: 'meetingBoard' }],
  },
  {
    id: 'meetingScreen',
    pos: [3.9, -13.3],
    radius: 1.8,
    label: [{ text: 'xem màn hình trình chiếu' }],
    actions: [{ dialogue: 'meetingScreen' }],
  },
  // ---------- Kho ----------
  {
    id: 'oldPhoto',
    pos: [POS.oldPhoto[0], -14.8],
    radius: 1.5,
    label: [{ text: 'xem bức ảnh cũ' }],
    actions: [{ dialogue: 'photo.old' }],
  },
  {
    id: 'micBox',
    pos: [-2.6, -16.2],
    radius: 1.5,
    label: [{ text: 'lục hộp thiết bị' }],
    actions: [{ cond: q7Open('mic'), dialogue: 'mic.take' }, { dialogue: 'mic.early' }],
  },
  {
    id: 'server',
    pos: [5.5, -22.6],
    radius: 1.7,
    label: [{ text: 'nhìn tủ server' }],
    actions: [{ dialogue: 'server' }],
  },
  // ---------- Pantry ----------
  {
    id: 'fridge',
    pos: [POS.fridge[0], 12.7],
    radius: 1.5,
    label: [{ text: 'mở tủ lạnh' }],
    actions: [{ cond: { questActive: 'q6', notClue: 'cake_fridge' }, dialogue: 'fridge.cake' }, { dialogue: 'fridge.idle' }],
  },
  {
    id: 'coffee',
    pos: [17.9, POS.coffee[1]],
    radius: 1.5,
    label: [{ text: 'dùng máy pha cà phê' }],
    actions: [{ dialogue: 'coffee' }],
  },
  {
    id: 'menuBoard',
    pos: [13, 13.2],
    radius: 1.6,
    label: [{ text: 'xem thực đơn hôm nay' }],
    actions: [{ dialogue: 'menu' }],
  },
  // ---------- Hội trường ----------
  {
    id: 'banner',
    pos: [POS.banner[0], -18.4],
    radius: 2.2,
    label: [{ cond: q7Open('banner'), text: 'xử lý băng rôn' }, { text: 'nhìn băng rôn' }],
    actions: [{ cond: q7Open('banner'), dialogue: 'banner.fix' }, { dialogue: 'banner.look' }],
  },
  {
    id: 'hallScreen',
    pos: [14.5, -16.1],
    radius: 1.5,
    label: [{ text: 'kiểm tra máy chiếu' }],
    actions: [{ cond: q7Open('screen'), dialogue: 'screen.check' }, { dialogue: 'screen.idle' }],
  },
  {
    id: 'djCase',
    pos: [19.4, -17.8],
    radius: 1.6,
    label: [{ text: 'xem thùng đồ bí ẩn cạnh sân khấu' }],
    actions: [{ dialogue: 'dj.case' }],
  },
  {
    id: 'cakeTable',
    pos: POS.cakeTable,
    radius: 1.5,
    label: [{ text: 'xem bàn tiệc' }],
    actions: [{ cond: { flag: 'cakeFound' }, dialogue: 'cake.look' }, { dialogue: 'cake.empty' }],
  },
];

export const INTER_MAP: Record<string, InteractDef> = Object.fromEntries(INTERACTABLES.map((i) => [i.id, i]));

export const ZONES: ZoneDef[] = [
  {
    id: 'lobbyEnter',
    rect: [-8, 2, 8, 13.4],
    cond: { questActive: 'q1', objDone: ['q1', 'talkGuard'] },
    effects: [{ obj: ['q1', 'enterLobby'] }],
    once: true,
  },
  {
    id: 'skipGate',
    rect: [-21, -24, 21, 14],
    cond: { questActive: 'q1', objNotDone: ['q1', 'talkGuard'] },
    effects: [{ obj: ['q1', 'talkGuard'] }, { obj: ['q1', 'enterLobby'] }],
    once: true,
  },
  {
    id: 'hallFirst',
    rect: [8, -24, 21, -3],
    cond: { questActive: 'q6', notFlag: 'hallVisited' },
    effects: [{ setFlag: 'hallVisited' }],
    dialogue: 'hall.firstLook',
    once: true,
  },
  {
    id: 'storageFirst',
    rect: [-4, -24, 8, -14],
    dialogue: 'storage.enter',
    once: true,
  },
];
