import {
  DAILY_TASKS,
  SCORING,
  MAX_DAILY_POINTS,
  getDailyRank,
} from '../config/settings';

const STORAGE_KEY = 'self_upgrade_records_v1';

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
 * Đọc dữ liệu từ LocalStorage
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
 * Lưu dữ liệu vào LocalStorage
 */
export function saveAllRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Lỗi lưu dữ liệu vào localStorage:', err);
  }
}

/**
 * Tính toán điểm và thống kê chi tiết cho 1 ngày
 * @param {Object} dayTaskMap - Map { [taskId]: 'BAD' | 'GOOD' | 'PERFECT' } và note (nếu có)
 */
export function calculateDayStats(dayRecord = {}) {
  const tasksMap = dayRecord?.tasks || {};
  let rawPoints = 0;
  const counts = {
    PERFECT: 0,
    GOOD: 0,
    BAD: 0,
    NONE: 0,
  };

  DAILY_TASKS.forEach((task) => {
    const statusKey = tasksMap[task.id] || 'NONE';
    const scoreDef = SCORING[statusKey] || SCORING.NONE;
    rawPoints += scoreDef.points;
    counts[scoreDef.key] = (counts[scoreDef.key] || 0) + 1;
  });

  const checkedCount = DAILY_TASKS.length - counts.NONE;
  const exactPercentage = (rawPoints / MAX_DAILY_POINTS) * 100;
  const percentage = Math.round(exactPercentage * 10) / 10;
  const rank = getDailyRank(percentage, checkedCount);

  return {
    rawPoints,
    maxPoints: MAX_DAILY_POINTS,
    percentage,
    checkedCount,
    totalTasks: DAILY_TASKS.length,
    counts,
    rank,
    note: dayRecord?.note || '',
  };
}

/**
 * Tính toán thống kê cho toàn bộ tháng (year, month)
 */
export function calculateMonthStats(year, month, allRecords = {}) {
  const totalDays = getDaysInMonth(year, month);
  const daysList = [];

  let sumPoints = 0;
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
    const stats = calculateDayStats(dayRecord);
    const weekday = getWeekdayLabel(year, month, d);

    const dayItem = {
      day: d,
      dateKey,
      weekday,
      ...stats,
    };

    daysList.push(dayItem);
    sumPoints += stats.rawPoints;

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

  // Điểm % trung bình của các ngày đã ghi nhận trong tháng
  const avgActivePercentage =
    activeDaysCount > 0
      ? Math.round((sumPercentageActiveDays / activeDaysCount) * 10) / 10
      : 0;

  // Điểm % tổng thể của cả tháng (trên tổng điểm tối đa của cả tháng)
  const maxMonthPoints = totalDays * MAX_DAILY_POINTS;
  const overallMonthPercentage =
    Math.round(((sumPoints / maxMonthPoints) * 100) * 10) / 10;

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

/**
 * Tạo dữ liệu mẫu thông minh cho một vài ngày đầu tháng để người dùng có thể xem thử biểu đồ ngay nếu muốn
 */
export function generateSampleDataForMonth(year, month, currentRecords = {}) {
  const updated = { ...currentRecords };
  const sampleDays = [1, 2, 3, 4, 5, 6, 7];
  const patterns = [
    ['PERFECT', 'PERFECT', 'GOOD', 'GOOD', 'PERFECT', 'GOOD', 'BAD', 'PERFECT', 'GOOD', 'PERFECT', 'GOOD', 'PERFECT'],
    ['GOOD', 'GOOD', 'GOOD', 'PERFECT', 'GOOD', 'BAD', 'GOOD', 'GOOD', 'PERFECT', 'GOOD', 'GOOD', 'GOOD'],
    ['PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'GOOD', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT'],
    ['BAD', 'GOOD', 'BAD', 'GOOD', 'GOOD', 'NONE', 'BAD', 'GOOD', 'BAD', 'GOOD', 'GOOD', 'BAD'],
    ['GOOD', 'PERFECT', 'GOOD', 'PERFECT', 'PERFECT', 'GOOD', 'GOOD', 'PERFECT', 'PERFECT', 'GOOD', 'PERFECT', 'GOOD'],
    ['PERFECT', 'GOOD', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'GOOD', 'PERFECT', 'PERFECT', 'PERFECT', 'GOOD', 'PERFECT'],
    ['PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT', 'PERFECT'],
  ];

  sampleDays.forEach((dayNum, idx) => {
    const key = formatDateKey(year, month, dayNum);
    const pattern = patterns[idx % patterns.length];
    const tasks = {};
    DAILY_TASKS.forEach((task, tIdx) => {
      const level = pattern[tIdx];
      if (level && level !== 'NONE') {
        tasks[task.id] = level;
      }
    });
    updated[key] = {
      tasks,
      note: `Ghi chú mẫu ngày ${dayNum}/${month}`,
    };
  });

  return updated;
}
