import {
  DAILY_TASKS,
  SCORING,
  MAX_POINTS_PER_TASK,
  getDailyRank,
  DEFAULT_USER_PROFILE,
  PERSONALIZATION_OPTIONS,
  isTaskBoostedByProfile,
} from '../config/settings';

const STORAGE_KEY = 'self_upgrade_records_v1';
const STORAGE_TASK_CONFIG_KEY = 'self_upgrade_task_config_v1';
const STORAGE_USER_PROFILE_KEY = 'self_upgrade_user_profile_v1';

/**
 * Chuẩn hóa chuỗi ngày YYYY-MM-DD
 */
export function formatDateKey(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Lấy thông tin ngày hôm nay theo giờ địa phương
 */
export function getTodayInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1 - 12
  const day = now.getDate();
  return {
    year,
    month,
    day,
    dateKey: formatDateKey(year, month, day),
  };
}

/**
 * Số ngày trong một tháng (month: 1 - 12)
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Lấy thứ trong tuần của một ngày (T2 -> CN)
 */
export function getWeekdayLabel(year, month, day) {
  const date = new Date(year, month - 1, day);
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return labels[date.getDay()];
}

/**
 * Lấy danh sách 7 ngày trong tuần chứa dateKey (Thứ 2 đến Chủ Nhật)
 */
export function getWeekDates(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    dates.push(
      formatDateKey(cur.getFullYear(), cur.getMonth() + 1, cur.getDate())
    );
  }
  return dates;
}

/**
 * Đọc dữ liệu ghi nhận ngày từ LocalStorage
 */
export function loadAllRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi đọc dữ liệu từ localStorage:', err);
    return {};
  }
}

/**
 * Lưu dữ liệu ghi nhận ngày vào LocalStorage
 */
export function saveAllRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Lỗi lưu dữ liệu vào localStorage:', err);
  }
}

/**
 * Đọc Hồ sơ cá nhân & Trạng thái (Thể chất, Tinh thần, Cảm xúc) từ LocalStorage
 */
export function loadUserProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_PROFILE_KEY);
    if (!raw) return { ...DEFAULT_USER_PROFILE };
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Lỗi đọc thông tin cá nhân:', err);
    return { ...DEFAULT_USER_PROFILE };
  }
}

/**
 * Lưu Hồ sơ cá nhân & Trạng thái vào LocalStorage
 */
export function saveUserProfile(profile) {
  try {
    localStorage.setItem(STORAGE_USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Lỗi lưu thông tin cá nhân:', err);
  }
}

/**
 * Đọc cấu hình danh sách công việc (Global + Tuỳ chỉnh theo ngày/tuần/tháng)
 */
export function loadTaskConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_TASK_CONFIG_KEY);
    if (!raw) {
      return {
        globalTasks: DAILY_TASKS.map((t) => ({ ...t })),
        customTasks: [],
        excludedTaskIds: {},
        taskOverrides: {},
      };
    }
    const parsed = JSON.parse(raw);
    return {
      globalTasks: parsed.globalTasks || DAILY_TASKS.map((t) => ({ ...t })),
      customTasks: parsed.customTasks || [],
      excludedTaskIds: parsed.excludedTaskIds || {},
      taskOverrides: parsed.taskOverrides || {},
    };
  } catch (err) {
    console.error('Lỗi đọc cấu hình công việc từ localStorage:', err);
    return {
      globalTasks: DAILY_TASKS.map((t) => ({ ...t })),
      customTasks: [],
      excludedTaskIds: {},
      taskOverrides: {},
    };
  }
}

/**
 * Lưu cấu hình công việc vào LocalStorage
 */
export function saveTaskConfig(config) {
  try {
    localStorage.setItem(STORAGE_TASK_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Lỗi lưu cấu hình công việc vào localStorage:', err);
  }
}

/**
 * Lấy danh sách đầu việc thực tế áp dụng cho một ngày cụ thể (dateKey)
 */
export function getTasksForDate(dateKey, taskConfig) {
  if (!taskConfig) return DAILY_TASKS;

  const monthKey = dateKey.substring(0, 7); // 'YYYY-MM'

  // 1. Khởi đầu với danh sách công việc chung (Global)
  const baseTasks = (taskConfig.globalTasks || DAILY_TASKS).map((t) => ({
    ...t,
  }));

  // 2. Lấy các công việc tuỳ chỉnh được gán cho ngày này, tuần này, tháng này, hoặc tất cả
  const custom = (taskConfig.customTasks || []).filter((ct) => {
    if (ct.scope === 'day' && ct.dateKey === dateKey) return true;
    if (ct.scope === 'week' && ct.weekDates && ct.weekDates.includes(dateKey))
      return true;
    if (ct.scope === 'month' && ct.monthKey === monthKey) return true;
    if (ct.scope === 'all') return true;
    return false;
  });

  let allTasks = [...baseTasks];
  custom.forEach((add) => {
    if (!allTasks.some((t) => t.id === add.id)) {
      allTasks.push({ ...add });
    }
  });

  // 3. Loại bỏ các công việc đã bị xoá cho ngày này
  const excludedForDate = taskConfig.excludedTaskIds?.[dateKey] || [];
  allTasks = allTasks.filter((t) => !excludedForDate.includes(t.id));

  // 4. Áp dụng các chỉnh sửa chi tiết (Overrides) cho ngày này
  const overridesForDate = taskConfig.taskOverrides?.[dateKey] || {};
  allTasks = allTasks.map((t) => {
    if (overridesForDate[t.id]) {
      return { ...t, ...overridesForDate[t.id] };
    }
    return t;
  });

  return allTasks;
}

/**
 * Tính toán điểm và thống kê chi tiết cho 1 ngày dựa trên danh sách việc + Hồ sơ cá nhân hóa
 */
export function calculateDayStats(
  dayRecord = {},
  tasksForDay = DAILY_TASKS,
  userProfile = DEFAULT_USER_PROFILE
) {
  const tasksMap = dayRecord?.tasks || {};
  let rawPoints = 0;
  let maxPoints = 0;

  const counts = {
    PERFECT: 0,
    GOOD: 0,
    BAD: 0,
    NONE: 0,
  };

  const tasksList = tasksForDay && tasksForDay.length > 0 ? tasksForDay : [];

  tasksList.forEach((task) => {
    const statusKey = tasksMap[task.id] || 'NONE';
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

  // Tính hệ số điều chỉnh điểm từ Thể chất, Tinh thần, Cảm xúc & Phong cách huấn luyện
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

    // Chỉ cộng điểm vượt khó tỷ lệ thuận với số việc đạt Tốt/Hoàn hảo trong ngày
    const positiveTasksCount = counts.GOOD + counts.PERFECT;
    const positiveRatio = totalTasks > 0 ? positiveTasksCount / totalTasks : 0;
    stateBonusPct += Math.round(rawResilienceBonus * positiveRatio * 10) / 10;

    // Nếu chọn chế độ Khắc nghiệt (STRICT) và có việc làm Tệ -> trừ kỷ luật
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
  };
}

/**
 * Tính toán thống kê cho toàn bộ tháng (year, month)
 */
export function calculateMonthStats(
  year,
  month,
  allRecords = {},
  taskConfig = null,
  userProfile = DEFAULT_USER_PROFILE
) {
  const totalDays = getDaysInMonth(year, month);
  const daysList = [];

  let sumPoints = 0;
  let maxMonthPoints = 0;
  let sumPercentageActiveDays = 0;
  let activeDaysCount = 0;
  let perfectDaysCount = 0; // Ngày đạt >= 90%
  let goodOrAboveDaysCount = 0; // Ngày đạt >= 70%

  const monthCounts = {
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

    const dayItem = {
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

  // Điểm % trung bình của các ngày đã ghi nhận trong tháng
  const avgActivePercentage =
    activeDaysCount > 0
      ? Math.round((sumPercentageActiveDays / activeDaysCount) * 10) / 10
      : 0;

  // Điểm % tổng thể của cả tháng
  const overallMonthPercentage =
    maxMonthPoints > 0
      ? Math.round(((sumPoints / maxMonthPoints) * 100) * 10) / 10
      : 0;

  // Tìm ngày điểm cao nhất trong tháng
  let bestDay = null;
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
