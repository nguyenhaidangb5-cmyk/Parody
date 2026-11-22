// ===== Bố cục bản đồ (dùng chung cho dựng cảnh 3D, va chạm và minimap) =====
// Trục: x sang phải (đông), z hướng về phía cổng (nam). Người chơi đi từ cổng (z ~ 39) vào tòa nhà (z < 14).

export const WALL_H = 3.2;
export const WALL_T = 0.25;

export const BUILDING = { minX: -21, maxX: 21, minZ: -24, maxZ: 14 };
export const WORLD = { minX: -34, maxX: 34, minZ: -30, maxZ: 46 };

export interface WallDef {
  /** 'x' = tường chạy dọc trục x tại z=at; 'z' = tường chạy dọc trục z tại x=at */
  axis: 'x' | 'z';
  at: number;
  from: number;
  to: number;
  gaps: [number, number][];
  ext?: boolean;
  /** các đoạn là vách kính */
  glass?: [number, number][];
  color?: string;
}

export const WALLS: WallDef[] = [
  // tường ngoài
  { axis: 'x', at: 14, from: -21, to: 21, gaps: [[-2, 2]], ext: true },
  { axis: 'x', at: -24, from: -21, to: 21, gaps: [], ext: true },
  { axis: 'z', at: -21, from: -24, to: 14, gaps: [], ext: true },
  { axis: 'z', at: 21, from: -24, to: 14, gaps: [], ext: true },
  // dãy phòng phía trước | hành lang
  { axis: 'x', at: 2, from: -21, to: 21, gaps: [[-15, -13], [-6, 6], [13, 15]], color: '#f4efe6' },
  { axis: 'z', at: -8, from: 2, to: 14, gaps: [], glass: [[8.2, 13.2]], color: '#f4efe6' },
  { axis: 'z', at: 8, from: 2, to: 14, gaps: [], color: '#f4efe6' },
  // hành lang | dãy phòng phía sau
  { axis: 'x', at: -3, from: -21, to: 21, gaps: [[-12, -9], [1, 3], [12, 16]], glass: [[-3.6, 0.8], [3.2, 7.6]], color: '#f4efe6' },
  { axis: 'z', at: -4, from: -24, to: -3, gaps: [[-20, -18]], color: '#eef2f6' },
  { axis: 'z', at: 8, from: -24, to: -3, gaps: [], color: '#eef2f6' },
  { axis: 'x', at: -14, from: -4, to: 8, gaps: [], color: '#eef2f6' },
];

export interface RoomDef {
  id: string;
  name: string;
  rect: [number, number, number, number];
  floor: 'lobby' | 'wood' | 'carpet' | 'tile' | 'concrete' | 'hall' | 'carpetBlue';
}

export const ROOMS: RoomDef[] = [
  { id: 'lobby', name: 'Sảnh chính', rect: [-8, 2, 8, 14], floor: 'lobby' },
  { id: 'interview', name: 'Phòng phỏng vấn', rect: [-21, 2, -8, 14], floor: 'wood' },
  { id: 'pantry', name: 'Pantry', rect: [8, 2, 21, 14], floor: 'tile' },
  { id: 'corridor', name: 'Hành lang', rect: [-21, -3, 21, 2], floor: 'lobby' },
  { id: 'office', name: 'Văn phòng mở', rect: [-21, -24, -4, -3], floor: 'carpet' },
  { id: 'meeting', name: 'Phòng họp', rect: [-4, -14, 8, -3], floor: 'carpetBlue' },
  { id: 'storage', name: 'Kho & Server', rect: [-4, -24, 8, -14], floor: 'concrete' },
  { id: 'hall', name: 'Hội trường', rect: [8, -24, 21, -3], floor: 'hall' },
];

// Cụm bàn văn phòng: [cx, cz]
export const DESK_CLUSTERS: [number, number][] = [
  [-16.5, -8],
  [-9.5, -8],
  [-16.5, -14],
  [-9.5, -14],
];

/** vị trí ghế (người ngồi) của bàn i trong cụm: 0..3 */
export function deskSeat(cluster: number, i: number): { x: number; z: number; rot: number } {
  const [cx, cz] = DESK_CLUSTERS[cluster];
  const sx = i % 2 === 0 ? -0.85 : 0.85;
  const front = i < 2; // ghế phía +z
  return { x: cx + sx, z: cz + (front ? 1.25 : -1.25), rot: front ? Math.PI : 0 };
}

export const POS = {
  start: [0, 39] as [number, number],
  guard: [4.9, 35.4] as [number, number],
  booth: [7.2, 32.4] as [number, number],
  kiosk: [7.3, 6.5] as [number, number],
  reception: [0, 6.4] as [number, number],
  printer: [-4.75, -6.8] as [number, number],
  fridge: [16.6, 13.35] as [number, number],
  coffee: [18.5, 5.6] as [number, number],
  counterX: 18.6,
  stage: { x0: 10, x1: 19, z0: -24, z1: -19.5, h: 0.5 },
  storageDoor: { x: -4, z0: -20, z1: -18 },
  hallScreen: [14.5, -23.8] as [number, number],
  banner: [14.5, -19.7] as [number, number],
  djCase: [19.75, -18.3] as [number, number],
  cakeTable: [10.9, -17.6] as [number, number],
  micBox: [-2.9, -16.2] as [number, number],
  oldPhoto: [1.5, -14.25] as [number, number],
  myDesk: deskSeat(2, 1),
  deskPhone: deskSeat(3, 2),
  clock: [-20.8, -16] as [number, number],
};
