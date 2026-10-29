import { TaskItem, TaskLevelKey, UserProfile } from '~/types';

export const THEME = {
  bgPrimary: '#FAF7F2',
  bgSurface: '#FFFDF9',
  bgMixed: '#EBE7E0',
  bgMixedSubtle: '#F3F0EA',
  textPrimary: '#222220',
  textSecondary: '#5C5A55',
  textMuted: '#8E8B82',
  border: '#222220',
  borderSubtle: '#D6D1C7',
  btnBg: '#FFFDF9',
  btnText: '#222220',
  btnBorder: '#222220',
  btnHoverBg: '#222220',
  btnHoverText: '#FAF7F2',
  levelPerfect: '#222220',
  levelGood: '#6E6B64',
  levelBad: '#B8B3A8',
  levelNone: '#E6E2D8',
  chartLine: '#222220',
  chartArea: 'rgba(34, 34, 32, 0.08)',
  chartGrid: '#E2DDD3',
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '14px',
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', monospace",
  stateBad: '#DC2626',
  stateMedium: '#ee651b',
  stateGood: '#ffbb00',
  statePerfect: '#16A34A',
};

export interface ScoreLevelDef {
  key: TaskLevelKey;
  label: string;
  points: number;
  colorKey: string;
}

export const SCORING: Record<TaskLevelKey, ScoreLevelDef> = {
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

export const LEVEL_LIST: ScoreLevelDef[] = [
  SCORING.BAD,
  SCORING.GOOD,
  SCORING.PERFECT,
];

export const TASK_CATEGORIES: string[] = [
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

export const DAILY_TASKS: TaskItem[] = [
  { id: 'wake_5am', title: 'Thức dậy lúc 5h', category: 'Kỷ luật sáng', timeHint: '05:00', hour: 5, columnIndex: 0 },
  { id: 'learn_english', title: 'Học tiếng Anh', category: 'Ngoại ngữ', timeHint: '07:00', hour: 7, columnIndex: 0 },
  { id: 'work', title: 'Làm việc', category: 'Sự nghiệp', timeHint: '08:00', hour: 8, columnIndex: 0 },
  { id: 'learn_code', title: 'Học code', category: 'Kỹ năng', timeHint: '09:00', hour: 9, columnIndex: 0 },
  { id: 'play_2_games', title: 'Chơi game 2 ván', category: 'Giải trí giới hạn', timeHint: '11:00', hour: 11, columnIndex: 0 },
  { id: 'nap', title: 'Ngủ trưa', category: 'Phục hồi', timeHint: '13:00', hour: 13, columnIndex: 0 },
  { id: 'drink_3l_water', title: 'Uống 3 lít nước', category: 'Sức khỏe', timeHint: 'Cả ngày', isAllDay: true },
  { id: 'gym', title: 'Tập gym', category: 'Thể hình', timeHint: '17:00', hour: 17, columnIndex: 0 },
  { id: 'no_junk_food', title: 'Không ăn vặt', category: 'Dinh dưỡng', timeHint: 'Cả ngày', isAllDay: true },
  { id: 'sleep_before_11pm', title: 'Ngủ trước 11h', category: 'Giấc ngủ', timeHint: '22:00', hour: 22, columnIndex: 0 },
];

export const MAX_POINTS_PER_TASK = SCORING.PERFECT.points;
export const MAX_DAILY_POINTS = DAILY_TASKS.length * MAX_POINTS_PER_TASK;

export interface DailyRank {
  code: string;
  title: string;
  description: string;
}

export function getDailyRank(percentage: number, completedCount = 0): DailyRank {
  if (completedCount === 0 && percentage === 0) {
    return {
      code: 'UNRATED',
      title: 'Chưa ghi',
      description: 'Hãy bắt đầu tích các việc đã làm trong ngày',
    };
  }
  if (percentage > 85) {
    return {
      code: 'S',
      title: 'Hoàn Hảo',
      description: 'Kỷ luật thép! Một ngày nâng cấp bản thân xuất sắc.',
    };
  }
  if (percentage >= 60) {
    return {
      code: 'A',
      title: 'Tốt',
      description: 'Duy trì nhịp độ rất tốt, hoàn thành phần lớn mục tiêu.',
    };
  }
  if (percentage >= 40) {
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

export const PERSONALIZATION_OPTIONS = {
  physicalStates: [
    {
      id: 'EXHAUSTED',
      tier: 'bad',
      tierLabel: 'Xấu',
      color: '#DC2626',
      label: 'Đang ốm / Kiệt sức',
      desc: 'Cần ưu tiên hồi phục (+10% điểm bản lĩnh khi cố gắng hoàn thành việc)',
      resilienceBonus: 10,
    },
    {
      id: 'TIRED',
      tier: 'medium',
      tierLabel: 'Vừa',
      color: '#EA580C',
      label: 'Mệt mỏi / Đau cơ / Thiếu ngủ',
      desc: 'Cơ thể uể oải (+5% điểm vượt khó khi vẫn duy trì kỷ luật)',
      resilienceBonus: 5,
    },
    {
      id: 'NORMAL',
      tier: 'good',
      tierLabel: 'Tốt',
      color: '#D97706',
      label: 'Bình thường / Ổn định',
      desc: 'Thể trạng tiêu chuẩn hàng ngày, đủ sức hoàn thành hết việc',
      resilienceBonus: 0,
    },
    {
      id: 'PEAK',
      tier: 'perfect',
      tierLabel: 'Hoàn hảo',
      color: '#16A34A',
      label: 'Sung sức / Đỉnh cao',
      desc: 'Cơ thể tràn đầy năng lượng, sẵn sàng tải cường độ cao',
      resilienceBonus: 0,
    },
  ],

  mentalStates: [
    {
      id: 'STRESSED',
      tier: 'bad',
      tierLabel: 'Xấu',
      color: '#DC2626',
      label: 'Căng thẳng / Quá tải (Burnout)',
      desc: 'Áp lực tinh thần cao (+6% điểm khích lệ khi vẫn giữ nhịp sinh hoạt)',
      resilienceBonus: 6,
    },
    {
      id: 'DISTRACTED',
      tier: 'medium',
      tierLabel: 'Vừa',
      color: '#EA580C',
      label: 'Dễ xao nhãng / Mất tập trung',
      desc: 'Tâm trí dễ bị phân tán (+3% điểm nếu kiểm soát tốt kỷ luật)',
      resilienceBonus: 3,
    },
    {
      id: 'STEADY',
      tier: 'good',
      tierLabel: 'Tốt',
      color: '#D97706',
      label: 'Ổn định / Bình thường',
      desc: 'Tâm trí bình thường, duy trì nhịp độ làm việc đều đặn',
      resilienceBonus: 0,
    },
    {
      id: 'SHARP',
      tier: 'perfect',
      tierLabel: 'Hoàn hảo',
      color: '#16A34A',
      label: 'Minh mẫn / Tập trung cao',
      desc: 'Đầu óc sắc bén, thời điểm vàng để Học code, Tiếng Anh, Làm việc',
      resilienceBonus: 0,
    },
  ],

  emotionalStates: [
    {
      id: 'LOW_MOOD',
      tier: 'bad',
      tierLabel: 'Xấu',
      color: '#DC2626',
      label: 'Chán nản / Tụt mood',
      desc: 'Tâm trạng đi xuống (+6% điểm bản lĩnh nếu không buông xuôi)',
      resilienceBonus: 6,
    },
    {
      id: 'ANXIOUS',
      tier: 'medium',
      tierLabel: 'Vừa',
      color: '#EA580C',
      label: 'Lo âu / Bồn chồn',
      desc: 'Có nhiều nỗi lo ngổn ngang (+3% điểm vượt rào cản cảm xúc)',
      resilienceBonus: 3,
    },
    {
      id: 'CALM',
      tier: 'good',
      tierLabel: 'Tốt',
      color: '#D97706',
      label: 'Bình tĩnh / Cân bằng',
      desc: 'Tâm trạng điềm tĩnh, làm chủ tốt cảm xúc và thói quen',
      resilienceBonus: 0,
    },
    {
      id: 'FIRED_UP',
      tier: 'perfect',
      tierLabel: 'Hoàn hảo',
      color: '#16A34A',
      label: 'Hào hứng / Quyết tâm cao',
      desc: 'Động lực mạnh mẽ — đòi hỏi kết quả phải xứng tầm quyết tâm',
      resilienceBonus: 0,
    },
  ],

  focusGoals: [
    {
      id: 'BALANCED',
      label: 'Phát triển Toàn diện',
      desc: 'Mọi đầu việc đều có trọng số ngang nhau (×1.0)',
      boostCategories: [] as string[],
      boostTaskIds: [] as string[],
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

  workoutGoals: [
    {
      id: 'HYPERTROPHY',
      label: 'Tăng cơ bắp tối đa (Hypertrophy)',
      labelEn: 'Hypertrophy / Muscle Growth',
      desc: 'Tập trung vào Volume, RIR 1-2, phát triển kích thước cơ bắp và độ nét',
    },
    {
      id: 'STRENGTH',
      label: 'Tăng sức mạnh & Tải tạ nặng (Strength / Power)',
      labelEn: 'Strength & Powerlifting',
      desc: 'Tập trung tăng mức tạ 1RM - 5RM ở các bài compound chính (Squat, Bench, Deadlift, OHP)',
    },
    {
      id: 'FAT_LOSS',
      label: 'Giảm mỡ & Săn chắc (Fat Loss / Recomp)',
      labelEn: 'Fat Loss & Body Recomp',
      desc: 'Giữ cường độ cao, đốt calo, bảo toàn khối cơ trong giai đoạn thâm hụt calo',
    },
    {
      id: 'ENDURANCE',
      label: 'Sức bền & Thể lực (Endurance / Conditioning)',
      labelEn: 'Endurance & Conditioning',
      desc: 'Tăng số rep (12-20 reps), rút ngắn thời gian nghỉ, nâng cao sức bền tim mạch và cơ bắp',
    },
    {
      id: 'GENERAL_FITNESS',
      label: 'Duy trì & Thể chất khỏe mạnh (General Fitness)',
      labelEn: 'General Health & Maintenance',
      desc: 'Rèn luyện toàn thân đều đặn, phòng ngừa chấn thương, nâng cao sức khỏe dài hạn',
    },
  ],

  workoutLevels: [
    {
      id: 'BEGINNER',
      label: 'Mới tập (< 1 năm)',
      labelEn: 'Beginner (< 1 year)',
    },
    {
      id: 'INTERMEDIATE',
      label: 'Trung cấp (1 - 3 năm)',
      labelEn: 'Intermediate (1 - 3 years)',
    },
    {
      id: 'ADVANCED',
      label: 'Nâng cao (> 3 năm)',
      labelEn: 'Advanced (> 3 years)',
    },
  ],
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  gender: 'male',
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
  workoutGoal: 'HYPERTROPHY',
  workoutLevel: 'INTERMEDIATE',
  macroMode: 'auto',
  targetCalories: '',
  targetProtein: '',
  targetCarb: '',
  targetFat: '',
  targetFiber: '',
};

export function isTaskBoostedByProfile(
  task: TaskItem,
  userProfile: UserProfile = DEFAULT_USER_PROFILE
): boolean {
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

export function buildPersonalizedCoaching(
  userProfile: UserProfile = DEFAULT_USER_PROFILE,
  dayStats: any,
  _tasksMap: Record<string, TaskLevelKey> = {}
) {
  const p = { ...DEFAULT_USER_PROFILE, ...(userProfile || {}) };
  const callName = p.name?.trim() ? p.name.trim() : 'Bạn';
  const pct = dayStats?.percentage || 0;
  const checkedCount = dayStats?.checkedCount || 0;
  const badCount = dayStats?.counts?.BAD || 0;
  const perfectCount = dayStats?.counts?.PERFECT || 0;

  const physObj =
    PERSONALIZATION_OPTIONS.physicalStates.find((x) => x.id === p.physicalState) ||
    PERSONALIZATION_OPTIONS.physicalStates[2];
  const mentObj =
    PERSONALIZATION_OPTIONS.mentalStates.find((x) => x.id === p.mentalState) ||
    PERSONALIZATION_OPTIONS.mentalStates[2];
  const emoObj =
    PERSONALIZATION_OPTIONS.emotionalStates.find((x) => x.id === p.emotionalState) ||
    PERSONALIZATION_OPTIONS.emotionalStates[2];
  const goalObj =
    PERSONALIZATION_OPTIONS.focusGoals.find((x) => x.id === p.focusGoal) ||
    PERSONALIZATION_OPTIONS.focusGoals[0];

  const isLowBody = p.physicalState === 'TIRED' || p.physicalState === 'EXHAUSTED';
  const isPeakBody = p.physicalState === 'PEAK';
  const isLowMind = p.mentalState === 'DISTRACTED' || p.mentalState === 'STRESSED';
  const isSharpMind = p.mentalState === 'SHARP';
  const isLowEmotion = p.emotionalState === 'ANXIOUS' || p.emotionalState === 'LOW_MOOD';
  const isHighEmotion = p.emotionalState === 'FIRED_UP';

  let stateHeadline = '';
  let stateCritiqueOrPraise = '';
  let stateActionableAdvice = '';

  if (checkedCount === 0) {
    stateHeadline = `${callName} chưa bắt đầu ghi nhận ngày hôm nay`;
    if (isLowBody || isLowMind || isLowEmotion) {
      stateCritiqueOrPraise = `Hôm nay thể trạng đang "${physObj.label}" và cảm xúc "${emoObj.label}". Đừng để cảm giác nặng nề làm tê liệt toàn bộ ngày của bạn.`;
      stateActionableAdvice = `Hãy bắt đầu bằng 2 việc nhẹ nhất: Uống nước và Đọc vài trang sách để kích hoạt lại nhịp sinh học.`;
    } else {
      stateCritiqueOrPraise = `Thể chất đang "${physObj.label}", tinh thần "${mentObj.label}" mà vẫn chưa tích việc nào sao ${callName}? Đừng lãng phí trạng thái tốt!`;
      stateActionableAdvice = `Bắt tay ngay vào nhóm mục tiêu "${goalObj.label}" và hoàn thành ít nhất 3 đầu việc mức Hoàn Hảo ngay bây giờ.`;
    }
  } else if (pct < 45) {
    if (isPeakBody || isSharpMind || isHighEmotion || p.coachingStyle === 'STRICT') {
      stateHeadline = `Đáng trách! Trạng thái tốt nhưng kết quả quá kém (${pct}%)`;
      stateCritiqueOrPraise = `${callName} tự nhận hôm nay "${physObj.label}" và "${emoObj.label}", vậy mà điểm số chỉ lẹt đẹt ${pct}% (${badCount} việc mức Tệ)!`;
      stateActionableAdvice = `Dừng ngay mọi lý do biện minh! Hãy gỡ lại điểm ở các mục Học code, Làm việc và Tập gym ngay lập tức.`;
    } else if (isLowBody || isLowMind || isLowEmotion) {
      stateHeadline = `Báo động năng lượng thấp & hiệu suất suy giảm (${pct}%)`;
      stateCritiqueOrPraise = `Cơ thể đang "${physObj.label}", tinh thần "${mentObj.label}" kèm cảm xúc "${emoObj.label}" đã kéo điểm hôm nay xuống ${pct}%.`;
      stateActionableAdvice = `Hãy ưu tiên Ngủ trưa 20 phút, Uống đủ nước và lên giường trước 11h đêm nay để cắt đứt chuỗi tụt dốc này.`;
    } else {
      stateHeadline = `Hiệu suất dưới chuẩn (${pct}%) — Cần chấn chỉnh kỷ luật`;
      stateCritiqueOrPraise = `${callName} đang ở trạng thái bình thường nhưng kết quả hôm nay quá rời rạc.`;
      stateActionableAdvice = `Chọn ra 2 việc thuộc nhóm "${goalObj.label}" và đẩy lên mức Hoàn Hảo (10đ) trước khi kết thúc ngày.`;
    }
  } else if (pct < 75) {
    if (isLowBody || isLowMind || isLowEmotion) {
      stateHeadline = `Bản lĩnh vượt khó đáng ghi nhận (${pct}%)!`;
      stateCritiqueOrPraise = `Dù thể chất đang "${physObj.label}" và cảm xúc "${emoObj.label}", ${callName} vẫn kiên trì đạt ${pct}% (đã được cộng điểm thưởng vượt khó).`;
      stateActionableAdvice = `Hãy hoàn thành gọn các việc nhẹ còn lại và ưu tiên giấc ngủ chất lượng (${p.sleepTargetHours || 7} tiếng) tối nay.`;
    } else {
      stateHeadline = `Đạt mức an toàn (${pct}%) nhưng chưa xứng với tiềm năng`;
      stateCritiqueOrPraise = `Với thể chất "${physObj.label}" và tinh thần "${mentObj.label}", mức ${pct}% chỉ mới là tròn vai chứ chưa phải là bứt phá đâu ${callName}.`;
      stateActionableAdvice = `Hãy dồn sự tập trung vào nhóm ưu tiên "${goalObj.label}" (đang được nhân ×1.25 điểm) để bứt tốc lên ngưỡng Tốt / Hoàn Hảo (>75%).`;
    }
  } else {
    if (isLowBody || isLowMind || isLowEmotion) {
      stateHeadline = `Phi thường! Chiến thắng nghịch cảnh (${pct}%)`;
      stateCritiqueOrPraise = `Quá nể phục ${callName}! Trong một ngày mà cơ thể "${physObj.label}" và tâm trạng "${emoObj.label}", bạn vẫn hoàn thành xuất sắc ${perfectCount} việc Hoàn Hảo để cán mốc ${pct}%.`;
      stateActionableAdvice = `Giờ là lúc thưởng cho cơ thể một giấc ngủ sâu trước 11h để phục hồi hoàn toàn.`;
    } else {
      stateHeadline = `Phong độ đỉnh cao — Hợp nhất Thể chất & Tinh thần (${pct}%)`;
      stateCritiqueOrPraise = `Tuyệt vời ${callName}! Khi thể chất "${physObj.label}" kết hợp với tinh thần "${mentObj.label}" và kỷ luật tự giác, bạn đã tạo ra một ngày hiệu suất cực kỳ ấn tượng (${perfectCount} đầu việc Hoàn Hảo).`;
      stateActionableAdvice = `Hãy duy trì trạng thái dòng chảy (Flow state) này cho mục tiêu "${goalObj.label}" vào ngày mai!`;
    }
  }

  let bioMetricsHint: string | null = null;
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

