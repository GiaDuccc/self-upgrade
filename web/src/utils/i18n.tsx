import React, { createContext, useContext } from 'react';
import { PersonalizationOptions } from '~/interface/user.interface';
import { PERSONALIZATION_OPTIONS } from '~/utils/constants';

export type AppLanguage = 'vi' | 'en';

interface LanguageContextValue {
  language: AppLanguage;
  isEn: boolean;
  onToggleLanguage: (lang: AppLanguage) => void;
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'vi',
  isEn: false,
  onToggleLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

const CATEGORY_EN_MAP: Record<string, string> = {
  'Sức khỏe': 'Health',
  'Kỷ luật': 'Discipline',
  'Giải trí': 'Leisure',
  'Học tập': 'Study',
  'Kỹ năng': 'Skills',
  'Sự nghiệp': 'Career',
  'Dinh dưỡng': 'Nutrition',
  'Giấc ngủ': 'Sleep',
  'Trí tuệ': 'Mindset',
  'Khác': 'Other',
  'Mục tiêu': 'Goal',
};

export function translateCategory(cat: string | undefined, lang: AppLanguage): string {
  if (!cat) return lang === 'en' ? 'Goal' : 'Mục tiêu';
  if (lang === 'vi') return cat;
  return CATEGORY_EN_MAP[cat] || cat;
}

const WEEKDAY_EN_MAP: Record<string, string> = {
  'Thứ Hai': 'Monday',
  'Thứ Ba': 'Tuesday',
  'Thứ Tư': 'Wednesday',
  'Thứ Năm': 'Thursday',
  'Thứ Sáu': 'Friday',
  'Thứ Bảy': 'Saturday',
  'Chủ Nhật': 'Sunday',
  'T2': 'Mon',
  'T3': 'Tue',
  'T4': 'Wed',
  'T5': 'Thu',
  'T6': 'Fri',
  'T7': 'Sat',
  'CN': 'Sun',
};

export function translateWeekday(weekday: string | undefined, lang: AppLanguage): string {
  if (!weekday) return '';
  if (lang === 'vi') return weekday;
  return WEEKDAY_EN_MAP[weekday] || weekday;
}

const RANK_TITLE_EN_MAP: Record<string, string> = {
  'hoàn hảo': 'Perfect',
  'xuất sắc': 'Excellent',
  'tốt': 'Good',
  'khá': 'Fair',
  'trung bình': 'Average',
  'yếu': 'Weak',
  'tệ': 'Poor',
  'chưa đánh giá': 'Unrated',
  'chưa ghi nhận': 'Unrated',
  'chưa chọn': 'Unselected',
  'unrated': 'Unrated',
  'unselected': 'Unselected',
  'hoàn Hảo': 'Perfect',
  'xuất Sắc': 'Excellent',
  'trung Bình': 'Average',
  'chưa Đánh Giá': 'Unrated',
  'chưa Ghi Nhận': 'Unrated',
  'chưa Chọn': 'Unselected',
};

export function translateRankTitle(title: string | undefined, lang: AppLanguage): string {
  if (!title) return '';
  if (lang === 'vi') return title;
  const key = title.trim().toLowerCase();
  return RANK_TITLE_EN_MAP[key] || RANK_TITLE_EN_MAP[title] || title;
}

export function translateRankDesc(desc: string | undefined, lang: AppLanguage): string {
  if (!desc || lang === 'vi') return desc || '';
  const map: Record<string, string> = {
    'Kỷ luật thép! Bạn đã hoàn thành xuất sắc hầu hết mục tiêu ngày hôm nay.':
      'Iron discipline! You excellently completed almost all goals today.',
    'Kỷ luật thép! Một ngày nâng cấp bản thân xuất sắc.':
      'Iron discipline! An excellent self-upgrade day.',
    'Phong độ tốt! Duy trì nhịp độ này để tiến tới mức Hoàn Hảo.':
      'Good performance! Keep up this pace to reach Perfect level.',
    'Duy trì nhịp độ rất tốt, hoàn thành phần lớn mục tiêu.':
      'Maintaining a great pace, completed most daily goals.',
    'Mức độ trung bình. Cần tập trung hơn vào các việc quan trọng.':
      'Average level. Need more focus on key tasks.',
    'Đã có cố gắng nhưng cần tập trung đẩy lên mức Hoàn Hảo.':
      'Good effort, but stay focused to reach Perfect level.',
    'Hiệu suất thấp. Hãy chấn chỉnh lại kỷ luật ngay ngày mai!':
      'Low performance. Realign your discipline tomorrow!',
    'Ngày hôm nay hiệu suất còn thấp, cần chấn chỉnh lại kỷ luật.':
      'Performance is low today, realign your discipline.',
    'Chưa có đầu việc nào được tích chọn trong ngày này.':
      'No tasks have been checked off on this day yet.',
    'Hãy bắt đầu tích các việc đã làm trong ngày':
      'Start checking off tasks you completed today.',
  };
  if (map[desc]) return map[desc];
  if (desc.includes('Hoàn Hảo') || desc.includes('xuất sắc')) {
    return 'Iron discipline! You excellently completed your goals today.';
  }
  if (desc.includes('Phong độ tốt') || desc.includes('Tốt') || desc.includes('rất tốt')) {
    return 'Good performance! Keep maintaining your daily discipline.';
  }
  if (desc.includes('trung bình') || desc.includes('Trung bình') || desc.includes('cố gắng')) {
    return 'Average performance. Focus more on your key habits.';
  }
  if (desc.includes('Chưa có') || desc.includes('chưa tích') || desc.includes('Hãy bắt đầu')) {
    return 'Start checking off tasks you completed today.';
  }
  return 'Stay disciplined and complete your daily habits.';
}

const PERSONALIZATION_EN: PersonalizationOptions = {
  physicalStates: [
    {
      id: 'EXHAUSTED',
      tier: 'bad',
      tierLabel: 'Poor',
      color: '#DC2626',
      label: 'Sick / Exhausted',
      desc: 'Prioritize recovery (+10% resilience bonus when completing tasks)',
      resilienceBonus: 10,
    },
    {
      id: 'TIRED',
      tier: 'medium',
      tierLabel: 'Fair',
      color: '#EA580C',
      label: 'Tired / Sore / Lack of Sleep',
      desc: 'Low physical energy (+5% resilience bonus for maintaining discipline)',
      resilienceBonus: 5,
    },
    {
      id: 'NORMAL',
      tier: 'good',
      tierLabel: 'Good',
      color: '#D97706',
      label: 'Normal / Stable',
      desc: 'Standard daily condition, ready to complete all scheduled tasks',
      resilienceBonus: 0,
    },
    {
      id: 'PEAK',
      tier: 'perfect',
      tierLabel: 'Peak',
      color: '#16A34A',
      label: 'Energetic / Peak Condition',
      desc: 'Full of energy, ready for high-intensity performance',
      resilienceBonus: 0,
    },
  ],
  mentalStates: [
    {
      id: 'STRESSED',
      tier: 'bad',
      tierLabel: 'Poor',
      color: '#DC2626',
      label: 'Stressed / Burnout',
      desc: 'High mental pressure (+6% encouragement bonus for keeping routine)',
      resilienceBonus: 6,
    },
    {
      id: 'DISTRACTED',
      tier: 'medium',
      tierLabel: 'Fair',
      color: '#EA580C',
      label: 'Easily Distracted / Unfocused',
      desc: 'Mind tends to wander (+3% bonus if discipline is maintained)',
      resilienceBonus: 3,
    },
    {
      id: 'STEADY',
      tier: 'good',
      tierLabel: 'Good',
      color: '#D97706',
      label: 'Steady / Normal',
      desc: 'Balanced mindset, maintaining a steady working pace',
      resilienceBonus: 0,
    },
    {
      id: 'SHARP',
      tier: 'perfect',
      tierLabel: 'Peak',
      color: '#16A34A',
      label: 'Sharp / Deep Focus',
      desc: 'Sharp mind, golden time for Coding, English, and Deep Work',
      resilienceBonus: 0,
    },
  ],
  emotionalStates: [
    {
      id: 'LOW_MOOD',
      tier: 'bad',
      tierLabel: 'Poor',
      color: '#DC2626',
      label: 'Low Mood / Demotivated',
      desc: 'Feeling down (+6% grit bonus for not giving up)',
      resilienceBonus: 6,
    },
    {
      id: 'ANXIOUS',
      tier: 'medium',
      tierLabel: 'Fair',
      color: '#EA580C',
      label: 'Anxious / Restless',
      desc: 'Many worries on your mind (+3% bonus for overcoming emotional barriers)',
      resilienceBonus: 3,
    },
    {
      id: 'CALM',
      tier: 'good',
      tierLabel: 'Good',
      color: '#D97706',
      label: 'Calm / Balanced',
      desc: 'Peaceful state of mind, in control of emotions and habits',
      resilienceBonus: 0,
    },
    {
      id: 'FIRED_UP',
      tier: 'perfect',
      tierLabel: 'Peak',
      color: '#16A34A',
      label: 'Excited / Highly Determined',
      desc: 'Strong motivation — results should match your determination',
      resilienceBonus: 0,
    },
  ],
  focusGoals: [
    {
      id: 'BALANCED',
      label: 'All-Round Balance',
      desc: 'All tasks carry equal weight (×1.0)',
      boostCategories: [],
      boostTaskIds: [],
    },
    {
      id: 'CAREER_MIND',
      label: 'Career & Intellect (×1.25)',
      desc: '×1.25 points for Coding, English, Work, Reading',
      boostCategories: ['Học tập', 'Kỹ năng', 'Ngoại ngữ', 'Sự nghiệp', 'Trí tuệ'],
      boostTaskIds: ['learn_code', 'learn_english', 'work', 'read_book'],
    },
    {
      id: 'HEALTH_BODY',
      label: 'Health & Fitness (×1.25)',
      desc: '×1.25 points for Morning Exercise, Gym, Water, Nutrition, Sleep',
      boostCategories: ['Sức khỏe', 'Thể chất', 'Thể hình', 'Dinh dưỡng', 'Giấc ngủ', 'Phục hồi'],
      boostTaskIds: ['morning_exercise', 'gym', 'drink_3l_water', 'no_junk_food', 'sleep_before_11pm', 'nap'],
    },
    {
      id: 'IRON_DISCIPLINE',
      label: 'Iron Discipline & Self-Control (×1.25)',
      desc: '×1.25 points for Wake 05:00, Sleep before 23:00, Limit Gaming, No Junk Food',
      boostCategories: ['Kỷ luật', 'Kỷ luật sáng', 'Giải trí', 'Giải trí giới hạn'],
      boostTaskIds: ['wake_5am', 'sleep_before_11pm', 'play_2_games', 'no_junk_food'],
    },
  ],
  coachingStyles: [
    {
      id: 'STRICT',
      label: 'Strict / Direct',
      desc: 'Blunt critique when slacking, higher discipline standards (-4% if any Poor task)',
    },
    {
      id: 'BALANCED',
      label: 'Realistic / Fair',
      desc: 'Objective feedback combining score analysis and personal state',
    },
    {
      id: 'EMPATHETIC',
      label: 'Empathetic / Supportive',
      desc: 'Gentle encouragement, prioritizing recovery when physical or mental state is low',
    },
  ],
  workoutGoals: [
    {
      id: 'HYPERTROPHY',
      label: 'Tăng cơ bắp tối đa (Hypertrophy)',
      labelEn: 'Hypertrophy / Muscle Growth',
      desc: 'Focus on volume, RIR 1-2, muscle hypertrophy and definition',
    },
    {
      id: 'STRENGTH',
      label: 'Tăng sức mạnh & Tải tạ nặng (Strength / Power)',
      labelEn: 'Strength & Powerlifting',
      desc: 'Focus on heavy progressive loads (1RM - 5RM) in compound lifts (Squat, Bench, Deadlift, OHP)',
    },
    {
      id: 'FAT_LOSS',
      label: 'Giảm mỡ & Săn chắc (Fat Loss / Recomp)',
      labelEn: 'Fat Loss & Body Recomp',
      desc: 'Maintain high training density, burn calories, preserve muscle mass in caloric deficit',
    },
    {
      id: 'ENDURANCE',
      label: 'Sức bền & Thể lực (Endurance / Conditioning)',
      labelEn: 'Endurance & Conditioning',
      desc: 'Higher reps (12-20 reps), shorter rest intervals, cardiovascular & muscular endurance',
    },
    {
      id: 'GENERAL_FITNESS',
      label: 'Duy trì & Thể chất khỏe mạnh (General Fitness)',
      labelEn: 'General Health & Maintenance',
      desc: 'Full-body functional health, injury prevention, and long-term athletic vitality',
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

export function getLocalizedPersonalization(lang: AppLanguage): PersonalizationOptions {
  return lang === 'en' ? PERSONALIZATION_EN : PERSONALIZATION_OPTIONS;
}

