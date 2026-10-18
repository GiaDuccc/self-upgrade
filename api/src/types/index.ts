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
}

export type CustomTaskItem = TaskItem;

export interface TaskOverride {
  title: string;
  category: string;
  timeHint?: string;
  target?: string;
}

export interface TaskConfig {
  globalTasks: TaskItem[];
  customTasks: TaskItem[];
  excludedTaskIds: Record<string, string[]>;
  taskOverrides: Record<string, Record<string, TaskOverride>>;
}

export interface DayRecord {
  tasks?: Record<string, TaskLevelKey>;
  note?: string;
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
  tasksList: TaskItem[];
  tasksMap: Record<string, TaskLevelKey>;
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


