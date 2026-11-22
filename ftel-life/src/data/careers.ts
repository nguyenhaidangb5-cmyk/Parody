import type { Career } from '../game/types';

export const CAREERS: Record<Career, { name: string; icon: string; color: string; tagline: string; desc: string; mission: string }> = {
  sales: {
    name: 'Kinh doanh',
    icon: '💼',
    color: '#F37021',
    tagline: 'Nói ít hiểu nhiều, chốt đơn nhẹ nhàng',
    desc: 'Tư vấn gói Internet cho khách hàng. Kỹ năng chính: hỏi đúng câu, nghe đúng ý.',
    mission: 'Tư vấn gói cước cho anh Bình',
  },
  tech: {
    name: 'Kỹ thuật',
    icon: '🛠️',
    color: '#0A6FC2',
    tagline: 'Dây nào cũng nối được, trừ dây thần kinh',
    desc: 'Xử lý thiết bị mất kết nối. Kỹ năng chính: bình tĩnh và… khởi động lại.',
    mission: 'Nối lại đường mạng phòng họp',
  },
  care: {
    name: 'Chăm sóc khách hàng',
    icon: '🎧',
    color: '#18A558',
    tagline: 'Giọng ngọt như trà sữa, đầu lạnh như điều hòa',
    desc: 'Hỗ trợ khách phản ánh mạng chậm. Kỹ năng chính: lắng nghe, xác minh, hỗ trợ.',
    mission: 'Hỗ trợ chị Phượng báo mạng chậm',
  },
  mkt: {
    name: 'Marketing / Sự kiện',
    icon: '🎉',
    color: '#C2185B',
    tagline: 'Ý tưởng nhiều hơn số bóng bay',
    desc: 'Lên kế hoạch chương trình. Kỹ năng chính: sắp xếp hỗn loạn thành trình tự.',
    mission: 'Sắp xếp kế hoạch chương trình nội bộ',
  },
};
