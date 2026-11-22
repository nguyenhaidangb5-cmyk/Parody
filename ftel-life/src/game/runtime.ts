// ===== Trạng thái tần suất cao (không đi qua React để tránh re-render) =====
import type { Emote } from './types';

export const runtime = {
  player: { x: 0, y: 0, z: 38, rotY: Math.PI, speed: 0, running: false, vy: 0, grounded: true },
  camYaw: Math.PI, // hướng camera nhìn (yaw): PI => nhìn về -z
  camPitch: 0.32,
  camDist: 4.6,
  /** vị trí NPC hiện tại (cập nhật mỗi frame) */
  npcPos: {} as Record<string, { x: number; z: number; y: number }>,
  /** NPC đang nói chuyện với người chơi */
  talkingNpc: null as string | null,
  /** biểu cảm tạm thời của NPC */
  npcEmote: {} as Record<string, { emote: Emote; until: number }>,
  playerEmote: { emote: 'none' as Emote, until: 0 },
  insideBuilding: false,
  /** thời gian (giây) kể từ khi bắt đầu */
  time: 0,
  /** dịch chuyển tức thời (debug/test và tải game) */
  teleport: null as null | { x: number; z: number; rotY?: number },
  /** đối tượng tương tác gần nhất */
  nearest: null as null | { kind: 'npc' | 'inter'; id: string; label: string },
  fps: 60,
  drawCalls: 0,
  triangles: 0,
  /** dấu thời gian các sự kiện hình ảnh (xoay ghế, máy in chạy…) */
  events: {} as Record<string, number>,
};

export function setNpcEmote(npc: string, emote: Emote, seconds = 2.5) {
  runtime.npcEmote[npc] = { emote, until: runtime.time + seconds };
}
