import {
  DAILY_TASKS,
  SCORING,
  MAX_POINTS_PER_TASK,
  getDailyRank,
  DEFAULT_USER_PROFILE,
  PERSONALIZATION_OPTIONS,
  isTaskBoostedByProfile,
} from '~/config/settings';
import {
  DayRecord,
  DayStats,
  MonthDayItem,
  MonthStats,
  ScoreCounts,
  TaskConfig,
  TaskItem,
  TaskLevelKey,
  UserProfile,
} from '~/types';

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

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getWeekdayLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return labels[date.getDay()];
}

export function getWeekDates(dateKey: string): string[] {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    dates.push(formatDateKey(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()));
  }
  return dates;
}

export function getDefaultTaskConfig(): TaskConfig {
  return {
    globalTasks: DAILY_TASKS.map((t) => ({ ...t })),
    customTasks: [],
    excludedTaskIds: {},
    taskOverrides: {},
  };
}

export function getTasksForDate(dateKey: string, taskConfig?: TaskConfig | null): TaskItem[] {
  if (!taskConfig) return DAILY_TASKS.map((t) => ({ ...t }));

  const monthKey = dateKey.substring(0, 7);

  const sourceGlobal =
    Array.isArray(taskConfig.globalTasks) && taskConfig.globalTasks.length > 0
      ? taskConfig.globalTasks
      : DAILY_TASKS;

  const baseTasks: TaskItem[] = sourceGlobal.map((t) => ({
    ...t,
  }));

  const custom = (taskConfig.customTasks || []).filter((ct) => {
    if (ct.scope === 'day' && ct.dateKey === dateKey) return true;
    if (ct.scope === 'week' && ct.weekDates && ct.weekDates.includes(dateKey)) return true;
    if (ct.scope === 'month' && ct.monthKey === monthKey) return true;
    if (ct.scope === 'all') return true;
    return false;
  });

  let allTasks: TaskItem[] = [...baseTasks];
  custom.forEach((add) => {
    if (!allTasks.some((t) => t.id === add.id)) {
      allTasks.push({ ...add });
    }
  });

  const excludedForDate = taskConfig.excludedTaskIds?.[dateKey] || [];
  allTasks = allTasks.filter((t) => !excludedForDate.includes(t.id));

  const overridesForDate = taskConfig.taskOverrides?.[dateKey] || {};
  allTasks = allTasks.map((t) => {
    if (overridesForDate[t.id]) {
      return { ...t, ...overridesForDate[t.id] };
    }
    return t;
  });

  return allTasks;
}

export function calculateDayStats(
  dayRecord: DayRecord = {},
  tasksForDay: TaskItem[] = DAILY_TASKS,
  userProfile: UserProfile = DEFAULT_USER_PROFILE
): DayStats {
  const tasksMap = dayRecord?.tasks || {};
  let rawPoints = 0;
  let maxPoints = 0;

  const counts: ScoreCounts = {
    PERFECT: 0,
    GOOD: 0,
    BAD: 0,
    NONE: 0,
  };

  const tasksList = tasksForDay && tasksForDay.length > 0 ? tasksForDay : [];

  tasksList.forEach((task) => {
    const statusKey: TaskLevelKey = tasksMap[task.id] || 'NONE';
    const scoreDef = SCORING[statusKey] || SCORING.NONE;
    const isBoosted = isTaskBoostedByProfile(task, userProfile);
    const weight = isBoosted ? 1.25 : 1;

    rawPoints += scoreDef.points * weight;
    maxPoints += MAX_POINTS_PER_TASK * weight;
    counts[scoreDef.key] = (counts[scoreDef.key] || 0) + 1;
  });

  rawPoints = Math.round(rawPoints * 10) / 10;
  maxPoints = Math.max(10, Math.round(maxPoints * 10) / 10);

  const totalTasks = tasksList.length;
  const checkedCount = totalTasks - counts.NONE;
  const basePercentage =
    totalTasks > 0 ? Math.round(((rawPoints / maxPoints) * 100) * 10) / 10 : 0;

  let stateBonusPct = 0;
  if (checkedCount > 0 && userProfile) {
    const phys = PERSONALIZATION_OPTIONS.physicalStates.find(
      (x) => x.id === userProfile.physicalState
    );
    const ment = PERSONALIZATION_OPTIONS.mentalStates.find(
      (x) => x.id === userProfile.mentalState
    );
    const emo = PERSONALIZATION_OPTIONS.emotionalStates.find(
      (x) => x.id === userProfile.emotionalState
    );

    const rawResilienceBonus =
      (phys?.resilienceBonus || 0) +
      (ment?.resilienceBonus || 0) +
      (emo?.resilienceBonus || 0);

    const positiveTasksCount = counts.GOOD + counts.PERFECT;
    const positiveRatio = totalTasks > 0 ? positiveTasksCount / totalTasks : 0;
    stateBonusPct += Math.round(rawResilienceBonus * positiveRatio * 10) / 10;

    if (userProfile.coachingStyle === 'STRICT' && counts.BAD > 0) {
      stateBonusPct -= Math.min(8, counts.BAD * 2);
    }
  }

  stateBonusPct = Math.round(stateBonusPct * 10) / 10;

  const finalPercentage =
    checkedCount > 0
      ? Math.max(0, Math.min(100, Math.round((basePercentage + stateBonusPct) * 10) / 10))
      : 0;

  const rank = getDailyRank(finalPercentage, checkedCount);

  return {
    rawPoints,
    maxPoints,
    basePercentage,
    stateBonusPct,
    percentage: finalPercentage,
    checkedCount,
    totalTasks,
    counts,
    rank,
    note: dayRecord?.note || '',
    tasksList,
    tasksMap,
    taskHours: dayRecord?.taskHours || {},
  };
}

export function calculateMonthStats(
  year: number,
  month: number,
  allRecords: Record<string, DayRecord> = {},
  taskConfig: TaskConfig | null = null,
  userProfile: UserProfile = DEFAULT_USER_PROFILE
): MonthStats {
  const totalDays = getDaysInMonth(year, month);
  const daysList: MonthDayItem[] = [];

  let sumPoints = 0;
  let maxMonthPoints = 0;
  let sumPercentageActiveDays = 0;
  let activeDaysCount = 0;
  let perfectDaysCount = 0;
  let goodOrAboveDaysCount = 0;

  const monthCounts: ScoreCounts = {
    PERFECT: 0,
    GOOD: 0,
    BAD: 0,
    NONE: 0,
  };

  for (let d = 1; d <= totalDays; d++) {
    const dateKey = formatDateKey(year, month, d);
    const dayRecord = allRecords[dateKey] || {};
    const tasksForDay = taskConfig
      ? getTasksForDate(dateKey, taskConfig)
      : DAILY_TASKS;
    const stats = calculateDayStats(dayRecord, tasksForDay, userProfile);
    const weekday = getWeekdayLabel(year, month, d);

    const dayItem: MonthDayItem = {
      day: d,
      dateKey,
      weekday,
      ...stats,
    };

    daysList.push(dayItem);
    sumPoints += stats.rawPoints;
    maxMonthPoints += stats.maxPoints;

    if (stats.checkedCount > 0) {
      activeDaysCount += 1;
      sumPercentageActiveDays += stats.percentage;

      monthCounts.PERFECT += stats.counts.PERFECT;
      monthCounts.GOOD += stats.counts.GOOD;
      monthCounts.BAD += stats.counts.BAD;
      monthCounts.NONE += stats.counts.NONE;
    }

    if (stats.percentage >= 90) perfectDaysCount += 1;
    if (stats.percentage >= 70) goodOrAboveDaysCount += 1;
  }

  sumPoints = Math.round(sumPoints * 10) / 10;
  maxMonthPoints = Math.round(maxMonthPoints * 10) / 10;

  const avgActivePercentage =
    activeDaysCount > 0
      ? Math.round((sumPercentageActiveDays / activeDaysCount) * 10) / 10
      : 0;

  const overallMonthPercentage =
    maxMonthPoints > 0
      ? Math.round(((sumPoints / maxMonthPoints) * 100) * 10) / 10
      : 0;

  let bestDay: MonthDayItem | null = null;
  daysList.forEach((item) => {
    if (item.checkedCount > 0) {
      if (!bestDay || item.percentage > bestDay.percentage) {
        bestDay = item;
      }
    }
  });

  const monthRank = getDailyRank(avgActivePercentage, activeDaysCount);

  return {
    year,
    month,
    totalDays,
    daysList,
    sumPoints,
    maxMonthPoints,
    activeDaysCount,
    avgActivePercentage,
    overallMonthPercentage,
    perfectDaysCount,
    goodOrAboveDaysCount,
    monthCounts,
    bestDay,
    monthRank,
  };
}

