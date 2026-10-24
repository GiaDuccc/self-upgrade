export type TaskLevelKey = 'NONE' | 'BAD' | 'GOOD' | 'PERFECT';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  timeHint?: string;
  hour?: number;
  columnIndex?: number;
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
  waterData?: WaterData;
  sleepData?: SleepData;
  updatedAt?: string;
}

export interface DailyRank {
  code: string;
  title: string;
  description: string;
}

export interface DayStats {
  percentage: number;
  checkedCount: number;
  totalTasks: number;
  rawPoints: number;
  maxPoints: number;
  note: string;
  rank?: DailyRank;
  waterData?: WaterData;
  sleepData?: SleepData;
  tasksList: TaskItem[];
  tasksMap: Record<string, TaskLevelKey>;
}

export interface DayDataResponse {
  dateKey: string;
  year: number;
  month: number;
  day: number;
  weekday: string;
  dayRecord: DayRecord;
  dayStats: DayStats;
}

export interface UserProfile {
  name: string;
  weightKg: string;
  heightCm: string;
  personalMotto: string;
  workoutGoal?: string;
  workoutLevel?: string;
}
