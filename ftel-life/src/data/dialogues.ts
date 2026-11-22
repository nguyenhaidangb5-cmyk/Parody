// ===== Kịch bản hội thoại (data-driven) =====
// Mỗi chuỗi: chain(id, [[người nói, lời thoại, {tùy chọn}], ...], {thuộc tính cho câu cuối}).
// Câu i>0 có id dạng `${id}#i`. Lựa chọn (choices) trỏ tới id chuỗi khác qua `to`.
// who: id NPC | 'player' | 'narrator' | '#Tên đồ vật'
import type { DNode, TextSpec } from '../game/types';

export const DIALOGUES: Record<string, DNode> = {};

type Line = [string, TextSpec, Partial<DNode>?];

function chain(id: string, lines: Line[], last?: Partial<DNode>) {
  let lastId = id;
  lines.forEach((l, i) => {
    const nid = i === 0 ? id : `${id}#${i}`;
    const next = i < lines.length - 1 ? `${id}#${i + 1}` : undefined;
    if (DIALOGUES[nid]) console.error('[dialogue] trùng id', nid);
    DIALOGUES[nid] = { who: l[0], text: l[1], next, ...(l[2] ?? {}) };
    lastId = nid;
  });
  if (last) Object.assign(DIALOGUES[lastId], last);
}

const N = 'narrator';
const P = 'player';

// =====================================================================
// CẢNH 1 – CHÚ TƯ Ở CỔNG
// =====================================================================
chain('tu.intro', [['tu', 'Ê ê, đứng lại! Con kia, thẻ nhân viên đâu?', { emote: 'surprised' }]], {
  choices: [
    {
      text: 'Dạ, em là nhân viên mới.',
      to: 'tu.introA',
      effects: [{ decision: 'gate', text: 'Tự tin xưng "nhân viên mới" khi chưa phỏng vấn' }],
    },
    {
      text: 'Dạ, em vào phỏng vấn.',
      to: 'tu.introB',
      effects: [{ stat: 'tonTrong', add: 1 }, { decision: 'gate', text: 'Thật thà khai báo đi phỏng vấn' }],
    },
    {
      text: 'Dạ, em tưởng hôm nay được làm việc tại nhà.',
      to: 'tu.introC',
      effects: [{ stat: 'kyQuac', add: 1 }, { decision: 'gate', text: 'Tưởng ngày đầu được làm việc tại nhà' }],
    },
  ],
});
chain('tu.introA', [
  ['tu', 'Nhân viên mới mà chưa có thẻ? Năm nào cũng có một đứa nói câu này. Và năm nào chú cũng tin.', { emote: 'think' }],
], { next: 'tu.name' });
chain('tu.introB', [
  ['tu', 'Phỏng vấn hả? Áo phẳng, giày sạch, mặt hơi run… Ừ, đúng là đi phỏng vấn thiệt rồi.', { emote: 'happy' }],
], { next: 'tu.name' });
chain('tu.introC', [
  ['tu', 'Làm việc tại nhà? Vậy sao con đứng ở nhà… của chú?', { emote: 'confused' }],
  ['tu', 'Thôi, ai đi tới tận cổng thì cũng là có lòng. Nhưng phải khai báo đàng hoàng.'],
], { next: 'tu.name' });
chain('tu.name', [
  ['tu', 'Tên gì? Để chú ghi vô sổ.'],
  [N, 'Chú Tư lật một cuốn sổ cũ mèm, ghi tên bạn bằng chữ in hoa rất to: {name}. Rồi gạch chân. Hai lần.'],
  ['tu', '{name}… Ừ. Tên này chiều nay chắc còn nghe nhiều.', { emote: 'happy' }],
], {
  choices: [
    { text: 'Sao chú biết chiều nay còn nghe ạ?', to: 'tu.why' },
    { text: 'Chú làm ở đây lâu chưa ạ?', to: 'tu.howlong', cond: { notClue: 'tu_1' } },
    { text: 'Dạ cảm ơn chú, em vào đây.', to: 'tu.open' },
  ],
});
chain('tu.why', [
  ['tu', 'Ở cái tòa nhà này, không có chuyện gì mà bảo vệ không biết trước. Chỉ có chuyện bảo vệ không được nói thôi.', { emote: 'think' }],
], { next: [{ cond: { questActive: 'q1' }, to: 'tu.open' }] });
chain('tu.howlong', [
  ['tu', 'Lâu hơn cái tòa nhà này.'],
  [P, 'Dạ… tòa nhà này xây năm 2015 mà chú?', { emote: 'confused' }],
  ['tu', 'Thì đó. Chú làm từ hồi công ty còn là một căn phòng thuê, có một cái quạt máy, ba cái máy tính và một con mèo.', { effects: [{ clue: 'tu_1' }] }],
  ['tu', 'Con mèo giờ làm trưởng phòng ở đâu đó rồi. Chú thì vẫn ở đây.'],
], { next: [{ cond: { questActive: 'q1' }, to: 'tu.open' }] });
chain('tu.open', [
  ['tu', 'Rồi, chú mở barie. Vô sảnh gặp lễ tân, phòng phỏng vấn ở phía tay trái. Nhớ: đừng quẹo vô pantry. Cô Thu mà mời ăn là trễ phỏng vấn đó!', {
    effects: [{ setFlag: 'gateOpen' }, { sfx: 'door' }, { obj: ['q1', 'talkGuard'] }],
  }],
]);
chain('tu.idle', [
  ['tu', { default: 'Chưa có thẻ thì đi đâu cũng phải chào chú một tiếng nha.' }, {
    next: [{ cond: { hasCard: true }, to: 'tu.idleCard' }, { to: 'tu.idleMenu' }],
  }],
]);
chain('tu.idleCard', [['tu', 'Có thẻ rồi đó hả? Đeo vô cho người ta biết mình là người nhà.', { emote: 'happy' }]], { next: 'tu.idleMenu' });
chain('tu.idleMenu', [['tu', 'Có chuyện gì không con?']], {
  choices: [
    { text: 'Chú làm ở đây lâu chưa ạ?', to: 'tu.howlong', cond: { notClue: 'tu_1' } },
    { text: 'Chú có biết gì về chương trình chiều nay không?', to: 'tu.secretive' },
    { text: 'Dạ không có gì, em chào chú.' },
  ],
});
chain('tu.secretive', [
  ['tu', 'Chương trình gì? Chú không biết. Chú chỉ biết từ sáng tụi nó khiêng ba chục trái bóng bay, một cái băng rôn, với một cái bánh…', { emote: 'think' }],
  ['tu', 'Cái bánh thì chú không biết. Không có cái bánh nào hết. Đi làm đi con.', { emote: 'surprised' }],
]);
chain('tu.q6', [
  ['tu', 'Bánh? Bánh gì? Chú không biết bánh nào hết. Chú đang… trực.', { emote: 'confused' }],
  [N, 'Chú Tư đứng chắn trước cửa bốt bảo vệ, kỹ một cách đáng ngờ. Trên tay áo đồng phục xanh có một vệt kem trắng.', { effects: [{ clue: 'cake_tu' }] }],
]);
chain('tu.q7', [['tu', 'Bận hả? Chiều nào ở đây cũng có một vụ "năm phút". Chú đếm rồi, kỷ lục là ba tiếng rưỡi.']], {
  choices: [
    { text: 'Chú có vào hội trường dự chương trình không?', to: 'tu.q7dj' },
    { text: 'Dạ em đi tiếp đây.' },
  ],
});
chain('tu.q7dj', [
  ['tu', 'Chú hả? Chú phải gác cổng. Mà nếu có ai hỏi về… DJ, thì nói chú không biết gì hết nha.', { emote: 'think' }],
  [P, 'DJ nào ạ?'],
  ['tu', 'Thấy chưa, con cũng không biết. Tốt.', { emote: 'happy' }],
]);

// =====================================================================
// LỄ TÂN VY
// =====================================================================
chain('vy.talk', [
  ['vy', 'Xin chào, FTEL xin nghe… à nhầm, chào bạn!', {
    next: [
      { cond: { questActive: 'q2' }, to: 'vy.q2' },
      { cond: { questActive: 'q3' }, to: 'vy.q3' },
      { cond: { any: [{ questActive: 'q6' }, { questActive: 'q7' }] }, to: 'vy.late' },
      { to: 'vy.idle' },
    ],
  }],
]);
chain('vy.q2', [['vy', 'Bạn là… {name} đúng không? Chị nghe tên bạn nhiều lắm từ sáng rồi!', { emote: 'happy' }]], {
  choices: [
    { text: 'Ơ, sao mọi người biết tên em?', to: 'vy.q2why' },
    { text: 'Phòng phỏng vấn ở đâu ạ?', to: 'vy.q2where' },
  ],
});
chain('vy.q2why', [
  ['vy', 'À… ờ… vì… danh sách phỏng vấn! Đúng rồi, danh sách phỏng vấn. Không phải danh sách nào khác đâu!', { emote: 'surprised' }],
], { next: 'vy.q2where' });
chain('vy.q2where', [['vy', 'Bạn ra hành lang phía sau, quẹo trái, cửa đầu tiên. Chị Linh đang chờ đó.']]);
chain('vy.q3', [['vy', 'Máy cấp thẻ hả? Nó hơi… có cá tính. Tuần trước nó cấp cho anh Huy cái thẻ ghi "Ngân hàng Nhà nước".']]);
chain('vy.late', [['vy', 'Chiều nay chị trực điện thoại. Mười cuộc thì chín cuộc hỏi "có phải tiệm phở không em". Cuộc còn lại hỏi mật khẩu Wi-Fi.']]);
chain('vy.idle', [['vy', 'Chúc bạn một ngày làm việc vui vẻ! Lạc đường thì cứ đi theo mũi tên dưới sàn… à, mình chưa dán mũi tên.', { emote: 'happy' }]]);

// =====================================================================
// CẢNH 2 – PHỎNG VẤN VỚI CHỊ LINH
// =====================================================================
chain('linh.early', [['linh', 'Ơ, em vào tới đây rồi hả? Em chưa chào chú Tư ngoài cổng à? Chú sẽ… rất tổn thương đó.', { emote: 'surprised' }]]);
chain('linh.interview', [
  ['linh', 'Chào {name}! Mời em ngồi. Chị là Linh, bên Nhân sự. Đừng run nha, phỏng vấn ở đây vui lắm. Chỉ có… vài câu hỏi thôi.', { emote: 'happy' }],
  ['linh', 'Câu đầu tiên: Công ty mình làm viễn thông, nhịp độ nhanh, cần người chịu được áp lực. Em nghĩ sao?'],
], {
  choices: [
    { text: 'Dạ, em sẵn sàng học hỏi.', to: 'linh.q1a', effects: [{ stat: 'guongMau', add: 1 }, { decision: 'iv1', text: 'Phỏng vấn: "Em sẵn sàng học hỏi" – chuẩn sách giáo khoa' }] },
    { text: 'Áp lực có được tính OT không ạ?', to: 'linh.q1b', effects: [{ stat: 'kyQuac', add: 1 }, { setFlag: 'askedOT' }, { decision: 'iv1', text: 'Phỏng vấn: hỏi áp lực có được tính OT không' }] },
    { text: 'Em chịu được, miễn là máy tính không bị treo.', to: 'linh.q1c', effects: [{ setFlag: 'fearsFreeze' }, { decision: 'iv1', text: 'Phỏng vấn: chịu được áp lực, trừ máy treo' }] },
  ],
});
chain('linh.q1a', [['linh', 'Chuẩn sách giáo khoa! Chị ghi: "Ứng viên có đọc sách giáo khoa." Đùa thôi, tốt lắm.', { emote: 'happy' }]], { next: 'linh.q2' });
chain('linh.q1b', [
  ['linh', '…', { emote: 'surprised' }],
  ['linh', 'Câu hỏi rất thực tế. Chị ghi lại để… tham khảo. Em yên tâm, ở đây quy định rõ ràng lắm. Chỉ có deadline là không rõ ràng thôi.'],
], { next: 'linh.q2' });
chain('linh.q1c', [['linh', 'Ha! Em sẽ hợp với anh Tùng bên IT lắm. Ảnh có một câu thần chú cho mọi loại máy treo.', { emote: 'happy' }]], { next: 'linh.q2' });
chain('linh.q2', [['linh', 'Câu thứ hai: Đồng nghiệp nhờ em một việc "chỉ mất năm phút", nhưng em đang dở việc của mình. Em làm gì?']], {
  choices: [
    { text: 'Hỏi rõ là việc gì, rồi sắp xếp thời gian giúp.', to: 'linh.q2a', effects: [{ stat: 'sangSuot', add: 1 }, { stat: 'dongDoi', add: 1 }] },
    { text: 'Giúp ngay! Năm phút thôi mà.', to: 'linh.q2b', effects: [{ stat: 'dongDoi', add: 1 }] },
    { text: 'Đề xuất làm một công cụ tự động để lần sau khỏi phải nhờ.', to: 'linh.q2c', effects: [{ stat: 'doiMoi', add: 1 }] },
  ],
});
chain('linh.q2a', [['linh', 'Rất tốt. Hỏi rõ trước khi nhận là kỹ năng sinh tồn số một ở công sở.', { emote: 'happy' }]], { next: 'linh.q3' });
chain('linh.q2b', [['linh', 'Tinh thần đồng đội cao đó. Chị chỉ lo… "năm phút" ở đây đơn vị không phải là phút.', { emote: 'think' }]], { next: 'linh.q3' });
chain('linh.q2c', [['linh', 'Ồ, đổi mới ghê! Chị thích. Nhớ làm xong công cụ trước khi nghỉ hưu nha.', { emote: 'happy' }]], { next: 'linh.q3' });
chain('linh.q3', [['linh', 'Câu cuối: Theo em, điều gì quan trọng nhất trong ngày đầu đi làm?']], {
  choices: [
    { text: 'Lắng nghe và làm quen với mọi người.', to: 'linh.q3a', effects: [{ stat: 'tonTrong', add: 1 }] },
    { text: 'Biết chỗ để xe và nhà vệ sinh.', to: 'linh.q3b', effects: [{ stat: 'sangSuot', add: 1 }, { stat: 'kyQuac', add: 1 }] },
    { text: 'Gây ấn tượng thật mạnh!', to: 'linh.q3c', effects: [{ stat: 'kyQuac', add: 1 }] },
  ],
});
chain('linh.q3a', [['linh', 'Đúng vậy. Ở đây mỗi người là một cuốn sách. Có cuốn hơi dày, có cuốn hơi… khó đọc. Như chú Tư.', { emote: 'happy' }]], { next: 'linh.result' });
chain('linh.q3b', [['linh', 'Câu trả lời thực tế nhất chị từng nghe. Chị cộng cho em điểm "sinh tồn".', { emote: 'happy' }]], { next: 'linh.result' });
chain('linh.q3c', [['linh', 'Ấn tượng mạnh thì… em làm được rồi đó.', { emote: 'confused' }]], { next: 'linh.result' });
chain('linh.result', [['linh', 'Chúc mừng {name}! Em đã chính thức được nhận!', { emote: 'happy', effects: [{ sfx: 'success' }] }]], {
  choices: [
    { text: 'Nhanh vậy ạ?!', to: 'linh.fast' },
    { text: 'Em biết mà!', to: 'linh.confident' },
  ],
});
chain('linh.fast', [
  ['linh', 'Ừ, quy trình bên chị tối ưu lắm. Với lại… chiều nay cần có em. À không! Ý chị là công ty cần người!', { emote: 'surprised' }],
], { next: 'linh.careerIntro' });
chain('linh.confident', [['linh', 'Tự tin ghê! Chị thích.', { emote: 'happy' }]], { next: 'linh.careerIntro' });
chain('linh.careerIntro', [
  ['linh', 'Giờ em chọn vị trí muốn thử sức nhé. Mỗi nghề sẽ có một nhiệm vụ riêng trong chiều nay.', {
    effects: [{ obj: ['q2', 'interview'] }, { open: 'careerSelect' }],
  }],
]);
chain('linh.careerAgain', [['linh', 'Em chọn nghề chưa? Đừng lo, chọn sai thì… thôi, cứ chọn đi đã.', { effects: [{ open: 'careerSelect' }] }]]);
chain('linh.afterCareer', [
  ['linh', {
    default: 'Lựa chọn hay đó!',
    sales: 'Kinh doanh! Em sẽ là người khiến khách hàng nói "dạ được" mà không hiểu vì sao.',
    tech: 'Kỹ thuật! Chào mừng em đến với thế giới của dây mạng, modem và câu hỏi "khởi động lại chưa?".',
    care: 'Chăm sóc khách hàng! Em sẽ là giọng nói dịu dàng nhất trong những ngày mạng chập chờn nhất.',
    mkt: 'Marketing – Sự kiện! Em sẽ được làm việc với Bắp. Chúc em… may mắn.',
  }, { emote: 'happy' }],
  ['linh', 'Ở đây có sáu giá trị: Tôn trọng, Đổi mới, Đồng đội, Chí công, Gương mẫu, Sáng suốt. Chị không bắt em học thuộc đâu. Mọi người sẽ tự thấy qua cách em làm việc.'],
  ['linh', 'Giờ em ra sảnh lấy thẻ nhân viên ở máy cấp thẻ nhé. À, 17 giờ chiều nay có chương trình ở hội trường. Danh sách có tên em rồi đó.', {
    effects: [{ obj: ['q2', 'career'] }],
  }],
], {
  choices: [
    { text: 'Chương trình gì vậy chị?', to: 'linh.secret' },
    { text: 'Dạ em nhớ rồi ạ.' },
  ],
});
chain('linh.secret', [
  ['linh', 'Bí… à, chương trình nội bộ thôi! Bình thường lắm. Không có gì đặc biệt. Tuyệt đối không có bánh.', { emote: 'surprised' }],
]);
chain('linh.q3card', [['linh', 'Máy cấp thẻ lỗi hả? Em tìm anh Tùng IT ở góc trong cùng văn phòng mở. Nhớ đừng nói "em thử rồi" nếu em chưa thử. Ảnh biết đó.']]);
chain('linh.q7', [['linh', 'Hội trường đang chuẩn bị hả? Ờ… chị không biết gì đâu. Chị chỉ… lên danh sách khách mời. Có một khách. Thôi em làm tiếp đi!', { emote: 'surprised' }]]);
chain('linh.idle', [['linh', 'Ngày đầu thế nào rồi {name}? Có ai nhờ em "năm phút" chưa?']], {
  choices: [
    { text: 'Có ạ, nhiều lắm.', to: 'linh.idleYes' },
    { text: 'Chưa ạ.', to: 'linh.idleNo' },
  ],
});
chain('linh.idleYes', [['linh', 'Chúc mừng, em đã chính thức hòa nhập.', { emote: 'happy' }]]);
chain('linh.idleNo', [['linh', 'Đợi tới 16 giờ 59 nha.', { emote: 'think' }]]);

// =====================================================================
// CẢNH 3 – THẺ NHÂN VIÊN
// =====================================================================
chain('kiosk.early', [['#Máy cấp thẻ', 'XIN CHÀO. VUI LÒNG PHỎNG VẤN TRƯỚC KHI ĐƯỢC TỒN TẠI.']]);
chain('kiosk.error', [
  ['#Máy cấp thẻ', 'ĐANG QUÉT KHUÔN MẶT… ████████ 100%', { effects: [{ sfx: 'boot' }] }],
  ['#Máy cấp thẻ', 'LỖI 404: NHÂN VIÊN KHÔNG TỒN TẠI.', { effects: [{ sfx: 'error' }] }],
  [P, 'Ơ… em đứng ngay đây mà.', { emote: 'confused' }],
  ['#Máy cấp thẻ', 'ĐỀ NGHỊ: LIÊN HỆ BỘ PHẬN IT. HOẶC TỰ CHỨNG MINH SỰ TỒN TẠI CỦA BẠN.'],
], {
  choices: [
    { text: 'Đi tìm bộ phận IT.', effects: [{ obj: ['q3', 'kiosk'] }] },
    { text: 'Vẫy tay thật mạnh trước camera.', to: 'kiosk.wave', effects: [{ stat: 'kyQuac', add: 1 }] },
  ],
});
chain('kiosk.wave', [
  ['#Máy cấp thẻ', 'PHÁT HIỆN CHUYỂN ĐỘNG. CÓ THỂ LÀ MỘT CÁI CÂY. VẪN KHÔNG TỒN TẠI.', { effects: [{ obj: ['q3', 'kiosk'] }] }],
]);
chain('kiosk.errorAgain', [['#Máy cấp thẻ', 'VẪN KHÔNG TỒN TẠI. ĐỪNG BUỒN, AI CŨNG TỪNG NHƯ VẬY VÀO NGÀY ĐẦU.']]);
chain('kiosk.restart', [
  [N, 'Bạn tìm thấy nút nguồn phía sau máy, ngay cạnh tờ giấy dán: "ĐỪNG BẤM NÚT NÀY – Tùng".'],
], {
  choices: [
    { text: 'Bấm nút (anh Tùng bảo bấm mà).', to: 'kiosk.boot' },
    { text: 'Kiểm tra dây nguồn đã cắm chắc chưa rồi mới bấm.', to: 'kiosk.boot', effects: [{ stat: 'sangSuot', add: 1 }] },
    { text: 'Thì thầm với máy: "Làm ơn hoạt động đi mà…"', to: 'kiosk.boot', effects: [{ stat: 'kyQuac', add: 1 }] },
  ],
});
chain('kiosk.boot', [
  ['#Máy cấp thẻ', 'ĐANG KHỞI ĐỘNG LẠI… CẬP NHẬT 1/47… CẬP NHẬT 47/47…', { effects: [{ sfx: 'boot' }] }],
  ['#Máy cấp thẻ', 'XIN CHÀO {name}. BẠN ĐÃ TỒN TẠI. CHÚC MỪNG!', { effects: [{ sfx: 'success' }] }],
  [N, 'Máy nhả ra một chiếc thẻ còn ấm. Ảnh trên thẻ là bạn… đang chớp mắt.', {
    effects: [{ obj: ['q3', 'restart'] }, { open: 'card' }],
  }],
]);
chain('kiosk.done', [['#Máy cấp thẻ', 'BẠN ĐÃ CÓ THẺ. MỖI NGƯỜI CHỈ ĐƯỢC TỒN TẠI MỘT LẦN.']]);

chain('tung.card', [
  ['tung', '…', { next: [{ cond: { flag: 'fearsFreeze' }, to: 'tung.card#f' }, { to: 'tung.card#1' }] }],
  ['tung', 'Máy cấp thẻ hả. Em khởi động lại thử chưa?'],
], {
  choices: [
    { text: 'Dạ em thử rồi ạ.', to: 'tung.lie', effects: [{ decision: 'tung', text: 'Nói dối anh Tùng là "em thử rồi"' }] },
    { text: 'Khởi động lại… máy hay khởi động lại em ạ?', to: 'tung.joke', effects: [{ stat: 'kyQuac', add: 1 }, { decision: 'tung', text: 'Hỏi anh Tùng nên khởi động lại máy hay bản thân' }] },
    { text: 'Em kiểm tra dây nguồn trước được không anh?', to: 'tung.smart', effects: [{ stat: 'sangSuot', add: 1 }, { decision: 'tung', text: 'Đề xuất kiểm tra dây nguồn trước khi khởi động lại' }] },
  ],
});
DIALOGUES['tung.card#f'] = { who: 'tung', text: 'Nghe chị Linh nói em sợ máy treo. Đừng lo. Máy nào treo anh cũng xử được. Bằng một cách.', next: 'tung.card#1' };
chain('tung.lie', [
  ['tung', 'Em chưa thử.'],
  [P, 'Sao anh biết ạ?', { emote: 'surprised' }],
  ['tung', 'Vì nếu em thử rồi thì em đã không đứng đây.', { emote: 'think' }],
], { next: 'tung.restartTip' });
chain('tung.joke', [['tung', 'Cả hai đều hiệu quả. Nhưng làm với máy trước.']], { next: 'tung.restartTip' });
chain('tung.smart', [
  ['tung', '…', { emote: 'surprised' }],
  ['tung', 'Câu hỏi hay. Lần đầu có người hỏi lại anh.'],
  ['tung', 'À. Dây nguồn đang bị rút ra để cắm sạc điện thoại. Chắc là Bắp. Lúc nào cũng là Bắp.'],
], { next: 'tung.restartTip' });
chain('tung.restartTip', [
  ['tung', 'Ra sau máy, có nút nguồn. Bấm. Đợi. Đừng nói chuyện với nó trong lúc cập nhật, nó nhạy cảm.', { effects: [{ obj: ['q3', 'tung'] }] }],
]);

// =====================================================================
// CẢNH 4 – NAM VÀ MÁY IN
// =====================================================================
chain('nam.early', [
  ['nam', 'Ê chào, nhân viên mới hả? Anh là Nam! Có gì cứ hỏi anh, anh biết khoảng… 60% mọi chuyện ở đây.', { emote: 'happy' }],
  ['nam', 'Mà em có thẻ chưa? Chưa có thẻ thì máy in không nhận lệnh đâu. Nó phân biệt đối xử lắm.'],
]);
chain('nam.intro', [
  ['nam', 'A, {name}! Có thẻ rồi hả? Ảnh thẻ có hồn ghê, nhắm mắt mà vẫn sáng.', { emote: 'happy' }],
  ['nam', 'Nhân tiện, em in giúp anh tài liệu này được không? Năm phút thôi. Máy in ở góc kia kìa.'],
], {
  choices: [
    { text: 'Dạ được ạ, em đi in liền.', to: 'nam.introOk', effects: [{ stat: 'dongDoi', add: 1 }] },
    { text: 'File tên gì anh? Có phải bản cuối chưa?', to: 'nam.askFinal', effects: [{ stat: 'sangSuot', add: 1 }, { setFlag: 'askedFinal' }] },
    { text: 'Năm phút thật hay năm phút công sở ạ?', to: 'nam.fiveMin', effects: [{ stat: 'kyQuac', add: 1 }] },
  ],
});
chain('nam.askFinal', [['nam', 'Bản cuối chứ! Tên nó có chữ FINAL mà. Tin anh đi.', { emote: 'happy' }]], { next: 'nam.introOk' });
chain('nam.fiveMin', [['nam', '…Năm phút công sở. Nhưng là loại ngắn!', { emote: 'confused' }]], { next: 'nam.introOk' });
chain('nam.introOk', [
  ['nam', 'Anh gửi lệnh in rồi. Em ra lấy giúp anh nha. Anh phải ngồi đây… suy nghĩ chiến lược.', { effects: [{ obj: ['q4', 'nam'] }] }],
]);
chain('nam.waiting', [['nam', 'In xong chưa em? Không sao, cứ từ từ… mà nhanh nhanh xíu nha.']]);

chain('printer.beforeNam', [['#Máy in', 'KHÔNG CÓ LỆNH IN. TÔI ĐANG NGHỈ NGƠI. ĐỪNG LÀM PHIỀN.']]);
chain('printer.noPaper', [
  ['#Máy in', 'LỖI E-01: HẾT GIẤY.', { effects: [{ sfx: 'error' }] }],
  [N, 'Khay giấy trống trơn, chỉ có một tờ giấy nhớ: "Muốn lấy giấy A4, liên hệ chị Hạnh (Kế toán). CÓ KÝ NHẬN."', { effects: [{ obj: ['q4', 'printer1'] }] }],
]);
chain('printer.weird', [
  [N, 'Bạn nạp đúng 5 tờ giấy vào khay và bấm In.', { effects: [{ sfx: 'printer' }, { event: 'printer' }] }],
  ['#Máy in', 'Rè rè… rè rè… rè…'],
  ['#Máy in', 'LỖI E-99: MÁY IN ĐANG BUỒN. VUI LÒNG THỬ LẠI SAU.', { effects: [{ sfx: 'error' }] }],
  [P, 'Máy in… cũng biết buồn hả?', { emote: 'confused', effects: [{ obj: ['q4', 'printer2'] }] }],
]);
chain('printer.weird2', [['#Máy in', 'VẪN BUỒN. ĐỀ NGHỊ HỎI ANH TÙNG. ĐỪNG HỎI TÔI VÌ SAO.']]);
chain('printer.restart', [
  [N, 'Bạn giữ nút đỏ bên hông ba giây.'],
  ['#Máy in', 'QUẠC!', { effects: [{ sfx: 'error' }] }],
  [N, 'Đúng là tiếng vịt thật. Máy in rung lên, đèn xanh bật sáng.'],
  ['#Máy in', 'ĐÃ HẾT BUỒN. ĐANG IN: FINAL_CHOT_THAT_LAN_NAY_7.pdf (1/5)…', { effects: [{ sfx: 'printer' }, { event: 'printer' }, { achievement: 'restart_master' }] }],
  [N, 'Trang đầu tiên in ra: "KỊCH BẢN CHƯƠNG TRÌNH 17:00 – NHÂN VẬT TRUNG TÂM: TÂN BINH. Yêu cầu: giữ bí mật tuyệt đối."'],
], {
  choices: [
    { text: 'Gom tài liệu mang cho Nam.', effects: [{ obj: ['q4', 'printer3'] }] },
    { text: 'Đọc kỹ thêm trang 2 trước đã.', to: 'printer.page2', effects: [{ stat: 'sangSuot', add: 1 }] },
  ],
});
chain('printer.page2', [
  [N, 'Trang 2: "Bánh kem: cô Thu. Băng rôn: Nam. Âm thanh: Bắp. Ngân sách: chị Hạnh. Tân binh: ĐỪNG ĐỂ T…" – phần còn lại bị kẹt trong máy in.'],
  [P, 'Đừng để T… gì nhỉ? "Đừng để tân binh trễ giờ"? Chắc vậy.', { emote: 'think', effects: [{ setFlag: 'readPage2' }, { obj: ['q4', 'printer3'] }] }],
]);
chain('printer.idle', [
  ['#Máy in', '…', {
    next: [
      { cond: { notFlag: 'pj1' }, to: 'printer.j1' },
      { cond: { notFlag: 'pj2' }, to: 'printer.j2' },
      { cond: { notFlag: 'pj3' }, to: 'printer.j3' },
      { to: 'printer.j4' },
    ],
  }],
]);
chain('printer.j1', [['#Máy in', 'LỖI E-12: GIẤY QUÁ TRẮNG. VUI LÒNG DÙNG GIẤY BỚT TRẮNG HƠN.', { effects: [{ setFlag: 'pj1' }, { sfx: 'error' }] }]]);
chain('printer.j2', [['#Máy in', 'LỖI E-37: PHÁT HIỆN CÓ NGƯỜI ĐANG NHÌN TÔI. TÔI NGẠI.', { effects: [{ setFlag: 'pj2' }, { sfx: 'error' }] }]]);
chain('printer.j3', [['#Máy in', 'ĐANG IN "Báo cáo tổng kết năm 2019"… LỆNH NÀY ĐÃ CHỜ TỪ NĂM 2019. CẢM ƠN SỰ KIÊN NHẪN CỦA BẠN.', { effects: [{ setFlag: 'pj3' }, { sfx: 'printer' }, { event: 'printer' }] }]]);
chain('printer.j4', [
  ['#Máy in', 'LỖI E-404: KHÔNG TÌM THẤY LÝ DO ĐỂ IN. BẠN CÓ CHẮC TÀI LIỆU NÀY CẦN IN KHÔNG?', {
    effects: [{ clearFlag: 'pj1' }, { clearFlag: 'pj2' }, { clearFlag: 'pj3' }, { sfx: 'error' }],
  }],
]);

chain('hanh.paper', [
  ['hanh', 'Giấy A4 hả em? Có. Nhưng phải làm phiếu đề xuất.', { emote: 'think' }],
  [N, 'Chị Hạnh đưa bạn một tờ "Phiếu đề xuất sử dụng giấy A4". Phiếu được in trên… một tờ giấy A4.'],
], {
  choices: [
    { text: 'Dạ em điền đầy đủ và ký nhận ạ.', to: 'hanh.paperA', effects: [{ stat: 'guongMau', add: 1 }, { decision: 'paper', text: 'Điền phiếu xin giấy A4 đúng quy trình' }] },
    { text: 'Chị ơi, hay mình làm phiếu điện tử cho đỡ tốn giấy để xin giấy?', to: 'hanh.paperB', effects: [{ stat: 'doiMoi', add: 1 }, { decision: 'paper', text: 'Đề xuất phiếu xin giấy… điện tử' }] },
    { text: 'Em lấy tạm vài tờ, chiều em trả được không chị?', to: 'hanh.paperC', effects: [{ stat: 'kyQuac', add: 1 }, { decision: 'paper', text: 'Hứa "trả lại" giấy A4 đã in' }] },
  ],
});
chain('hanh.paperA', [['hanh', 'Tốt. Người làm đúng quy trình từ ngày đầu là người chị tin.', { emote: 'happy' }]], { next: 'hanh.paperGive' });
chain('hanh.paperB', [
  ['hanh', '…', { emote: 'surprised' }],
  ['hanh', 'Có lý. Chị sẽ đề xuất. Bằng phiếu đề xuất. Trên giấy.'],
], { next: 'hanh.paperGive' });
chain('hanh.paperC', [
  ['hanh', 'Trả? Em định trả lại giấy đã in hả?', { emote: 'angry' }],
  ['hanh', 'Thôi được. Nhưng chị ghi sổ: em nợ 5 tờ.'],
], { next: 'hanh.paperGive' });
chain('hanh.paperGive', [
  ['hanh', 'Đây, đúng 5 tờ. Chị đếm hai lần rồi. Đếm lại lần ba cho chắc: một, hai, ba, bốn, năm.', { effects: [{ sfx: 'pickup' }, { obj: ['q4', 'paper'] }] }],
]);

chain('tung.printer', [
  ['tung', 'Máy in báo gì?'],
  [P, 'Dạ nó báo… "Máy in đang buồn, vui lòng thử lại sau".'],
  ['tung', 'Ừ. Thứ Năm nào nó cũng buồn.'],
  ['tung', 'Em khởi động lại thử chưa?'],
], {
  choices: [
    { text: 'Lần này em hỏi trước: có cách nào khác không anh?', to: 'tung.printerA', effects: [{ stat: 'sangSuot', add: 1 }] },
    { text: 'Em đoán trước câu này rồi!', to: 'tung.printerB' },
    { text: 'Hay mình cho máy in chạy bằng năng lượng mặt trời?', to: 'tung.printerC', effects: [{ stat: 'doiMoi', add: 1 }, { stat: 'kyQuac', add: 1 }] },
  ],
});
chain('tung.printerA', [['tung', 'Có. Gọi hãng, chờ 3 ngày, rồi họ bảo khởi động lại.']], { next: 'tung.printerGo' });
chain('tung.printerB', [['tung', 'Tốt. Em đang tiến bộ.', { emote: 'happy' }]], { next: 'tung.printerGo' });
chain('tung.printerC', [['tung', '…Ghi nhận. Sau khi em khởi động lại.', { emote: 'think' }]], { next: 'tung.printerGo' });
chain('tung.printerGo', [
  ['tung', 'Nút đỏ bên hông. Giữ ba giây. Nếu nó kêu như tiếng vịt thì là bình thường.', { effects: [{ obj: ['q4', 'tung2'] }] }],
]);

chain('nam.deliver', [
  [N, 'Bạn đưa tập tài liệu còn nóng hổi cho Nam.'],
  ['nam', 'Cảm ơn em! Để anh xem…'],
  ['nam', 'Ơ.', { emote: 'surprised' }],
  ['nam', 'Ơ ơ. File này là FINAL_CHOT_THAT_LAN_NAY_7.pdf. Bản đúng là FINAL_CHOT_THAT_LAN_NAY_7_sua_lan_cuoi_v2 (1).pdf.', {
    next: [{ cond: { flag: 'askedFinal' }, to: 'nam.deliverAsked' }, { to: 'nam.deliverMis' }],
  }],
]);
chain('nam.deliverAsked', [
  [P, 'Em có hỏi anh rồi mà…'],
  ['nam', 'Ừ… lần sau em hỏi to hơn nha.', { emote: 'sad' }],
], { next: 'nam.deliverMis' });
chain('nam.deliverMis', [
  ['nam', 'Mà khoan! Trang đầu ghi: "Nhân vật trung tâm: TÂN BINH." À, hiểu rồi! Tức là tân binh phụ trách chương trình chiều nay! Là em đó!', { emote: 'happy' }],
  [P, 'Em… phụ trách chương trình ạ?', { emote: 'confused' }],
  ['nam', 'Chắc chắn! Anh đọc kịch bản rồi mà. Chiều có gì gấp em lo nha. Giờ tính sao với cái file này đây?'],
], {
  choices: [
    { text: 'Để em in lại bản đúng giúp anh.', to: 'nam.fixA', effects: [{ stat: 'dongDoi', add: 1 }, { decision: 'print', text: 'In lại bản đúng giúp Nam' }] },
    { text: 'Hay mình gửi link file lên nhóm chat, khỏi in nữa anh?', to: 'nam.fixB', effects: [{ stat: 'doiMoi', add: 1 }, { decision: 'print', text: 'Đề xuất gửi link thay vì in giấy' }] },
    { text: 'Lỗi do em chưa kiểm tra kỹ. Lần sau em sẽ xem tên file trước khi in.', to: 'nam.fixC', effects: [{ stat: 'guongMau', add: 1 }, { decision: 'print', text: 'Nhận trách nhiệm vụ in nhầm file' }] },
  ],
});
chain('nam.fixA', [['nam', 'Em tốt quá! Anh sẽ kể với chị Mai là em có tinh thần đồng đội cấp độ… máy in.', { emote: 'happy' }]], { next: 'nam.afterPrint' });
chain('nam.fixB', [['nam', 'Ơ… sao anh không nghĩ ra nhỉ. Tiết kiệm được 5 tờ giấy, chị Hạnh sẽ quý em lắm.', { emote: 'surprised' }]], { next: 'nam.afterPrint' });
chain('nam.fixC', [['nam', 'Không, lỗi của anh mà! …Nhưng em nhận trách nhiệm ngầu ghê. Anh học được rồi.', { emote: 'happy' }]], { next: 'nam.afterPrint' });
chain('nam.afterPrint', [
  ['nam', 'Thôi, ăn trưa đã rồi chiều "chiến". Nhớ nha: chị Mai nói năm phút thì em nhân với mười hai.', { effects: [{ obj: ['q4', 'deliver'] }] }],
  [N, '— Giờ nghỉ trưa trôi qua với một hộp cơm gà và ba lần bị hỏi "em là con nhà ai" —'],
]);

// =====================================================================
// CẢNH 5 – NHIỆM VỤ NGHỀ NGHIỆP
// =====================================================================
chain('mai.early', [['mai', 'Chào em! Chị là Mai, trưởng nhóm. Chiều chị có việc cho em, năm phút thôi. Giờ em cứ làm quen mọi người đã nha!', { emote: 'happy' }]]);
chain('mai.task', [
  ['mai', 'A, {name}! Đúng người chị cần. Có một việc nhỏ xíu. Năm phút thôi.', { emote: 'happy' }],
  ['mai', {
    default: 'Chị cần em hỗ trợ một nhiệm vụ.',
    sales: 'Anh Bình – khách hàng – đang cần tư vấn gói Internet cho gia đình. Em tư vấn giúp chị. Nhớ: hỏi trước, chốt sau.',
    tech: 'Đường mạng phòng họp mất kết nối, cả nhóm đang họp bằng… giấy. Em nối lại giúp chị nha.',
    care: 'Có chị khách gọi lên báo mạng chậm, giọng đang… rất to. Em hỗ trợ chị ấy nha.',
    mkt: 'Kế hoạch chương trình nội bộ đang rối như dây tai nghe. Em sắp xếp lại giúp chị nha.',
  }],
  ['mai', 'Em ngồi bàn số 7 trong văn phòng mở, máy bật sẵn rồi. Đi đi, chị bấm giờ đây! Năm phút!'],
], {
  choices: [
    { text: 'Dạ, em làm ngay!', effects: [{ obj: ['q5', 'mai'] }] },
    { text: 'Năm phút này là phút thường hay phút trưởng nhóm ạ?', to: 'mai.taskJoke', effects: [{ stat: 'kyQuac', add: 1 }] },
  ],
});
chain('mai.taskJoke', [
  ['mai', 'Phút trưởng nhóm thì nhanh hơn phút thường! …Hình như ngược lại. Thôi đi đi!', { emote: 'confused', effects: [{ obj: ['q5', 'mai'] }] }],
]);
chain('mai.remind', [['mai', 'Xong chưa em? Không gấp đâu, nhưng mà gấp nha! Bàn số 7 đó.']]);
chain('desk.minigame', [
  [N, {
    default: 'Bạn ngồi vào bàn số 7. Màn hình sáng lên…',
    sales: 'Bạn ngồi vào bàn số 7. Cuộc gọi video với anh Bình đang chờ kết nối…',
    tech: 'Bạn ngồi vào bàn số 7. Sơ đồ mạng phòng họp hiện lên, đỏ lòm.',
    care: 'Bạn ngồi vào bàn số 7, đeo tai nghe. Có tiếng thở dài rất dài ở đầu dây bên kia.',
    mkt: 'Bạn ngồi vào bàn số 7. Một file kế hoạch tên "KE_HOACH_HON_LOAN.docx" đang mở.',
  }, { effects: [{ open: 'minigame' }] }],
]);
chain('desk.early', [[N, 'Bàn số 7. Trên bàn có tờ giấy: "Chào mừng bạn mới! Máy này đã được khởi động lại 3 lần cho chắc. – Tùng".']]);
chain('desk.idle', [[N, 'Bàn làm việc của bạn. Có một cây xương rồng nhỏ, một cái ly in chữ "TÂN BINH" và tờ giấy dán: "Chỉ 5 phút – Mai".']]);
chain('mai.afterMinigame', [
  ['mai', {
    default: 'Tuyệt vời!',
    sales: '(Chị Mai nhắn chat) Anh Bình vừa gọi lại khen em tư vấn có tâm, còn giới thiệu thêm hai nhà hàng xóm. Chốt đơn kiểu này chị thích!',
    tech: '(Chị Mai nhắn chat) Phòng họp có mạng rồi! Mọi người vỗ tay xong lại quay ra lướt mạng xã hội. Thành công rực rỡ!',
    care: '(Chị Mai nhắn chat) Chị Phượng gửi thư cảm ơn, kèm sticker trái tim và… ảnh 11 hàng xóm vừa bị đá khỏi Wi-Fi.',
    mkt: '(Chị Mai nhắn chat) Kế hoạch gọn gàng tới mức Bắp đọc xong không thêm được ý tưởng nào. Chuyện chưa từng có!',
  }, { emote: 'happy', effects: [{ achievement: 'career_done' }, { decision: 'career', text: 'Hoàn thành nhiệm vụ nghề "{career}"' }] }],
  ['mai', 'Đó, thấy chưa, năm phút thôi! …Ủa, sao đã 3 giờ chiều rồi?', { emote: 'surprised' }],
  [N, 'Đồng hồ chỉ 15:00. Không ai biết năm phút đã đi đâu.'],
]);

// =====================================================================
// CẢNH 6 – BÍ ẨN CHIẾC BÁNH
// =====================================================================
chain('thu.idle', [['thu', 'Con ăn gì chưa? Hôm nay có cơm gà, canh chua, rau muống xào tỏi.']], {
  choices: [
    { text: 'Cô làm ở đây lâu chưa ạ?', to: 'thu.long' },
    { text: 'Dạ con ăn rồi ạ.', to: 'thu.ate' },
  ],
});
chain('thu.long', [
  ['thu', 'Cô nấu cho công ty mười lăm năm. Biết hết ai thích ăn gì, ai đang giận ai, ai sắp được tăng lương. Cái gì cũng biết, trừ mật khẩu Wi-Fi.', { emote: 'happy' }],
]);
chain('thu.ate', [['thu', 'Ăn rồi thì ăn thêm. Ngày đầu đi làm là ngày dài nhất đó con.', { emote: 'happy' }]]);
chain('thu.cake', [
  ['thu', 'Con ơi! Chuyện lớn rồi! Chiếc bánh kem cho chương trình chiều nay biến mất khỏi tủ lạnh!', { emote: 'surprised' }],
  ['thu', 'Bánh cô đặt từ tuần trước, ghi chữ đàng hoàng. Giờ chỉ còn cái hộp không!'],
], {
  choices: [
    { text: 'Cô bình tĩnh, con sẽ tìm giúp cô.', to: 'thu.cakeA', effects: [{ stat: 'dongDoi', add: 1 }] },
    { text: 'Từ trưa tới giờ có những ai ra vào pantry ạ?', to: 'thu.cakeB', effects: [{ stat: 'sangSuot', add: 1 }] },
  ],
});
chain('thu.cakeA', [['thu', 'Ngoan quá! Ai cũng nói "chuyện nhỏ", chỉ có con chịu giúp. Từ trưa có ba người lảng vảng: Nam, Bắp và chị Hạnh.', { emote: 'happy' }]], { next: 'thu.cakeGo' });
chain('thu.cakeB', [['thu', 'Hỏi đúng trọng tâm! Từ trưa có ba người lảng vảng: Nam, Bắp và chị Hạnh.', { emote: 'think' }]], { next: 'thu.cakeGo' });
chain('thu.cakeGo', [
  ['thu', 'Con kiểm tra tủ lạnh, rồi hỏi Nam, Bắp với chị Hạnh coi. Có đủ manh mối rồi thì quay lại nói cô. Đừng bắt oan ai nha.', { effects: [{ obj: ['q6', 'thu'] }] }],
]);
chain('thu.cakeHint', [['thu', 'Có manh mối gì chưa con? Ít nhất ba cái nha. Tủ lạnh, Nam, Bắp, chị Hạnh… người nào cũng đáng ngờ hết!']]);
chain('fridge.cake', [
  ['#Tủ lạnh', 'Ngăn bánh trống trơn. Chỉ còn tờ giấy: "Tem tài sản TS-2026-0001 – Đã kiểm kê – H." và một vết kem hình… dấu giày.'],
  [N, 'Vết giày to, đế răng cưa – loại giày của người phải đứng cả ngày.', { effects: [{ clue: 'cake_fridge' }] }],
]);
chain('nam.cake', [
  ['nam', 'Bánh hả? Không phải anh! Vụn bánh trên áo anh là bánh mì pate. Có bằng chứng hẳn hoi: mùi pate.', { emote: 'surprised' }],
  ['nam', 'Nhưng lúc 2 giờ anh thấy một người mặc áo xanh, có sọc vàng trên vai, ôm cái hộp to đi ra phía cổng. Đi nhanh như ninja.', { effects: [{ clue: 'cake_nam' }] }],
], {
  choices: [
    { text: 'Áo xanh sọc vàng… ai mặc vậy anh?', to: 'nam.cakeWho' },
    { text: 'Cảm ơn anh.' },
  ],
});
chain('nam.cakeWho', [['nam', 'Ờ… đồng phục… của… bảo vệ? Không, không lẽ nào. Chắc là người giao hàng thôi.', { emote: 'think' }]]);
chain('bap.cake', [
  ['bap', 'Bánh hả? Ờ… đúng là anh có mượn cái bánh lúc 2 giờ để quay clip "unboxing bánh kem". Nhưng anh trả lại tủ lạnh rồi mà!', { emote: 'surprised' }],
  ['bap', 'Xem nè, ảnh chụp lúc 14 giờ 05.'],
  [N, 'Trong ảnh: chiếc bánh có dòng chữ "Chào mừng {initial}…", phần còn lại bị ngón tay Bắp che mất. Góc ảnh lấp ló một ống tay áo màu xanh có sọc vàng.', { effects: [{ clue: 'cake_bap' }] }],
], {
  choices: [
    { text: 'Chữ trên bánh là "Chào mừng" ai vậy anh?', to: 'bap.cakeName' },
    { text: 'Ống tay áo xanh sọc vàng này là của ai?', to: 'bap.cakeSleeve' },
  ],
});
chain('bap.cakeName', [['bap', 'Ờ… bí mật! À không, anh không biết! Anh chỉ quay thôi! Thôi anh đi quay tiếp đây!', { emote: 'surprised' }]]);
chain('bap.cakeSleeve', [['bap', 'Chắc ai đi ngang qua. Mà áo xanh sọc vàng thì… cả tòa nhà có đúng một người mặc thôi mà nhỉ?', { emote: 'think' }]]);
chain('hanh.cake', [
  ['hanh', 'Chiếc bánh? Chị có kiểm kê lúc 13 giờ 45. Đã dán tem tài sản: TS-2026-0001.'],
  [P, 'Chị dán tem tài sản lên… bánh kem ạ?', { emote: 'surprised' }],
  ['hanh', 'Giá trị trên 500 nghìn thì phải kiểm kê. Quy định là quy định. Sau đó chị để nguyên chỗ cũ. Chị không ăn đồ chưa có hóa đơn đỏ.', { effects: [{ clue: 'cake_hanh' }] }],
], {
  choices: [
    { text: 'Chị có thấy ai mang bánh đi không?', to: 'hanh.cakeSaw' },
    { text: 'Dạ cảm ơn chị.' },
  ],
});
chain('hanh.cakeSaw', [
  ['hanh', 'Không. Nhưng có người bóc tem tài sản ra, dán lên cửa tủ lạnh. Như thể muốn chị biết là bánh vẫn an toàn. Ai mà chu đáo vậy ta?', { emote: 'think' }],
]);
chain('booth.log', [
  ['#Sổ trực bảo vệ', '08:00 – Mở cổng. 08:05 – Nhân viên mới đến, tên: {name} (in hoa, gạch chân 2 lần). 08:06 – Nhắc Bắp KHÔNG rút điện máy cấp thẻ để sạc điện thoại.'],
  [N, 'Trang sau ghi một danh sách dài: "1999: Quân. 2001: Hòa. 2004: Linh. 2009: Nam…" Cạnh mỗi cái tên là một hình bánh kem nhỏ.'],
]);
chain('booth.cake', [
  ['#Sổ trực bảo vệ', '14:10 – Đã chuyển "vật phẩm quan trọng" về tủ lạnh bốt. Lý do: tủ lạnh pantry không an toàn (vụ 3 hộp sữa chua tuần trước).'],
  [N, 'Tủ lạnh mini trong bốt khóa bằng một ổ khóa… hình con mèo.', { effects: [{ clue: 'cake_booth' }] }],
]);
chain('thu.accuse', [['thu', 'Sao con? Ai lấy chiếc bánh?', { emote: 'think' }]], {
  choices: [
    { text: 'Là Nam! Áo anh ấy dính đầy vụn bánh.', to: 'thu.wrongNam', effects: [{ stat: 'kyQuac', add: 1 }, { decision: 'cake', text: 'Buộc tội Nam vì vụn… bánh mì' }] },
    { text: 'Là Bắp! Anh ấy đã mượn bánh để quay clip.', to: 'thu.wrongBap', effects: [{ stat: 'kyQuac', add: 1 }, { decision: 'cake', text: 'Buộc tội Bắp vì clip unboxing' }] },
    { text: 'Là chị Hạnh! Chị ấy dán tem tài sản lên bánh.', to: 'thu.wrongHanh', effects: [{ stat: 'kyQuac', add: 1 }, { decision: 'cake', text: 'Buộc tội chị Hạnh vì kiểm kê bánh' }] },
    {
      text: 'Là chú Tư. Áo xanh sọc vàng, giày đứng cả ngày, đi về phía cổng.',
      to: 'thu.right',
      cond: { any: [{ clue: 'cake_nam' }, { clue: 'cake_bap' }, { clue: 'cake_tu' }, { clue: 'cake_booth' }] },
      effects: [{ stat: 'sangSuot', add: 1 }, { achievement: 'detective' }, { decision: 'cake', text: 'Phá án bánh kem: thủ phạm là chú Tư' }],
    },
    { text: 'Con chưa chắc. Để con tìm thêm manh mối.', to: 'thu.wait' },
  ],
});
chain('thu.wait', [['thu', 'Cẩn thận vậy là tốt. Đi đi con, cô chờ.', { emote: 'happy' }]]);
chain('thu.wrongNam', [
  ['thu', 'Nam?!', { emote: 'angry' }],
  [N, 'Cô Thu gọi Nam vào. Nam xuất hiện với nửa ổ bánh mì pate trên tay.'],
  ['nam', 'Cô ơi oan! Đây là bánh MÌ! Bánh MÌ!', { emote: 'angry' }],
  ['thu', '…Ừ ha. Thôi để cô gọi hỏi bảo vệ coi có ai mang hộp ra cổng không.'],
], { next: 'thu.call' });
chain('thu.wrongBap', [
  ['thu', 'Bắp?!', { emote: 'angry' }],
  ['bap', 'Em trả lại rồi mà! Em còn quay clip lúc trả nè! Clip dài 47 phút, cô xem không?', { emote: 'surprised' }],
  ['thu', 'Thôi khỏi. Để cô gọi hỏi bảo vệ.'],
], { next: 'thu.call' });
chain('thu.wrongHanh', [
  ['thu', 'Chị Hạnh?!', { emote: 'surprised' }],
  ['hanh', 'Chị chỉ kiểm kê. Kiểm kê không phải là ăn. Ăn là chi phí. Kiểm kê là tài sản.', { emote: 'angry' }],
  ['thu', 'Nghe… cũng hợp lý. Để cô gọi bảo vệ.'],
], { next: 'thu.call' });
chain('thu.right', [
  ['thu', 'Chú Tư?! Cái ông già đó…', { emote: 'angry' }],
], { next: 'thu.call' });
chain('thu.call', [
  [N, 'Cô Thu bấm điện thoại nội bộ gọi ra bốt bảo vệ.', { effects: [{ sfx: 'phone' }] }],
  ['tu', '(qua điện thoại) Alô, bốt bảo vệ nghe.'],
  ['thu', 'Ông Tư! Cái bánh kem đâu?'],
  ['tu', 'À, cái bánh đó hả. Tôi cất trong tủ lạnh bốt bảo vệ rồi. Tuần trước tủ lạnh pantry mất ba hộp sữa chua, tôi không tin ai hết.'],
  ['tu', 'Bánh của nhân viên mới thì phải giữ cẩn thận. Truyền thống từ năm 1998 rồi.'],
  ['thu', 'Bánh của… ÔNG NÓI NHỎ THÔI!!!', { emote: 'surprised' }],
  [N, 'Cô Thu cúp máy cái rụp, rồi quay sang cười với bạn. Cười hơi lâu.'],
  ['thu', 'Không có gì đâu con! Bánh tìm được rồi! Con giỏi lắm. Giờ nghỉ tay chút đi, năm giờ chiều còn… à, còn ra về.', {
    emote: 'happy',
    effects: [{ setFlag: 'cakeFound' }, { clearFlag: 'cakeMissing' }, { obj: ['q6', 'accuse'] }],
  }],
]);
chain('thu.gossip', [
  ['thu', 'Con biết không, hồi xưa chú Tư là MC bá đạo nhất công ty đó. Tiệc nào có chú cầm micro là không ai về sớm được.'],
  ['thu', 'Rồi tự nhiên một ngày chú xin ra đứng cổng. Nói là "để được chào từng người mới". Kỳ ghê.', { effects: [{ clue: 'tu_4' }] }],
]);
chain('hall.firstLook', [[N, 'Hội trường đang trang trí dở dang: bóng bay, ghế xếp, một sân khấu nhỏ. Có vẻ chiều nay có chuyện lớn.']]);

// =====================================================================
// CẢNH 7 – 16:59 CÓ VIỆC GẤP
// =====================================================================
chain('bap.idle', [
  ['bap', 'Ê nhân viên mới! Đứng yên! Chụp một tấm cho fanpage!', { emote: 'happy', effects: [{ sfx: 'click' }] }],
  [N, 'Tách! Bắp chụp đúng lúc bạn đang há miệng.'],
  ['bap', 'Đẹp! Rất đời thực. Caption: "Ngày đầu đi làm, cảm xúc dâng trào".', { emote: 'happy' }],
]);
chain('bap.q7', [
  ['bap', '{name}! May quá! Chương trình 17 giờ mà mất micro! Không có micro thì MC phải hét, mà MC hét thì… hàng xóm gọi bảo vệ!', { emote: 'surprised' }],
  ['bap', 'Chưa hết: Nam treo băng rôn có vấn đề, màn chiếu bị gì đó, chị Hạnh chưa duyệt quỹ. Mà năm phút nữa là bắt đầu!'],
], {
  choices: [
    { text: 'Bình tĩnh. Mình chia việc ra từng bước nhé.', to: 'bap.q7a', effects: [{ stat: 'sangSuot', add: 1 }, { decision: 'chaos', text: 'Giữ bình tĩnh và chia việc khi mọi thứ rối tung' }] },
    { text: 'Không có micro thì mượn loa kéo bán hàng của cô Thu!', to: 'bap.q7b', effects: [{ stat: 'doiMoi', add: 1 }, { stat: 'kyQuac', add: 1 }, { decision: 'chaos', text: 'Đề xuất dùng loa kéo thay micro' }] },
    { text: 'Năm phút thì làm sao mà kịp?!', to: 'bap.q7c', effects: [{ decision: 'chaos', text: 'Hoảng loạn cùng Bắp' }] },
  ],
});
chain('bap.q7a', [['bap', 'Đúng rồi! Chia việc! Anh lo phần… đứng đây hồi hộp.', { emote: 'happy' }]], { next: 'bap.q7go' });
chain('bap.q7b', [['bap', 'Ý tưởng điên rồ! Anh thích! Nhưng thử tìm micro thật trước đã.', { emote: 'happy' }]], { next: 'bap.q7go' });
chain('bap.q7c', [['bap', 'Năm phút của chị Mai đó. Tức là… vẫn còn hy vọng.', { emote: 'think' }]], { next: 'bap.q7go' });
chain('bap.q7go', [
  ['bap', 'Micro chắc ở phòng kho cạnh văn phòng mở. Cửa kho quẹt thẻ là mở. Đi đi!', { effects: [{ obj: ['q7', 'hall'] }, { music: 'tense' }] }],
]);
chain('bap.q7busy', [['bap', 'Nhanh nhanh! Anh đang livestream… cảnh anh đang đợi.', { emote: 'surprised' }]]);
chain('tung.q7mic', [
  ['tung', 'Micro hả. Trong phòng kho, hộp thiết bị ngay cửa. Thẻ em quẹt được rồi.'],
  ['tung', 'À. Đừng đụng vào cái thùng có chữ DJ. Cái đó của… một người. Một người rất đáng sợ.', { emote: 'think' }],
]);
chain('tung.idle', [['tung', '…']], {
  choices: [
    { text: 'Anh ơi, mật khẩu Wi-Fi là gì ạ?', to: 'tung.wifi', cond: { notClue: 'tu_6' } },
    { text: 'Anh làm ở đây lâu chưa?', to: 'tung.long' },
    { text: 'Dạ không có gì ạ.' },
  ],
});
chain('tung.wifi', [
  ['tung', 'ChuTuDepTrai1998. Viết hoa C, T, D, T.'],
  [P, 'Sao lại là… chú Tư ạ?', { emote: 'confused' }],
  ['tung', 'Người cài mạng đầu tiên của công ty. Không ai dám đổi mật khẩu.', { effects: [{ clue: 'tu_6' }] }],
]);
chain('tung.long', [['tung', 'Đủ lâu để biết 90% sự cố được giải quyết bằng khởi động lại. 10% còn lại là do Bắp.']]);
chain('mic.take', [
  [N, 'Bạn lục hộp thiết bị: dây cáp, ổ cắm, 3 con chuột không dây (không có pin), và… một chiếc micro!', { effects: [{ sfx: 'pickup' }] }],
], {
  choices: [
    { text: 'Kiểm tra pin micro trước khi mang đi.', to: 'mic.check', effects: [{ stat: 'sangSuot', add: 1 }, { decision: 'mic', text: 'Kiểm tra pin micro trước khi mang đi' }] },
    { text: 'Ôm micro chạy luôn!', to: 'mic.run', effects: [{ decision: 'mic', text: 'Ôm micro chạy, không kiểm tra gì' }] },
  ],
});
chain('mic.check', [[N, 'Pin hết thật. Bạn lấy pin từ… một con chuột không dây. À, chuột không có pin. Bạn lấy pin từ cái điều khiển máy lạnh. Micro hoạt động!', { effects: [{ obj: ['q7', 'mic'] }] }]]);
chain('mic.run', [[N, 'Bạn ôm micro chạy đi. Trong đầu vang lên giọng anh Tùng: "Em khởi động lại chưa?"', { effects: [{ obj: ['q7', 'mic'] }] }]]);
chain('mic.early', [[N, 'Một hộp thiết bị đầy dây cáp rối như kế hoạch của Bắp. Hiện chưa cần gì ở đây.']]);
chain('nam.q7', [['nam', 'Băng rôn anh treo đẹp không? Anh tự in đó! Chương trình "chào mừng" thì… chào là chào tạm biệt, đúng không?', { emote: 'confused' }]]);
chain('nam.idle', [['nam', 'Ăn trưa chưa em? Cô Thu hôm nay nấu canh chua ngon lắm. À, đừng dùng máy pha cà phê lâu quá, nó hay… tâm sự.']]);
chain('banner.look', [
  [N, 'Băng rôn trên sân khấu.', {
    next: [
      { cond: { flag: 'banner_team' }, to: 'banner.lookTeam' },
      { cond: { flag: 'banner_creative' }, to: 'banner.lookCreative' },
      { cond: { flag: 'banner_bye' }, to: 'banner.lookBye' },
      { to: 'banner.lookRolled' },
    ],
  }],
]);
chain('banner.lookRolled', [[N, 'Băng rôn còn cuộn tròn, buộc dây có ghi: "Đừng mở trước 17h – Bắp".']]);
chain('banner.lookTeam', [[N, 'Băng rôn viết tay bằng bút lông: "CHÀO MỪNG!" – nét chữ của bạn và Nam, hơi lệch nhưng rất chân thành.']]);
chain('banner.lookCreative', [[N, '"TẠM BIỆT THẤT NGHIỆP – CHÀO MỪNG ĐI LÀM!" Nam đứng dưới chụp ảnh tự sướng với nó lần thứ 12.']]);
chain('banner.lookBye', [[N, '"TẠM BIỆT VÀ HẸN GẶP LẠI!" vẫn tung bay đầy kiêu hãnh.']]);
chain('banner.fix', [
  [N, 'Băng rôn Nam vừa treo lên ghi to: "TẠM BIỆT VÀ HẸN GẶP LẠI!"'],
  ['nam', 'Đẹp không? Chương trình chào mừng thì phải có "tạm biệt" chứ, chào là chào tạm biệt mà!', { emote: 'happy' }],
], {
  choices: [
    { text: 'Anh ơi, "chào mừng" là đón người mới. Mình làm lại cùng nhau nhé.', to: 'banner.team', effects: [{ stat: 'dongDoi', add: 1 }, { stat: 'tonTrong', add: 1 }, { setFlag: 'banner_team' }, { decision: 'banner', text: 'Cùng Nam viết lại băng rôn "CHÀO MỪNG!"' }] },
    { text: 'Viết thêm: "TẠM BIỆT THẤT NGHIỆP – CHÀO MỪNG ĐI LÀM!"', to: 'banner.creative', effects: [{ stat: 'doiMoi', add: 1 }, { setFlag: 'banner_creative' }, { decision: 'banner', text: 'Biến băng rôn "tạm biệt" thành "tạm biệt thất nghiệp"' }] },
    { text: 'Để nguyên đi, nhìn cũng nghệ thuật mà.', to: 'banner.bye', effects: [{ stat: 'kyQuac', add: 2 }, { setFlag: 'banner_bye' }, { decision: 'banner', text: 'Giữ nguyên băng rôn "TẠM BIỆT" trong tiệc chào mừng' }] },
  ],
});
chain('banner.team', [
  ['nam', 'Ơ… ờ ha! Thảo nào chị Mai nhìn anh như nhìn máy in đang buồn. Làm lại liền!', { emote: 'surprised' }],
  [N, 'Hai bạn lật mặt sau băng rôn, viết lại bằng bút lông thật to: "CHÀO MỪNG!"', { effects: [{ obj: ['q7', 'banner'] }] }],
]);
chain('banner.creative', [
  ['nam', 'THIÊN TÀI! Vừa sửa được, vừa khỏi phải in lại!', { emote: 'happy', effects: [{ obj: ['q7', 'banner'] }] }],
]);
chain('banner.bye', [
  ['nam', 'Đúng không! Anh biết em hiểu anh mà!', { emote: 'happy' }],
  [N, 'Băng rôn "TẠM BIỆT" sẽ tung bay trong buổi chào mừng. Một quyết định… táo bạo.', { effects: [{ obj: ['q7', 'banner'] }] }],
]);
chain('screen.idle', [['#Máy chiếu', 'Máy chiếu đang tắt. Trên vỏ dán: "Chỉ Bắp được bật. Bắp không được bật."']]);
chain('screen.check', [
  [N, 'Màn chiếu đang chạy slide thử. Dòng chữ thật to: "CHÀO MỪNG TÂN BINH: {name}".', { effects: [{ setFlag: 'sawName' }] }],
  [P, 'Ơ… tên mình?', { emote: 'surprised' }],
  [N, 'Slide tự chuyển: "LỖI HIỂN THỊ. VUI LÒNG QUÊN NHỮNG GÌ BẠN VỪA THẤY."'],
], {
  choices: [
    { text: 'Hỏi thẳng mọi người cho rõ.', to: 'screen.ask', effects: [{ stat: 'sangSuot', add: 1 }, { decision: 'screen', text: 'Hỏi thẳng về cái tên trên màn chiếu' }] },
    { text: 'Chắc trùng tên. Rút cáp ra cắm lại cho máy chạy đã.', to: 'screen.fix', effects: [{ decision: 'screen', text: 'Sửa máy chiếu bằng cách… cắm lại cáp' }] },
    { text: 'Đổi slide thành ảnh mèo đeo kính cho vui.', to: 'screen.cat', effects: [{ stat: 'doiMoi', add: 1 }, { stat: 'kyQuac', add: 1 }, { setFlag: 'catSlide' }, { decision: 'screen', text: 'Đổi slide chào mừng thành ảnh mèo đeo kính' }] },
  ],
});
chain('screen.ask', [
  [N, 'Bạn quay lại hỏi. Cả hội trường đồng loạt… ngước nhìn trần nhà và huýt sáo.'],
  ['bap', 'Trùng tên thôi! Trùng tên! Tên em phổ biến lắm!', { emote: 'surprised', effects: [{ obj: ['q7', 'screen'] }] }],
]);
chain('screen.fix', [[N, 'Bạn rút cáp HDMI ra, cắm lại. Màn chiếu hiện logo FTEL sáng đẹp. Khởi động lại – giải pháp vạn năng.', { effects: [{ obj: ['q7', 'screen'] }] }]]);
chain('screen.cat', [
  [N, 'Màn chiếu hiện một chú mèo đeo kính râm, nghiêm túc nhìn cả hội trường.'],
  ['bap', 'Ơ… hợp lý một cách khó hiểu. Giữ nguyên!', { emote: 'happy', effects: [{ obj: ['q7', 'screen'] }, { achievement: 'cat_slide' }] }],
]);
chain('hanh.budget', [
  ['hanh', 'Quỹ phong trào còn đúng 600 nghìn. Ba bên cùng xin: Bắp mua thêm bóng bay, Nam in lại băng rôn, cô Thu mua thêm nước ngọt. Em chia sao?'],
], {
  choices: [
    { text: 'Xem nhu cầu thực tế, ưu tiên khoản thiếu nhất cho chương trình.', to: 'hanh.budgetA', effects: [{ stat: 'chiCong', add: 1 }, { stat: 'sangSuot', add: 1 }, { decision: 'budget', text: 'Chia quỹ theo nhu cầu thực tế' }] },
    { text: 'Chia đều mỗi bên 200 nghìn cho công bằng.', to: 'hanh.budgetB', effects: [{ stat: 'chiCong', add: 1 }, { decision: 'budget', text: 'Chia đều quỹ mỗi bên 200 nghìn' }] },
    { text: 'Dồn hết mua trà sữa cho cả hội trường!', to: 'hanh.budgetC', effects: [{ stat: 'kyQuac', add: 2 }, { decision: 'budget', text: 'Dồn toàn bộ quỹ phong trào mua trà sữa' }] },
  ],
});
chain('hanh.budgetA', [['hanh', 'Hợp lý. Bóng bay đủ rồi, nước ngọt thiếu, còn băng rôn… để chị xem Nam in gì đã. Duyệt!', { emote: 'happy', effects: [{ obj: ['q7', 'budget'] }] }]]);
chain('hanh.budgetB', [['hanh', 'Công bằng, dễ quyết toán. Chị thích những con số chia hết. Duyệt!', { emote: 'happy', effects: [{ obj: ['q7', 'budget'] }] }]]);
chain('hanh.budgetC', [
  ['hanh', '…Trà sữa không có trong danh mục chi.', { emote: 'angry' }],
  ['hanh', 'Nhưng… nếu có hóa đơn đỏ thì… thôi được. Size L. Ít đá.', { emote: 'think', effects: [{ obj: ['q7', 'budget'] }] }],
]);
chain('hanh.idle', [['hanh', 'Em cần gì? Giấy, bút, hay một bảng tính Excel 47 trang?']], {
  choices: [
    { text: 'Chị làm ở đây lâu chưa ạ?', to: 'hanh.long' },
    { text: 'Dạ không có gì ạ.' },
  ],
});
chain('hanh.long', [['hanh', 'Chị vào sau chú Tư năm năm. Ai ở đây cũng vào sau chú Tư hết.', { emote: 'think' }]]);
chain('mai.q7busy', [['mai', 'Còn việc nè em! Thiếu gì thì xem bảng nhiệm vụ (phím Tab) nha. Chị đang bận… đứng đây chỉ đạo.', { emote: 'surprised' }]]);
chain('mai.idle', [['mai', 'Ngày đầu vui không em? Mai em quay lại nha. À, Mai là chị. Ý chị là ngày mai.', { emote: 'happy' }]]);
chain('mai.ready', [
  ['mai', 'Mọi thứ sẵn sàng chưa em?'],
  [P, 'Dạ, micro có rồi, băng rôn đã xử lý, quỹ đã chốt, màn chiếu… vẫn hơi lạ.'],
  ['mai', 'Tuyệt! Vậy em đứng giữa hội trường giúp chị nha. Đúng chỗ đó. Đừng nhúc nhích.', { emote: 'happy' }],
], {
  choices: [
    { text: 'Sao lại là em đứng giữa ạ?', to: 'mai.readyWhy' },
    { text: 'Dạ.', to: 'mai.readyGo' },
  ],
});
chain('mai.readyWhy', [['mai', 'Vì… ánh sáng ở đó đẹp! Đúng rồi, ánh sáng!', { emote: 'surprised' }]], { next: 'mai.readyGo' });
chain('mai.readyGo', [['mai', 'Đèn ơi… TẮT!', { effects: [{ obj: ['q7', 'ready'] }] }]]);

// =====================================================================
// CẢNH 8 – CÚ TWIST & KẾT
// =====================================================================
chain('finale.start', [
  [N, '17:00. Đèn hội trường vụt tắt.', { effects: [{ teleport: [14.5, -13.6, Math.PI] }, { setFlag: 'lightsOff' }, { sfx: 'whoosh' }] }],
  [N, 'Trong bóng tối có tiếng thì thầm: "Suỵt! Tới rồi!" – "Ai cầm bánh?" – "Đèn đâu? Ai bật đèn đi!"'],
  [N, 'Đèn bật sáng.', { effects: [{ clearFlag: 'lightsOff' }, { setFlag: 'surprise' }, { sfx: 'party' }, { music: 'party' }] }],
  ['#Cả hội trường', 'SURPRISE!!! CHÀO MỪNG {name} ĐẾN VỚI FTEL!!!'],
  [P, '…Hả?', { emote: 'surprised' }],
  ['mai', 'Đây là chương trình chào mừng nhân viên mới! Và nhân viên mới là… em!', { emote: 'happy' }],
  [P, 'Khoan… vậy là cả buổi chiều nay… em đã chuẩn bị tiệc chào mừng chính mình?', { emote: 'confused' }],
  ['nam', 'Ơ… là do anh đọc nhầm kịch bản. "Nhân vật trung tâm: tân binh" không có nghĩa là "tân binh phụ trách"…', { emote: 'sad' }],
  ['linh', 'Chị đã nói rồi mà: danh sách có tên em. Ở dòng "khách mời danh dự".', { emote: 'happy' }],
  ['bap', 'Và anh đã quay lại toàn bộ cảnh em chạy khắp tòa nhà chuẩn bị tiệc cho chính mình. Video viral nhất năm đây rồi!', { emote: 'happy' }],
  ['thu', 'Bánh nè con! Chú Tư giữ kỹ lắm, không sứt miếng nào!', { emote: 'happy' }],
  [N, 'Chiếc bánh được mang ra: "CHÀO MỪNG {name}!" Tem tài sản TS-2026-0001 vẫn dán ngay ngắn ở góc.'],
  ['mai', 'Giờ em nói vài lời đi! Micro em tự tìm đó!', { emote: 'happy' }],
], {
  choices: [
    { text: 'Cảm ơn mọi người! Em sẽ cố gắng hết mình.', to: 'finale.thanks', effects: [{ decision: 'final', text: 'Cảm ơn mọi người và hứa cố gắng' }] },
    { text: 'Vậy… cả buổi chiều nay em có được tính OT không ạ?', to: 'finale.ot', effects: [{ stat: 'kyQuac', add: 2 }, { decision: 'final', text: 'Hỏi được tính OT ngay trên sân khấu' }] },
    {
      text: 'Khoan đã… em muốn mời một người lên sân khấu: chú Tư!',
      to: 'finale.tu',
      cond: { secretGte: 4 },
      hint: 'bí mật',
      effects: [{ setFlag: 'final_tu' }, { decision: 'final', text: 'Mời chú Tư lên sân khấu' }],
    },
  ],
});
chain('finale.thanks', [
  [N, 'Cả hội trường vỗ tay rần rần. Anh Đức nhìn đồng hồ – lần đầu tiên trong ngày – quên mất mình định về.'],
  ['hanh', 'Chị đã ghi nhận lời hứa của em. Có ký tên.', { emote: 'happy', effects: [{ open: 'ending' }] }],
]);
chain('finale.ot', [
  [N, 'Cả hội trường im lặng ba giây.'],
  ['linh', '…Câu này hình như em đã hỏi trong buổi phỏng vấn.', { emote: 'think' }],
  ['mai', 'Năm phút! Chỉ tính năm phút OT thôi!', { emote: 'happy' }],
  [N, 'Cả hội trường cười ồ. Câu hỏi của bạn được Bắp đăng lên group chat và nhận 300 lượt thả "haha".', { effects: [{ open: 'ending' }] }],
]);
chain('finale.tu', [
  [N, 'Bạn cầm micro: "Mời chú Tư!" Cả hội trường sững sờ.'],
  [N, 'Đèn tắt phụt. Một luồng đèn màu quét về góc sân khấu.', { effects: [{ setFlag: 'djtu' }, { sfx: 'surprise' }] }],
  ['tu', 'Hừm. Cuối cùng cũng có đứa phát hiện ra.', { emote: 'happy' }],
  ['tu', 'Năm 1998, công ty chỉ có mình chú. Ngày đầu đi làm không ai chào mừng, nên chú tự treo băng rôn "CHÀO MỪNG TÔI", tự mua bánh, tự cầm micro.'],
  ['tu', 'Từ đó chú hứa: nhân viên mới nào cũng phải có một buổi chào mừng. Chú xin ra đứng cổng để là người đầu tiên chào từng đứa.'],
  ['tu', 'Còn vụ để tân binh tự chuẩn bị tiệc của mình… là do thằng Nam đọc nhầm kịch bản. Năm nào nó cũng đọc nhầm.'],
  ['nam', 'Năm nào em cũng đọc nhầm thật…', { emote: 'sad' }],
  ['tu', 'Rồi! Nhân viên số 0001 – DJ TƯ – xin phép mở nhạc!', { emote: 'happy', effects: [{ sfx: 'party' }, { achievement: 'secret_hunter' }] }],
  [N, 'Bàn mixer sáng rực. Sau hai mươi năm, DJ Tư trở lại.', { effects: [{ open: 'ending' }] }],
]);

// =====================================================================
// TƯƠNG TÁC PHỤ – NHỮNG ĐIỀU NHỎ LÀM THẾ GIỚI SỐNG ĐỘNG
// =====================================================================
chain('banhmi', [['#Cô bán bánh mì', 'Bánh mì không con? Nhân viên mới hả? Ăn đi lấy sức, ngày đầu là ngày dài nhất!']], {
  choices: [
    { text: 'Dạ cho con một ổ.', to: 'banhmi.buy' },
    { text: 'Dạ thôi, con sợ trễ giờ.' },
  ],
});
chain('banhmi.buy', [[N, 'Bạn nhận một ổ bánh mì nóng giòn. Tinh thần +100. (Chỉ số này không có trong game, nhưng bạn cảm nhận được.)', { effects: [{ sfx: 'pickup' }] }]]);
chain('signboard', [['#Biển chỉ dẫn', 'FTEL TOWER — ↑ Sảnh chính · Phòng phỏng vấn · Pantry · Hội trường. ← Bãi xe. ↓ Lối ra (bạn chưa được về đâu).']]);
chain('board.q1', [['#Bảng thông báo', 'THÔNG BÁO: Thứ Hai mặc áo đồng phục. Thứ Ba mặc áo đồng phục. Thứ Tư đến Chủ Nhật: như trên.']]);
chain('board.q2', [
  ['#Bảng thông báo', '📌 17:00 HÔM NAY – CHƯƠNG TRÌNH CHÀO MỪNG ████ TẠI HỘI TRƯỜNG. Toàn thể nhân viên tham dự.'],
  [N, 'Ai đó đã dán đè một mẩu giấy lên tên. Bên dưới: "📌 Tìm thấy: 1 chìa khóa xe máy, 1 trái tim tan vỡ (chưa ai nhận)."'],
]);
chain('board.q4', [['#Bảng thông báo', '📌 Máy in đang buồn, đề nghị mọi người động viên. 📌 Ai lấy hộp sữa chua ghi "HẠNH – ĐÃ KIỂM KÊ" vui lòng hoàn trả.']]);
chain('board.q6', [['#Bảng thông báo', '📌 KHẨN: Tủ lạnh pantry KHÔNG PHẢI nơi an toàn. – Ký tên: Một người quan tâm. (Chữ ký có hình một bộ ria mép.)']]);
chain('board.q7', [['#Bảng thông báo', '📌 16:59 – Chương trình 17:00 cần hỗ trợ GẤP. Chỉ 5 phút! 📌 Khách mời danh dự: 1 người. (Tên vẫn bị che. Mẩu giấy che tên ghi: "Đừng đọc".)']]);
chain('showcase', [
  ['#Tủ cúp', 'Cúp "Nhân viên của năm 1999", "Tiếng hát FTEL 2003", "MC xuất sắc 2005", "MC xuất sắc 2006", "MC xuất sắc 2007"… Tất cả khắc cùng một cái tên: T. TƯ.'],
  [P, 'T. Tư… Không lẽ…', { emote: 'think', effects: [{ clue: 'tu_2' }] }],
]);
chain('elevator', [
  ['#Thang máy', 'Bạn bấm nút gọi thang. Màn hình: "THANG ĐANG Ở TẦNG 47".', {
    next: [{ cond: { flag: 'elev1' }, to: 'elevator.2' }, { to: 'elevator.1' }],
  }],
]);
chain('elevator.1', [[N, 'Tòa nhà này có… 1 tầng.', { effects: [{ setFlag: 'elev1' }] }]]);
chain('elevator.2', [[N, 'Màn hình đổi thành "TẦNG 48". Nó đang đi lên. Bạn quyết định không hỏi thêm.', { effects: [{ achievement: 'elevator' }] }]]);
chain('sofa', [[N, 'Bạn ngồi thử. Sofa êm tới mức suýt ngủ quên trong ngày đầu đi làm. Lễ tân Vy nhìn bạn đầy lo lắng.']]);
chain('vending', [['#Máy bán hàng', 'Mời chọn đồ uống.']], {
  choices: [
    { text: 'Mua trà đào (10.000đ).', to: 'vending.buy' },
    { text: 'Đá nhẹ vào máy.', to: 'vending.kick', effects: [{ stat: 'kyQuac', add: 1 }] },
    { text: 'Thôi, không mua.' },
  ],
});
chain('vending.buy', [[N, 'Máy nuốt tiền, nhả ra một lon… cà phê sữa. Cũng được.', { effects: [{ sfx: 'pickup' }] }]]);
chain('vending.kick', [[N, 'Máy rơi ra ba lon nước và một tờ giấy: "Đã ghi nhận hành vi. – Chú Tư".', { effects: [{ sfx: 'error' }] }]]);
chain('water', [[N, 'Ọc ọc ọc. Bạn uống một ly nước mát. Đây là hoạt động duy nhất trong ngày không có ai nhờ "năm phút".']]);
chain('phone.call', [
  [N, 'Điện thoại bàn reo inh ỏi. Không ai nghe. Bạn nhấc máy.', { effects: [{ sfx: 'phone' }] }],
  ['#Người gọi', 'Alô, cho một tô phở tái nạm, ít hành, nhiều bánh, giao tới số 12 nha em!'],
], {
  choices: [
    { text: 'Dạ, đây là công ty viễn thông ạ. Anh gọi nhầm số rồi.', to: 'phone.polite', effects: [{ stat: 'tonTrong', add: 1 }, { setFlag: 'phoneAnswered' }] },
    { text: 'Dạ, phở tái nạm ít hành, 15 phút có ạ!', to: 'phone.pho', effects: [{ stat: 'kyQuac', add: 1 }, { setFlag: 'phoneAnswered' }, { achievement: 'pho' }] },
  ],
});
chain('phone.polite', [
  ['#Người gọi', 'Ủa vậy hả? Vậy… mạng nhà anh cũng chậm, em xem giúp luôn được không?'],
  [P, '…Dạ, em chuyển anh sang tổng đài hỗ trợ ngay ạ.', { emote: 'happy' }],
]);
chain('phone.pho', [
  ['#Người gọi', 'Ok em! Anh đợi!'],
  [N, 'Bạn vừa nhận một đơn phở mà công ty bạn không bán. Ở đâu đó, một người đàn ông sẽ đợi mãi.'],
]);
chain('phone.after', [[N, 'Điện thoại đã im. Màn hình hiện: "Cuộc gọi nhỡ: Phở Hai Lúa (14)".']]);
chain('chair.spin', [[N, 'Bạn xoay chiếc ghế. Nó xoay… xoay… xoay mãi. Từ xa, anh Đức nói vọng lại: "Đừng. Nó sẽ không dừng đâu."']]);
chain('file.long', [['#Màn hình máy tính', 'File đang mở: "bao_cao_tong_hop_quy_3_ban_moi_nhat_DA_SUA_theo_y_chi_Mai_lan_2_KHONG_SUA_NUA_that_su_final_v9_(dung_ban_nay).xlsx". Dung lượng: 2 KB.']]);
chain('plant', [[N, 'Bạn định tưới cây kim tiền. Tờ giấy dán trên chậu: "Cây này đã được tưới 6 lần hôm nay. Nó đang bơi. – Hạnh".']]);
chain('clock', [['#Đồng hồ', 'Đồng hồ chỉ {time}. Kim giây đi chậm một cách đáng ngờ mỗi khi có người nhìn.']]);
chain('door.locked', [['#Cửa phòng kho', 'Cửa có khóa từ, cần quẹt thẻ nhân viên. Bạn chưa có thẻ, tức là về mặt kỹ thuật bạn… chưa tồn tại.']]);
chain('meetingBoard', [
  ['#Bảng ghi chú', '"CT 17h – CHÀO MỪNG TÂN BINH. Bánh: Thu ✓. Băng rôn: Nam (??). Âm thanh: Bắp. MC: ???. TÂN BINH: KHÔNG ĐƯỢC BIẾT!!!"'],
  [P, 'Tân binh không được biết… Mình cũng là tân binh mà. Chắc còn tân binh khác.', { emote: 'think', effects: [{ setFlag: 'sawBoard' }] }],
]);
chain('meetingScreen', [['#Màn hình', 'Slide đang chiếu: "KẾ HOẠCH QUÝ 4 – Mục tiêu: không còn cuộc họp nào kéo dài quá 5 phút." Slide này đã được chiếu suốt 2 tiếng.']]);
chain('storage.enter', [[N, 'Phòng kho mát lạnh, quạt server rì rì. Có mùi giấy cũ và… mùi bóng bay?']]);
chain('photo.old', [
  ['#Bức ảnh cũ', 'Ảnh đã ngả màu, ghi chú: "Ngày đầu đi làm – 1998". Một chàng trai ria mép cầm micro, đứng trước băng rôn viết tay: "CHÀO MỪNG TÔI".'],
  [P, 'Chào mừng… tôi? Người này tự chuẩn bị tiệc chào mừng chính mình à?', { emote: 'surprised' }],
  [N, 'Bộ ria mép đó trông quen quen.', { effects: [{ clue: 'tu_3' }] }],
]);
chain('server', [['#Tủ server', 'Đèn xanh nhấp nháy đều. Giấy dán: "Nếu tủ kêu bíp 3 lần: khởi động lại. Nếu kêu bíp 4 lần: chạy. – Tùng".']]);
chain('fridge.idle', [['#Tủ lạnh', 'Sáu hộp cơm có ghi tên, một hộp không ghi tên (không ai dám đụng) và tờ giấy: "Ai lấy sữa chua của tôi, tôi biết bạn là ai. – H."']]);
chain('coffee', [['#Máy pha cà phê', 'Xin chào. Bạn muốn: cà phê đen, cà phê sữa, hay… tâm sự?']], {
  choices: [
    { text: 'Cà phê đen.', to: 'coffee.black' },
    { text: 'Cà phê sữa.', to: 'coffee.milk' },
    { text: 'Tâm sự.', to: 'coffee.talk' },
  ],
});
chain('coffee.black', [['#Máy pha cà phê', 'Đây. Đắng như deadline chiều thứ Sáu.', { effects: [{ sfx: 'coffee' }] }]]);
chain('coffee.milk', [['#Máy pha cà phê', 'Đây. Ngọt như câu "năm phút thôi" của chị Mai.', { effects: [{ sfx: 'coffee' }] }]]);
chain('coffee.talk', [
  ['#Máy pha cà phê', 'Tôi đã pha 40.000 ly cà phê. Chưa ai hỏi tôi có mệt không. Cảm ơn bạn.', { effects: [{ sfx: 'coffee' }] }],
  [N, 'Máy pha cà phê nhỏ một giọt… nước ngưng tụ. Bạn quyết định tin đó là nước mắt.', { effects: [{ achievement: 'coffee_friend' }] }],
]);
chain('menu', [['#Thực đơn', 'Hôm nay: Cơm gà xối mỡ · Canh chua cá lóc · Rau muống xào tỏi. Tráng miệng: ~~Bánh kem~~ (bị gạch, ghi đè: "BÍ MẬT").']]);
chain('dj.case', [
  ['#Thùng đồ', 'Thùng nhôm sơn chữ: "TÀI SẢN CỦA DJ TƯ – CẤM ĐỤNG". Bên trong lộ ra bàn mixer, đôi tai nghe to và… một bộ ria mép giả dự phòng.'],
  [P, 'DJ… Tư? Chú Tư bảo vệ?', { emote: 'surprised', effects: [{ clue: 'tu_5' }] }],
]);
chain('cake.empty', [[N, 'Bàn tiệc trống, chỉ có khăn trải và chồng đĩa giấy. Một tấm thẻ nhỏ: "Chỗ để bánh".']]);
chain('cake.look', [[N, 'Chiếc bánh đã về chỗ, che bằng một tờ giấy A4 (có chữ ký chị Hạnh). Bạn lén nhìn: "Chào mừng {initial}…" – phần còn lại bị che mất.']]);
chain('huy.lost', [
  ['huy', '…', {
    next: [
      { cond: { notFlag: 'huy1' }, to: 'huy.1' },
      { cond: { notFlag: 'huy2' }, to: 'huy.2' },
      { cond: { notFlag: 'huy3' }, to: 'huy.3' },
      { to: 'huy.4' },
    ],
  }],
]);
chain('huy.1', [['huy', 'Bạn ơi, phòng họp "Sao Hỏa" ở đâu vậy? Tôi có cuộc họp lúc 9 giờ, lịch ghi "Phòng Sao Hỏa, tầng 12".', { emote: 'confused' }]], {
  choices: [
    { text: 'Tòa nhà này chỉ có một tầng thôi anh ạ.', to: 'huy.1a', effects: [{ setFlag: 'huy1' }] },
    { text: 'Chắc ở cạnh phòng Sao Kim đó anh.', to: 'huy.1b', effects: [{ setFlag: 'huy1' }, { stat: 'kyQuac', add: 1 }] },
  ],
});
chain('huy.1a', [['huy', 'Một tầng? Vậy tầng 12 ở đâu? …Đó chính là điều đáng sợ.', { emote: 'surprised' }]]);
chain('huy.1b', [['huy', 'Cảm ơn! Tôi biết ngay mà!', { emote: 'happy' }]]);
chain('huy.2', [['huy', 'Vẫn chưa thấy phòng Sao Hỏa. Tôi đã đi vòng hành lang này 37 lần. Đồng hồ báo tôi đạt 10.000 bước rồi.', { emote: 'sad', effects: [{ setFlag: 'huy2' }] }]]);
chain('huy.3', [['huy', 'Tôi vừa nhận email: cuộc họp 9 giờ đã chuyển sang… online. Từ hôm qua.', { emote: 'sad', effects: [{ setFlag: 'huy3' }] }]]);
chain('huy.4', [['huy', 'Giờ tôi đi tìm chỗ cho chương trình 17 giờ. Họ bảo ở "Hội trường". Nghe nguy hiểm quá.', { emote: 'think' }]]);
chain('duc.clock', [
  ['duc', '…', {
    next: [
      { cond: { questActive: 'q7' }, to: 'duc.q7' },
      { cond: { questActive: 'q6' }, to: 'duc.q6' },
      { cond: { questActive: 'q5' }, to: 'duc.q5' },
      { cond: { questActive: 'q4' }, to: 'duc.q4' },
      { to: 'duc.morning' },
    ],
  }],
]);
chain('duc.morning', [['duc', 'Còn 8 tiếng 30 phút nữa là hết giờ làm. Tôi đang đếm.', { emote: 'think' }]]);
chain('duc.q4', [['duc', 'Còn 6 tiếng 30. Tôi bắt đầu nghe thấy tiếng xe máy ngoài bãi gọi tên tôi.', { emote: 'think' }]]);
chain('duc.q5', [['duc', '3 tiếng 30. Tôi đã thấy được ánh sáng cuối đường hầm.', { emote: 'happy' }]]);
chain('duc.q6', [['duc', '2 tiếng. Tôi đã đeo sẵn balo từ 8 giờ sáng.', { emote: 'happy' }]]);
chain('duc.q7', [
  ['duc', '16 giờ 59! Một phút nữa thôi! Đừng ai nói chữ "gấp" gần tôi!', { emote: 'surprised' }],
  ['duc', '…Tôi vừa nghe thấy chữ "gấp" rồi.', { emote: 'sad' }],
]);
chain('walker.a', [['walker1', 'Chào em! Nhân viên mới hả? Chị đang đi gặp khách, khách bảo "ghé năm phút thôi". Hẹn em năm sau gặp lại nha!', { emote: 'happy' }]]);
chain('walker.b', [['walker2', 'Anh vừa đi lắp mạng cho một bà cụ. Bà cho anh ba trái chuối và hỏi anh có người yêu chưa. Nghề kỹ thuật là vậy đó em.', { emote: 'happy' }]]);
