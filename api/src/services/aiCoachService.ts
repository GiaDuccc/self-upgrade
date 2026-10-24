import { DEFAULT_USER_PROFILE, PERSONALIZATION_OPTIONS } from '~/config/settings';
import { disciplineModel } from '~/models/disciplineModel';
import { userModel } from '~/models/userModel';
import {
  calculateDayStats,
  getDefaultTaskConfig,
  getTasksForDate,
  getTodayInfo,
} from '~/utils/statsCalculator';
import { CaloriesSummary, DayRecord, FoodItem, TaskItem, UserProfile, WorkoutExercise, WorkoutSummary } from '~/types';
import { buildUserMemorySnapshot } from '~/agents/memory/agentMemoryEngine';
import {
  DateTemporalContext,
  DayPeriodKey,
  RecentChangeContext,
  TimeOfDayContext,
  runDisciplineCoachAgent,
  runNutritionistAgent,
  runWorkoutAgent,
} from '~/agents/selfUpgradeAgent';

const STATE_EN_LABELS: Record<string, string> = {
  // Physical states
  EXHAUSTED: 'exhausted / recovering',
  TIRED: 'tired / sore',
  NORMAL: 'normal & steady',
  PEAK: 'peak energy',
  // Mental states
  STRESSED: 'stressed / overloaded',
  DISTRACTED: 'easily distracted',
  STEADY: 'steady & focused',
  SHARP: 'razor-sharp',
  // Emotional states
  LOW_MOOD: 'low mood',
  ANXIOUS: 'anxious / restless',
  CALM: 'calm & balanced',
  FIRED_UP: 'fired up & determined',
  // Focus goals
  BALANCED: 'Holistic Growth',
  CAREER_MIND: 'Career & Intellect',
  HEALTH_BODY: 'Health & Fitness',
  IRON_DISCIPLINE: 'Iron Discipline & Self-Control',
};

const LEVEL_LABELS: Record<string, string> = {
  PERFECT: 'Hoàn Hảo',
  GOOD: 'Tốt',
  BAD: 'Tệ',
  NONE: 'Bỏ tích (chưa làm)',
};

function getDateTemporalContext(
  targetDateKey: string,
  todayDateKey: string
): DateTemporalContext {
  const parseLocal = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y || 2026, (m || 1) - 1, d || 1);
  };
  const targetObj = parseLocal(targetDateKey);
  const todayObj = parseLocal(todayDateKey);
  const diffDays = Math.round(
    (targetObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24)
  );
  const [, mStr, dStr] = targetDateKey.split('-');
  const shortDate = `${dStr}/${mStr}`;

  let relativeDayLabel = `ngày hôm nay (${shortDate})`;
  let relativeDayLabelEn = `today (${shortDate})`;

  if (diffDays === -1) {
    relativeDayLabel = `ngày hôm qua (${shortDate})`;
    relativeDayLabelEn = `yesterday (${shortDate})`;
  } else if (diffDays === -2) {
    relativeDayLabel = `ngày hôm kia (${shortDate})`;
    relativeDayLabelEn = `2 days ago (${shortDate})`;
  } else if (diffDays < -2) {
    relativeDayLabel = `ngày ${shortDate} (${Math.abs(diffDays)} ngày trước)`;
    relativeDayLabelEn = `${shortDate} (${Math.abs(diffDays)} days ago)`;
  } else if (diffDays === 1) {
    relativeDayLabel = `ngày mai (${shortDate})`;
    relativeDayLabelEn = `tomorrow (${shortDate})`;
  } else if (diffDays > 1) {
    relativeDayLabel = `ngày ${shortDate} (${diffDays} ngày tới)`;
    relativeDayLabelEn = `${shortDate} (in ${diffDays} days)`;
  }

  return {
    diffDays,
    isToday: diffDays === 0,
    isPastDay: diffDays < 0,
    isFutureDay: diffDays > 0,
    shortDate,
    relativeDayLabel,
    relativeDayLabelEn,
  };
}

function getCurrentTimeContext(
  clientHour?: number,
  clientMinute?: number
): TimeOfDayContext {
  let hour: number;
  let minute: number;

  if (
    typeof clientHour === 'number' &&
    !isNaN(clientHour) &&
    clientHour >= 0 &&
    clientHour <= 23
  ) {
    hour = clientHour;
    minute =
      typeof clientMinute === 'number' &&
      !isNaN(clientMinute) &&
      clientMinute >= 0 &&
      clientMinute <= 59
        ? clientMinute
        : 0;
  } else {
    // Luôn fallback chuẩn theo múi giờ Việt Nam GMT+7 (Asia/Ho_Chi_Minh)
    // để khi deploy lên Render (mặc định UTC) không bao giờ bị lệch múi giờ
    try {
      const vnDate = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
      );
      hour = vnDate.getHours();
      minute = vnDate.getMinutes();
    } catch {
      const now = new Date();
      hour = now.getHours();
      minute = now.getMinutes();
    }
  }

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const totalMins = hour * 60 + minute;

  let periodKey: DayPeriodKey = 'MID_MORNING';
  let periodLabel = 'Buổi sáng';
  let periodLabelEn = 'morning';
  let naturalGreetingTimeVi = `buổi sáng (${timeStr})`;
  let naturalGreetingTimeEn = `this morning (${timeStr})`;

  if (totalMins >= 5 * 60 && totalMins < 8 * 60 + 30) {
    // 05:00 - 08:29
    periodKey = 'EARLY_MORNING';
    periodLabel = 'Buổi sáng sớm';
    periodLabelEn = 'early morning';
    naturalGreetingTimeVi = `sáng sớm (${timeStr})`;
    naturalGreetingTimeEn = `early morning (${timeStr})`;
  } else if (totalMins >= 8 * 60 + 30 && totalMins < 11 * 60 + 30) {
    // 08:30 - 11:29
    periodKey = 'MID_MORNING';
    periodLabel = 'Buổi sáng';
    periodLabelEn = 'morning';
    naturalGreetingTimeVi = `buổi sáng (${timeStr})`;
    naturalGreetingTimeEn = `this morning (${timeStr})`;
  } else if (totalMins >= 11 * 60 + 30 && totalMins < 14 * 60) {
    // 11:30 - 13:59
    periodKey = 'NOON';
    periodLabel = 'Buổi trưa';
    periodLabelEn = 'midday';
    naturalGreetingTimeVi = `đã ${timeStr} trưa rồi`;
    naturalGreetingTimeEn = `it’s already ${timeStr} noon`;
  } else if (totalMins >= 14 * 60 && totalMins < 17 * 60) {
    // 14:00 - 16:59
    periodKey = 'AFTERNOON';
    periodLabel = 'Buổi chiều';
    periodLabelEn = 'afternoon';
    naturalGreetingTimeVi = `buổi chiều (${timeStr})`;
    naturalGreetingTimeEn = `this afternoon (${timeStr})`;
  } else if (totalMins >= 17 * 60 && totalMins < 19 * 60) {
    // 17:00 - 18:59
    periodKey = 'LATE_AFTERNOON';
    periodLabel = 'Chiều muộn / Giờ tan sở';
    periodLabelEn = 'late afternoon';
    naturalGreetingTimeVi = `đã ${timeStr} chiều rồi`;
    naturalGreetingTimeEn = `it’s ${timeStr} late afternoon`;
  } else if (totalMins >= 19 * 60 && totalMins < 22 * 60) {
    // 19:00 - 21:59
    periodKey = 'EVENING';
    periodLabel = 'Buổi tối';
    periodLabelEn = 'evening';
    naturalGreetingTimeVi = `buổi tối (${timeStr})`;
    naturalGreetingTimeEn = `this evening (${timeStr})`;
  } else {
    // 22:00 - 04:59
    periodKey = 'LATE_NIGHT';
    periodLabel = 'Đêm muộn';
    periodLabelEn = 'late night';
    naturalGreetingTimeVi = `đã ${timeStr} đêm muộn rồi`;
    naturalGreetingTimeEn = `it’s already ${timeStr} late night`;
  }

  return {
    hour,
    minute,
    timeStr,
    periodKey,
    periodLabel,
    periodLabelEn,
    naturalGreetingTimeVi,
    naturalGreetingTimeEn,
  };
}

function isNightSleepTask(
  task?: { id?: string; title?: string; category?: string } | null
): boolean {
  if (!task) return false;
  if (task.id === 'sleep_before_11pm') return true;
  const titleLower = (task.title || '').toLowerCase();
  if (titleLower.includes('ngủ trưa')) return false;
  if (
    titleLower.includes('ngủ trước') ||
    titleLower.includes('đi ngủ') ||
    titleLower.includes('ngủ sớm') ||
    titleLower.includes('ngủ đúng giờ') ||
    (task.category || '').toLowerCase() === 'giấc ngủ'
  ) {
    return true;
  }
  return false;
}

function classifyPendingTasksByTime(
  pendingTaskObjects: TaskItem[],
  currentHour: number
): { actionableNow: string[]; passedTimeWindow: string[] } {
  // 1. Phân loại từng task theo giờ đã lên lịch (scheduledHour)
  const scheduledTasks = pendingTaskObjects.map((t) => {
    let hour = t.hour;
    if (typeof hour !== 'number' || isNaN(hour)) {
      if (t.timeHint) {
        const m = t.timeHint.match(/(\d{1,2}):(\d{2})/);
        if (m) hour = parseInt(m[1], 10);
        const m2 = t.timeHint.match(/(\d{1,2})h/i);
        if (m2) hour = parseInt(m2[1], 10);
      }
    }
    if (typeof hour !== 'number' || isNaN(hour)) {
      const id = (t.id || '').toLowerCase();
      const titleLower = (t.title || '').toLowerCase();
      if (id.includes('wake') || titleLower.includes('dậy')) hour = 5;
      else if (id.includes('english') || titleLower.includes('tiếng anh')) hour = 7;
      else if (id.includes('work') || titleLower.includes('làm việc')) hour = 8;
      else if (id.includes('code') || titleLower.includes('code')) hour = 9;
      else if (id.includes('game') || titleLower.includes('game')) hour = 11;
      else if (id.includes('nap') || titleLower.includes('ngủ trưa')) hour = 13;
      else if (id.includes('water') || titleLower.includes('nước')) hour = 15;
      else if (id.includes('gym') || titleLower.includes('thể dục')) hour = 17;
      else if (id.includes('junk_food') || titleLower.includes('ăn vặt')) hour = 19;
      else if (id.includes('sleep') || titleLower.includes('ngủ trước')) hour = 22;
      else hour = 12;
    }
    return { task: t, hour };
  });

  const passedTimeWindow: string[] = [];
  const currentWindowTasks: string[] = [];
  const upcomingTodayTasks: string[] = [];
  const generalTasks: string[] = [];

  for (const { task, hour } of scheduledTasks) {
    const title = task.title;
    const titleLower = title.toLowerCase();

    // Các việc chỉ có ý nghĩa vào một khung giờ cụ thể và đã trôi qua
    const isStrictMorning =
      task.id === 'wake_5am' ||
      titleLower.includes('thức dậy') ||
      titleLower.includes('dậy 5h');
    const isStrictNap = task.id === 'nap' || titleLower.includes('ngủ trưa');
    const isNightSleep = isNightSleepTask(task);

    if (isStrictMorning && currentHour >= 11) {
      passedTimeWindow.push(title);
      continue;
    }

    if (isStrictNap && (currentHour < 11 || currentHour >= 15)) {
      if (currentHour >= 15) passedTimeWindow.push(title);
      continue;
    }

    if (isNightSleep) {
      if (currentHour >= 21) {
        currentWindowTasks.push(title);
      }
      // Ban ngày không giục đi ngủ trước 11h
      continue;
    }

    // Task thuộc khung giờ hiện tại (chênh lệch trong khoảng -1 đến +2 tiếng)
    if (hour >= currentHour - 1 && hour <= currentHour + 2) {
      currentWindowTasks.push(title);
    } else if (hour > currentHour + 2 && hour < 22) {
      upcomingTodayTasks.push(title);
    } else if (currentHour - hour > 3) {
      // Đã quá giờ dự kiến hơn 3 tiếng (ví dụ việc 7h sáng khi đang 13h chiều)
      passedTimeWindow.push(title);
      generalTasks.push(title);
    } else {
      generalTasks.push(title);
    }
  }

  // Sắp xếp ưu tiên: Việc của khung giờ hiện tại -> Việc sắp tới hôm nay -> Việc tồn đọng
  const actionableNow = [
    ...currentWindowTasks,
    ...upcomingTodayTasks,
    ...generalTasks,
  ];

  return { actionableNow, passedTimeWindow };
}

function describeRecentChange(
  signal: string | undefined,
  tasksList: TaskItem[],
  stateLabels: { phys: string; ment: string; emo: string },
  dateCtx: DateTemporalContext
): RecentChangeContext | null {
  if (!signal) return null;
  const parts = signal.split('|');

  if (parts[0] === 'PROFILE') {
    return {
      kind: 'PROFILE',
      detail: `Người dùng vừa cập nhật trạng thái cá nhân: Thể chất "${stateLabels.phys}", Tinh thần "${stateLabels.ment}", Cảm xúc "${stateLabels.emo}".`,
      short: `Vừa cập nhật trạng thái (thể chất ${stateLabels.phys.toLowerCase()}),`,
    };
  }

  if (parts.length < 3) return null;
  const kind = parts[1];

  if (kind === 'ALL') {
    const lvl = LEVEL_LABELS[parts[2]] || parts[2];
    return {
      kind: 'ALL',
      levelKey: parts[2],
      detail: `Người dùng vừa bấm tích nhanh TẤT CẢ ${tasksList.length} việc ở mức "${lvl}".`,
      short: `Tích nhanh tất cả ở mức ${lvl}${dateCtx.isPastDay ? ` cho ${dateCtx.relativeDayLabel}` : ''},`,
    };
  }

  if (kind === 'CLEAR') {
    return {
      kind: 'CLEAR',
      detail: `Người dùng vừa bấm "Đặt lại ngày".`,
      short: `Vừa đặt lại bảng việc ${dateCtx.relativeDayLabel},`,
    };
  }

  if (kind === 'NOTE') {
    const noteText = parts.slice(2, -1).join('|').trim();
    return {
      kind: 'NOTE',
      noteText,
      detail: noteText
        ? `Người dùng vừa lưu ghi chú tự kiểm điểm: "${noteText.slice(0, 400)}".`
        : `Người dùng vừa xóa trống ghi chú.`,
      short: `Đọc ghi chú ${dateCtx.relativeDayLabel} vừa viết rồi nhé,`,
    };
  }

  if (kind === 'WATER') {
    const ml = parts[2] || '0';
    return {
      kind: 'WATER',
      waterMl: ml,
      detail: `Người dùng vừa cập nhật nạp nước: ${ml}ml.`,
      short: `Thấy bạn vừa nạp thêm nước (${ml}ml),`,
    };
  }

  const task = tasksList.find((t) => t.id === kind);
  const levelKey = parts[2];
  const hourPart = parts[3]?.endsWith('h') ? parts[3] : '';
  const hourNote = hourPart ? ` vào khung giờ ${hourPart}` : '';
  const title = task?.title || 'một đầu việc';
  const sleepFlag = isNightSleepTask(task);

  if (levelKey === 'NONE') {
    return {
      kind: 'TASK',
      task,
      levelKey,
      hourPart,
      isSleepTask: sleepFlag,
      detail: `Người dùng vừa BỎ TÍCH việc "${title}".`,
      short: `Vừa bỏ tích "${title}"${dateCtx.isPastDay ? ` của ${dateCtx.relativeDayLabel}` : ''},`,
    };
  }

  return {
    kind: 'TASK',
    task,
    levelKey,
    hourPart,
    isSleepTask: sleepFlag,
    detail: `Người dùng vừa tích hoàn thành việc "${title}"${hourNote}.`,
    short: `Vừa tích "${title}"${hourNote}${dateCtx.isPastDay ? ` cho ${dateCtx.relativeDayLabel}` : ''},`,
  };
}

/**
 * Điều phối Sub-Agent 1: Discipline Coach Agent (Observe -> 7-Day Memory -> Persona -> Bilingual NLG -> Episodic Memory)
 * Không phụ thuộc Gemini API, không bao giờ lỗi 429 hay Timeout, siêu nhẹ (<5MB RAM) cho Render.
 */
const getCoachingMessage = async (
  userId: string,
  payload: {
    dateKey?: string;
    mode?: 'greeting' | 'feedback';
    changeSignal?: string;
    clientHour?: number;
    clientMinute?: number;
    timezone?: string;
  },
  signal?: AbortSignal
): Promise<{
  message: string;
  messageEn?: string;
  isTimeout?: boolean;
  error?: string;
}> => {
  if (signal?.aborted) {
    return { message: '' };
  }

  const mode = payload.mode || 'feedback';
  const todayInfo = getTodayInfo();
  const signalDateMatch = payload.changeSignal?.match(/^(\d{4}-\d{2}-\d{2})\|/);
  const targetDateKey =
    signalDateMatch?.[1] || payload.dateKey || todayInfo.dateKey;

  const dateCtx = getDateTemporalContext(targetDateKey, todayInfo.dateKey);
  const timeCtx = getCurrentTimeContext(payload.clientHour, payload.clientMinute);

  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);

  if (signal?.aborted) {
    return { message: '' };
  }

  const userProfile = user?.profile || DEFAULT_USER_PROFILE;
  const records = disciplineDoc.records || {};
  const taskConfig = disciplineDoc.taskConfig || getDefaultTaskConfig();
  const dayRecord = records[targetDateKey] || { tasks: {}, note: '' };
  const tasksList = getTasksForDate(targetDateKey, taskConfig);
  const dayStats = calculateDayStats(dayRecord, tasksList, userProfile);

  const tasksMap = dayRecord.tasks || {};
  const completedTasks: string[] = [];
  const pendingTasks: string[] = [];
  const pendingTaskObjects: TaskItem[] = [];

  tasksList.forEach((t) => {
    const lvl = tasksMap[t.id];
    if (lvl && lvl !== 'NONE') {
      const hours = dayRecord.taskHours?.[t.id];
      const hoursStr =
        Array.isArray(hours) && hours.length > 0
          ? ` (lúc ${hours.map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')})`
          : '';
      completedTasks.push(`${t.title}${hoursStr}`);
    } else {
      pendingTasks.push(t.title);
      pendingTaskObjects.push(t);
    }
  });

  const { actionableNow, passedTimeWindow } = classifyPendingTasksByTime(
    pendingTaskObjects,
    timeCtx.hour
  );

  const physObj =
    PERSONALIZATION_OPTIONS.physicalStates.find(
      (x) => x.id === userProfile.physicalState
    ) || { id: 'NORMAL', label: 'Bình thường' };
  const mentObj =
    PERSONALIZATION_OPTIONS.mentalStates.find(
      (x) => x.id === userProfile.mentalState
    ) || { id: 'STEADY', label: 'Ổn định' };
  const emoObj =
    PERSONALIZATION_OPTIONS.emotionalStates.find(
      (x) => x.id === userProfile.emotionalState
    ) || { id: 'CALM', label: 'Cân bằng' };
  const goalObj =
    PERSONALIZATION_OPTIONS.focusGoals.find(
      (x) => x.id === userProfile.focusGoal
    ) || { id: 'BALANCED', label: 'Phát triển toàn diện' };

  const callName = userProfile.name?.trim() ? userProfile.name.trim() : 'bạn';

  const recentChange =
    mode === 'feedback'
      ? describeRecentChange(
          payload.changeSignal,
          tasksList,
          {
            phys: physObj.label,
            ment: mentObj.label,
            emo: emoObj.label,
          },
          dateCtx
        )
      : null;

  // Bước 1 của Agent: Truy xuất Trí nhớ dài hạn 7 ngày (Long-Term Memory Engine)
  const memorySnapshot = buildUserMemorySnapshot(
    todayInfo.dateKey,
    records,
    taskConfig,
    userProfile,
    dayStats.percentage || 0
  );

  // Bước 2 của Agent: Điều phối quyết định & Sinh ngôn ngữ song ngữ (VI + EN)
  const agentResponse = runDisciplineCoachAgent({
    userId,
    mode,
    callName,
    percentage: dayStats.percentage || 0,
    rawPoints: dayStats.rawPoints || 0,
    maxPoints: dayStats.maxPoints || 100,
    completedTasks,
    pendingTasks,
    actionableNow,
    passedTimeWindow,
    physLabel: physObj.label,
    physLabelEn: STATE_EN_LABELS[physObj.id] || 'steady',
    mentLabel: mentObj.label,
    mentLabelEn: STATE_EN_LABELS[mentObj.id] || 'focused',
    emoLabel: emoObj.label,
    emoLabelEn: STATE_EN_LABELS[emoObj.id] || 'balanced',
    goalLabel: goalObj.label,
    goalLabelEn: STATE_EN_LABELS[goalObj.id] || 'Holistic Growth',
    dateCtx,
    timeCtx,
    recentChange,
    memory: memorySnapshot,
    waterCurrentMl: dayRecord.waterData?.currentMl,
    waterTargetMl: dayRecord.waterData?.targetMl,
  });

  console.log(
    `   [SelfUpgrade Agent] 🤖 Coach (Streak ${memorySnapshot.streakDays}d | Avg7d ${memorySnapshot.avg7DayScore}% | Momentum ${memorySnapshot.momentum}) -> Hoàn thành trong <5ms`
  );

  return {
    message: agentResponse.message,
    messageEn: agentResponse.messageEn,
  };
};

/**
 * Điều phối Sub-Agent 2: Nutritionist Agent (Tool-Augmented Macro Engine + Mifflin-St Jeor TDEE + Bilingual Feedback)
 * Tính toán chính xác 5 chỉ số Macro cho từng món ăn và tổng thực đơn trong <5ms.
 */
const analyzeNutrition = async (
  profile: UserProfile,
  dateKey: string,
  meals: FoodItem[],
  previousSummary?: CaloriesSummary
): Promise<{ summary: CaloriesSummary; meals: FoodItem[] }> => {
  const result = runNutritionistAgent({
    profile,
    dateKey,
    meals,
    previousSummary,
  });

  console.log(
    `   [SelfUpgrade Agent] 🥗 Nutritionist (${meals.length} món -> ${result.summary.totalCalories} kcal | P:${result.summary.protein}g C:${result.summary.carb}g F:${result.summary.fat}g Fib:${result.summary.fiber}g)`
  );

  return result;
};

/**
 * Điều phối Sub-Agent 3: Workout Training Agent (Progressive Overload + RIR Analysis)
 */
const analyzeWorkout = async (params: {
  profile: UserProfile;
  dateKey: string;
  targetMuscles: string[];
  exercises: WorkoutExercise[];
  allRecords: Record<string, DayRecord>;
}): Promise<WorkoutSummary> => {
  const summary = runWorkoutAgent(params);
  console.log(
    `   [SelfUpgrade Agent] 🏋️ Workout Agent (${params.exercises.length} bài | Vol: ${summary.totalVolumeKg}kg | Status: ${summary.progressiveOverloadStatus})`
  );
  return summary;
};

export const aiCoachService = {
  getCoachingMessage,
  analyzeNutrition,
  analyzeWorkout,
};
