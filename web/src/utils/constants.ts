import { PersonalizationOptions, UserProfile } from '~/interface/user.interface';
import { ScoreLevelDef, TaskItem, TaskLevelKey } from '~/interface/discipline.interface';
import { Capacitor } from '@capacitor/core';

export const getApiRoot = (): string => {
  try {
    const custom = localStorage.getItem('custom_api_root');
    if (custom && custom.trim()) return custom.trim();
    if (Capacitor.isNativePlatform()) {
      return (import.meta as any).env?.VITE_API_BASE_URL || 'http://10.0.2.2:2004';
    }
    if (
      typeof window !== 'undefined' &&
      window.location.hostname &&
      window.location.hostname.endsWith('.trycloudflare.com')
    ) {
      return window.location.origin;
    }
    if (
      typeof window !== 'undefined' &&
      window.location.hostname &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return `http://${window.location.hostname}:2004`;
    }
  } catch {}
  return 'http://localhost:2004';
};

export const API_ROOT = getApiRoot();

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

export const SCORING: Record<TaskLevelKey, ScoreLevelDef> = {
  NONE: { key: 'NONE', label: 'Chưa chọn', points: 0, colorKey: 'levelNone' },
  BAD: { key: 'BAD', label: 'Tệ', points: 1, colorKey: 'levelBad' },
  GOOD: { key: 'GOOD', label: 'Tốt', points: 5, colorKey: 'levelGood' },
  PERFECT: { key: 'PERFECT', label: 'Hoàn Hảo', points: 10, colorKey: 'levelPerfect' },
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

export const PERSONALIZATION_OPTIONS: PersonalizationOptions = {
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
  if (goalObj.boostTaskIds?.includes(task.id)) return true;
  if (
    task.category &&
    goalObj.boostCategories?.some(
      (cat) => task.category.toLowerCase() === cat.toLowerCase()
    )
  ) {
    return true;
  }
  return false;
}

export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function getTodayInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return {
    year,
    month,
    day,
    dateKey: formatDateKey(year, month, day),
  };
}

