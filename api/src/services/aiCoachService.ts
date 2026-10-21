import { env } from '~/config/environment';
import { DEFAULT_USER_PROFILE, PERSONALIZATION_OPTIONS } from '~/config/settings';
import { disciplineModel } from '~/models/disciplineModel';
import { userModel } from '~/models/userModel';
import {
  calculateDayStats,
  getDefaultTaskConfig,
  getTasksForDate,
  getTodayInfo,
} from '~/utils/statsCalculator';

import { CaloriesSummary, FoodItem, TaskItem, UserProfile } from '~/types';

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

// Lưu lịch sử các câu đã nói theo từng userId để chống lặp lại cấu trúc câu
const userRecentMessagesMap = new Map<string, string[]>();
const MAX_HISTORY_TRACKED = 6;

const RANDOM_VIBES = [
  'Hài hước dí dỏm, châm biếm nhẹ nhàng, troll vui nhưng thúc đẩy kỷ luật mạnh mẽ',
  'Chiến binh Sparta, kỷ luật thép, nói thẳng thắn, không vuốt ve, đòi hỏi hành động ngay',
  'Người anh thân thiết, tâm lý, hiểu chuyện, chia sẻ thực tế và xốc lại tinh thần',
  'Truyền lửa bùng nổ, dùng thán từ phấn khích, tiếp thêm năng lượng tích cực tối đa',
  'Sắc lạnh thực dụng, tập trung 100% vào số liệu điểm số và việc tiếp theo cần dứt điểm',
  'Bình thản thông thái, triết lý ngắn gọn, đánh thức lòng tự trọng và ý chí nội tại',
  'Đời thường dí dỏm, ví von hình tượng bất ngờ, cười sảng khoái mà thấm thía',
];

const OPENING_SUGGESTIONS = [
  'Dùng thán từ cảm thán bất ngờ (Ơ kìa, Ủa alo, Chà chà, Khét đấy, Này, Úi chà, Thẳng thắn nhé,...)',
  'Gọi tên người dùng ở giữa hoặc cuối câu thay vì đầu câu',
  'Mở đầu bằng việc đặt câu hỏi tu từ khích tướng',
  'Đi thẳng vào phân tích việc vừa tích hoặc việc đang trì hoãn',
  'Mở đầu bằng so sánh/ví von đời thường dí dỏm',
];

async function callGeminiCascade(promptContext: string): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptContext }] }],
            generationConfig: {
              temperature: 1.0,
              maxOutputTokens: 2500,
            },
          }),
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string; thought?: boolean }>;
          };
        }>;
      };

      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p) => p.text && !p.thought) || parts[0];
      let text = textPart?.text?.trim() || '';

      if (text) {
        text = text.replace(/^#+\s*/gm, '');
        text = text.replace(/\*\*/g, '');
        text = text.replace(/^[-*•]\s*/gm, '');
        text = text.replace(/^["'“]+|["'”]+$/g, '').trim();

        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const filteredLines = lines.filter((l) => {
          const lower = l.toLowerCase();
          if (lower.endsWith(':')) return false;
          if (
            /^(lời khuyên|lời chào|nhận xét|động viên|chê|gợi ý|ai coach)\s*:/i.test(
              l
            )
          )
            return false;
          return true;
        });
        const cleanSentence = filteredLines
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanSentence && cleanSentence.length >= 10) {
          return cleanSentence;
        }
      }
    } catch {
      // Thử model kế tiếp
    }
  }

  return null;
}

interface DateTemporalContext {
  diffDays: number;
  isToday: boolean;
  isPastDay: boolean;
  isFutureDay: boolean;
  shortDate: string;
  relativeDayLabel: string;
}

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
  if (diffDays === -1) {
    relativeDayLabel = `ngày hôm qua (${shortDate})`;
  } else if (diffDays === -2) {
    relativeDayLabel = `ngày hôm kia (${shortDate})`;
  } else if (diffDays < -2) {
    relativeDayLabel = `ngày ${shortDate} (${Math.abs(diffDays)} ngày trước)`;
  } else if (diffDays === 1) {
    relativeDayLabel = `ngày mai (${shortDate})`;
  } else if (diffDays > 1) {
    relativeDayLabel = `ngày ${shortDate} (${diffDays} ngày tới)`;
  }

  return {
    diffDays,
    isToday: diffDays === 0,
    isPastDay: diffDays < 0,
    isFutureDay: diffDays > 0,
    shortDate,
    relativeDayLabel,
  };
}

function getCurrentTimeContext() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  let periodLabel = 'Buổi sáng';
  if (hour >= 5 && hour < 11) {
    periodLabel = 'Buổi sáng';
  } else if (hour >= 11 && hour < 14) {
    periodLabel = 'Buổi trưa';
  } else if (hour >= 14 && hour < 18) {
    periodLabel = 'Buổi chiều';
  } else if (hour >= 18 && hour < 22) {
    periodLabel = 'Buổi tối';
  } else {
    periodLabel = 'Đêm muộn (khung giờ nghỉ ngơi / chuẩn bị đi ngủ)';
  }

  return { hour, minute, timeStr, periodLabel };
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
  const actionableNow: string[] = [];
  const passedTimeWindow: string[] = [];

  for (const t of pendingTaskObjects) {
    const titleLower = (t.title || '').toLowerCase();
    const hintLower = (t.timeHint || '').toLowerCase();

    const isMorningOnly =
      t.id === 'wake_5am' ||
      t.id === 'morning_exercise' ||
      titleLower.includes('thức dậy') ||
      titleLower.includes('buổi sáng') ||
      hintLower.includes('05:00') ||
      hintLower.includes('buổi sáng');

    const isMiddayNap =
      t.id === 'nap' ||
      titleLower.includes('ngủ trưa') ||
      hintLower.includes('buổi trưa');

    const isHeavyWorkout =
      t.id === 'gym' ||
      titleLower.includes('tập gym') ||
      titleLower.includes('thể dục');

    const isNightSleep = isNightSleepTask(t);

    if (isMorningOnly && currentHour >= 11) {
      passedTimeWindow.push(t.title);
      continue;
    }

    if (isMiddayNap && (currentHour < 11 || currentHour >= 15)) {
      if (currentHour >= 15) {
        passedTimeWindow.push(t.title);
      }
      continue;
    }

    if (currentHour >= 22 && isHeavyWorkout) {
      passedTimeWindow.push(t.title);
      continue;
    }

    // Ban ngày (< 20h) không thúc giục "đi ngủ trước 11h ngay bây giờ" nếu còn việc khác
    if (isNightSleep && currentHour < 20) {
      continue;
    }

    actionableNow.push(t.title);
  }

  return { actionableNow, passedTimeWindow };
}

interface RecentChangeInfo {
  detail: string;
  short: string;
  kind: 'PROFILE' | 'ALL' | 'CLEAR' | 'NOTE' | 'TASK';
  task?: TaskItem;
  levelKey?: string;
  isSleepTask?: boolean;
}

function generateDiverseFallback({
  mode,
  callName,
  percentage,
  completedTasks,
  actionablePendingTasks,
  physLabel,
  mentLabel,
  recentHistory,
  dateCtx,
  recentChange,
}: {
  mode: string;
  callName: string;
  percentage: number;
  completedTasks: string[];
  actionablePendingTasks: string[];
  physLabel: string;
  mentLabel: string;
  recentHistory: string[];
  dateCtx: DateTemporalContext;
  recentChange: RecentChangeInfo | null;
}): string {
  const pct = percentage || 0;
  const targetTask = actionablePendingTasks[0] || 'mục tiêu còn lại';
  const recentDone = completedTasks[0] || 'thói quen vừa làm';

  const pickRandom = (arr: string[]) => {
    const valid = arr.filter((s) => !recentHistory.includes(s));
    const pool = valid.length > 0 ? valid : arr;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  if (mode === 'greeting') {
    const greetingPool = [
      `Ơ kìa ${callName}, hôm nay thể chất đang ${physLabel.toLowerCase()} đấy, hãy lấy kỷ luật làm bàn đạp để chinh phục mọi mục tiêu nhé!`,
      `Nhìn xem ai vừa vào nâng cấp bản thân này, ${callName} hãy giữ vững tinh thần ${mentLabel.toLowerCase()} và bùng nổ hết mình hôm nay!`,
      `Chào ngày mới ${callName}, cơ thể đang sẵn sàng thì tâm trí đừng để trì hoãn chen chân vào lịch trình nhé!`,
      `Chà chà ${callName}, năng lượng ${physLabel.toLowerCase()} này mà không dứt điểm các đầu việc thì quả là lãng phí!`,
      `Hôm nay là cơ hội tuyệt vời để tự vượt ngưỡng chính mình đấy ${callName}, bắt tay vào việc ngay thôi!`,
      `Khởi động ngày mới nào ${callName}, sự kỷ luật hôm nay sẽ định hình con người xuất sắc của bạn ngày mai!`,
    ];
    return pickRandom(greetingPool);
  }

  // Trường hợp 1: Đang cập nhật dữ liệu của một NGÀY TRONG QUÁ KHỨ
  if (dateCtx.isPastDay) {
    const changePrefix = recentChange?.short || `Cập nhật lại sổ kỷ luật ${dateCtx.relativeDayLabel},`;
    const pastPool =
      pct >= 70
        ? [
            `${changePrefix} khép lại ${dateCtx.relativeDayLabel} ở mức ${pct}% là một cột mốc rất đáng khen đấy ${callName}, hãy mang trọn khí thế này sang bùng nổ trong ngày hôm nay nhé!`,
            `${changePrefix} nhìn lại ${dateCtx.relativeDayLabel} đạt ${pct}% mới thấy sự bền bỉ của ${callName}, tiếp tục giữ vững phong độ đó cho lịch trình hôm nay nào!`,
          ]
        : [
            `${changePrefix} ${dateCtx.relativeDayLabel} khép lại ở mức ${pct}% vẫn còn những mục tiêu bỏ ngỏ đấy ${callName}, hãy lấy đó làm bài học để hôm nay gỡ lại điểm số thật thuyết phục!`,
            `${changePrefix} tổng kết ${dateCtx.relativeDayLabel} dừng ở ${pct}% là lời nhắc nhở rõ ràng nhất, hôm nay ${callName} quyết tâm kỷ luật gấp đôi để bù lại nhé!`,
          ];
    return pickRandom(pastPool);
  }

  // Trường hợp 2: Vừa tích việc "Ngủ trước 11h" / Giấc ngủ cuối ngày
  if (recentChange?.isSleepTask) {
    const lvlKey = recentChange.levelKey;
    if (lvlKey === 'PERFECT' || lvlKey === 'GOOD') {
      const sleepGoodPool = [
        `Chốt mục tiêu "${recentChange.task?.title}" đúng chuẩn kỷ luật rồi đấy ${callName}! Khép lại ngày hôm nay ở mức ${pct}%, giờ hãy tắt hết thiết bị và ngủ thật sâu để sáng mai thức dậy lúc 5h tràn đầy năng lượng nhé!`,
        `Biết dừng lại nghỉ ngơi trước 23h là đỉnh cao của sự tự chủ đấy ${callName}! Tổng kết ngày đạt ${pct}% rồi, chúc bạn một giấc ngủ chất lượng để cơ thể phục hồi hoàn toàn cho ngày mai bùng nổ!`,
      ];
      return pickRandom(sleepGoodPool);
    }
    if (lvlKey === 'BAD') {
      return `Thức khuya khiến mục tiêu "${recentChange.task?.title}" chỉ đạt mức Tệ thôi sao ${callName}? Ngày hôm nay khép lại ở ${pct}%, hãy tắt máy đi ngủ ngay để tránh uể oải vào sáng mai nhé!`;
    }
  }

  if (completedTasks.length === 0) {
    const zeroPool = [
      `Ủa alo ${callName}, mở app nhìn đồng hồ mà chưa dứt điểm việc nào là định để cả ngày trôi qua vô ích sao?`,
      `Kế hoạch nằm sẵn trên giấy rồi đấy ${callName}, bắt tay hoàn thành "${targetTask}" để lấy đà đi chứ!`,
      `Này ${callName}, sự trì hoãn đang thắng 1-0 đấy, lập tức mở màn bằng một thói quen Hoàn Hảo để lật ngược tình thế đi!`,
      `Chờ đợi động lực là cái bẫy đấy ${callName}, bắt tay vào làm ngay việc phù hợp nhất thay vì ngắm bảng việc!`,
    ];
    return pickRandom(zeroPool);
  }

  if (pct < 40) {
    const lowPool = [
      `Mới được ${pct}% thôi sao hả ${callName}, tốc độ này còn chậm đấy, tập trung xử lý tiếp "${targetTask}" ngay nào!`,
      `Nhìn con số ${pct}% đi ${callName}, nếu không tăng tốc thì cuối ngày lại ngồi tiếc nuối đấy, hành động ngay!`,
      `Tích được ${recentDone} là tốt rồi nhưng ${pct}% vẫn cần cố gắng thêm nhiều nhé ${callName}, xốc lại tinh thần tiến tới mục tiêu kế tiếp!`,
      `Thẳng thắn nhé ${callName}: ${pct}% là chưa đạt tiêu chuẩn tự nâng cấp đâu, đừng dễ dãi với bản thân nữa!`,
    ];
    return pickRandom(lowPool);
  }

  if (pct < 70) {
    const midPool = [
      `Khá lắm ${callName}, đã đi được hơn nửa chặng đường ở mức ${pct}%, đẩy thêm 1-2 việc nữa lên Hoàn Hảo là ngày hôm nay cực kỳ mỹ mãn!`,
      `Đang có đà quán tính rất tốt với ${pct}%, ${callName} đừng buông lỏng mà hãy xử lý gọn luôn "${targetTask}" nhé!`,
      `Nhịp điệu kỷ luật hôm nay của ${callName} bén đấy, giữ vững phong độ này để chạm mốc xuất sắc!`,
      `Điểm số ${pct}% chứng minh nỗ lực có thật, cố thêm một chút nữa thôi là bạn bỏ xa sự lười biếng rồi ${callName}!`,
    ];
    return pickRandom(midPool);
  }

  if (pct >= 90) {
    const perfectPool = [
      `Khét lẹt luôn ${callName}! ${pct}% điểm kỷ luật thép hôm nay là minh chứng cho sự tự chủ tuyệt đối, tối nay tha hồ ngủ ngon!`,
      `Đỉnh cao phong độ là đây chứ đâu, ${callName} đã gần như càn quét sạch sẽ bảng việc với ${pct}%, xuất sắc không tì vết!`,
      `Nhìn bảng tích điểm ${pct}% mà thấy nể phục sự kiên định của ${callName}, bạn đang trở thành phiên bản mạnh mẽ nhất của chính mình!`,
      `Thắng lợi giòn giã hôm nay thuộc về bạn, ${callName} nhớ tự thưởng cho mình chút thời gian thư giãn xứng đáng nhé!`,
    ];
    return pickRandom(perfectPool);
  }

  return `Tiến độ ${pct}% rất đáng ghi nhận, tiếp tục giữ vững nhịp độ này để kết thúc ngày trọn vẹn nhé ${callName}!`;
}

const LEVEL_LABELS: Record<string, string> = {
  PERFECT: 'Hoàn Hảo',
  GOOD: 'Tốt',
  BAD: 'Tệ',
  NONE: 'Bỏ tích (chưa làm)',
};

/**
 * Chuyển tín hiệu thay đổi từ FE thành mô tả "thay đổi gần nhất" cho AI.
 * Định dạng tín hiệu:
 *  - `${dateKey}|${taskId}|${levelKey}|${ts}`  : tích / đổi mức một việc
 *  - `${dateKey}|ALL|${levelKey}|${ts}`        : tích nhanh tất cả
 *  - `${dateKey}|CLEAR|${ts}`                  : đặt lại ngày
 *  - `${dateKey}|NOTE|${noteText}|${ts}`       : lưu ghi chú
 *  - `PROFILE|${ts}`                            : cập nhật trạng thái cá nhân
 */
function describeRecentChange(
  signal: string | undefined,
  tasksList: TaskItem[],
  stateLabels: { phys: string; ment: string; emo: string },
  dateCtx: DateTemporalContext
): RecentChangeInfo | null {
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
  const dayContextNote = dateCtx.isPastDay
    ? ` của ${dateCtx.relativeDayLabel} (NGÀY ĐÃ QUA — người dùng đang ghi nhận/cập nhật bù lại dữ liệu cũ)`
    : dateCtx.isFutureDay
    ? ` của ${dateCtx.relativeDayLabel} (NGÀY TRONG TƯƠNG LAI)`
    : ` của ${dateCtx.relativeDayLabel}`;

  if (kind === 'ALL') {
    const lvl = LEVEL_LABELS[parts[2]] || parts[2];
    return {
      kind: 'ALL',
      levelKey: parts[2],
      detail: `Người dùng vừa bấm tích nhanh TẤT CẢ ${tasksList.length} việc ở mức "${lvl}" cùng lúc${dayContextNote}.`,
      short: `Tích nhanh tất cả ở mức ${lvl}${dateCtx.isPastDay ? ` cho ${dateCtx.relativeDayLabel}` : ''},`,
    };
  }

  if (kind === 'CLEAR') {
    return {
      kind: 'CLEAR',
      detail: `Người dùng vừa bấm "Đặt lại ngày" — xóa toàn bộ tích chọn${dayContextNote}.`,
      short: `Vừa đặt lại bảng việc ${dateCtx.relativeDayLabel},`,
    };
  }

  if (kind === 'NOTE') {
    const noteText = parts.slice(2, -1).join('|').trim();
    return {
      kind: 'NOTE',
      detail: noteText
        ? `Người dùng vừa lưu ghi chú tự kiểm điểm${dayContextNote}: "${noteText.slice(0, 400)}".`
        : `Người dùng vừa xóa trống ghi chú${dayContextNote}.`,
      short: `Đọc ghi chú ${dateCtx.relativeDayLabel} vừa viết rồi nhé,`,
    };
  }

  // Tích / đổi một việc cụ thể
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
      isSleepTask: sleepFlag,
      detail: `Người dùng vừa BỎ TÍCH việc "${title}" (chuyển về trạng thái chưa làm)${dayContextNote}.`,
      short: `Vừa bỏ tích "${title}"${dateCtx.isPastDay ? ` của ${dateCtx.relativeDayLabel}` : ''},`,
    };
  }
  return {
    kind: 'TASK',
    task,
    levelKey,
    isSleepTask: sleepFlag,
    detail: `Người dùng vừa tích hoàn thành việc "${title}"${hourNote}${task?.timeHint ? ` (khung giờ gợi ý: ${task.timeHint})` : ''}${dayContextNote}.`,
    short: `Vừa tích "${title}"${hourNote}${dateCtx.isPastDay ? ` cho ${dateCtx.relativeDayLabel}` : ''},`,
  };
}

const getCoachingMessage = async (
  userId: string,
  payload: {
    dateKey?: string;
    mode?: 'greeting' | 'feedback';
    changeSignal?: string;
  }
) => {
  const mode = payload.mode || 'feedback';
  const todayInfo = getTodayInfo();
  const signalDateMatch = payload.changeSignal?.match(/^(\d{4}-\d{2}-\d{2})\|/);
  const targetDateKey =
    signalDateMatch?.[1] || payload.dateKey || todayInfo.dateKey;

  const dateCtx = getDateTemporalContext(targetDateKey, todayInfo.dateKey);
  const timeCtx = getCurrentTimeContext();

  const [user, disciplineDoc] = await Promise.all([
    userModel.findOneById(userId),
    disciplineModel.findOrCreateByUserId(userId),
  ]);

  const userProfile = user?.profile || DEFAULT_USER_PROFILE;
  const records = disciplineDoc.records || {};
  const taskConfig = disciplineDoc.taskConfig || getDefaultTaskConfig();
  const dayRecord = records[targetDateKey] || { tasks: {}, note: '' };
  const tasksList = getTasksForDate(targetDateKey, taskConfig);
  const dayStats = calculateDayStats(dayRecord, tasksList, userProfile);

  const tasksMap = dayRecord.tasks || {};
  const noteText = (dayRecord.note || '').trim();

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
    ) || { label: 'Bình thường' };
  const mentObj =
    PERSONALIZATION_OPTIONS.mentalStates.find(
      (x) => x.id === userProfile.mentalState
    ) || { label: 'Ổn định' };
  const emoObj =
    PERSONALIZATION_OPTIONS.emotionalStates.find(
      (x) => x.id === userProfile.emotionalState
    ) || { label: 'Cân bằng' };
  const goalObj =
    PERSONALIZATION_OPTIONS.focusGoals.find(
      (x) => x.id === userProfile.focusGoal
    ) || { label: 'Phát triển toàn diện' };
  const coachingStyle =
    PERSONALIZATION_OPTIONS.coachingStyles.find(
      (x) => x.id === userProfile.coachingStyle
    ) || { label: 'Thực tế / Công tâm' };

  const weight = parseFloat(String(userProfile.weightKg || ''));
  const height = parseFloat(String(userProfile.heightCm || ''));
  const bmiStr =
    weight > 25 && height > 100
      ? `BMI ~${Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10}`
      : '';

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

  const randomVibe =
    RANDOM_VIBES[Math.floor(Math.random() * RANDOM_VIBES.length)];
  const randomOpener =
    OPENING_SUGGESTIONS[Math.floor(Math.random() * OPENING_SUGGESTIONS.length)];
  const randomSeed = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const recentHistory = userRecentMessagesMap.get(userId) || [];
  const historyPromptBlock =
    recentHistory.length > 0
      ? `CÁC CÂU BẠN VỪA NÓI GẦN ĐÂY (TUYỆT ĐỐI CẤM LẶP LẠI CẤU TRÚC HAY TỪ NGỮ NÀY):\n${recentHistory
          .map((s, idx) => `${idx + 1}. "${s}"`)
          .join('\n')}`
      : '';

  let promptContext = '';

  if (mode === 'greeting') {
    promptContext = `
Bạn là AI Coach cá nhân hóa của ứng dụng rèn luyện kỷ luật "Self Upgrade".
Người dùng vừa mở/truy cập vào ứng dụng lúc ${timeCtx.timeStr} (${timeCtx.periodLabel}) ngày hôm nay ${todayInfo.dateKey}.
Hãy quan sát hồ sơ cá nhân và đưa ra DUY NHẤT 1 CÂU gồm: lời chào ngẫu nhiên + lời nhắc nhở tinh thần/kỷ luật phù hợp với ${timeCtx.periodLabel.toLowerCase()} hôm nay.

THÔNG TIN NGƯỜI DÙNG:
- Tên/Biệt danh: ${callName}
${userProfile.age ? `- Tuổi: ${userProfile.age}` : ''}
${userProfile.weightKg ? `- Thể trạng: Nặng ${userProfile.weightKg}kg, Cao ${userProfile.heightCm}cm (${bmiStr})` : ''}
- Trạng thái hôm nay: Thể chất "${physObj.label}", Tinh thần "${mentObj.label}", Cảm xúc "${emoObj.label}"
- Mục tiêu trọng tâm: ${goalObj.label}

PHONG CÁCH DIỄN ĐẠT LẦN NÀY: "${randomVibe}"
GỢI Ý MỞ CÂU: "${randomOpener}"
RANDOM SEED: ${randomSeed}

${historyPromptBlock}

QUY TẮC BẮT BUỘC:
1. ĐÚNG 1 CÂU DUY NHẤT (khoảng 18–35 từ), liền mạch, tự nhiên, sinh động.
2. TUYỆT ĐỐI KHÔNG mở đầu một màu theo kiểu "Chào ${callName}, ...". Hãy sáng tạo cách chào ngẫu nhiên (dùng thán từ, đặt tên ở giữa câu hoặc cuối câu).
3. Tuyệt đối KHÔNG viết tiêu đề, KHÔNG xuống dòng, KHÔNG thêm dấu ngoặc kép bọc ngoài.
`.trim();
  } else {
    const recentChangeBlock = recentChange
      ? `THAY ĐỔI GẦN NHẤT (ƯU TIÊN SỐ 1 — PHẢI NHẬN XÉT ĐIỀU NÀY TRƯỚC):\n- ${recentChange.detail}`
      : `THAY ĐỔI GẦN NHẤT: Người dùng bấm xem lại nhận xét cho ${dateCtx.relativeDayLabel}.`;

    let specificContextAndRules = '';

    if (dateCtx.isPastDay) {
      specificContextAndRules = `
BỐI CẢNH THỜI GIAN ĐẶC BIỆT (NGÀY TRONG QUÁ KHỨ):
- Ngày thực tế hiện tại là: ${todayInfo.dateKey} (${timeCtx.timeStr} - ${timeCtx.periodLabel}).
- Nhưng bảng việc người dùng vừa thao tác là của: ${dateCtx.relativeDayLabel} (NGÀY ĐÃ QUA).
- Nghĩa là người dùng đang GHI NHẬN BÙ / CẬP NHẬT LẠI kết quả hoặc viết ghi chú tổng kết cho ${dateCtx.relativeDayLabel}, chứ ngày đó KHÔNG CÒN đang diễn ra!

QUY TẮC BẮT BUỘC KHI NHẬN XÉT NGÀY QUÁ KHỨ (${dateCtx.relativeDayLabel}):
1. Viết ĐÚNG 2 CÂU ngắn liền nhau (tổng khoảng 25–45 từ), sinh động, có chất riêng, KHÔNG DÙNG VĂN MẪU.
2. CÂU 1: Phản hồi TRỰC TIẾP vào thay đổi vừa cập nhật của ${dateCtx.relativeDayLabel} — gọi đúng tên việc vừa tích/bỏ tích và mức độ (hoặc nội dung ghi chú vừa lưu), đồng thời nói rõ ngữ cảnh đây là việc của ${dateCtx.relativeDayLabel} (VD: "hôm qua", "ngày ${dateCtx.shortDate}"...).
3. CÂU 2: Đánh giá TỔNG KẾT khép lại ${dateCtx.relativeDayLabel} ở mức ${dayStats.percentage}% (nhìn nhận kết quả đã làm được hoặc những việc đã bỏ lỡ trong ngày cũ đó) và liên hệ sang NGÀY HÔM NAY (${todayInfo.dateKey}) — thúc đẩy phát huy tiếp hoặc rút kinh nghiệm để hôm nay gỡ điểm.
4. CẤM TUYỆT ĐỐI: KHÔNG ĐƯỢC nói như thể ${dateCtx.relativeDayLabel} là ngày hôm nay! TUYỆT ĐỐI KHÔNG bắt hay giục người dùng "bây giờ hãy đi tập/đi học/làm tiếp việc X" của ngày cũ vì ngày đó đã kết thúc rồi!
5. Tuyệt đối KHÔNG viết tiêu đề, KHÔNG xuống dòng, KHÔNG gạch đầu dòng, KHÔNG thêm dấu ngoặc kép bao bọc.`.trim();
    } else if (dateCtx.isFutureDay) {
      specificContextAndRules = `
BỐI CẢNH THỜI GIAN ĐẶC BIỆT (NGÀY TRONG TƯƠNG LAI):
- Ngày thực tế hiện tại là ${todayInfo.dateKey}, nhưng người dùng đang thao tác trên ${dateCtx.relativeDayLabel} (chưa tới).
- QUY TẮC: Viết ĐÚNG 2 CÂU ngắn (25–45 từ). Câu 1 nhận xét dí dỏm về thao tác vừa làm trên ${dateCtx.relativeDayLabel}; Câu 2 nhắc người dùng tập trung hoàn thành tốt lịch trình của ngày hôm nay (${todayInfo.dateKey}) trước. KHÔNG viết tiêu đề, KHÔNG xuống dòng.`.trim();
    } else if (recentChange?.isSleepTask) {
      specificContextAndRules = `
BỐI CẢNH ĐẶC BIỆT (VIỆC GIẤC NGỦ CUỐI NGÀY — "${recentChange.task?.title}"):
- Người dùng vừa thao tác trên mục tiêu giấc ngủ đêm: "${recentChange.task?.title}" (mức: ${LEVEL_LABELS[recentChange.levelKey || ''] || recentChange.levelKey}).
- Ý nghĩa thực tế: Đi ngủ trước 11h đêm là hoạt động CUỐI CÙNG KHÉP LẠI NGÀY để cơ thể nghỉ ngơi và hồi phục, KHÔNG PHẢI lúc bắt đầu đi cày cuốc việc khác!

QUY TẮC BẮT BUỘC KHI NHẬN XÉT VIỆC "${recentChange.task?.title}":
1. Viết ĐÚNG 2 CÂU ngắn liền nhau (tổng khoảng 25–45 từ), tự nhiên, tâm lý, KHÔNG DÙNG VĂN MẪU.
2. CÂU 1: Phản hồi TRỰC TIẾP vào việc "${recentChange.task?.title}":
   - Nếu tích mức Hoàn Hảo hoặc Tốt: Khen ngợi kỷ luật lên giường đúng giờ, biết tắt màn hình sớm để bảo vệ sức khỏe và nhịp sinh học.
   - Nếu tích mức Tệ: Chấn chỉnh thẳng thắn việc thức khuya quá 23h gây suy giảm trí lực và làm uể oải vào sáng hôm sau.
   - Nếu vừa Bỏ tích: Hỏi khích tướng vì sao lại hủy cam kết ngủ sớm.
3. CÂU 2: Chốt lại tổng kết ngày hôm nay ở mức ${dayStats.percentage}% và nhắn người dùng nghỉ ngơi/ngủ thật sâu để nạp đầy năng lượng cho sáng mai thức dậy bùng nổ (nếu trong ngày còn việc chưa làm thì chỉ dặn gác lại để ngày mai phục thù).
4. CẤM TUYỆT ĐỐI: Khi người dùng vừa tích việc đi ngủ ("${recentChange.task?.title}"), TUYỆT ĐỐI KHÔNG ĐƯỢC bảo người dùng đứng dậy đi tập thể dục, đi tập gym, đi học tiếng Anh, học code hay làm thêm bất kỳ việc nào khác ngay lúc này!
5. Tuyệt đối KHÔNG viết tiêu đề, KHÔNG xuống dòng, KHÔNG gạch đầu dòng, KHÔNG thêm dấu ngoặc kép bao bọc.`.trim();
    } else {
      const actionableListStr =
        actionableNow.length > 0
          ? actionableNow.slice(0, 5).join(', ')
          : pendingTasks.length === 0
          ? 'Đã hoàn thành toàn bộ mục tiêu trong ngày'
          : 'Chuẩn bị nghỉ ngơi và ngủ trước 11h';

      const passedWindowStr =
        passedTimeWindow.length > 0
          ? `\n- Việc của khung giờ sáng/trưa đã qua chưa thấy tích: ${passedTimeWindow.join(', ')} (Lưu ý: các việc này thuộc khung giờ đã qua, KHÔNG giục người dùng "bây giờ đi thức dậy lúc 5h" hay "bây giờ đi ngủ trưa" khi đã trễ!)`
          : '';

      specificContextAndRules = `
BỐI CẢNH THỜI GIAN THỰC TRONG NGÀY HÔM NAY (${targetDateKey}):
- Giờ hiện tại: ${timeCtx.timeStr} (${timeCtx.periodLabel}).
- Việc CHƯA LÀM phù hợp để thực hiện tiếp trong khung giờ hiện tại (${timeCtx.periodLabel}): ${actionableListStr}${passedWindowStr}

QUY TẮC BẮT BUỘC:
1. Viết ĐÚNG 2 CÂU ngắn liền nhau (tổng khoảng 25–45 từ), sinh động, có chất riêng, KHÔNG DÙNG VĂN MẪU.
2. CÂU 1: Phản hồi TRỰC TIẾP vào THAY ĐỔI GẦN NHẤT — gọi đúng tên việc vừa tích/bỏ tích và mức độ (hoặc nội dung ghi chú / hành động vừa làm). Khen nếu là mức Hoàn Hảo/Tốt, chê thẳng nếu mức Tệ hoặc vừa bỏ tích, phản hồi sát nội dung nếu là ghi chú.
3. CÂU 2: Nối sang TỔNG QUAN ngày hôm nay (${dayStats.percentage}%) — chỉ gợi ý việc tiếp theo nằm trong nhóm "Việc CHƯA LÀM phù hợp để thực hiện tiếp trong khung giờ hiện tại (${timeCtx.periodLabel})". Nếu hiện tại đã là đêm muộn (sau 22h) thì khuyên khép lại công việc để chuẩn bị ngủ trước 11h chứ KHÔNG giục đi tập gym/thể dục hay cày việc nặng. Nếu đã xong hết mọi việc thì khen tổng kết.
4. Đa dạng cách mở câu (thán từ, đặt tên ${callName} ở giữa/cuối câu...), không rập khuôn.
5. Tuyệt đối KHÔNG viết tiêu đề, KHÔNG xuống dòng, KHÔNG gạch đầu dòng, KHÔNG thêm dấu ngoặc kép bao bọc.`.trim();
    }

    promptContext = `
Bạn là AI Coach cá nhân hóa của ứng dụng rèn luyện kỷ luật "Self Upgrade".
Người dùng vừa có một thay đổi trên bảng việc. Nhiệm vụ: phản hồi NGAY vào thay đổi gần nhất trước, sau đó mới nhận xét tổng quan một cách hợp lý theo đúng ngữ cảnh ngày và giờ.

${recentChangeBlock}

THÔNG TIN NGƯỜI DÙNG:
- Tên/Biệt danh: ${callName}
${userProfile.age ? `- Tuổi: ${userProfile.age}` : ''}
${userProfile.weightKg ? `- Thể trạng: Nặng ${userProfile.weightKg}kg, Cao ${userProfile.heightCm}cm (${bmiStr})` : ''}
- Trạng thái: Thể chất "${physObj.label}", Tinh thần "${mentObj.label}", Cảm xúc "${emoObj.label}"
- Mục tiêu trọng tâm: ${goalObj.label}
- Phong cách huấn luyện: ${coachingStyle.label}

TỔNG QUAN BẢNG VIỆC (${dateCtx.relativeDayLabel.toUpperCase()} — ${targetDateKey}):
- Tiến độ: ${dayStats.percentage || 0}% (${dayStats.rawPoints || 0}/${dayStats.maxPoints || 120} điểm)
- Việc ĐÃ LÀM (${completedTasks.length} việc): ${completedTasks.length > 0 ? completedTasks.join(', ') : 'Chưa tích việc nào'}
- Việc CHƯA LÀM (${pendingTasks.length} việc): ${pendingTasks.length > 0 ? pendingTasks.slice(0, 6).join(', ') : 'Đã hoàn thành toàn bộ mục tiêu'}
${noteText ? `- Ghi chú trong ngày: "${noteText}"` : ''}

PHONG CÁCH DIỄN ĐẠT LẦN NÀY: "${randomVibe}"
RANDOM SEED: ${randomSeed}

${historyPromptBlock}

${specificContextAndRules}
`.trim();
  }

  let message = await callGeminiCascade(promptContext);

  if (!message) {
    message = generateDiverseFallback({
      mode,
      callName,
      percentage: dayStats.percentage,
      completedTasks,
      actionablePendingTasks:
        actionableNow.length > 0 ? actionableNow : pendingTasks,
      physLabel: physObj.label,
      mentLabel: mentObj.label,
      recentHistory,
      dateCtx,
      recentChange,
    });
    // Fallback: nếu là ngày hôm nay và chưa phải trường hợp đặc biệt đã ghép sẵn prefix
    if (
      mode === 'feedback' &&
      recentChange &&
      !dateCtx.isPastDay &&
      !recentChange.isSleepTask
    ) {
      message = `${recentChange.short} ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
    }
  }

  const updatedHistory = [message, ...recentHistory].slice(0, MAX_HISTORY_TRACKED);
  userRecentMessagesMap.set(userId, updatedHistory);

  return { message };
};

async function callGeminiJson<T>(prompt: string): Promise<T | null> {
  if (!env.GEMINI_API_KEY) {
    console.warn('[Gemini AI Calories] Không có GEMINI_API_KEY');
    return null;
  }

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`[Gemini AI Calories] Đang phân tích bằng model ${model}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        console.warn(`[Gemini AI Calories] Model ${model} trả về mã lỗi: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string; thought?: boolean }>;
          };
        }>;
      };

      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p) => p.text && !p.thought) || parts[0];
      const rawText = textPart?.text?.trim() || '';

      if (rawText) {
        try {
          const parsed = JSON.parse(rawText) as T;
          console.log(`[Gemini AI Calories] Thành công với model ${model}`);
          return parsed;
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]) as T;
            console.log(`[Gemini AI Calories] Thành công (regex parse) với model ${model}`);
            return parsed;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Gemini AI Calories] Lỗi khi gọi model ${model}:`, err?.message || err);
      continue;
    }
  }

  return null;
}

const analyzeNutrition = async (
  profile: UserProfile,
  dateKey: string,
  meals: FoodItem[],
  previousSummary?: CaloriesSummary
): Promise<CaloriesSummary> => {
  if (!meals || meals.length === 0) {
    return {
      totalCalories: 0,
      protein: 0,
      carb: 0,
      fat: 0,
      fiber: 0,
      aiFeedback:
        'Chưa có món ăn nào được ghi lại cho ngày này. Hãy thêm các món bạn ăn từ 6h sáng đến 9h tối nhé!',
      updatedAt: new Date().toISOString(),
    };
  }

  const COOKING_METHOD_NAMES: Record<string, string> = {
    hap: 'Hấp (thanh đạm, giữ nguyên dưỡng chất)',
    luoc: 'Luộc (không dầu mỡ)',
    xao: 'Xào (có thêm dầu/mỡ và gia vị)',
    chien: 'Chiên / Rán (nhiều dầu mỡ, tăng calo và chất béo)',
    nuong: 'Nướng (ít mỡ hoặc róc mỡ thừa)',
  };

  const mealListText = meals
    .map((m, idx) => {
      const sessionLabel =
        m.mealSession === 'morning'
          ? 'Buổi Sáng'
          : m.mealSession === 'afternoon'
          ? 'Buổi Chiều'
          : 'Buổi Tối';

      let stateText = '';
      if (m.foodState === 'raw') {
        stateText = 'Tình trạng: CÂN LÚC CÒN SỐNG (Raw, chưa qua nấu chín)';
      } else if (m.foodState === 'cooked') {
        const method = m.cookingMethod
          ? COOKING_METHOD_NAMES[m.cookingMethod] || m.cookingMethod
          : 'Đã nấu chín';
        stateText = `Tình trạng: CÂN LÚC ĐÃ NẤU CHÍN (Cooked) — Cách chế biến: ${method}`;
      } else {
        stateText = 'Đã chế biến';
      }

      return `${idx + 1}. [${sessionLabel}]: ${m.name} — Định lượng: ${m.weight || '1 phần'} — ${stateText}`;
    })
    .join('\n');

  const prevText = previousSummary
    ? `DỮ LIỆU LẦN LƯU TRƯỚC (CHỈ DÙNG ĐỂ SO SÁNH TRONG NHẬN XÉT aiFeedback, TUYỆT ĐỐI KHÔNG COPY HAY GIỮ LẠI CON SỐ NÀY NẾU MÓN ĂN ĐÃ THAY ĐỔI):
- Lần trước: Tổng ${previousSummary.totalCalories} kcal, Protein: ${previousSummary.protein}g, Carb: ${previousSummary.carb}g, Fat: ${previousSummary.fat}g, Chất xơ: ${previousSummary.fiber}g.`
    : 'Đây là lần lưu thực đơn đầu tiên trong ngày.';

  const prompt = `
Bạn là AI Chuyên gia Dinh dưỡng (Nutritionist AI) của ứng dụng rèn luyện kỷ luật Self Upgrade.
Thông tin thể trạng người dùng:
- Tên/Tuổi: ${profile.name || 'Người dùng'} (${profile.age || 'Chưa rõ'} tuổi)
- Cân nặng: ${profile.weightKg || 'Chưa rõ'} kg, Chiều cao: ${profile.heightCm || 'Chưa rõ'} cm
- Mục tiêu chính: ${profile.focusGoal || 'Sức khỏe & Kỷ luật'}
- Thể trạng hiện tại: ${profile.physicalState || 'Bình thường'}

Ngày ghi nhận: ${dateKey}
DANH SÁCH MÓN ĂN HIỆN TẠI (CHỈ TÍNH TOÁN 5 CHỈ SỐ DỰA TRÊN ${meals.length} MÓN ĐANG CÓ NÀY):
${mealListText}

${prevText}

YÊU CẦU BẮT BUỘC:
1. QUY TẮC TÍNH TOÁN 5 CHỈ SỐ (BẮT BUỘC TÍNH ĐỘC LẬP TỪ DANH SÁCH MÓN HIỆN TẠI):
   - ĐẶC BIỆT CHÚ Ý TÌNH TRẠNG SỐNG / CHÍN VÀ CÁCH CHẾ BIẾN:
     * CÂN LÚC CÒN SỐNG: Tính theo bảng thực phẩm sống (nhiều nước, mật độ calo/đạm trên 100g thấp hơn so với đồ chín).
     * CÂN LÚC ĐÃ NẤU CHÍN: Tính theo bảng thực phẩm chín (nước đã thoát bớt, mật độ calo/đạm trên 100g cao hơn, ví dụ: 100g ức gà chín ~165 kcal, ~31g protein; trong khi 100g ức gà sống ~120 kcal, ~23g protein).
     * CHIÊN / XÀO: Bắt buộc cộng thêm calo và chất béo (fat) tương ứng lượng dầu mỡ dùng để chiên/xào.
     * LUỘC / HẤP / NƯỚNG: Giữ calo nguyên bản sạch, ít béo.
   - NẾU NGƯỜI DÙNG VỪA XÓA BỚT MÓN ĂN: Tổng calo và toàn bộ 4 chỉ số macro (protein, carb, fat, fiber) BẮT BUỘC PHẢI GIẢM TƯƠNG ỨNG với phần dinh dưỡng của món đã bị xóa đi. TUYỆT ĐỐI KHÔNG ĐƯỢC giữ nguyên con số của lần trước.
   - NẾU NGƯỜI DÙNG THÊM MÓN ĂN: Các chỉ số macro BẮT BUỘC PHẢI TĂNG LÊN tương ứng.
   - totalCalories: Tổng calories nạp vào (kcal, số nguyên) của các món hiện tại.
   - protein: Tổng chất đạm (g) của các món hiện tại.
   - carb: Tổng tinh bột (g) của các món hiện tại.
   - fat: Tổng chất béo (g) của các món hiện tại.
   - fiber: Tổng chất xơ (g) của các món hiện tại.
2. aiFeedback: Viết một đoạn nhận xét sắc bén (2-3 câu, tối đa 80 từ) bằng tiếng Việt chuẩn:
   - Viết chuẩn chính tả tiếng Việt tuyệt đối, cách từ rõ ràng, không dính chữ, không nuốt chữ.
   - So sánh sự thay đổi so với lần trước (nêu rõ vừa xóa món hay thêm món làm calo và macro tăng/giảm từ bao nhiêu xuống/lên bao nhiêu, nhắc đến cách chế biến luộc/hấp/xào/chiên/nướng nếu có).
   - Đánh giá sự cân đối đạm/carb/béo/chất xơ cho thể trạng và mục tiêu ${profile.focusGoal || 'sức khỏe'}.
   - Lời khuyên ngắn gọn, thiết thực, giàu tính kỷ luật.

ĐỊNH DẠNG BẮT BUỘC TRẢ VỀ JSON:
{
  "totalCalories": number,
  "protein": number,
  "carb": number,
  "fat": number,
  "fiber": number,
  "aiFeedback": "chuỗi nhận xét"
}
`.trim();

  const result = await callGeminiJson<CaloriesSummary>(prompt);

  const cleanFeedbackText = (text: string | undefined): string => {
    if (!text) return 'Đã tổng hợp dinh dưỡng các bữa ăn trong ngày thành công.';
    return text
      .replace(/\bcũngụt\b/gi, 'cũng sụt')
      .replace(/\bcũngtụt\b/gi, 'cũng tụt')
      .replace(/\bụt giảm\b/gi, 'sụt giảm')
      .trim();
  };

  if (result && typeof result.totalCalories === 'number') {
    return {
      totalCalories: Math.round(result.totalCalories) || 0,
      protein: Math.round(Number(result.protein) * 10) / 10 || 0,
      carb: Math.round(Number(result.carb) * 10) / 10 || 0,
      fat: Math.round(Number(result.fat) * 10) / 10 || 0,
      fiber: Math.round(Number(result.fiber) * 10) / 10 || 0,
      aiFeedback: cleanFeedbackText(result.aiFeedback),
      updatedAt: new Date().toISOString(),
    };
  }

  // Fallback calculation nếu Gemini offline hoặc lỗi mạng
  const estCalories = meals.length * 220;
  const estProtein = Math.round(meals.length * 12);
  const estCarb = Math.round(meals.length * 28);
  const estFat = Math.round(meals.length * 7);
  const estFiber = Math.round(meals.length * 4);

  return {
    totalCalories: estCalories,
    protein: estProtein,
    carb: estCarb,
    fat: estFat,
    fiber: estFiber,
    aiFeedback: `Đã lưu thực đơn gồm ${meals.length} món ăn. Tỷ lệ dinh dưỡng ước tính cơ bản đã sẵn sàng, hãy đảm bảo uống đủ nước và ăn thêm rau củ cho các bữa tiếp theo!`,
    updatedAt: new Date().toISOString(),
  };
};

export const aiCoachService = {
  getCoachingMessage,
  analyzeNutrition,
};
