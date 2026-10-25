import { ObjectId } from 'mongodb';
import { DailyRank } from '~/config/settings';

export type TaskLevelKey = 'NONE' | 'BAD' | 'GOOD' | 'PERFECT';

export type TaskScope = 'day' | 'week' | 'month' | 'all';

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

export type CustomTaskItem = TaskItem;

export interface TaskOverride {
  title: string;
  category: string;
  timeHint?: string;
  target?: string;
  hour?: number;
  columnIndex?: number;
}

export interface TaskConfig {
  globalTasks: TaskItem[];
  customTasks: TaskItem[];
  excludedTaskIds: Record<string, string[]>;
  taskOverrides: Record<string, Record<string, TaskOverride>>;
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

export interface ExerciseSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  category: string;
  sets: ExerciseSet[];
}

export interface WorkoutSummary {
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  avgRir: number;
  comparedDateKey?: string;
  volumeChangePct?: number;
  volumeChangeKg?: number;
  progressiveOverloadStatus: 'OVERLOAD_ACHIEVED' | 'MAINTAINED' | 'DELOAD_FATIGUED' | 'FIRST_SESSION';
  aiFeedback: string;
  aiFeedbackEn?: string;
  updatedAt?: string;
}

export interface WorkoutData {
  targetMuscles: string[];
  exercises: WorkoutExercise[];
  summary?: WorkoutSummary;
  updatedAt?: string;
}

export interface DayRecord {
  tasks?: Record<string, TaskLevelKey>;
  taskHours?: Record<string, number[]>;
  note?: string;
  caloriesData?: CaloriesData;
  waterData?: WaterData;
  sleepData?: SleepData;
  workoutData?: WorkoutData;
  physicalState?: string;
  mentalState?: string;
  emotionalState?: string;
  updatedAt?: string;
}

export type RecordsMap = Record<string, DayRecord>;

export interface ScoreCounts {
  PERFECT: number;
  GOOD: number;
  BAD: number;
  NONE: number;
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

export interface UserProfile {
  name: string;
  age: string;
  weightKg: string;
  heightCm: string;
  sleepTargetHours: string;
  physicalState: string;
  mentalState: string;
  emotionalState: string;
  focusGoal: string;
  coachingStyle: string;
  personalMotto: string;
  workoutGoal?: string;
  workoutLevel?: string;
}

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  password: string;
  role: 'client' | 'admin';
  isVerified: boolean;
  verifyCode: string | null;
  verifyToken: string | null;
  verifyCodeExpires: number | null;
  refreshToken: string | null;
  isProfileSetup: boolean;
  profile: UserProfile;
  createdAt: number;
  updatedAt: number | null;
  _destroy?: boolean;
}

export interface DisciplineDocument {
  _id?: ObjectId;
  userId: ObjectId;
  records: RecordsMap;
  taskConfig: TaskConfig;
  createdAt?: number;
  updatedAt: number | null;
}

export interface JwtPayloadUser {
  _id: string;
  email: string;
  role: 'client' | 'admin';
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      jwtDecoded?: JwtPayloadUser;
    }
  }
}


