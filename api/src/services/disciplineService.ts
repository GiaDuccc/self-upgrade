import { StatusCodes } from 'http-status-codes';
import {
  DAILY_TASKS,
  DEFAULT_USER_PROFILE,
  LEVEL_LIST,
  PERSONALIZATION_OPTIONS,
  SCORING,
  TASK_CATEGORIES,
  buildPersonalizedCoaching,
} from '~/config/settings';
import { disciplineModel } from '~/models/disciplineModel';
import { userModel } from '~/models/userModel';
import { CustomTaskItem, DayRecord, TaskConfig, TaskLevelKey } from '~/types';
import ApiError from '~/utils/ApiError';
import {
  calculateDayStats,
  calculateMonthStats,
  formatDateKey,
  getDaysInMonth,
  getDefaultTaskConfig,
  getTasksForDate,
  getWeekdayLabel,
  getWeekDates,
} from '~/utils/statsCalculator';

const getSettingsMetadata = () => ({
  categories: TASK_CATEGORIES,
  scoring: SCORING,
  levelList: LEVEL_LIST,
  personalizationOptions: PERSONALIZATION_OPTIONS,
  defaultTasks: DAILY_TASKS,
});

const getMonthData = async (userId: string, year: number, month: number) => {
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng!');
  }

  const profile = user.profile || DEFAULT_USER_PROFILE;
  const records = disciplineDoc.records || {};
  const taskConfig = disciplineDoc.taskConfig || getDefaultTaskConfig();

  const monthStats = calculateMonthStats(year, month, records, taskConfig, profile);

  return {
    monthStats,
    profile,
    isProfileSetup: Boolean(user.isProfileSetup),
    settings: getSettingsMetadata(),
  };
};

const getDayData = async (userId: string, dateKey: string) => {
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng!');
  }

  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Định dạng ngày không hợp lệ (YYYY-MM-DD)!');
  }

  const profile = user.profile || DEFAULT_USER_PROFILE;
  const records = disciplineDoc.records || {};
  const taskConfig = disciplineDoc.taskConfig || getDefaultTaskConfig();

  const dayRecord = records[dateKey] || { tasks: {}, note: '' };
  const tasksForDay = getTasksForDate(dateKey, taskConfig);
  const dayStats = calculateDayStats(dayRecord, tasksForDay, profile);
  const weekday = getWeekdayLabel(y, m, d);

  return {
    dateKey,
    year: y,
    month: m,
    day: d,
    weekday,
    dayRecord,
    dayStats,
    profile,
    isProfileSetup: Boolean(user.isProfileSetup),
    settings: getSettingsMetadata(),
  };
};

const setTaskLevel = async (
  userId: string,
  payload: { dateKey: string; taskId: string; levelKey: TaskLevelKey }
) => {
  const { dateKey, taskId, levelKey } = payload;
  const disciplineDoc = await disciplineModel.findOrCreateByUserId(userId);
  const records = { ...(disciplineDoc.records || {}) };
  const currentDay: DayRecord = { ...(records[dateKey] || {}) };
  const currentTasks = { ...(currentDay.tasks || {}) };

  if (levelKey === 'NONE') {
    delete currentTasks[taskId];
  } else {
    currentTasks[taskId] = levelKey;
  }

  records[dateKey] = {
    ...currentDay,
    tasks: currentTasks,
    updatedAt: new Date().toISOString(),
  };

  await disciplineModel.updateByUserId(userId, { records });
  return await getDayData(userId, dateKey);
};

const markAllLevel = async (
  userId: string,
  payload: { dateKey: string; levelKey: TaskLevelKey }
) => {
  const { dateKey, levelKey } = payload;
  const disciplineDoc = await disciplineModel.findOrCreateByUserId(userId);
  const records = { ...(disciplineDoc.records || {}) };
  const taskConfig = disciplineDoc.taskConfig || getDefaultTaskConfig();
  const tasksForDay = getTasksForDate(dateKey, taskConfig);

  const currentDay: DayRecord = { ...(records[dateKey] || {}) };
  const newTasksMap: Record<string, TaskLevelKey> = {};

  if (levelKey !== 'NONE') {
    tasksForDay.forEach((t) => {
      newTasksMap[t.id] = levelKey;
    });
  }

  records[dateKey] = {
    ...currentDay,
    tasks: newTasksMap,
    updatedAt: new Date().toISOString(),
  };

  await disciplineModel.updateByUserId(userId, { records });
  return await getDayData(userId, dateKey);
};

const clearDay = async (userId: string, payload: { dateKey: string }) => {
  const { dateKey } = payload;
  const disciplineDoc = await disciplineModel.findOrCreateByUserId(userId);
  const records = { ...(disciplineDoc.records || {}) };
  delete records[dateKey];

  await disciplineModel.updateByUserId(userId, { records });
  return await getDayData(userId, dateKey);
};

const updateNote = async (
  userId: string,
  payload: { dateKey: string; note: string }
) => {
  const { dateKey, note } = payload;
  const disciplineDoc = await disciplineModel.findOrCreateByUserId(userId);
  const records = { ...(disciplineDoc.records || {}) };
  const currentDay: DayRecord = { ...(records[dateKey] || {}) };

  records[dateKey] = {
    ...currentDay,
    tasks: currentDay.tasks || {},
    note,
    updatedAt: new Date().toISOString(),
  };

  await disciplineModel.updateByUserId(userId, { records });
  return await getDayData(userId, dateKey);
};

const getTargetDatesByScope = (
  scope: 'day' | 'week' | 'month' | 'all',
  selectedDateKey: string
): string[] => {
  if (scope === 'day') return [selectedDateKey];
  if (scope === 'week') return getWeekDates(selectedDateKey);
  if (scope === 'month') {
    const [y, m] = selectedDateKey.split('-').map(Number);
    const total = getDaysInMonth(y, m);
    const list: string[] = [];
    for (let d = 1; d <= total; d++) {
      list.push(formatDateKey(y, m, d));
    }
    return list;
  }
  return [];
};

const saveTask = async (
  userId: string,
  payload: {
    mode: 'add' | 'edit';
    taskId?: string;
    title: string;
    category: string;
    timeHint?: string;
    target?: string;
    scope: 'day' | 'week' | 'month' | 'all';
    dateKey: string;
  }
) => {
  const { mode, taskId, title, category, scope, dateKey } = payload;
  const timeHint = payload.timeHint || payload.target || '';
  const disciplineDoc = await disciplineModel.findOrCreateByUserId(userId);
  const prev = disciplineDoc.taskConfig || getDefaultTaskConfig();

  const next: TaskConfig = {
    globalTasks: [...(prev.globalTasks || [])],
    customTasks: [...(prev.customTasks || [])],
    excludedTaskIds: { ...(prev.excludedTaskIds || {}) },
    taskOverrides: { ...(prev.taskOverrides || {}) },
  };

  const monthKey = dateKey.substring(0, 7);

  if (mode === 'add') {
    const newId = `task_custom_${Date.now()}`;
    const newTaskObj: CustomTaskItem = {
      id: newId,
      title,
      category,
      timeHint,
    };

    if (scope === 'all') {
      next.globalTasks.push(newTaskObj);
    } else if (scope === 'day') {
      next.customTasks.push({ ...newTaskObj, scope: 'day', dateKey });
    } else if (scope === 'week') {
      const weekDates = getWeekDates(dateKey);
      next.customTasks.push({ ...newTaskObj, scope: 'week', weekDates });
    } else if (scope === 'month') {
      next.customTasks.push({ ...newTaskObj, scope: 'month', monthKey });
    }
  } else if (mode === 'edit' && taskId) {
    if (scope === 'all') {
      next.globalTasks = next.globalTasks.map((t) =>
        t.id === taskId ? { ...t, title, category, timeHint } : t
      );
      next.customTasks = next.customTasks.map((t) =>
        t.id === taskId ? { ...t, title, category, timeHint } : t
      );
      Object.keys(next.taskOverrides).forEach((dKey) => {
        if (next.taskOverrides[dKey]?.[taskId]) {
          const clone = { ...next.taskOverrides[dKey] };
          delete clone[taskId];
          next.taskOverrides[dKey] = clone;
        }
      });
    } else {
      const targetDates = getTargetDatesByScope(scope, dateKey);
      targetDates.forEach((dKey) => {
        const curOverrides = next.taskOverrides[dKey] || {};
        next.taskOverrides[dKey] = {
          ...curOverrides,
          [taskId]: { title, category, timeHint },
        };
      });
    }
  }

  await disciplineModel.updateByUserId(userId, { taskConfig: next });
  return await getDayData(userId, dateKey);
};

const deleteTask = async (
  userId: string,
  payload: {
    taskId: string;
    scope: 'day' | 'week' | 'month' | 'all';
    dateKey: string;
  }
) => {
  const { taskId, scope, dateKey } = payload;
  const disciplineDoc = await disciplineModel.findOrCreateByUserId(userId);
  const prev = disciplineDoc.taskConfig || getDefaultTaskConfig();

  const next: TaskConfig = {
    globalTasks: [...(prev.globalTasks || [])],
    customTasks: [...(prev.customTasks || [])],
    excludedTaskIds: { ...(prev.excludedTaskIds || {}) },
    taskOverrides: { ...(prev.taskOverrides || {}) },
  };

  if (scope === 'all') {
    next.globalTasks = next.globalTasks.filter((t) => t.id !== taskId);
    next.customTasks = next.customTasks.filter((t) => t.id !== taskId);
  } else {
    const targetDates = getTargetDatesByScope(scope, dateKey);
    targetDates.forEach((dKey) => {
      const curList = next.excludedTaskIds[dKey] || [];
      if (!curList.includes(taskId)) {
        next.excludedTaskIds[dKey] = [...curList, taskId];
      }
    });
  }

  await disciplineModel.updateByUserId(userId, { taskConfig: next });
  return await getDayData(userId, dateKey);
};

const exportData = async (userId: string) => {
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);

  return {
    records: disciplineDoc.records || {},
    taskConfig: disciplineDoc.taskConfig || getDefaultTaskConfig(),
    userProfile: user?.profile || DEFAULT_USER_PROFILE,
    exportedAt: new Date().toISOString(),
  };
};

const importData = async (
  userId: string,
  payload: {
    records?: Record<string, DayRecord>;
    taskConfig?: TaskConfig;
    userProfile?: Record<string, unknown>;
  }
) => {
  if (payload.records || payload.taskConfig) {
    const updateDoc: Record<string, unknown> = {};
    if (payload.records) updateDoc.records = payload.records;
    if (payload.taskConfig) updateDoc.taskConfig = payload.taskConfig;
    await disciplineModel.updateByUserId(userId, updateDoc);
  }

  if (payload.userProfile) {
    await userModel.update(userId, {
      profile: {
        ...DEFAULT_USER_PROFILE,
        ...payload.userProfile,
      },
      isProfileSetup: true,
    });
  }

  return { message: 'Đã khôi phục dữ liệu thành công!' };
};

export const disciplineService = {
  getMonthData,
  getDayData,
  setTaskLevel,
  markAllLevel,
  clearDay,
  updateNote,
  saveTask,
  deleteTask,
  exportData,
  importData,
};
