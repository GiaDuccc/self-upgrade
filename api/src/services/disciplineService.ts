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
import {
  CustomTaskItem,
  DayRecord,
  DisciplineDocument,
  FoodItem,
  TaskConfig,
  TaskLevelKey,
  UserDocument,
  WaterData,
  SleepData,
  WorkoutExercise,
} from '~/types';
import { aiCoachService } from '~/services/aiCoachService';
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

const formatDayDataResponse = (
  dateKey: string,
  user: UserDocument,
  disciplineDoc: DisciplineDocument
) => {
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

const getMonthData = async (userId: string, year: number, month: number) => {
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
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
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Định dạng ngày không hợp lệ (YYYY-MM-DD)!');
  }

  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return formatDayDataResponse(dateKey, user, disciplineDoc);
};

const setTaskLevel = async (
  userId: string,
  payload: { dateKey: string; taskId: string; levelKey: TaskLevelKey; hours?: number[] }
) => {
  const { dateKey, taskId, levelKey, hours } = payload;
  const setFields: Record<string, unknown> = {
    [`records.${dateKey}.updatedAt`]: new Date().toISOString(),
  };
  const unsetFields: Record<string, unknown> = {};

  if (levelKey === 'NONE') {
    unsetFields[`records.${dateKey}.tasks.${taskId}`] = '';
    unsetFields[`records.${dateKey}.taskHours.${taskId}`] = '';
  } else {
    setFields[`records.${dateKey}.tasks.${taskId}`] = levelKey;
    if (hours !== undefined) {
      if (hours.length === 0) {
        unsetFields[`records.${dateKey}.taskHours.${taskId}`] = '';
      } else {
        setFields[`records.${dateKey}.taskHours.${taskId}`] = hours;
      }
    }
  }

  const [user, updatedDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.updateFieldsByUserId(userId, setFields, unsetFields),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return formatDayDataResponse(
    dateKey,
    user,
    updatedDoc || (await disciplineModel.findOrCreateByUserId(userId))
  );
};

const markAllLevel = async (
  userId: string,
  payload: { dateKey: string; levelKey: TaskLevelKey }
) => {
  const { dateKey, levelKey } = payload;
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  const taskConfig = disciplineDoc.taskConfig || getDefaultTaskConfig();
  const tasksForDay = getTasksForDate(dateKey, taskConfig);
  const currentDay: DayRecord = { ...(disciplineDoc.records?.[dateKey] || {}) };
  const newTasksMap: Record<string, TaskLevelKey> = {};
  const newTaskHours: Record<string, number[]> = { ...(currentDay.taskHours || {}) };

  if (levelKey !== 'NONE') {
    tasksForDay.forEach((t) => {
      newTasksMap[t.id] = levelKey;
    });
  } else {
    for (const t of tasksForDay) {
      delete newTaskHours[t.id];
    }
  }

  const updatedDoc = await disciplineModel.updateFieldsByUserId(userId, {
    [`records.${dateKey}.tasks`]: newTasksMap,
    [`records.${dateKey}.taskHours`]: newTaskHours,
    [`records.${dateKey}.updatedAt`]: new Date().toISOString(),
  });

  return formatDayDataResponse(dateKey, user, updatedDoc || disciplineDoc);
};

const clearDay = async (userId: string, payload: { dateKey: string }) => {
  const { dateKey } = payload;
  const [user, updatedDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.updateFieldsByUserId(userId, {}, { [`records.${dateKey}`]: '' }),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return formatDayDataResponse(
    dateKey,
    user,
    updatedDoc || (await disciplineModel.findOrCreateByUserId(userId))
  );
};

const updateNote = async (
  userId: string,
  payload: { dateKey: string; note: string }
) => {
  const { dateKey, note } = payload;
  const [user, updatedDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.updateFieldsByUserId(userId, {
      [`records.${dateKey}.note`]: note,
      [`records.${dateKey}.updatedAt`]: new Date().toISOString(),
    }),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return formatDayDataResponse(
    dateKey,
    user,
    updatedDoc || (await disciplineModel.findOrCreateByUserId(userId))
  );
};

const saveDayCalories = async (
  userId: string,
  payload: { dateKey: string; meals: FoodItem[] }
) => {
  const { dateKey, meals } = payload;
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  const currentDay: DayRecord = disciplineDoc.records?.[dateKey] || {};
  const profile = user.profile || DEFAULT_USER_PROFILE;
  const previousSummary = currentDay.caloriesData?.summary;

  const { summary, meals: analyzedMeals } = await aiCoachService.analyzeNutrition(
    profile,
    dateKey,
    meals,
    previousSummary
  );

  const updatedDoc = await disciplineModel.updateFieldsByUserId(userId, {
    [`records.${dateKey}.caloriesData`]: {
      meals: analyzedMeals,
      summary,
    },
    [`records.${dateKey}.updatedAt`]: new Date().toISOString(),
  });

  return formatDayDataResponse(dateKey, user, updatedDoc || disciplineDoc);
};

const saveDayWater = async (
  userId: string,
  payload: { dateKey: string; waterData: WaterData }
) => {
  const { dateKey, waterData } = payload;
  const [user, updatedDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.updateFieldsByUserId(userId, {
      [`records.${dateKey}.waterData`]: waterData,
      [`records.${dateKey}.updatedAt`]: new Date().toISOString(),
    }),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return formatDayDataResponse(
    dateKey,
    user,
    updatedDoc || (await disciplineModel.findOrCreateByUserId(userId))
  );
};

const saveDaySleep = async (
  userId: string,
  payload: { dateKey: string; sleepData: SleepData }
) => {
  const { dateKey, sleepData } = payload;
  const nowIso = new Date().toISOString();
  const [user, updatedDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.updateFieldsByUserId(userId, {
      [`records.${dateKey}.sleepData`]: {
        ...sleepData,
        updatedAt: nowIso,
      },
      [`records.${dateKey}.updatedAt`]: nowIso,
    }),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return formatDayDataResponse(
    dateKey,
    user,
    updatedDoc || (await disciplineModel.findOrCreateByUserId(userId))
  );
};

const saveDayWorkout = async (
  userId: string,
  payload: {
    dateKey: string;
    targetMuscles: string[];
    exercises: WorkoutExercise[];
  }
) => {
  const { dateKey, targetMuscles, exercises } = payload;
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  const records = disciplineDoc.records || {};
  const profile = user.profile || DEFAULT_USER_PROFILE;
  const summary =
    exercises && exercises.length > 0
      ? await aiCoachService.analyzeWorkout({
          profile,
          dateKey,
          targetMuscles: targetMuscles || [],
          exercises: exercises || [],
          allRecords: records,
        })
      : undefined;

  const nowIso = new Date().toISOString();
  const updatedDoc = await disciplineModel.updateFieldsByUserId(userId, {
    [`records.${dateKey}.workoutData`]: {
      targetMuscles: targetMuscles || [],
      exercises: exercises || [],
      summary,
      updatedAt: nowIso,
    },
    [`records.${dateKey}.updatedAt`]: nowIso,
  });

  return formatDayDataResponse(dateKey, user, updatedDoc || disciplineDoc);
};

const saveDayStates = async (
  userId: string,
  payload: {
    dateKey: string;
    physicalState: string;
    mentalState: string;
    emotionalState: string;
  }
) => {
  const { dateKey, physicalState, mentalState, emotionalState } = payload;
  const [user, updatedDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.updateFieldsByUserId(userId, {
      [`records.${dateKey}.physicalState`]: physicalState,
      [`records.${dateKey}.mentalState`]: mentalState,
      [`records.${dateKey}.emotionalState`]: emotionalState,
      [`records.${dateKey}.updatedAt`]: new Date().toISOString(),
    }),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return formatDayDataResponse(
    dateKey,
    user,
    updatedDoc || (await disciplineModel.findOrCreateByUserId(userId))
  );
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
    startTime?: string;
    endTime?: string;
    target?: string;
    scope: 'day' | 'week' | 'month' | 'all';
    dateKey: string;
    hour?: number;
    columnIndex?: number;
    isAllDay?: boolean;
  }
) => {
  const {
    mode,
    taskId,
    title,
    category,
    scope,
    dateKey,
    hour,
    columnIndex,
    startTime,
    endTime,
    isAllDay,
  } = payload;
  const timeHint = isAllDay
    ? 'Cả ngày'
    : payload.timeHint ||
      (startTime && endTime
        ? `${startTime} - ${endTime}`
        : startTime || payload.target || '');
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }
  const prev = disciplineDoc.taskConfig || getDefaultTaskConfig();

  const next: TaskConfig = {
    globalTasks: [...(prev.globalTasks || [])],
    customTasks: [...(prev.customTasks || [])],
    excludedTaskIds: { ...(prev.excludedTaskIds || {}) },
    taskOverrides: { ...(prev.taskOverrides || {}) },
  };

  const monthKey = dateKey.substring(0, 7);

  if (mode === 'add') {
    const newId = `task_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTaskObj: CustomTaskItem = {
      id: newId,
      title,
      category,
      timeHint,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      hour: isAllDay ? undefined : hour,
      columnIndex: isAllDay ? undefined : columnIndex,
      isAllDay: Boolean(isAllDay),
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
    const extraFields = isAllDay
      ? {
          startTime: undefined,
          endTime: undefined,
          hour: undefined,
          columnIndex: undefined,
          isAllDay: true,
        }
      : {
          isAllDay: false,
          ...(hour !== undefined ? { hour } : {}),
          ...(columnIndex !== undefined ? { columnIndex } : {}),
          ...(startTime !== undefined ? { startTime } : {}),
          ...(endTime !== undefined ? { endTime } : {}),
        };
    if (scope === 'all') {
      next.globalTasks = next.globalTasks.map((t) =>
        t.id === taskId ? { ...t, title, category, timeHint, ...extraFields } : t
      );
      next.customTasks = next.customTasks.map((t) =>
        t.id === taskId ? { ...t, title, category, timeHint, ...extraFields } : t
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
          [taskId]: { title, category, timeHint, ...extraFields },
        };
      });
    }
  }

  const updatedDoc = await disciplineModel.updateByUserId(userId, { taskConfig: next });
  return formatDayDataResponse(dateKey, user, updatedDoc || disciplineDoc);
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
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }
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

  const updatedDoc = await disciplineModel.updateByUserId(userId, { taskConfig: next });
  return formatDayDataResponse(dateKey, user, updatedDoc || disciplineDoc);
};

const exportData = async (userId: string) => {
  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa! Vui lòng đăng nhập lại.');
  }

  return {
    records: disciplineDoc.records || {},
    taskConfig: disciplineDoc.taskConfig || getDefaultTaskConfig(),
    userProfile: user.profile || DEFAULT_USER_PROFILE,
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
  saveDayCalories,
  saveDayWater,
  saveDaySleep,
  saveDayWorkout,
  saveDayStates,
  saveTask,
  deleteTask,
  exportData,
  importData,
};
