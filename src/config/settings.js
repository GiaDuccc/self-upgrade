/**
 * ============================================================================
 * FILE CẤU HÌNH TẬP TRUNG (CENTRALIZED SETTINGS)
 * ============================================================================
 * Khi bạn thay đổi bất kỳ mã màu, thang điểm hoặc danh sách công việc nào tại đây,
 * toàn bộ giao diện Web và các biểu đồ (Tròn, Đường) sẽ tự động cập nhật theo.
 * Các phần CSS cục bộ của từng component vẫn hoạt động bình thường.
 */

export const THEME = {
  // 1. Màu nền (Backgrounds)
  bgPrimary: '#FAF7F2',       // Trắng ngả kem nhẹ (nền chính toàn trang)
  bgSurface: '#FFFDF9',       // Nền thẻ / khung nội dung
  bgMixed: '#EBE7E0',         // Màu xám nhạt pha kem (dùng cho vùng hỗn hợp, ô phụ, thanh nền)
  bgMixedSubtle: '#F3F0EA',   // Màu xám nhạt dịu hơn (dùng cho hover nhẹ hoặc vùng đệm)

  // 2. Màu chữ & Viền (Typography & Borders)
  textPrimary: '#222220',     // Đen nhạt (chữ chính)
  textSecondary: '#5C5A55',   // Xám đen (chữ phụ, nhãn)
  textMuted: '#8E8B82',       // Xám mờ (chú thích, ngày trống)
  border: '#222220',          // Viền đen nhạt chủ đạo
  borderSubtle: '#D6D1C7',    // Viền mảnh phân cách nội bộ

  // 3. Màu Nút bấm & Tương tác (Buttons - Đảo màu khi Hover / Active)
  btnBg: '#FFFDF9',           // Nền nút mặc định
  btnText: '#222220',         // Chữ nút mặc định (đen nhạt)
  btnBorder: '#222220',       // Viền nút (đen nhạt)
  btnHoverBg: '#222220',      // Nền nút khi Hover / Đang chọn (đen nhạt)
  btnHoverText: '#FAF7F2',    // Chữ nút khi Hover / Đang chọn (trắng kem)

  // 4. Màu Biểu đồ & Mức độ đánh giá (Charts & Status Levels)
  levelPerfect: '#222220',    // Hoàn Hảo (10đ) - Đen nhạt đậm nét
  levelGood: '#6E6B64',       // Tốt (5đ) - Xám đậm trung tính
  levelBad: '#B8B3A8',        // Tệ (1đ) - Xám nhạt
  levelNone: '#E6E2D8',       // Chưa tích (0đ) - Xám kem rất nhạt

  chartLine: '#222220',       // Màu đường biểu đồ (Line chart)
  chartArea: 'rgba(34, 34, 32, 0.08)', // Màu vùng đổ bóng dưới biểu đồ đường
  chartGrid: '#E2DDD3',       // Đường kẻ lưới trong biểu đồ

  // 5. Bo góc & Font chữ (Layout & Typography)
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '14px',
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

/**
 * Cấu hình thang điểm cho mỗi đầu việc
 * Điểm tối đa 1 việc = 10đ. Hoàn hảo hết 12 việc = 120đ (tương ứng 100%).
 */
export const SCORING = {
  NONE: {
    key: 'NONE',
    label: 'Chưa chọn',
    points: 0,
    colorKey: 'levelNone',
  },
  BAD: {
    key: 'BAD',
    label: 'Tệ',
    points: 1,
    colorKey: 'levelBad',
  },
  GOOD: {
    key: 'GOOD',
    label: 'Tốt',
    points: 5,
    colorKey: 'levelGood',
  },
  PERFECT: {
    key: 'PERFECT',
    label: 'Hoàn Hảo',
    points: 10,
    colorKey: 'levelPerfect',
  },
};

export const LEVEL_LIST = [SCORING.BAD, SCORING.GOOD, SCORING.PERFECT];

/**
 * Các trường / danh mục công việc có thể chọn
 */
export const TASK_CATEGORIES = [
  'Sức khỏe',
  'Kỷ luật',
  'Giải trí',
  'Học tập',
  'Kỹ năng',
  'Sự nghiệp',
  'Dinh dưỡng',
  'Giấc ngủ',
  'Trí tuệ',
  'Khác',
];

/**
 * Danh sách 12 đầu việc mặc định ban đầu
 */
export const DAILY_TASKS = [
  { id: 'wake_5am', title: 'Thức dậy lúc 5h', category: 'Kỷ luật sáng', timeHint: '05:00' },
  { id: 'morning_exercise', title: 'Tập thể dục buổi sáng', category: 'Thể chất', timeHint: 'Buổi sáng' },
  { id: 'learn_english', title: 'Học tiếng Anh', category: 'Ngoại ngữ', timeHint: 'Mỗi ngày' },
  { id: 'learn_code', title: 'Học code', category: 'Kỹ năng', timeHint: 'Chuyên sâu' },
  { id: 'play_2_games', title: 'Chơi game 2 ván', category: 'Giải trí giới hạn', timeHint: 'Tối đa 2 ván' },
  { id: 'nap', title: 'Ngủ trưa', category: 'Phục hồi', timeHint: '20–30 phút' },
  { id: 'gym', title: 'Tập gym', category: 'Thể hình', timeHint: 'Buổi chiều' },
  { id: 'no_junk_food', title: 'Không ăn vặt', category: 'Dinh dưỡng', timeHint: 'Cả ngày' },
  { id: 'drink_3l_water', title: 'Uống 3 lít nước', category: 'Sức khỏe', timeHint: '3.0 Lít' },
  { id: 'work', title: 'Làm việc', category: 'Sự nghiệp', timeHint: 'Tập trung' },
  { id: 'read_book', title: 'Đọc sách', category: 'Trí tuệ', timeHint: 'Mỗi ngày' },
  { id: 'sleep_before_11pm', title: 'Ngủ trước 11h', category: 'Giấc ngủ', timeHint: 'Trước 23:00' },
];

export const MAX_POINTS_PER_TASK = SCORING.PERFECT.points; // 10
export const MAX_DAILY_POINTS = DAILY_TASKS.length * MAX_POINTS_PER_TASK; // 120

/**
 * Xếp hạng mức đạt được của một ngày dựa trên % hoàn thành
 */
export function getDailyRank(percentage, completedCount = 0) {
  if (completedCount === 0 && percentage === 0) {
    return {
      code: 'UNRATED',
      title: 'Chưa ghi nhận',
      description: 'Hãy bắt đầu tích các việc đã làm trong ngày',
    };
  }
  if (percentage >= 90) {
    return {
      code: 'S',
      title: 'Hoàn Hảo',
      description: 'Kỷ luật thép! Một ngày nâng cấp bản thân xuất sắc.',
    };
  }
  if (percentage >= 70) {
    return {
      code: 'A',
      title: 'Tốt',
      description: 'Duy trì nhịp độ rất tốt, hoàn thành phần lớn mục tiêu.',
    };
  }
  if (percentage >= 45) {
    return {
      code: 'B',
      title: 'Trung Bình',
      description: 'Đã có cố gắng nhưng cần tập trung đẩy lên mức Hoàn Hảo.',
    };
  }
  return {
    code: 'C',
    title: 'Tệ',
    description: 'Ngày hôm nay hiệu suất còn thấp, cần chấn chỉnh lại kỷ luật.',
  };
}

/**
 * Kho câu nói ngẫu nhiên (Lời chê, Cảnh tỉnh, Lời khuyên, Lời động viên, Khen ngợi)
 * phân theo các ngưỡng điểm % đạt được trong ngày.
 */
export const FEEDBACK_POOLS = {
  // Chưa tích việc nào (0% & 0 việc)
  UNRATED: [
    {
      tag: 'Lời nhắc',
      tone: 'Khởi động ngày mới',
      message: 'Ngày hôm nay vẫn đang là một tờ giấy trắng. Bắt đầu từ việc nhỏ nhất và tích ngay mục đầu tiên đi!',
      advice: 'Đừng đợi có hứng mới làm. Kỷ luật là làm ngay cả khi lười.',
    },
    {
      tag: 'Lời khuyên',
      tone: 'Tập trung hành động',
      message: 'Chưa có đầu việc nào được ghi nhận. Hãy nhìn danh sách 12 việc bên trái và chọn ngay 1 việc mày có thể hoàn thành trong 30 phút tới.',
      advice: 'Ưu tiên nhóm việc tạo đà: Uống nước, học code hoặc đọc sách.',
    },
    {
      tag: 'Cảnh tỉnh',
      tone: 'Đừng trì hoãn',
      message: 'Một ngày trôi qua rất nhanh. Nếu không bắt đầu tích điểm từ bây giờ, cuối ngày mày sẽ lại tiếc nuối.',
      advice: 'Hãy trung thực đánh giá những việc đã qua trong hôm nay.',
    },
  ],

  // Điểm rất thấp (1% -> 24%): Lời chê gắt & Cảnh tỉnh mạnh
  VERY_LOW: [
    {
      tag: 'Lời chê',
      tone: 'Báo động đỏ về kỷ luật',
      message: 'Điểm số quá thấp! Mày gọi đây là "Self Upgrade" sao? Hôm nay gần như buông thả hoàn toàn.',
      advice: 'Tắt ngay các thứ gây xao nhãng, cứu vãn ngày hôm nay bằng ít nhất 3 việc mức Hoàn Hảo trước khi đi ngủ.',
    },
    {
      tag: 'Lời chê',
      tone: 'Thẳng thắn nhìn nhận',
      message: 'Kết quả hôm nay thực sự tệ. Nếu ngày nào cũng giữ mức điểm lẹt đẹt thế này thì mục tiêu nâng cấp bản thân chỉ là lời nói suông.',
      advice: 'Đừng viện cớ bận hay mệt nữa. Chọn ngay 1 việc học tập và làm nghiêm túc đi!',
    },
    {
      tag: 'Cảnh tỉnh',
      tone: 'Chấn chỉnh ngay lập tức',
      message: 'Toàn là mức Tệ hoặc bỏ trống! Sự dễ dãi với bản thân hôm nay chính là thứ kéo tụt mày lại phía sau.',
      advice: 'Uống đủ nước, dừng ăn vặt và đi ngủ trước 11h để ngày mai làm lại từ đầu lúc 5h sáng.',
    },
    {
      tag: 'Lời chê',
      tone: 'Không chấp nhận sự lười biếng',
      message: 'Mới được vài phần trăm điểm! Mày đang để sự trì hoãn thắng thế hoàn toàn trong ngày hôm nay đấy.',
      advice: 'Hãy gỡ điểm ngay bằng việc Đọc sách và Học tiếng Anh tối nay.',
    },
  ],

  // Điểm thấp (25% -> 44%): Chê + Khuyên cải thiện
  LOW: [
    {
      tag: 'Lời chê',
      tone: 'Dưới mức trung bình',
      message: 'Làm việc kiểu đối phó! Có tích đấy nhưng toàn mức Tệ hoặc bỏ dở nửa chừng thì chưa đủ để thay đổi bản thân đâu.',
      advice: 'Thà làm ít việc mà đạt mức Hoàn Hảo còn hơn việc gì cũng làm qua loa cho có.',
    },
    {
      tag: 'Lời khuyên',
      tone: 'Cần nghiêm khắc hơn',
      message: 'Hiệu suất đang ở vùng nguy hiểm (<45%). Mày đã bắt đầu nhúc nhích nhưng vẫn còn chiều chuộng bản thân quá nhiều.',
      advice: 'Rà soát lại những việc đang bị đánh dấu "Tệ" bên trái và tìm cách nâng chúng lên "Tốt" ngay.',
    },
    {
      tag: 'Lời chê',
      tone: 'Thiếu sự bứt phá',
      message: 'Điểm số này chứng tỏ hôm nay mày mất tập trung khá nhiều. Đừng tự hài lòng với vài điểm lẻ tẻ!',
      advice: 'Cắt ngay thời gian lướt mạng vô bổ, tập trung vào Học code và Làm việc.',
    },
    {
      tag: 'Động viên & Nhắc nhở',
      tone: 'Vẫn còn cơ hội gỡ điểm',
      message: 'Chưa tới 45% — kết quả còn yếu, nhưng ngày hôm nay vẫn chưa khép lại hoàn toàn.',
      advice: 'Hoàn thành tốt các việc buổi tối (Đọc sách, Ngủ trước 11h, Không ăn vặt) sẽ kéo điểm lên mốc an toàn.',
    },
  ],

  // Điểm trung bình (45% -> 69%): Vừa khích lệ vừa thúc đẩy
  MEDIUM: [
    {
      tag: 'Lời khuyên',
      tone: 'Vượt mức trung bình, cần bứt tốc',
      message: 'Mức Trung Bình! Mày đã làm được hơn một nửa chặng đường, nhưng khoảng cách giữa người bình thường và người xuất sắc nằm ở 30% còn lại.',
      advice: 'Chỉ cần đẩy thêm 2–3 đầu việc từ "Tốt" lên "Hoàn Hảo" là mày sẽ chạm ngưỡng Tốt (≥70%).',
    },
    {
      tag: 'Lời động viên',
      tone: 'Đà tiến triển khá',
      message: 'Không tệ! Nhịp sinh hoạt hôm nay đã có khuôn khổ hơn, nhưng vẫn còn vài mắt xích yếu làm tụt tổng điểm.',
      advice: 'Chú ý giữ kỷ luật giấc ngủ và thể chất (Tập gym, Uống 3 lít nước) để duy trì năng lượng.',
    },
    {
      tag: 'Nhắc nhở',
      tone: 'Đừng dừng ở vùng an toàn',
      message: 'Điểm số tạm chấp nhận được nhưng chưa thực sự ấn tượng. Đừng để bản thân mắc kẹt ở mức "tạm ổn" mãi.',
      advice: 'Hãy nhìn những ô còn trống chưa chọn và giải quyết dứt điểm trước 23:00.',
    },
    {
      tag: 'Lời khuyên',
      tone: 'Tối ưu chất lượng',
      message: 'Số lượng việc làm được khá nhiều nhưng tỷ lệ mức "Hoàn Hảo" chưa áp đảo.',
      advice: 'Lần tới khi ngồi vào bàn Học code hay Học tiếng Anh, hãy bật chế độ không làm phiền để đạt 10đ trọn vẹn.',
    },
  ],

  // Điểm tốt (70% -> 89%): Động viên mạnh & Khen ngợi
  GOOD: [
    {
      tag: 'Lời động viên',
      tone: 'Phong độ rất đáng khen!',
      message: 'Rất tốt! Đạt trên 70% chứng tỏ hôm nay mày có tính tự giác và kỷ luật rất cao. Cứ giữ đà này mỗi ngày là sẽ lột xác.',
      advice: 'Chỉ còn thiếu một chút tinh chỉnh nhỏ ở vài đầu việc nữa thôi là chạm mốc S (Hoàn Hảo).',
    },
    {
      tag: 'Lời khen',
      tone: 'Kiểm soát ngày hiệu quả',
      message: 'Một ngày làm việc và rèn luyện năng suất! Mày đã cân bằng tốt giữa học tập, công việc và sức khỏe.',
      advice: 'Nhớ chốt hạ ngày hôm nay bằng việc đi ngủ trước 11h để bảo toàn năng lượng cho ngày mai.',
    },
    {
      tag: 'Lời động viên',
      tone: 'Sát nút đỉnh cao',
      message: 'Hiệu suất thuộc nhóm dẫn đầu! Rất ít người duy trì được khối lượng 12 thói quen ở ngưỡng điểm này.',
      advice: 'Xem lại 1–2 việc chưa đạt 10đ hôm nay để ngày mai chinh phục cột mốc 90–100%.',
    },
  ],

  // Điểm xuất sắc / Hoàn hảo (90% -> 100%): Tán thưởng đỉnh cao
  PERFECT: [
    {
      tag: 'Tán thưởng',
      tone: 'Kỷ luật thép — Hạng S!',
      message: 'Đỉnh cao! Một ngày gần như không có điểm trừ. Đây chính xác là phiên bản nâng cấp mà mày đang hướng tới!',
      advice: 'Hãy tự hào về ngày hôm nay, nghỉ ngơi chất lượng và giữ vững chuỗi phong độ này vào ngày mai.',
    },
    {
      tag: 'Lời khen',
      tone: '100% Năng lượng & Bản lĩnh',
      message: 'Không còn gì để chê! Từ dậy sớm 5h, rèn luyện thể chất, trí tuệ đến kỷ luật ăn uống và giải trí đều tuyệt vời.',
      advice: 'Ghi chú lại cảm giác chiến thắng bản thân hôm nay vào ô nhật ký bên dưới nhé!',
    },
    {
      tag: 'Tán thưởng',
      tone: 'Chiến thần kỷ luật',
      message: 'Quá xuất sắc! Khi mày làm chủ được từng giờ trong ngày như thế này, mọi mục tiêu lớn đều chỉ là vấn đề thời gian.',
      advice: 'Duy trì nhịp độ này nhưng đừng quên lắng nghe cơ thể để đi đường dài bền vững.',
    },
  ],
};

/**
 * Nhận xét phụ tự động dựa trên các đầu việc cụ thể được tích Tệ hoặc Hoàn Hảo trong ngày
 */
export const TASK_SPECIFIC_NOTES = {
  wake_5am: {
    BAD: 'Dậy trễ làm mất lợi thế buổi sáng. Tối nay phải ngủ sớm hơn!',
    PERFECT: 'Dậy đúng 5h sáng — khởi đầu hoàn hảo giúp làm chủ cả ngày dài.',
  },
  morning_exercise: {
    BAD: 'Bỏ bê thể dục sáng dễ khiến cơ thể uể oải cả buổi.',
    PERFECT: 'Tập thể dục sáng đầy đủ giúp bơm máu và sự tỉnh táo lên não bộ.',
  },
  learn_english: {
    BAD: 'Tiếng Anh cần sự đều đặn mỗi ngày, học qua loa sẽ rất nhanh quên.',
    PERFECT: 'Duy trì học tiếng Anh xuất sắc, vốn ngoại ngữ đang dày lên từng ngày.',
  },
  learn_code: {
    BAD: 'Học code mà thiếu tập trung thì khó nâng trình tư duy thuật toán & dự án.',
    PERFECT: 'Giờ học code chất lượng cao! Kỹ năng lập trình đang tăng tiến rõ rệt.',
  },
  play_2_games: {
    BAD: 'Chơi game quá đà hoặc mất kiểm soát thời gian rồi! Phải dừng đúng 2 ván.',
    PERFECT: 'Giải trí đúng kỷ luật (chỉ 2 ván), biết điểm dừng là bản lĩnh lớn.',
  },
  nap: {
    BAD: 'Ngủ trưa quá lâu hoặc không ngủ trưa đều làm giảm sự tỉnh táo buổi chiều.',
    PERFECT: 'Ngủ trưa vừa vặn giúp sạc lại 100% pin cho buổi chiều.',
  },
  gym: {
    BAD: 'Buổi tập gym hôm nay chưa đạt yêu cầu, đừng để cơ bắp ngủ quên.',
    PERFECT: 'Buổi tập gym cháy hết mình! Thể hình và sức bền đang được nâng cấp.',
  },
  no_junk_food: {
    BAD: 'Lại ăn vặt rồi! Đồ ăn vặt chỉ sướng miệng lúc đó nhưng hại dáng và gây mệt.',
    PERFECT: 'Kiểm soát miệng cực tốt — nói không tuyệt đối với đồ ăn vặt!',
  },
  drink_3l_water: {
    BAD: 'Uống quá ít nước! Hãy để sẵn bình nước ngay trước mặt bàn làm việc.',
    PERFECT: 'Đủ 3 lít nước — cơ thể và làn da được thanh lọc tối đa.',
  },
  work: {
    BAD: 'Hiệu suất làm việc chính hôm nay còn xao nhãng, cần dùng kỹ thuật Pomodoro.',
    PERFECT: 'Hoàn thành công việc với độ tập trung tuyệt đối!',
  },
  read_book: {
    BAD: 'Chưa đọc sách nghiêm túc hôm nay. Hãy đọc ít nhất 10–15 trang trước khi ngủ.',
    PERFECT: 'Đọc sách trọn vẹn — bồi đắp tư duy và chiều sâu trí tuệ mỗi tối.',
  },
  sleep_before_11pm: {
    BAD: 'Thức khuya sau 11h sẽ phá hỏng luôn mục tiêu dậy 5h sáng ngày mai!',
    PERFECT: 'Lên giường trước 11h đêm — bảo vệ giấc ngủ sâu và kỷ luật ngày mới.',
  },
};

/**
 * Hàm tự động đồng bộ toàn bộ thông số từ THEME sang biến CSS toàn cục (:root)
 */
export function applyThemeToRoot(customTheme = THEME) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const cssVarMap = {
    '--bg-primary': customTheme.bgPrimary,
    '--bg-surface': customTheme.bgSurface,
    '--bg-mixed': customTheme.bgMixed,
    '--bg-mixed-subtle': customTheme.bgMixedSubtle,
    '--text-primary': customTheme.textPrimary,
    '--text-secondary': customTheme.textSecondary,
    '--text-muted': customTheme.textMuted,
    '--border-color': customTheme.border,
    '--border-subtle': customTheme.borderSubtle,
    '--btn-bg': customTheme.btnBg,
    '--btn-text': customTheme.btnText,
    '--btn-border': customTheme.btnBorder,
    '--btn-hover-bg': customTheme.btnHoverBg,
    '--btn-hover-text': customTheme.btnHoverText,
    '--level-perfect': customTheme.levelPerfect,
    '--level-good': customTheme.levelGood,
    '--level-bad': customTheme.levelBad,
    '--level-none': customTheme.levelNone,
    '--chart-line': customTheme.chartLine,
    '--chart-area': customTheme.chartArea,
    '--chart-grid': customTheme.chartGrid,
    '--radius-sm': customTheme.radiusSm,
    '--radius-md': customTheme.radiusMd,
    '--radius-lg': customTheme.radiusLg,
    '--font-sans': customTheme.fontSans,
    '--font-mono': customTheme.fontMono,
  };

  Object.entries(cssVarMap).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * ============================================================================
 * CẤU HÌNH CÁ NHÂN HÓA: THỂ CHẤT, TINH THẦN, CẢM XÚC & MỤC TIÊU TRỌNG TÂM
 * ============================================================================
 */
export const PERSONALIZATION_OPTIONS = {
  physicalStates: [
    {
      id: 'PEAK',
      label: 'Sung sức / Đỉnh cao',
      desc: 'Cơ thể tràn đầy năng lượng, sẵn sàng tải cường độ cao',
      resilienceBonus: 0,
    },
    {
      id: 'NORMAL',
      label: 'Bình thường / Ổn định',
      desc: 'Thể trạng tiêu chuẩn hàng ngày, đủ sức hoàn thành hết việc',
      resilienceBonus: 0,
    },
    {
      id: 'TIRED',
      label: 'Mệt mỏi / Đau cơ / Thiếu ngủ',
      desc: 'Cơ thể uể oải (+5% điểm vượt khó khi vẫn duy trì kỷ luật)',
      resilienceBonus: 5,
    },
    {
      id: 'EXHAUSTED',
      label: 'Đang ốm / Kiệt sức',
      desc: 'Cần ưu tiên hồi phục (+10% điểm bản lĩnh khi cố gắng hoàn thành việc)',
      resilienceBonus: 10,
    },
  ],

  mentalStates: [
    {
      id: 'SHARP',
      label: 'Minh mẫn / Tập trung cao',
      desc: 'Đầu óc sắc bén, thời điểm vàng để Học code, Tiếng Anh, Làm việc',
      resilienceBonus: 0,
    },
    {
      id: 'STEADY',
      label: 'Ổn định / Bình thường',
      desc: 'Tâm trí bình thường, duy trì nhịp độ làm việc đều đặn',
      resilienceBonus: 0,
    },
    {
      id: 'DISTRACTED',
      label: 'Dễ xao nhãng / Mất tập trung',
      desc: 'Tâm trí dễ bị phân tán (+3% điểm nếu kiểm soát tốt kỷ luật)',
      resilienceBonus: 3,
    },
    {
      id: 'STRESSED',
      label: 'Căng thẳng / Quá tải (Burnout)',
      desc: 'Áp lực tinh thần cao (+6% điểm khích lệ khi vẫn giữ nhịp sinh hoạt)',
      resilienceBonus: 6,
    },
  ],

  emotionalStates: [
    {
      id: 'FIRED_UP',
      label: 'Hào hứng / Quyết tâm cao',
      desc: 'Động lực mạnh mẽ — đòi hỏi kết quả phải xứng tầm quyết tâm',
      resilienceBonus: 0,
    },
    {
      id: 'CALM',
      label: 'Bình tĩnh / Cân bằng',
      desc: 'Tâm trạng điềm tĩnh, làm chủ tốt cảm xúc và thói quen',
      resilienceBonus: 0,
    },
    {
      id: 'ANXIOUS',
      label: 'Lo âu / Bồn chồn',
      desc: 'Có nhiều nỗi lo ngổn ngang (+3% điểm vượt rào cản cảm xúc)',
      resilienceBonus: 3,
    },
    {
      id: 'LOW_MOOD',
      label: 'Chán nản / Tụt mood',
      desc: 'Tâm trạng đi xuống (+6% điểm bản lĩnh nếu không buông xuôi)',
      resilienceBonus: 6,
    },
  ],

  focusGoals: [
    {
      id: 'BALANCED',
      label: 'Phát triển Toàn diện',
      desc: 'Mọi đầu việc đều có trọng số ngang nhau (×1.0)',
      boostCategories: [],
      boostTaskIds: [],
    },
    {
      id: 'CAREER_MIND',
      label: 'Sự nghiệp & Trí tuệ (×1.25)',
      desc: 'Nhân ×1.25 điểm cho Học code, Tiếng Anh, Làm việc, Đọc sách',
      boostCategories: ['Học tập', 'Kỹ năng', 'Ngoại ngữ', 'Sự nghiệp', 'Trí tuệ'],
      boostTaskIds: ['learn_code', 'learn_english', 'work', 'read_book'],
    },
    {
      id: 'HEALTH_BODY',
      label: 'Thể chất & Sức khỏe (×1.25)',
      desc: 'Nhân ×1.25 điểm cho Thể dục sáng, Gym, Uống nước, Dinh dưỡng, Ngủ',
      boostCategories: ['Sức khỏe', 'Thể chất', 'Thể hình', 'Dinh dưỡng', 'Giấc ngủ', 'Phục hồi'],
      boostTaskIds: ['morning_exercise', 'gym', 'drink_3l_water', 'no_junk_food', 'sleep_before_11pm', 'nap'],
    },
    {
      id: 'IRON_DISCIPLINE',
      label: 'Kỷ luật thép & Kiểm soát bản thân (×1.25)',
      desc: 'Nhân ×1.25 điểm cho Dậy 5h, Ngủ trước 11h, Giới hạn Game, Không ăn vặt',
      boostCategories: ['Kỷ luật', 'Kỷ luật sáng', 'Giải trí', 'Giải trí giới hạn'],
      boostTaskIds: ['wake_5am', 'sleep_before_11pm', 'play_2_games', 'no_junk_food'],
    },
  ],

  coachingStyles: [
    {
      id: 'STRICT',
      label: 'Khắc nghiệt / Thẳng thắn',
      desc: 'Chê gắt khi lười biếng, đòi hỏi chuẩn kỷ luật cao hơn (-4% nếu có việc Tệ)',
    },
    {
      id: 'BALANCED',
      label: 'Thực tế / Công tâm',
      desc: 'Khen chê khách quan, kết hợp phân tích điểm số và trạng thái cá nhân',
    },
    {
      id: 'EMPATHETIC',
      label: 'Thấu cảm / Đồng hành',
      desc: 'Nhẹ nhàng khích lệ, ưu tiên phục hồi khi thể chất hoặc tinh thần xuống thấp',
    },
  ],
};

export const DEFAULT_USER_PROFILE = {
  name: '',
  age: '',
  weightKg: '',
  heightCm: '',
  sleepTargetHours: '7',
  physicalState: 'NORMAL',
  mentalState: 'STEADY',
  emotionalState: 'CALM',
  focusGoal: 'BALANCED',
  coachingStyle: 'BALANCED',
  personalMotto: '',
};

/**
 * Kiểm tra xem 1 đầu việc có nằm trong nhóm mục tiêu ưu tiên (được nhân trọng số ×1.25) hay không
 */
export function isTaskBoostedByProfile(task, userProfile = DEFAULT_USER_PROFILE) {
  if (!task || !userProfile) return false;
  const goalObj =
    PERSONALIZATION_OPTIONS.focusGoals.find(
      (g) => g.id === userProfile.focusGoal
    ) || PERSONALIZATION_OPTIONS.focusGoals[0];

  if (goalObj.id === 'BALANCED') return false;
  if (goalObj.boostTaskIds.includes(task.id)) return true;
  if (
    task.category &&
    goalObj.boostCategories.some(
      (cat) => task.category.toLowerCase() === cat.toLowerCase()
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Tạo phân tích & lời khuyên/lời chê cá nhân hóa dựa trên Hồ sơ (Thể chất, Tinh thần, Cảm xúc) + Điểm ngày đó
 */
export function buildPersonalizedCoaching(
  userProfile = DEFAULT_USER_PROFILE,
  dayStats,
  tasksMap = {}
) {
  const p = { ...DEFAULT_USER_PROFILE, ...(userProfile || {}) };
  const callName = p.name?.trim() ? p.name.trim() : 'Mày';
  const pct = dayStats?.percentage || 0;
  const checkedCount = dayStats?.checkedCount || 0;
  const badCount = dayStats?.counts?.BAD || 0;
  const perfectCount = dayStats?.counts?.PERFECT || 0;

  const physObj =
    PERSONALIZATION_OPTIONS.physicalStates.find((x) => x.id === p.physicalState) ||
    PERSONALIZATION_OPTIONS.physicalStates[1];
  const mentObj =
    PERSONALIZATION_OPTIONS.mentalStates.find((x) => x.id === p.mentalState) ||
    PERSONALIZATION_OPTIONS.mentalStates[1];
  const emoObj =
    PERSONALIZATION_OPTIONS.emotionalStates.find((x) => x.id === p.emotionalState) ||
    PERSONALIZATION_OPTIONS.emotionalStates[1];
  const goalObj =
    PERSONALIZATION_OPTIONS.focusGoals.find((x) => x.id === p.focusGoal) ||
    PERSONALIZATION_OPTIONS.focusGoals[0];

  const isLowBody = p.physicalState === 'TIRED' || p.physicalState === 'EXHAUSTED';
  const isPeakBody = p.physicalState === 'PEAK';
  const isLowMind = p.mentalState === 'DISTRACTED' || p.mentalState === 'STRESSED';
  const isSharpMind = p.mentalState === 'SHARP';
  const isLowEmotion = p.emotionalState === 'ANXIOUS' || p.emotionalState === 'LOW_MOOD';
  const isHighEmotion = p.emotionalState === 'FIRED_UP';

  // 1. Nhận xét kết hợp Trạng thái (Thể chất + Tinh thần + Cảm xúc) và Kết quả điểm
  let stateHeadline = '';
  let stateCritiqueOrPraise = '';
  let stateActionableAdvice = '';

  if (checkedCount === 0) {
    stateHeadline = `${callName} chưa bắt đầu ghi nhận ngày hôm nay`;
    if (isLowBody || isLowMind || isLowEmotion) {
      stateCritiqueOrPraise = `Hôm nay thể trạng đang "${physObj.label}" và cảm xúc "${emoObj.label}". Đừng để cảm giác nặng nề làm tê liệt toàn bộ ngày của ${callName.toLowerCase()}.`;
      stateActionableAdvice = `Không cần ép bản thân làm việc quá nặng ngay lúc này. Hãy bắt đầu bằng 2 việc nhẹ nhất: Uống nước và Đọc vài trang sách để kích hoạt lại nhịp sinh học.`;
    } else {
      stateCritiqueOrPraise = `Thể chất đang "${physObj.label}", tinh thần "${mentObj.label}" mà vẫn chưa tích nổi 1 việc nào sao ${callName}? Đừng lãng phí trạng thái tốt!`;
      stateActionableAdvice = `Bắt tay ngay vào nhóm mục tiêu "${goalObj.label}" và hoàn thành ít nhất 3 đầu việc mức Hoàn Hảo ngay bây giờ.`;
    }
  } else if (pct < 45) {
    // ĐIỂM THẤP (<45%)
    if (isPeakBody || isSharpMind || isHighEmotion || p.coachingStyle === 'STRICT') {
      stateHeadline = `Đáng trách! Trạng thái tốt nhưng kết quả quá kém (${pct}%)`;
      stateCritiqueOrPraise = `${callName} tự nhận hôm nay "${physObj.label}" và "${emoObj.label}", vậy mà điểm số chỉ lẹt đẹt ${pct}% (${badCount} việc mức Tệ)! Đây không phải là thiếu năng lực mà là sự buông thả và thiếu tự trọng với mục tiêu của chính mình.`;
      stateActionableAdvice = `Dừng ngay mọi lý do biện minh! Nếu đã có sức khỏe và sự minh mẫn, ${callName.toLowerCase()} bắt buộc phải gỡ lại điểm ở các mục Học code, Làm việc và Tập gym ngay lập tức.`;
    } else if (isLowBody || isLowMind || isLowEmotion) {
      stateHeadline = `Báo động năng lượng thấp & hiệu suất suy giảm (${pct}%)`;
      stateCritiqueOrPraise = `Cơ thể đang "${physObj.label}", tinh thần "${mentObj.label}" kèm cảm xúc "${emoObj.label}" đã kéo điểm hôm nay xuống ${pct}%. Tuy nhiên, đánh dấu ${badCount} việc ở mức Tệ cho thấy ${callName.toLowerCase()} đang để cảm xúc tiêu cực dẫn dắt hành vi.`;
      stateActionableAdvice = `Tuyệt đối không thức khuya hay ăn vặt để giải tỏa stress! Hãy ưu tiên Ngủ trưa 20 phút, Uống đủ nước và lên giường trước 11h đêm nay để cắt đứt chuỗi tụt dốc này.`;
    } else {
      stateHeadline = `Hiệu suất dưới chuẩn (${pct}%) — Cần chấn chỉnh kỷ luật`;
      stateCritiqueOrPraise = `${callName} đang ở trạng thái bình thường nhưng kết quả hôm nay quá rời rạc. Sự trì hoãn đang ăn mòn mục tiêu "${goalObj.label}" của ${callName.toLowerCase()}.`;
      stateActionableAdvice = `Chọn ra 2 việc thuộc nhóm "${goalObj.label}" và đẩy lên mức Hoàn Hảo (10đ) trước khi kết thúc ngày.`;
    }
  } else if (pct < 75) {
    // ĐIỂM TRUNG BÌNH - KHÁ (45% - 74%)
    if (isLowBody || isLowMind || isLowEmotion) {
      stateHeadline = `Bản lĩnh vượt khó đáng ghi nhận (${pct}%)!`;
      stateCritiqueOrPraise = `Dù thể chất đang "${physObj.label}" và cảm xúc "${emoObj.label}", ${callName} vẫn kiên trì đạt ${pct}% (đã được cộng điểm thưởng vượt khó). Đó là tinh thần không bỏ cuộc rất đáng khen!`;
      stateActionableAdvice = `Hôm nay không cần ép mình quá sức đến kiệt quệ. Hãy hoàn thành gọn các việc nhẹ còn lại và ưu tiên giấc ngủ chất lượng (${p.sleepTargetHours || 7} tiếng) tối nay.`;
    } else {
      stateHeadline = `Đạt mức an toàn (${pct}%) nhưng chưa xứng với tiềm năng`;
      stateCritiqueOrPraise = `Với thể chất "${physObj.label}" và tinh thần "${mentObj.label}", mức ${pct}% chỉ mới là tròn vai chứ chưa phải là bứt phá đâu ${callName}. Vẫn còn những việc làm nửa vời!`;
      stateActionableAdvice = `Hãy dồn sự tập trung vào nhóm ưu tiên "${goalObj.label}" (đang được nhân ×1.25 điểm) để bứt tốc lên ngưỡng Tốt / Hoàn Hảo (>75%).`;
    }
  } else {
    // ĐIỂM TỐT & HOÀN HẢO (>= 75%)
    if (isLowBody || isLowMind || isLowEmotion) {
      stateHeadline = `Phi thường! Chiến thắng nghịch cảnh (${pct}%)`;
      stateCritiqueOrPraise = `Quá nể phục ${callName}! Trong một ngày mà cơ thể "${physObj.label}" và tâm trạng "${emoObj.label}", mày vẫn nghiến răng hoàn thành xuất sắc ${perfectCount} việc Hoàn Hảo để cán mốc ${pct}%. Đây chính là bản lĩnh của kẻ mạnh!`;
      stateActionableAdvice = `Mày đã vượt qua giới hạn bản thân hôm nay rồi. Giờ là lúc thưởng cho cơ thể một giấc ngủ sâu trước 11h để phục hồi hoàn toàn.`;
    } else {
      stateHeadline = `Phong độ đỉnh cao — Hợp nhất Thể chất & Tinh thần (${pct}%)`;
      stateCritiqueOrPraise = `Tuyệt vời ${callName}! Khi thể chất "${physObj.label}" kết hợp với tinh thần "${mentObj.label}" và kỷ luật tự giác, mày đã tạo ra một ngày hiệu suất cực kỳ ấn tượng (${perfectCount} đầu việc Hoàn Hảo).`;
      stateActionableAdvice = `Hãy duy trì trạng thái dòng chảy (Flow state) này cho mục tiêu "${goalObj.label}" vào ngày mai. Đừng quên ngủ đúng giờ để giữ phong độ dài hạn!`;
    }
  }

  // 2. Gợi ý sinh học cá nhân hóa (Dựa theo cân nặng / chiều cao nếu có nhập)
  let bioMetricsHint = null;
  const weight = parseFloat(p.weightKg);
  const height = parseFloat(p.heightCm);
  if (weight > 25 && weight < 250) {
    const recommendedWaterLiters = Math.round(weight * 0.04 * 10) / 10;
    let bmiInfo = '';
    if (height > 100 && height < 250) {
      const hMeter = height / 100;
      const bmi = Math.round((weight / (hMeter * hMeter)) * 10) / 10;
      let bmiLabel = 'Chuẩn';
      if (bmi < 18.5) bmiLabel = 'Thiếu cân — cần tăng dinh dưỡng & tập kháng lực';
      else if (bmi >= 23 && bmi < 25) bmiLabel = 'Hơi thừa cân — siết chặt Không ăn vặt & Tập gym';
      else if (bmi >= 25) bmiLabel = 'Thừa cân — bắt buộc kỷ luật Không ăn vặt & Cardio sáng';
      bmiInfo = `BMI: ${bmi} (${bmiLabel}) • `;
    }
    bioMetricsHint = `${bmiInfo}Với cân nặng ${weight}kg, cơ thể cần tối thiểu ~${recommendedWaterLiters} lít nước/ngày và ngủ đủ ${p.sleepTargetHours || 7}h.`;
  }

  return {
    callName,
    physObj,
    mentObj,
    emoObj,
    goalObj,
    stateHeadline,
    stateCritiqueOrPraise,
    stateActionableAdvice,
    bioMetricsHint,
    personalMotto: p.personalMotto?.trim() || '',
  };
}

