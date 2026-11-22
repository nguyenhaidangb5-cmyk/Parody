import type { EndingId } from '../game/types';

export const ENDINGS: Record<
  EndingId,
  { title: string; subtitle: string; color: string; story: string[]; quotes: { who: string; text: string }[]; condition: string }
> = {
  A: {
    title: 'TÂN BINH XUẤT SẮC',
    subtitle: 'Ngày đầu tròn trịa – như một chiếc bánh kem có tem tài sản',
    color: '#18A558',
    story: [
      'Bạn đi qua một ngày đầy "năm phút" mà vẫn giữ được bình tĩnh, biết hỏi, biết giúp và biết làm việc cùng mọi người.',
      'Tối đó, nhóm chat "FTEL Team Siêu Nhân 🚀" nổ 99+ tin nhắn chúc mừng. Chị Mai ghim một tin: "Tân binh này giữ lại nha mọi người."',
    ],
    quotes: [
      { who: 'mai', text: 'Mai em vào sớm năm phút nha… Đùa thôi! Làm tốt lắm.' },
      { who: 'tung', text: '…Không cần khởi động lại em. Hiếm đó.' },
      { who: 'hanh', text: 'Chị đã ghi tên em vào sổ. Sổ người tốt.' },
    ],
    condition: 'Hợp tác tốt, chọn những cách xử lý hợp lý và ít quyết định kỳ quặc.',
  },
  B: {
    title: 'CHIẾN THẦN CHỮA CHÁY',
    subtitle: 'Không có lửa nào mà không dập được bằng một ý tưởng lạ',
    color: '#F37021',
    story: [
      'Chương trình suýt "cháy" ở mọi khâu, nhưng lần nào bạn cũng nghĩ ra một cách không ai ngờ tới – và nó chạy.',
      'Bắp đăng clip "Tân binh cứu cả hội trường trong 5 phút (thật ra là 2 tiếng)" lên fanpage. Bình luận đầu tiên: "Cho bạn này làm trưởng phòng đổi mới luôn đi."',
    ],
    quotes: [
      { who: 'bap', text: 'Anh có content cho cả năm rồi! Cảm ơn em!' },
      { who: 'nam', text: 'Băng rôn của anh chưa bao giờ ý nghĩa như vậy.' },
      { who: 'mai', text: 'Lần sau có việc gấp chị gọi em đầu tiên nha. Năm phút thôi!' },
    ],
    condition: 'Thường xuyên chọn giải pháp sáng tạo (Đổi mới cao hơn Đồng đội).',
  },
  C: {
    title: 'NGÀY ĐẦU HUYỀN THOẠI',
    subtitle: 'Không ai quên được ngày hôm nay. Kể cả khi họ rất muốn quên',
    color: '#9c36b5',
    story: [
      'Từ câu trả lời phỏng vấn đến băng rôn trên sân khấu, bạn đã biến ngày đầu đi làm thành một sự kiện mà cả công ty sẽ kể lại suốt mười năm.',
      'Chị Linh lấy các câu trả lời phỏng vấn của bạn làm slide đào tạo, mục "Những tình huống thú vị". Chú Tư ghi tên bạn vào sổ – với ba dấu chấm than.',
    ],
    quotes: [
      { who: 'linh', text: 'Năm sau phỏng vấn, chị sẽ hỏi ứng viên: "Em có biết anh chị {name} không?"' },
      { who: 'duc', text: 'Hôm nay tôi quên nhìn đồng hồ. Vì em.' },
      { who: 'thu', text: 'Con này lạ ghê. Mà cô thương.' },
    ],
    condition: 'Chọn nhiều quyết định kỳ quặc (chỉ số "Kỳ quặc" ẩn ≥ 6).',
  },
  SECRET: {
    title: 'BÍ MẬT CỦA CHÚ TƯ',
    subtitle: 'Nhân viên số 0001 – DJ Tư – trở lại sau 20 năm',
    color: '#0A6FC2',
    story: [
      'Bạn là người đầu tiên ghép đủ các mảnh: tủ cúp, bức ảnh 1998, mật khẩu Wi-Fi, thùng đồ DJ… Chú Tư – bảo vệ – chính là nhân viên đầu tiên của công ty.',
      'Đêm đó DJ Tư mở nhạc tới 21 giờ. Anh Đức không về. Chị Hạnh nhảy. Anh Tùng… khởi động lại bàn mixer hai lần, và cả hai lần đều hiệu quả.',
      'Sáng hôm sau, chú Tư vẫn đứng ở cổng: "Thẻ đâu con?" – nhưng lần này, chú nháy mắt.',
    ],
    quotes: [
      { who: 'tu', text: 'Ngày đầu đi làm của ai cũng nên có người chào mừng. Kể cả khi người đó phải tự chuẩn bị.' },
      { who: 'thu', text: 'Hai mươi năm rồi mới thấy ông già đó cười như vậy.' },
      { who: 'tung', text: 'Mật khẩu Wi-Fi vẫn không đổi. Giờ thì em hiểu vì sao.' },
    ],
    condition: 'Tìm được ít nhất 4/6 bí mật về chú Tư và mời chú lên sân khấu ở cảnh cuối.',
  },
};

export const ACHIEVEMENTS: Record<string, { name: string; icon: string; desc: string }> = {
  restart_master: { name: 'Thần chưởng khởi động lại', icon: '🔄', desc: 'Sửa máy in bằng tuyệt kỹ của anh Tùng.' },
  career_done: { name: 'Năm phút của trưởng nhóm', icon: '⏱️', desc: 'Hoàn thành nhiệm vụ nghề nghiệp.' },
  detective: { name: 'Thám tử bánh kem', icon: '🕵️', desc: 'Tìm ra thủ phạm thật sự của vụ bánh kem.' },
  coffee_friend: { name: 'Bạn tâm giao của máy pha cà phê', icon: '☕', desc: 'Lắng nghe một chiếc máy pha cà phê.' },
  pho: { name: 'Tổng đài phở', icon: '🍜', desc: 'Nhận đơn phở qua điện thoại công ty.' },
  elevator: { name: 'Tầng 48', icon: '🛗', desc: 'Kiên nhẫn chờ thang máy ở tòa nhà một tầng.' },
  cat_slide: { name: 'Nghệ sĩ trình chiếu', icon: '🐱', desc: 'Biến màn chiếu chào mừng thành ảnh mèo.' },
  secret_hunter: { name: 'Kẻ săn bí mật', icon: '🎧', desc: 'Khám phá bí mật của chú Tư.' },
};

export const SECRET_CLUES: Record<string, string> = {
  tu_1: 'Chú Tư làm ở đây "lâu hơn cả tòa nhà"',
  tu_2: 'Tủ cúp: "MC xuất sắc" nhiều năm – T. TƯ',
  tu_3: 'Ảnh 1998: chàng trai ria mép tự treo băng rôn "CHÀO MỪNG TÔI"',
  tu_4: 'Cô Thu: chú Tư từng là MC bá đạo nhất công ty',
  tu_5: 'Thùng đồ "TÀI SẢN CỦA DJ TƯ – CẤM ĐỤNG"',
  tu_6: 'Mật khẩu Wi-Fi: ChuTuDepTrai1998',
};

export const CAKE_CLUES: Record<string, string> = {
  cake_fridge: 'Tủ lạnh: tem tài sản và dấu giày đế răng cưa',
  cake_nam: 'Nam thấy người áo xanh sọc vàng ôm hộp ra cổng',
  cake_bap: 'Ảnh của Bắp: ống tay áo xanh sọc vàng',
  cake_hanh: 'Chị Hạnh đã kiểm kê bánh lúc 13:45',
  cake_tu: 'Vệt kem trên tay áo chú Tư',
  cake_booth: 'Sổ trực: "vật phẩm quan trọng" được cất vào tủ lạnh bốt',
};
