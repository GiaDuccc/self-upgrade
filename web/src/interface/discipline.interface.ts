import { PersonalizationOptions, UserProfile } from './user.interface';

export type TaskLevelKey = 'NONE' | 'BAD' | 'GOOD' | 'PERFECT';

export type TaskScope = 'day' | 'week' | 'month' | 'all';

export interface ScoreLevelDef {
  key: TaskLevelKey;
  label: string;
  points: number;
  colorKey: string;
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  timeHint?: string;
  target?: string;
  scope?: TaskScope;
  dateKey?: string;
  weekDates?: string[];
  monthKey?: string;
  hour?: number;
  columnIndex?: number;
}

export type MealSession = 'morning' | 'afternoon' | 'evening';

export type FoodState = 'raw' | 'cooked';
export type CookingMethod = 'hap' | 'luoc' | 'xao' | 'chien' | 'nuong';

export interface FoodItem {
  id: string;
  name: string;
  weight: string;
  mealSession: MealSession;
  time?: string;
  foodState?: FoodState;
  cookingMethod?: CookingMethod;
  calories?: number;
  protein?: number;
  carb?: number;
  fat?: number;
  fiber?: number;
}

export interface CaloriesSummary {
  totalCalories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
  aiFeedback: string;
  aiFeedbackEn?: string;
  updatedAt?: string;
  error?: string;
}

export interface CaloriesData {
  meals: FoodItem[];
  summary?: CaloriesSummary;
}

export interface WaterLog {
  id: string;
  amount: number;
  time: string;
}

export interface WaterData {
  targetMl: number;
  currentMl: number;
  logs: WaterLog[];
}

export interface SleepData {
  bedTime: string;
  wakeTime: string;
  durationMinutes: number;
  deepSleepMinutes?: number;
  remMinutes?: number;
  sleepScore?: number;
  source?: 'manual' | 'apple_health' | 'google_health' | 'xiaomi_band';
  updatedAt?: string;
}

export interface DayRecord {
  tasks?: Record<string, TaskLevelKey>;
  taskHours?: Record<string, number[]>;
  note?: string;
  caloriesData?: CaloriesData;
  waterData?: WaterData;
  sleepData?: SleepData;
  updatedAt?: string;
}

export interface ScoreCounts {
  PERFECT: number;
  GOOD: number;
  BAD: number;
  NONE: number;
}

export interface DailyRank {
  code: string;
  title: string;
  description: string;
}

export interface DayStats {
  rawPoints: number;
  maxPoints: number;
  basePercentage: number;
  stateBonusPct: number;
  percentage: number;
  checkedCount: number;
  totalTasks: number;
  counts: ScoreCounts;
  rank: DailyRank;
  note: string;
  waterData?: WaterData;
  sleepData?: SleepData;
  tasksList: TaskItem[];
  tasksMap: Record<string, TaskLevelKey>;
  taskHours?: Record<string, number[]>;
}

export interface MonthDayItem extends DayStats {
  day: number;
  dateKey: string;
  weekday: string;
}

export interface MonthStats {
  year: number;
  month: number;
  totalDays: number;
  daysList: MonthDayItem[];
  sumPoints: number;
  maxMonthPoints: number;
  activeDaysCount: number;
  avgActivePercentage: number;
  overallMonthPercentage: number;
  perfectDaysCount: number;
  goodOrAboveDaysCount: number;
  monthCounts: ScoreCounts;
  bestDay: MonthDayItem | null;
  monthRank: DailyRank;
}

export interface DisciplineSettings {
  categories: string[];
  scoring: Record<TaskLevelKey, ScoreLevelDef>;
  levelList: ScoreLevelDef[];
  personalizationOptions: PersonalizationOptions;
  defaultTasks: TaskItem[];
}

export interface MonthDataResponse {
  monthStats: MonthStats;
  profile: UserProfile;
  isProfileSetup: boolean;
  settings: DisciplineSettings;
}

export interface DayDataResponse {
  dateKey: string;
  year: number;
  month: number;
  day: number;
  weekday: string;
  dayRecord: DayRecord;
  dayStats: DayStats;
  profile: UserProfile;
  isProfileSetup: boolean;
  settings: DisciplineSettings;
}

