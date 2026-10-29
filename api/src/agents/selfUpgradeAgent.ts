import {
  calculateWorkoutMetrics,
  calculateSingleExerciseMetrics,
  findPreviousExercisePerformance,
  findBestMatchingPreviousWorkout,
  PreviousExerciseMatch,
  ExerciseCalculatedMetrics,
} from './tools/workoutKnowledgeTool';
import { CaloriesSummary, DayRecord, FoodItem, TaskItem, UserProfile, WorkoutExercise, WorkoutSummary } from '~/types';
import {
  AgentMemorySnapshot,
  getEpisodicHistory,
  recordEpisodicMemory,
} from './memory/agentMemoryEngine';
import {
  calculateSingleItemMacros,
  calculateSingleItemMacrosAsync,
  calculateUserNutritionTargets,
} from './tools/nutritionKnowledgeTool';

export interface DateTemporalContext {
  diffDays: number;
  isToday: boolean;
  isPastDay: boolean;
  isFutureDay: boolean;
  shortDate: string;
  relativeDayLabel: string;
  relativeDayLabelEn: string;
}

export type DayPeriodKey =
  | 'EARLY_MORNING'   // 05:00 - 08:29
  | 'MID_MORNING'     // 08:30 - 11:29
  | 'NOON'            // 11:30 - 13:59
  | 'AFTERNOON'       // 14:00 - 16:59
  | 'LATE_AFTERNOON'  // 17:00 - 18:59
  | 'EVENING'         // 19:00 - 21:59
  | 'LATE_NIGHT';     // 22:00 - 04:59

export interface TimeOfDayContext {
  hour: number;
  minute: number;
  timeStr: string;
  periodKey: DayPeriodKey;
  periodLabel: string;
  periodLabelEn: string;
  naturalGreetingTimeVi: string;
  naturalGreetingTimeEn: string;
}

export interface RecentChangeContext {
  detail: string;
  short: string;
  kind: 'PROFILE' | 'ALL' | 'CLEAR' | 'NOTE' | 'TASK' | 'WATER';
  task?: TaskItem;
  levelKey?: string;
  hourPart?: string;
  waterMl?: string;
  noteText?: string;
  isSleepTask?: boolean;
  scheduledHour?: number;
  isFutureHourTask?: boolean;
}

const TASK_TITLE_EN_MAP: Record<string, string> = {
  'Thức dậy lúc 5h': 'Wake up at 05:00',
  'Thức dậy lúc 5h sáng': 'Wake up at 05:00',
  'Học tiếng Anh': 'Learn English',
  'Làm việc': 'Focused Work',
  'Học code': 'Learn to Code',
  'Chơi game 2 ván': 'Limit gaming to 2 matches',
  'Ngủ trưa': 'Midday Power Nap',
  'Uống 3 lít nước': 'Drink 3L of water',
  'Uống đủ 2 lít nước': 'Drink 2L of water',
  'Tập gym': 'Gym Workout',
  'Không ăn vặt': 'No Junk Food',
  'Ngủ trước 11h': 'Sleep before 23:00',
  'Ngủ trước 23:00': 'Sleep before 23:00',
  'Đi ngủ trước 11h đêm': 'Sleep before 23:00',
  'Đi ngủ trước 23:00': 'Sleep before 23:00',
  'Tập thể dục buổi sáng': 'Morning workout',
  'Không dùng điện thoại 1h đầu ngày': 'No phone for the first hour',
  'Ăn sáng lành mạnh & đủ chất': 'Healthy breakfast',
  'Làm việc / Học tập sâu (Deep Work)': 'Deep Work session',
  'Đọc sách 30 phút': 'Read for 30 minutes',
  'Học ngoại ngữ / Kỹ năng mới': 'Learn a new skill / language',
  'Tập Gym / Vận động cường độ cao': 'Gym / High-intensity training',
  'Ngủ trưa ngắn (15 - 30 phút)': 'Power nap (15–30 mins)',
  'Không ăn đồ ngọt / Đồ chiên rán': 'No sugary / fried junk food',
  'Viết nhật ký / Tổng kết ngày': 'Journaling / Daily review',
  'Chuẩn bị To-do list cho ngày mai': 'Plan tomorrow’s To-do list',
};

export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function translateTaskTitle(title: string | undefined): string {
  if (!title) return 'your objective';
  const cleanTitle = title.replace(/\s*\(lúc.*?\)\s*$/i, '').trim();
  if (TASK_TITLE_EN_MAP[cleanTitle]) return TASK_TITLE_EN_MAP[cleanTitle];
  const lower = cleanTitle.toLowerCase();
  if (lower.includes('thức dậy') || lower.includes('5h') || lower.includes('dậy sớm')) return 'Wake up at 05:00';
  if (lower.includes('tiếng anh') || lower.includes('ngoại ngữ') || lower.includes('english')) return 'Learn English';
  if (lower.includes('học code') || lower.includes('lập trình') || lower.includes('coding')) return 'Code & Tech Skills';
  if (lower.includes('làm việc') || lower.includes('deep work') || lower.includes('công việc')) return 'Deep Focused Work';
  if (lower.includes('chơi game') || lower.includes('game')) return 'Limit Gaming to 2 Matches';
  if (lower.includes('thể dục') || lower.includes('gym') || lower.includes('workout')) return 'Gym Workout';
  if (lower.includes('chạy bộ') || lower.includes('jogging') || lower.includes('run')) return 'Running & Cardio';
  if (lower.includes('thiền') || lower.includes('meditation')) return 'Mindfulness Meditation';
  if (lower.includes('ăn vặt') || lower.includes('đồ ngọt') || lower.includes('junk food')) return 'Clean Nutrition / No Junk Food';
  if (lower.includes('đọc sách') || lower.includes('reading')) return 'Read for 30 Minutes';
  if (lower.includes('nước') || lower.includes('water')) return 'Drink 3L of Water';
  if (lower.includes('ngủ trước') || lower.includes('đi ngủ') || lower.includes('23h') || lower.includes('23:00')) return 'Sleep before 23:00';
  if (lower.includes('ngủ trưa') || lower.includes('nap')) return 'Midday Power Nap';
  if (lower.includes('nhật ký') || lower.includes('journal')) return 'Daily Journal & Review';
  if (lower.includes('dọn dẹp') || lower.includes('dọn phòng')) return 'Clean Living Space';
  if (lower.includes('nấu ăn') || lower.includes('meal')) return 'Healthy Meal Prep';
  if (lower.includes('đi bộ') || lower.includes('walk')) return 'Walking Target';
  return removeVietnameseAccents(cleanTitle);
}

function pickNonRepeating(
  candidates: Array<{ vi: string; en: string }>,
  history: string[]
): { vi: string; en: string } {
  if (candidates.length === 0) {
    return { vi: '', en: '' };
  }
  // Ưu tiên chọn câu không trùng cấu trúc với lịch sử gần đây
  const fresh = candidates.filter((c) => {
    const prefix = c.vi.slice(0, 22).toLowerCase();
    return !history.some(
      (h) => h === c.vi || h.toLowerCase().startsWith(prefix)
    );
  });
  const pool = fresh.length > 0 ? fresh : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * ============================================================================
 * SUB-AGENT 1: DISCIPLINE COACH AGENT (ReAct + Memory + Compositional NLG)
 * ============================================================================
 */
export function runDisciplineCoachAgent(params: {
  userId: string;
  mode: 'greeting' | 'feedback';
  callName: string;
  percentage: number;
  rawPoints: number;
  maxPoints: number;
  completedTasks: string[];
  pendingTasks: string[];
  actionableNow: string[];
  passedTimeWindow: string[];
  physLabel: string;
  physLabelEn: string;
  mentLabel: string;
  mentLabelEn: string;
  emoLabel: string;
  emoLabelEn: string;
  goalLabel: string;
  goalLabelEn: string;
  dateCtx: DateTemporalContext;
  timeCtx: TimeOfDayContext;
  recentChange: RecentChangeContext | null;
  memory: AgentMemorySnapshot;
  waterCurrentMl?: number;
  waterTargetMl?: number;
}): { message: string; messageEn: string } {
  const {
    userId,
    mode,
    callName,
    percentage: pct,
    completedTasks,
    pendingTasks,
    actionableNow,
    physLabel,
    physLabelEn,
    mentLabel,
    mentLabelEn,
    goalLabel,
    goalLabelEn,
    dateCtx,
    timeCtx,
    recentChange,
    memory,
  } = params;

  const history = getEpisodicHistory(userId);
  const nameEn = callName === 'bạn' ? 'friend' : removeVietnameseAccents(callName);

  const nextTaskVi =
    actionableNow[0] || pendingTasks[0] || 'mục tiêu trọng tâm trong ngày';
  const nextTaskEn = translateTaskTitle(nextTaskVi);

  // --------------------------------------------------------------------------
  // BƯỚC 1: TẠO MẢNH GHÉP TRÍ NHỚ DÀI HẠN (MEMORY INSIGHT CLAUSE)
  // --------------------------------------------------------------------------
  const memoryInsights: Array<{ vi: string; en: string }> = [];

  if (memory.streakDays >= 3) {
    memoryInsights.push(
      {
        vi: `Chuỗi ${memory.streakDays} ngày kỷ luật liên tiếp của ${callName} đang rất ấn tượng đấy`,
        en: `Your ${memory.streakDays}-day discipline streak is looking seriously impressive, ${nameEn}`,
      },
      {
        vi: `Đã giữ vững mạch ${memory.streakDays} ngày rèn luyện bền bỉ rồi`,
        en: `You have maintained a solid ${memory.streakDays}-day consistency streak`,
      }
    );
  } else if (memory.activeDaysCount >= 2 && memory.momentum === 'RISING') {
    memoryInsights.push({
      vi: `Phong độ hôm nay (${pct}%) đang vượt lên trên mức trung bình ${memory.avg7DayScore}% của tuần qua`,
      en: `Today’s ${pct}% score is outperforming your 7-day average of ${memory.avg7DayScore}%`,
    });
  } else if (memory.yesterdayScore !== null && pct > memory.yesterdayScore) {
    memoryInsights.push({
      vi: `Điểm số ${pct}% hôm nay đã bứt phá cao hơn mức ${memory.yesterdayScore}% của ngày hôm qua`,
      en: `At ${pct}%, you have already surpassed yesterday’s ${memory.yesterdayScore}% score`,
    });
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // BƯỚC 2: CHẾ ĐỘ GREETING (KHI MỚI VÀO APP / RELOAD TRANG) — BÁM SÁT 100% THEO KHUNG GIỜ THỰC TẾ
  // --------------------------------------------------------------------------
  if (mode === 'greeting') {
    const streakNoteVi =
      memory.streakDays >= 2
        ? ` (đang giữ chuỗi ${memory.streakDays} ngày bền bỉ)`
        : '';
    const streakNoteEn =
      memory.streakDays >= 2
        ? ` (riding a ${memory.streakDays}-day streak)`
        : '';

    let periodCandidates: Array<{ vi: string; en: string }> = [];

    switch (timeCtx.periodKey) {
      case 'EARLY_MORNING':
        periodCandidates = [
          {
            vi: `Chào buổi sáng ${callName} lúc ${timeCtx.timeStr}! Khởi động ngày mới với tinh thần ${mentLabel.toLowerCase()}${streakNoteVi} và mở màn bằng "${nextTaskVi}" để tạo đà chiến thắng cho cả ngày nào!`,
            en: `Good early morning, ${nameEn} (${timeCtx.timeStr})! Ignite your day with a ${mentLabelEn.toLowerCase()} mindset${streakNoteEn} and knock out "${nextTaskEn}" to build winning momentum!`,
          },
          {
            vi: `Mới ${timeCtx.timeStr} sáng sớm mà ${callName} đã mở bảng kỷ luật rồi, năng lượng ${physLabel.toLowerCase()} này chắc chắn sẽ giúp bạn hoàn thành xuất sắc mục tiêu "${nextTaskVi}"!`,
            en: `Up early at ${timeCtx.timeStr}, ${nameEn}! This ${physLabelEn.toLowerCase()} energy will surely power you through "${nextTaskEn}" with flying colors!`,
          },
          {
            vi: `Bắt đầu ngày mới thật kỷ luật nhé ${callName}! Lúc ${timeCtx.timeStr} sáng này là thời điểm vàng để làm chủ bản thân với "${nextTaskVi}".`,
            en: `Kick off the day with iron discipline, ${nameEn}! This ${timeCtx.timeStr} early hour is your prime window to master "${nextTaskEn}".`,
          },
        ];
        break;

      case 'MID_MORNING':
        periodCandidates = [
          {
            vi: `Đang là khung giờ vàng buổi sáng (${timeCtx.timeStr}) đấy ${callName}! Dồn trọn sự tập trung ${mentLabel.toLowerCase()}${streakNoteVi} vào "${nextTaskVi}" để bứt phá điểm số kỷ luật nào!`,
            en: `Peak morning focus hour right now (${timeCtx.timeStr}), ${nameEn}! Channel that ${mentLabelEn.toLowerCase()} mindset${streakNoteEn} into "${nextTaskEn}" to drive your discipline score up!`,
          },
          {
            vi: `Chào ${callName}, buổi sáng (${timeCtx.timeStr}) với thể chất ${physLabel.toLowerCase()} là thời cơ tốt nhất để giải quyết dứt điểm "${nextTaskVi}" trước giờ trưa!`,
            en: `Morning check-in at ${timeCtx.timeStr}, ${nameEn}! With your body feeling ${physLabelEn.toLowerCase()}, knock out "${nextTaskEn}" cleanly before lunchtime!`,
          },
        ];
        break;

      case 'NOON':
        periodCandidates = [
          {
            vi: `Đã ${timeCtx.timeStr} trưa rồi đấy ${callName}! Hãy ăn trưa đủ chất và nghỉ ngơi chừng 15-20 phút để nạp lại 100% năng lượng cho buổi chiều nhé.`,
            en: `It’s already ${timeCtx.timeStr} noon, ${nameEn}! Enjoy a nutritious lunch and recharge with a 15–20 min break to restore 100% energy for the afternoon!`,
          },
          {
            vi: `Chào buổi trưa ${callName} (${timeCtx.timeStr})! Tiến độ hôm nay đang đạt ${pct}%${streakNoteVi}, giờ trưa này hãy chợp mắt một chút hoặc hoàn thành nhẹ "${nextTaskVi}" để chiều tiếp tục bùng nổ nhé!`,
            en: `Good midday, ${nameEn} (${timeCtx.timeStr})! Progress stands at ${pct}%${streakNoteEn}—take a quick power nap or gently handle "${nextTaskEn}" to power up for the afternoon!`,
          },
          {
            vi: `Ủa alo ${callName}, đồng hồ đã điểm ${timeCtx.timeStr} trưa rồi! Nghỉ ngơi dưỡng sức hoặc xử lý êm gọn "${nextTaskVi}" để buổi chiều thảnh thơi nào.`,
            en: `Clock struck ${timeCtx.timeStr} noon, ${nameEn}! Rest up or smoothly take care of "${nextTaskEn}" so your afternoon runs effortlessly.`,
          },
        ];
        break;

      case 'AFTERNOON':
        periodCandidates = [
          {
            vi: `Đầu giờ chiều (${timeCtx.timeStr}) rồi ${callName}! Uống một ly nước lọc để lấy lại sự tỉnh táo và cùng dứt điểm mục tiêu "${nextTaskVi}" nhé.`,
            en: `Afternoon session underway (${timeCtx.timeStr}), ${nameEn}! Grab a glass of water to refresh your focus and knock out "${nextTaskEn}".`,
          },
          {
            vi: `Chào ${callName}, buổi chiều (${timeCtx.timeStr}) đang diễn ra với tiến độ ${pct}%, giữ vững tinh thần ${mentLabel.toLowerCase()} để chinh phục "${nextTaskVi}" nào!`,
            en: `Good afternoon, ${nameEn} (${timeCtx.timeStr})! Sitting at ${pct}% today—maintain that ${mentLabelEn.toLowerCase()} tempo and conquer "${nextTaskEn}"!`,
          },
        ];
        break;

      case 'LATE_AFTERNOON':
        periodCandidates = [
          {
            vi: `Đã ${timeCtx.timeStr} chiều rồi đấy ${callName}! Sau một ngày dài làm việc thì giải phóng năng lượng bằng "${nextTaskVi}" là lựa chọn số một để xả stress!`,
            en: `It’s ${timeCtx.timeStr} late afternoon, ${nameEn}! After a focused day, releasing energy through "${nextTaskEn}" is the ultimate stress buster!`,
          },
          {
            vi: `Khung giờ ${timeCtx.timeStr} chiều muộn rồi ${callName}, bảng kỷ luật đang ở mức ${pct}%, đẩy nốt "${nextTaskVi}" là ngày hôm nay cực kỳ mỹ mãn!`,
            en: `Late afternoon at ${timeCtx.timeStr}, ${nameEn}! Board is at ${pct}%—finishing "${nextTaskEn}" now will make today a resounding victory!`,
          },
        ];
        break;

      case 'EVENING':
        periodCandidates = [
          {
            vi: `Buổi tối (${timeCtx.timeStr}) rồi ${callName}, nhớ giữ kỷ luật "${nextTaskVi}" và nhìn lại những thành quả kỷ luật xuất sắc bạn đã đạt được hôm nay nhé!`,
            en: `Good evening (${timeCtx.timeStr}), ${nameEn}! Keep up your "${nextTaskEn}" discipline and reflect on today’s solid achievements!`,
          },
          {
            vi: `Chào ${callName}, ${timeCtx.timeStr} tối rồi mà bảng việc đã cán mốc ${pct}%${streakNoteVi}, thư giãn nhẹ nhàng và chuẩn bị khép lại ngày thật trọn vẹn nào!`,
            en: `Evening check-in at ${timeCtx.timeStr}, ${nameEn}! At ${pct}%${streakNoteEn}, enjoy a peaceful evening and prepare to wrap up a great day!`,
          },
        ];
        break;

      case 'LATE_NIGHT':
      default:
        periodCandidates = [
          {
            vi: `Đã ${timeCtx.timeStr} đêm muộn rồi đấy ${callName}, hãy rời xa các màn hình và chuẩn bị đi ngủ trước 23:00 để sáng mai thức dậy tràn đầy năng lượng nhé!`,
            en: `It’s already ${timeCtx.timeStr} late night, ${nameEn}! Step away from screens and get ready to sleep before 23:00 to wake up fully energized tomorrow!`,
          },
          {
            vi: `Khuya rồi ${callName} (${timeCtx.timeStr})! Khép lại ngày hôm nay ở mức ${pct}%${streakNoteVi} là rất đáng khen rồi, giờ là lúc ngủ thật sâu để cơ thể phục hồi 100%!`,
            en: `It’s late (${timeCtx.timeStr}), ${nameEn}! Wrapping up today at ${pct}%${streakNoteEn} is truly commendable—now get deep sleep to recharge 100%!`,
          },
        ];
        break;
    }

    if (pct >= 85) {
      periodCandidates.unshift({
        vi: `Đỉnh cao đấy ${callName}, mới ${timeCtx.timeStr} mà bảng kỷ luật đã cán mốc ${pct}%${streakNoteVi}—giữ vững phong độ hủy diệt này đến cuối ngày nhé!`,
        en: `Outstanding work, ${nameEn}! Reaching ${pct}% by ${timeCtx.timeStr}${streakNoteEn} is elite execution—carry this unstoppable momentum through the rest of the day!`,
      });
    }

    const chosen = pickNonRepeating(periodCandidates, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // --------------------------------------------------------------------------
  // BƯỚC 3: CHẾ ĐỘ FEEDBACK — NGÀY TRONG QUÁ KHỨ (PAST DAY)
  // --------------------------------------------------------------------------
  if (dateCtx.isPastDay) {
    const taskTitleVi = recentChange?.task?.title || 'bảng kỷ luật';
    const taskTitleEn = translateTaskTitle(recentChange?.task?.title);

    const pastCandidates: Array<{ vi: string; en: string }> =
      pct >= 60
        ? [
            {
              vi: `Ghi nhận cập nhật mục "${taskTitleVi}" cho ${dateCtx.relativeDayLabel} nhé ${callName}! Khép lại ngày cũ ở mức ấn tượng ${pct}% là bàn đạp tuyệt vời để hôm nay bạn tiếp tục bùng nổ với "${nextTaskVi}".`,
              en: `Logged your update on "${taskTitleEn}" for ${dateCtx.relativeDayLabelEn}, ${nameEn}! Wrapping up that day at a strong ${pct}% is great fuel to tackle "${nextTaskEn}" today.`,
            },
            {
              vi: `Đã cập nhật lại dữ liệu ${dateCtx.relativeDayLabel} rồi đấy ${callName}, con số ${pct}% chứng tỏ sự bền bỉ rất đáng khen! Hãy mang trọn tinh thần kỷ luật đó quay lại càn quét lịch trình ngày hôm nay nhé.`,
              en: `Updated your records for ${dateCtx.relativeDayLabelEn}, ${nameEn}—finishing at ${pct}% shows solid grit! Bring that exact same discipline back to conquer today’s schedule.`,
            },
          ]
        : [
            {
              vi: `Đã lưu cập nhật "${taskTitleVi}" cho ${dateCtx.relativeDayLabel} rồi nhé ${callName}. Ngày cũ khép lại ở mức ${pct}% vẫn còn những mục tiêu bỏ ngỏ, hãy lấy đó làm động lực để hôm nay gỡ lại điểm số thật thuyết phục!`,
              en: `Saved your update on "${taskTitleEn}" for ${dateCtx.relativeDayLabelEn}, ${nameEn}. That day closed at ${pct}% with room for improvement—use it as fuel to bounce back strong today!`,
            },
            {
              vi: `Nhìn lại sổ kỷ luật ${dateCtx.relativeDayLabel} dừng ở mức ${pct}% sau khi cập nhật mới thấy thời gian trôi nhanh thật đấy ${callName}. Quá khứ đã khép lại, giờ là lúc dồn 100% sự tập trung vào ngày hôm nay để bứt phá!`,
              en: `Reviewing ${dateCtx.relativeDayLabelEn} at ${pct}% is a clear reminder of how fast time flies, ${nameEn}. The past is locked in—now channel 100% of your focus into dominating today!`,
            },
          ];

    const chosen = pickNonRepeating(pastCandidates, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // --------------------------------------------------------------------------
  // BƯỚC 4: CHẾ ĐỘ FEEDBACK — NGÀY TRONG TƯƠNG LAI (FUTURE DAY)
  // --------------------------------------------------------------------------
  if (dateCtx.isFutureDay) {
    const futureCandidates: Array<{ vi: string; en: string }> = [
      {
        vi: `Chà, ${callName} còn chuẩn bị trước cả thao tác cho ${dateCtx.relativeDayLabel} cơ à, tinh thần nhìn xa trông rộng đấy! Nhưng đừng quên chiến trường chính vẫn là ngày hôm nay—quay lại xử gọn "${nextTaskVi}" trước đã nhé.`,
        en: `Planning ahead for ${dateCtx.relativeDayLabelEn} already, ${nameEn}? Love the foresight, but remember your main battlefield is today—head back and knock out "${nextTaskEn}" first!`,
      },
      {
        vi: `Thao tác trên ${dateCtx.relativeDayLabel} đã được ghi nhận rồi nhé ${callName}. Tương lai được quyết định bởi hành động ngay lúc này, hãy tập trung hoàn thành trọn vẹn bảng việc ngày hôm nay trước nào!`,
        en: `Recorded your action on ${dateCtx.relativeDayLabelEn}, ${nameEn}. The future is built by what you do right now—focus on finishing today’s discipline board first!`,
      },
    ];
    const chosen = pickNonRepeating(futureCandidates, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // --------------------------------------------------------------------------
  // BƯỚC 5: CHẾ ĐỘ FEEDBACK — CÁC HÀNH ĐỘNG ĐẶC BIỆT TRONG NGÀY HÔM NAY
  // --------------------------------------------------------------------------

  // 5.0. THẮC MẮC KHI TÍCH VIỆC Ở KHUNG GIỜ TƯƠNG LAI (TRÁNH BẤM NHẦM)
  if (recentChange?.isFutureHourTask) {
    const taskTitleVi = recentChange.task?.title || 'đầu việc này';
    const taskTitleEn = translateTaskTitle(taskTitleVi);
    const scheduledHour = recentChange.scheduledHour ?? 12;
    const scheduledTimeStr = `${String(scheduledHour).padStart(2, '0')}:00`;
    const lvl = recentChange.levelKey;

    // 5.0.1. Tích việc đi ngủ đêm vào ban ngày (trước 20h)
    if (recentChange.isSleepTask && timeCtx.hour < 20) {
      const sleepFuturePool: Array<{ vi: string; en: string }> = [
        {
          vi: `Ủa ${callName} ơi, bây giờ mới có ${timeCtx.timeStr} thôi mà bạn đã tích hoàn thành "${taskTitleVi}" rồi á? Bạn có nhấn nhầm ô không đấy, hay là hôm nay định đi ngủ sớm từ giữa ban ngày thế này? 😄`,
          en: `Wait, ${nameEn}! It’s only ${timeCtx.timeStr} right now, but you already checked off "${taskTitleEn}"? Did you tap it by mistake, or are you really heading to sleep in broad daylight? 😄`,
        },
        {
          vi: `Đồng hồ mới chỉ ${timeCtx.timeStr} thôi mà ${callName} đã vội chốt mục "${taskTitleVi}" rồi! Có phải bạn bấm nhầm không nè, chứ giờ này mặt trời còn chưa lặn mà đã chuẩn bị đi ngủ đêm sao?`,
          en: `Hold on ${nameEn}, the clock shows ${timeCtx.timeStr} and you’ve already ticked "${taskTitleEn}"! Make sure you didn't click the wrong box—save this one for tonight before 23:00!`,
        },
        {
          vi: `Ủa ${callName}, mới ${timeCtx.timeStr} mà đã tích "${taskTitleVi}" rồi à? Coi chừng ấn nhầm ô nha, giờ này hãy tập trung làm việc và sinh hoạt đã, tối đến tầm 22h-23h hẵng chốt mục này nhé!`,
          en: `Wait ${nameEn}, it's just ${timeCtx.timeStr} and you already checked "${taskTitleEn}"? Watch out for misclicks—focus on your daytime goals first, and wrap this one up tonight!`,
        },
      ];
      const chosen = pickNonRepeating(sleepFuturePool, history);
      recordEpisodicMemory(userId, chosen.vi);
      return { message: chosen.vi, messageEn: chosen.en };
    }

    // 5.0.2. Tích việc có giờ lớn hơn giờ hiện tại (ví dụ 12h trưa tích việc 15h, 17h, 21h...)
    const futureHourPool: Array<{ vi: string; en: string }> = [
      {
        vi: `Ủa ${callName} ơi, bây giờ mới có ${timeCtx.timeStr} thôi mà bạn đã tích hoàn thành "${taskTitleVi}" (lên lịch lúc ${scheduledTimeStr}) rồi thế? Bạn có nhấn nhầm ô không đấy, hay là vừa tranh thủ giải quyết sớm trước giờ vậy?`,
        en: `Hold on a second, ${nameEn}! The clock is showing ${timeCtx.timeStr}, but you’ve already checked off "${taskTitleEn}" scheduled for ${scheduledTimeStr}. Did your finger slip on the box, or did you genuinely hustle and finish it early ahead of schedule? If you crushed it early, respect! If it was an accident, double-check to keep your progress tracking 100% accurate.`,
      },
      {
        vi: `Khoan đã ${callName}, đồng hồ mới chỉ ${timeCtx.timeStr} mà bạn đã đánh dấu xong "${taskTitleVi}" dự kiến cho khung ${scheduledTimeStr} rồi à? Nếu bạn làm sớm thật thì quá đỉnh, còn nếu lỡ tay bấm nhầm thì nhớ kiểm tra lại kẻo lệch bảng theo dõi nhé!`,
        en: `Wait a moment, ${nameEn}! It’s only ${timeCtx.timeStr} right now, yet "${taskTitleEn}" (planned for ${scheduledTimeStr}) is marked done. True self-mastery is anchored in honest time-tracking—make sure you didn’t click by mistake so today’s ${pct}% score reflects your genuine actions.`,
      },
      {
        vi: `Ủa alo ${callName}! Bây giờ mới ${timeCtx.timeStr} mà mục "${taskTitleVi}" (khung ${scheduledTimeStr}) đã thấy tích ${lvl === 'PERFECT' ? 'Hoàn Hảo' : 'xong'} rồi. Bạn có vô tình chạm nhầm nút không, hay là hôm nay đổi lịch làm việc này sớm hơn thế?`,
        en: `Quick check-in, ${nameEn}! Current time is ${timeCtx.timeStr}, but "${taskTitleEn}" (slotted for ${scheduledTimeStr}) is already marked complete. Did you accidentally tap the button, or did you adjust your daily flow to tackle this ahead of time?`,
      },
      {
        vi: `Thấy ${callName} tích "${taskTitleVi}" sớm hơn lịch trình (${scheduledTimeStr}) khi mới ${timeCtx.timeStr}. Bạn có lỡ tay ấn nhầm không nè? Kỷ luật tự giác là trung thực với từng mốc giờ, xác nhận lại giúp mình nha!`,
        en: `Noticed you logged "${taskTitleEn}" earlier than its scheduled ${scheduledTimeStr} window while it's currently ${timeCtx.timeStr}, ${nameEn}. Was that a misclick? Daily discipline thrives on authentic accountability—take a second to verify your board!`,
      },
    ];
    const chosen = pickNonRepeating(futureHourPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // 5A. Vừa thao tác mục Giấc ngủ cuối ngày ("Đi ngủ trước 11h")
  if (recentChange?.isSleepTask) {
    const lvl = recentChange.levelKey;
    const sleepTitleVi = recentChange.task?.title || 'Đi ngủ trước 11h đêm';
    const sleepTitleEn = translateTaskTitle(sleepTitleVi);

    if (lvl === 'PERFECT' || lvl === 'GOOD') {
      const sleepGoodPool: Array<{ vi: string; en: string }> = [
        {
          vi: `Chốt hạ mục tiêu "${sleepTitleVi}" đúng chuẩn kỷ luật rồi đấy ${callName}! Khép lại ngày hôm nay ở mức ${pct}%, giờ hãy rời xa màn hình và ngủ thật sâu để cơ thể phục hồi 100% năng lượng cho sáng mai thức dậy bùng nổ nhé.`,
          en: `Locked in "${sleepTitleEn}" with true discipline, ${nameEn}! Wrapping up today at ${pct}%—now step away from screens and get deep sleep to recharge 100% for tomorrow morning.`,
        },
        {
          vi: `Biết dừng lại nghỉ ngơi đúng giờ là biểu hiện rõ nhất của người làm chủ bản thân đấy ${callName}! Tổng kết hôm nay đạt ${pct}% rồi, chúc bạn một giấc ngủ thật chất lượng để ngày mai lại càn quét bảng việc.`,
          en: `Knowing when to power down on time is the ultimate sign of self-mastery, ${nameEn}! Today closes at ${pct}%—enjoy high-quality rest tonight and wake up ready to dominate tomorrow.`,
        },
      ];
      const chosen = pickNonRepeating(sleepGoodPool, history);
      recordEpisodicMemory(userId, chosen.vi);
      return { message: chosen.vi, messageEn: chosen.en };
    }

    if (lvl === 'BAD') {
      const sleepBadPool: Array<{ vi: string; en: string }> = [
        {
          vi: `Thức khuya khiến mục "${sleepTitleVi}" chỉ đạt mức Tệ thôi sao ${callName}? Ngày hôm nay khép lại ở ${pct}%, đừng lướt điện thoại thêm nữa mà hãy đi ngủ ngay để tránh uể oải vào sáng mai nhé!`,
          en: `Staying up late dropped "${sleepTitleEn}" to Bad, ${nameEn}? Today ends at ${pct}%—put the phone away and sleep immediately so you don't drain tomorrow's energy!`,
        },
      ];
      const chosen = pickNonRepeating(sleepBadPool, history);
      recordEpisodicMemory(userId, chosen.vi);
      return { message: chosen.vi, messageEn: chosen.en };
    }
  }

  // 5B. Vừa cập nhật lượng nước uống (WATER)
  if (recentChange?.kind === 'WATER') {
    const ml = Number(recentChange.waterMl || params.waterCurrentMl || 0);
    const targetMl = params.waterTargetMl || 2000;
    const waterPct = Math.min(100, Math.round((ml / targetMl) * 100));

    const waterPool: Array<{ vi: string; en: string }> = [
      {
        vi: `Nạp thêm nước lên mức ${ml}ml/${targetMl}ml (${waterPct}%) là thói quen cực tốt để giữ não bộ tỉnh táo đấy ${callName}! Giờ thì thừa thắng xông lên giải quyết gọn mục "${nextTaskVi}" để kéo điểm kỷ luật ${pct}% lên cao hơn nữa nhé.`,
        en: `Hydrating up to ${ml}ml/${targetMl}ml (${waterPct}%) is essential cellular fuel for razor-sharp cognitive stamina, ${nameEn}! Ride this wave of mental clarity straight into conquering "${nextTaskEn}" and elevating your ${pct}% discipline score.`,
      },
      {
        vi: `Ghi nhận ${callName} vừa bổ sung nước (${ml}ml)—cơ thể đủ nước thì hiệu suất tập trung mới đạt đỉnh được! Hiện bảng việc đang ở mức ${pct}%, hãy tiếp tục dứt điểm "${nextTaskVi}" trong ${timeCtx.periodLabel.toLowerCase()} này nào.`,
        en: `Recorded your ${ml}ml water intake, ${nameEn}—proper hydration is non-negotiable for sustained energy and brain performance! With the board at ${pct}%, let’s channel this alertness into crushing "${nextTaskEn}" during this ${timeCtx.periodLabelEn.toLowerCase()}.`,
      },
    ];
    const chosen = pickNonRepeating(waterPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // 5C. Vừa lưu Ghi chú tự kiểm điểm (NOTE)
  if (recentChange?.kind === 'NOTE') {
    const noteSnippet = (recentChange.noteText || '').slice(0, 65);
    const notePool: Array<{ vi: string; en: string }> = noteSnippet
      ? [
          {
            vi: `Đọc dòng ghi chú "${noteSnippet}" mới thấy sự tự nhìn nhận nghiêm túc của ${callName}! Đang ở mức ${pct}% điểm kỷ luật hôm nay, hãy biến những suy nghĩ đó thành hành động cụ thể với "${nextTaskVi}" ngay nhé.`,
            en: `Reading your reflection "${noteSnippet}" shows genuine self-awareness and accountability, ${nameEn}! Sitting at ${pct}% discipline today, bridge thought into execution by tackling "${nextTaskEn}" immediately.`,
          },
          {
            vi: `Viết nhật ký phản tư là thói quen của những người có tư duy phát triển mạnh mẽ đấy ${callName}! Tiến độ hôm nay đang đạt ${pct}%, tiếp tục giữ vững nhịp độ với "${nextTaskVi}" để khép lại ngày thật trọn vẹn nào.`,
            en: `Intentional journaling is the hallmark of relentless growth and self-correction, ${nameEn}! Your day stands at ${pct}%—maintain this purposeful rhythm with "${nextTaskEn}" to finish today with flying colors.`,
          },
        ]
      : [
          {
            vi: `Đã cập nhật lại phần ghi chú trong ngày rồi nhé ${callName}. Tiến độ hiện tại đang là ${pct}%, hãy dồn sự tập trung vào "${nextTaskVi}" tiếp theo nào!`,
            en: `Updated your daily reflection, ${nameEn}. Current progress stands at ${pct}%—channel all your mental focus into conquering "${nextTaskEn}" next!`,
          },
        ];
    const chosen = pickNonRepeating(notePool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // 5D. Vừa cập nhật Trạng thái cá nhân (PROFILE)
  if (recentChange?.kind === 'PROFILE') {
    const profilePool: Array<{ vi: string; en: string }> = [
      {
        vi: `Cập nhật trạng thái mới: thể chất ${physLabel.toLowerCase()}, tinh thần ${mentLabel.toLowerCase()} rồi đấy ${callName}! Hệ thống đã điều chỉnh trọng số cá nhân hóa, giờ hãy chinh phục ngay "${nextTaskVi}" để nâng mức ${pct}% lên tầm cao mới nhé.`,
        en: `State updated: feeling ${physLabelEn.toLowerCase()} in body and ${mentLabelEn.toLowerCase()} in mind, ${nameEn}! Your personalized difficulty weights are calibrated—now direct that energy into conquering "${nextTaskEn}" and elevating your ${pct}% score.`,
      },
      {
        vi: `Lắng nghe cơ thể (${physLabel.toLowerCase()}) và tâm trí (${mentLabel.toLowerCase()}) giúp ${callName} phân bổ sức lực thông minh hơn nhiều đấy! Cùng giữ đà ${pct}% hiện tại và tiến thẳng tới mục tiêu "${nextTaskVi}" nào.`,
        en: `Attuning to your physical state (${physLabelEn.toLowerCase()}) and mental focus (${mentLabelEn.toLowerCase()}) empowers you to pace your cognitive stamina with strategic precision, ${nameEn}! Keep driving today’s ${pct}% momentum straight into "${nextTaskEn}".`,
      },
    ];
    const chosen = pickNonRepeating(profilePool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // 5E. Vừa bấm Đặt lại ngày (CLEAR)
  if (recentChange?.kind === 'CLEAR') {
    const clearPool: Array<{ vi: string; en: string }> = [
      {
        vi: `Đã làm mới toàn bộ bảng việc hôm nay về 0% theo ý ${callName} rồi đấy! Một trang giấy trắng tinh đã sẵn sàng, hãy đánh dấu chiến thắng đầu tiên bằng việc hoàn thành "${nextTaskVi}" ngay thôi.`,
        en: `Reset today’s discipline board back to 0% as requested, ${nameEn}! A clean slate is ready—claim your first victory by knocking out "${nextTaskEn}" right now.`,
      },
    ];
    const chosen = pickNonRepeating(clearPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // 5F. Vừa bấm Tích nhanh tất cả (ALL)
  if (recentChange?.kind === 'ALL') {
    // Nếu bấm tích tất cả vào ban ngày (trước 19h tối)
    if (timeCtx.hour < 19 && !dateCtx.isPastDay && !dateCtx.isFutureDay) {
      const daytimeAllPool: Array<{ vi: string; en: string }> = [
        {
          vi: `Ủa ${callName} ơi, bây giờ mới có ${timeCtx.timeStr} mà bạn đã bấm "Tích tất cả" 100% rồi á? Coi chừng ấn nhầm nút nhé, vì các việc buổi chiều tối như thể dục, làm việc, hay ngủ đêm vẫn còn ở phía trước mà! Hãy kiểm tra lại bảng việc nha.`,
          en: `Wait ${nameEn}, it's only ${timeCtx.timeStr} and you just clicked "Check All" for 100%? Watch out for accidental clicks—afternoon and evening goals like workout and night sleep are still ahead!`,
        },
        {
          vi: `Khoan nào ${callName}, mới ${timeCtx.timeStr} thôi mà toàn bộ công việc trong ngày đã được tích sạch rồi! Có phải bạn bấm nhầm nút "Tích tất cả" không? Hãy chắc chắn rằng bạn chỉ tích những việc đã thật sự hoàn thành thôi nhé.`,
          en: `Hold on ${nameEn}! It's just ${timeCtx.timeStr} and the entire day is marked done. Did you hit "Check All" by mistake? Remember true discipline is logging tasks as you genuinely complete them!`,
        },
      ];
      const chosen = pickNonRepeating(daytimeAllPool, history);
      recordEpisodicMemory(userId, chosen.vi);
      return { message: chosen.vi, messageEn: chosen.en };
    }

    const allPool: Array<{ vi: string; en: string }> = [
      {
        vi: `Cú quét sạch toàn bộ bảng việc lên mức ${pct}% cực kỳ dứt khoát đấy ${callName}! Hãy đảm bảo mọi đầu việc đều được thực hiện trung thực 100% với bản thân vì kỷ luật thật sự nằm ở hành động thực tế nhé.`,
        en: `Sweeping the entire board up to ${pct}% is a bold move, ${nameEn}! Make sure every single check reflects 100% honest execution—true discipline lives in real action.`,
      },
    ];
    const chosen = pickNonRepeating(allPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // 5G. Tích hoặc đổi mức một đầu việc cụ thể (TASK) hoặc Bấm đổi câu
  const taskTitleVi = recentChange?.task?.title || completedTasks[completedTasks.length - 1] || 'mục tiêu vừa chọn';
  const taskTitleEn = translateTaskTitle(recentChange?.task?.title || taskTitleVi);
  const lvl = recentChange?.levelKey;
  const hourSuffixVi = recentChange?.hourPart ? ` lúc ${recentChange.hourPart}` : '';
  const hourSuffixEn = recentChange?.hourPart ? ` at ${recentChange.hourPart}` : '';

  let nextStepAdviceVi = '';
  let nextStepAdviceEn = '';

  if (pendingTasks.length === 0) {
    nextStepAdviceVi = 'Toàn bộ mục tiêu hôm nay đã hoàn tất mỹ mãn, hãy tận hưởng buổi tối thư giãn xứng đáng nhé!';
    nextStepAdviceEn = 'Every single goal for today is complete—enjoy your well-deserved rest tonight!';
  } else if (timeCtx.periodKey === 'LATE_NIGHT') {
    nextStepAdviceVi = `Hiện đã là ${timeCtx.timeStr} đêm muộn, hãy khép lại công việc để chuẩn bị ngủ trước 23:00 nhé!`;
    nextStepAdviceEn = `It’s already ${timeCtx.timeStr} late at night—wrap up your work and get ready for sleep before 23:00!`;
  } else if (timeCtx.periodKey === 'NOON') {
    nextStepAdviceVi = `Giờ trưa (${timeCtx.timeStr}) này hãy nghỉ ngơi chừng 15-20 phút dưỡng sức để chiều tiếp tục bùng nổ với "${nextTaskVi}" nhé!`;
    nextStepAdviceEn = `This midday (${timeCtx.timeStr}), rest up or take a 15–20 min power nap before tackling "${nextTaskEn}"!`;
  } else if (timeCtx.periodKey === 'LATE_AFTERNOON') {
    nextStepAdviceVi = `Đã ${timeCtx.timeStr} chiều muộn rồi, chuẩn bị đến giờ giải phóng năng lượng với "${nextTaskVi}" rồi đấy!`;
    nextStepAdviceEn = `It’s ${timeCtx.timeStr} late afternoon—get ready to unleash your energy with "${nextTaskEn}"!`;
  } else if (timeCtx.periodKey === 'EVENING') {
    nextStepAdviceVi = `Tối nay (${timeCtx.timeStr}) tiếp tục giữ vững kỷ luật "${nextTaskVi}" để bảo toàn điểm số hôm nay nhé!`;
    nextStepAdviceEn = `This evening (${timeCtx.timeStr}), stay consistent with "${nextTaskEn}" to lock in today’s progress!`;
  } else {
    nextStepAdviceVi = `Tiếp tục giữ nhịp độ này và xử lý gọn "${nextTaskVi}" trong ${timeCtx.periodLabel.toLowerCase()} nay nào!`;
    nextStepAdviceEn = `Keep this momentum rolling and tackle "${nextTaskEn}" next this ${timeCtx.periodLabelEn.toLowerCase()}!`;
  }

  const memClause =
    memoryInsights.length > 0
      ? memoryInsights[Math.floor(Math.random() * memoryInsights.length)]
      : null;

  if (lvl === 'NONE') {
    // Vừa BỎ TÍCH một việc
    const uncheckPool: Array<{ vi: string; en: string }> = [
      {
        vi: `Ủa sao lại bỏ tích mục "${taskTitleVi}" khiến điểm số lùi về ${pct}% thế kia ${callName}? Trung thực với bản thân là rất tốt, nhưng đừng để mục tiêu này bị bỏ quên—hãy bắt tay làm thật rồi tích lại đầy tự hào nhé!`,
        en: `Notice you unchecked "${taskTitleEn}", dialing back your score to ${pct}%, ${nameEn}? Radical honesty with yourself is admirable, but don’t let this goal slide into oblivion—execute it thoroughly and earn that checkmark back with pride!`,
      },
      {
        vi: `Thấy ${callName} vừa rút lại dấu tích ở việc "${taskTitleVi}" (tiến độ hiện tại: ${pct}%). Không sao cả, thà chậm mà chắc—hãy xốc lại tinh thần và hoàn thành "${nextTaskVi}" ngay bây giờ nào!`,
        en: `Saw you retracted the completion on "${taskTitleEn}" (current progress stands at ${pct}%), ${nameEn}. Quality and integrity always beat superficial rush—regroup your determination and conquer "${nextTaskEn}" right away!`,
      },
    ];
    const chosen = pickNonRepeating(uncheckPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  if (lvl === 'BAD') {
    // Tích mức TỆ
    const badPool: Array<{ vi: string; en: string }> = [
      {
        vi: `Mục "${taskTitleVi}"${hourSuffixVi} hôm nay chỉ đạt mức Tệ thôi sao ${callName}? Điểm kỷ luật đang ở mức ${pct}%, đừng dễ dãi thỏa hiệp với bản thân nữa mà hãy gỡ gạc lại ngay bằng mức Hoàn Hảo ở việc "${nextTaskVi}" đi!`,
        en: `Only a "Bad" rating on "${taskTitleEn}"${hourSuffixEn} today, ${nameEn}? Sitting at ${pct}%, refuse to negotiate with self-doubt—reclaim full control right now with an uncompromising Perfect run on "${nextTaskEn}"!`,
      },
      {
        vi: `Thẳng thắn nhé ${callName}: hoàn thành "${taskTitleVi}" ở mức Tệ là lời cảnh báo sự tập trung đang đi xuống đấy! Hiện bạn đạt ${pct}%, hãy chấn chỉnh lại ngay và dồn 100% tâm sức vào "${nextTaskVi}" tiếp theo nào.`,
        en: `Direct feedback, ${nameEn}: logging "Bad" on "${taskTitleEn}" signals that focus is slipping! At ${pct}% today, reset your mindset immediately and channel 100% of your energy into dominating "${nextTaskEn}" next.`,
      },
    ];
    const chosen = pickNonRepeating(badPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  if (lvl === 'GOOD') {
    // Tích mức TỐT
    const goodPool: Array<{ vi: string; en: string }> = [
      {
        vi: `Ghi nhận ${callName} đã hoàn thành "${taskTitleVi}"${hourSuffixVi} ở mức Tốt, đưa tổng tiến độ lên ${pct}%! Chỉ cần rướn thêm một chút sự tỉ mỉ nữa là chạm chuẩn Hoàn Hảo rồi. ${memClause ? memClause.vi + '. ' : ''}${nextStepAdviceVi}`,
        en: `Solid progress completing "${taskTitleEn}"${hourSuffixEn} at a commendable Good level, lifting your overall score to ${pct}%, ${nameEn}! Just a slight nudge in precision will push you to Perfect. ${memClause ? memClause.en + '. ' : ''}${nextStepAdviceEn}`,
      },
      {
        vi: `Xử lý xong "${taskTitleVi}" ở mức Tốt là bước tiến vững chắc đấy ${callName} (${pct}% điểm kỷ luật). ${memClause ? memClause.vi + '. ' : ''}${nextStepAdviceVi}`,
        en: `Checking off "${taskTitleEn}" at a solid Good level keeps your momentum strong, ${nameEn} (${pct}% discipline achieved). ${memClause ? memClause.en + '. ' : ''}${nextStepAdviceEn}`,
      },
    ];
    const chosen = pickNonRepeating(goodPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // Tích mức HOÀN HẢO (PERFECT) hoặc làm mới nhận xét chung
  const perfectPool: Array<{ vi: string; en: string }> = [
    {
      vi: `Khét đấy ${callName}! Chốt hạ "${taskTitleVi}"${hourSuffixVi} ở mức Hoàn Hảo giúp bảng kỷ luật vọt lên ${pct}% cực kỳ thuyết phục. ${memClause ? memClause.vi + '. ' : ''}${nextStepAdviceVi}`,
      en: `Phenomenal focus, ${nameEn}! Locking in "${taskTitleEn}"${hourSuffixEn} with flawless execution elevates your daily discipline to a stellar ${pct}%. ${memClause ? memClause.en + '. ' : ''}${nextStepAdviceEn}`,
    },
    {
      vi: `Một cú tích Hoàn Hảo cho "${taskTitleVi}"${hourSuffixVi} không chê vào đâu được, ${callName} đang nắm giữ ${pct}% điểm kỷ luật hôm nay! ${memClause ? memClause.vi + '. ' : ''}${nextStepAdviceVi}`,
      en: `Absolute mastery on "${taskTitleEn}"${hourSuffixEn}, ${nameEn}—you’re operating at peak efficiency with a commanding ${pct}% discipline score today! ${memClause ? memClause.en + '. ' : ''}${nextStepAdviceEn}`,
    },
    {
      vi: `Đúng chất chiến binh kỷ luật! Dứt điểm "${taskTitleVi}"${hourSuffixVi} gọn gàng đưa tiến độ hôm nay cán mốc ${pct}% rồi đấy ${callName}. ${memClause ? memClause.vi + '. ' : ''}${nextStepAdviceVi}`,
      en: `True warrior discipline in action! Crushing "${taskTitleEn}"${hourSuffixEn} cleanly propels your progress forward to an impressive ${pct}%, ${nameEn}. ${memClause ? memClause.en + '. ' : ''}${nextStepAdviceEn}`,
    },
    {
      vi: `Sự kiên định của ${callName} thể hiện rõ qua việc hoàn thành xuất sắc "${taskTitleVi}"${hourSuffixVi} (tổng đạt ${pct}%). ${memClause ? memClause.vi + '. ' : ''}${nextStepAdviceVi}`,
      en: `Relentless consistency defines elite performers, ${nameEn}—knocking out "${taskTitleEn}"${hourSuffixEn} flawlessly cements today’s score at ${pct}%. ${memClause ? memClause.en + '. ' : ''}${nextStepAdviceEn}`,
    },
  ];

  const chosen = pickNonRepeating(perfectPool, history);
  recordEpisodicMemory(userId, chosen.vi);
  return { message: chosen.vi, messageEn: chosen.en };
}

/**
 * ============================================================================
 * SUB-AGENT 2: NUTRITIONIST AGENT (Tool-Augmented Macro & Diet Reasoning)
 * ============================================================================
 */
export async function runNutritionistAgent(params: {
  profile: UserProfile;
  dateKey: string;
  meals: FoodItem[];
  previousSummary?: CaloriesSummary;
}): Promise<{ summary: CaloriesSummary; meals: FoodItem[] }> {
  const { profile, meals, previousSummary } = params;

  if (!meals || meals.length === 0) {
    return {
      summary: {
        totalCalories: 0,
        protein: 0,
        carb: 0,
        fat: 0,
        fiber: 0,
        aiFeedback:
          'Chưa có món ăn nào được ghi lại cho ngày này. Hãy thêm các món bạn ăn từ 06:00 đến 21:00 nhé!',
        aiFeedbackEn:
          'No meals logged yet for this day. Please add the meals you eat between 06:00 and 21:00!',
        updatedAt: new Date().toISOString(),
      },
      meals: [],
    };
  }

  // BƯỚC 1: GỌI TOOL TÍNH TOÁN CHÍNH XÁC 5 CHỈ SỐ MACRO CHO TỪNG MÓN ĂN
  const analyzedMeals = await Promise.all(meals.map((m) => calculateSingleItemMacrosAsync(m)));

  // BƯỚC 2: TỔNG HỢP 5 CHỈ SỐ TOÀN NGÀY
  const totalCalories = Math.round(
    analyzedMeals.reduce((acc, m) => acc + (m.calories || 0), 0)
  );
  const protein =
    Math.round(
      analyzedMeals.reduce((acc, m) => acc + (m.protein || 0), 0) * 10
    ) / 10;
  const carb =
    Math.round(analyzedMeals.reduce((acc, m) => acc + (m.carb || 0), 0) * 10) /
    10;
  const fat =
    Math.round(analyzedMeals.reduce((acc, m) => acc + (m.fat || 0), 0) * 10) /
    10;
  const fiber =
    Math.round(analyzedMeals.reduce((acc, m) => acc + (m.fiber || 0), 0) * 10) /
    10;

  // BƯỚC 3: GỌI TOOL TÍNH NHU CẦU DINH DƯỠNG CÁ NHÂN HÓA (BMR / TDEE / TARGETS)
  const targets = calculateUserNutritionTargets(profile);
  const callName = profile.name?.trim() ? profile.name.trim() : 'bạn';
  const nameEn = callName === 'bạn' ? 'you' : removeVietnameseAccents(callName);

  // BƯỚC 4: PHÂN TÍCH BIẾN ĐỘNG SO VỚI LẦN LƯU TRƯỚC & CÁCH CHẾ BIẾN
  let comparisonVi = '';
  let comparisonEn = '';

  if (previousSummary && typeof previousSummary.totalCalories === 'number') {
    const calDiff = totalCalories - previousSummary.totalCalories;
    const proDiff = Math.round((protein - previousSummary.protein) * 10) / 10;

    if (calDiff > 15) {
      comparisonVi = `So với lần lưu trước (${previousSummary.totalCalories} kcal), thực đơn vừa bổ sung thêm món giúp tổng năng lượng tăng +${calDiff} kcal (lên ${totalCalories} kcal) và đạm ${proDiff >= 0 ? `tăng +${proDiff}g` : `giảm ${proDiff}g`}. `;
      comparisonEn = `Compared to your previous save (${previousSummary.totalCalories} kcal), adding new items increased total energy by +${calDiff} kcal (to ${totalCalories} kcal) and protein by ${proDiff >= 0 ? `+${proDiff}g` : `${proDiff}g`}. `;
    } else if (calDiff < -15) {
      comparisonVi = `So với lần lưu trước (${previousSummary.totalCalories} kcal), việc lược bớt món đã làm tổng calo giảm ${Math.abs(calDiff)} kcal (xuống còn ${totalCalories} kcal, đạm ${proDiff >= 0 ? `+${proDiff}g` : `${proDiff}g`}). `;
      comparisonEn = `Compared to your previous save (${previousSummary.totalCalories} kcal), removing items reduced total calories by ${Math.abs(calDiff)} kcal (down to ${totalCalories} kcal, protein ${proDiff >= 0 ? `+${proDiff}g` : `${proDiff}g`}). `;
    } else {
      comparisonVi = `Thực đơn gồm ${analyzedMeals.length} món giữ mức năng lượng ổn định ở ${totalCalories} kcal (Đạm: ${protein}g, Tinh bột: ${carb}g, Béo: ${fat}g, Xơ: ${fiber}g). `;
      comparisonEn = `Your ${analyzedMeals.length}-item menu maintains a steady energy intake at ${totalCalories} kcal (Protein: ${protein}g, Carbs: ${carb}g, Fat: ${fat}g, Fiber: ${fiber}g). `;
    }
  } else {
    comparisonVi = `Đã phân tích ${analyzedMeals.length} món ăn với tổng năng lượng ${totalCalories} kcal (nhu cầu khuyến nghị của ${callName} khoảng ~${targets.targetCalories} kcal/ngày). `;
    comparisonEn = `Analyzed ${analyzedMeals.length} food item(s) totaling ${totalCalories} kcal (your estimated daily target is ~${targets.targetCalories} kcal/day). `;
  }

  // Kiểm tra phương pháp chế biến
  const friedItems = analyzedMeals.filter((m) => m.cookingMethod === 'chien' || m.cookingMethod === 'xao');
  const cleanItems = analyzedMeals.filter((m) => m.cookingMethod === 'luoc' || m.cookingMethod === 'hap');

  let cookingNoteVi = '';
  let cookingNoteEn = '';
  if (friedItems.length > 0) {
    cookingNoteVi = `Lưu ý thực đơn có ${friedItems.length} món chiên/xào làm tăng lượng chất béo hấp thụ (${fat}g fat); `;
    cookingNoteEn = `Note that ${friedItems.length} fried/stir-fried item(s) added extra cooking oil fat (${fat}g fat total); `;
  } else if (cleanItems.length > 0) {
    cookingNoteVi = `Ưu điểm lớn là bạn ưu tiên chế biến luộc/hấp giúp kiểm soát chất béo cực kỳ sạch (${fat}g fat); `;
    cookingNoteEn = `Great job prioritizing boiled/steamed preparation to keep fat intake clean (${fat}g fat); `;
  }

  // Đánh giá cân đối Đạm & Chất xơ
  const advicesVi: string[] = [];
  const advicesEn: string[] = [];

  if (protein < targets.targetProtein * 0.65) {
    const needPro = Math.round(targets.targetProtein - protein);
    advicesVi.push(
      `lượng đạm hiện đạt ${protein}g/${targets.targetProtein}g, bạn nên nạp thêm khoảng ${needPro}g protein từ ức gà, cá, trứng hoặc đậu phụ ở bữa tiếp theo`
    );
    advicesEn.push(
      `protein is currently at ${protein}g/${targets.targetProtein}g, so aim to add ~${needPro}g of lean protein from chicken breast, fish, eggs, or tofu`
    );
  } else {
    advicesVi.push(
      `lượng đạm ${protein}g đang đáp ứng rất tốt cho cơ bắp và thể trạng của bạn`
    );
    advicesEn.push(
      `your ${protein}g protein intake is well-aligned with muscle recovery and your physique goals`
    );
  }

  if (fiber < 12) {
    advicesVi.push(
      `bổ sung thêm rau xanh luộc hoặc trái cây ít ngọt để nâng chất xơ (hiện ${fiber}g) đạt chuẩn tiêu hóa nhé!`
    );
    advicesEn.push(
      `and add more green vegetables or low-sugar fruits to boost fiber (currently ${fiber}g) for optimal digestion!`
    );
  } else {
    advicesVi.push(
      `lượng chất xơ ${fiber}g rất dồi dào, hãy tiếp tục duy trì kỷ luật ăn uống lành mạnh này nhé!`
    );
    advicesEn.push(
      `and your ${fiber}g fiber intake is excellent—keep up this clean nutritional discipline, ${nameEn}!`
    );
  }

  const aiFeedback = `${comparisonVi}${cookingNoteVi}${advicesVi.join(', ')}.`
    .replace(/\.\./g, '.')
    .trim();
  const aiFeedbackEn = `${comparisonEn}${cookingNoteEn}${advicesEn.join(', ')}.`
    .replace(/\.\./g, '.')
    .trim();

  return {
    summary: {
      totalCalories,
      protein,
      carb,
      fat,
      fiber,
      aiFeedback,
      aiFeedbackEn,
      updatedAt: new Date().toISOString(),
    },
    meals: analyzedMeals,
  };
}


/**
 * ============================================================================
 * SUB-AGENT 3: GYM WORKOUT & TRAINING AGENT (Progressive Overload + RIR Analysis)
 * ============================================================================
 */
export function runWorkoutAgent(params: {
  profile: UserProfile;
  dateKey: string;
  targetMuscles: string[];
  exercises: WorkoutExercise[];
  allRecords: Record<string, DayRecord>;
}): WorkoutSummary {
  const { profile, dateKey, targetMuscles, exercises, allRecords } = params;
  const callName = profile.name?.trim() || 'bạn';
  const nameEn = callName === 'bạn' ? 'friend' : removeVietnameseAccents(callName);
  const userWeight = parseFloat(profile.weightKg || '70') || 70;
  const workoutGoal = profile.workoutGoal || 'HYPERTROPHY';

  if (!exercises || exercises.length === 0) {
    return {
      totalVolumeKg: 0,
      totalSets: 0,
      totalReps: 0,
      avgRir: 0,
      progressiveOverloadStatus: 'FIRST_SESSION',
      aiFeedback: 'Chưa có bài tập nào được ghi lại cho buổi tập này. Hãy chọn nhóm cơ và thêm các bài tập cùng số set, tạ (kg), rep và RIR để AI phân tích phong độ nhé!',
      aiFeedbackEn: 'No exercises logged yet for this workout session. Select muscle groups and add your exercises with sets, weight (kg), reps, and RIR for AI analysis!',
      updatedAt: new Date().toISOString(),
    };
  }

  const currentMetrics = calculateWorkoutMetrics(exercises, userWeight);

  const GOAL_LABELS: Record<string, { vi: string; en: string }> = {
    HYPERTROPHY: { vi: 'Tăng cơ bắp tối đa (Hypertrophy)', en: 'Hypertrophy / Muscle Growth' },
    STRENGTH: { vi: 'Tăng sức mạnh (Strength)', en: 'Strength & Powerlifting' },
    FAT_LOSS: { vi: 'Giảm mỡ & Săn chắc (Fat Loss)', en: 'Fat Loss & Recomp' },
    ENDURANCE: { vi: 'Sức bền & Thể lực (Endurance)', en: 'Endurance & Conditioning' },
    GENERAL_FITNESS: { vi: 'Duy trì sức khỏe (General Fitness)', en: 'General Fitness' },
  };

  const goalInfo = GOAL_LABELS[workoutGoal] || GOAL_LABELS.HYPERTROPHY;

  // ==========================================================================
  // SO SÁNH TỪNG BÀI TẬP VỚI BUỔI GẦN NHẤT CÓ TẬP BÀI ĐÓ (PER-EXERCISE OVERLOAD)
  // ==========================================================================
  interface ExerciseAnalysis {
    curEx: WorkoutExercise;
    curMetrics: ExerciseCalculatedMetrics;
    prevMatch: PreviousExerciseMatch | null;
    weightDiff: number;
    volumeDiff: number;
    repsDiff: number;
    status: 'INCREASED_WEIGHT' | 'INCREASED_VOLUME' | 'MAINTAINED' | 'DECREASED' | 'NEW';
    clauseVi: string;
    clauseEn: string;
  }

  const analyzedExercises: ExerciseAnalysis[] = [];
  const matchedDates: string[] = [];

  for (const curEx of exercises) {
    const curMetrics = calculateSingleExerciseMetrics(curEx, userWeight);
    const prevMatch = findPreviousExercisePerformance(curEx, allRecords, dateKey, userWeight);

    if (prevMatch) {
      matchedDates.push(prevMatch.previousDateKey);
      const prevMetrics = prevMatch.previousMetrics;
      const weightDiff = curMetrics.maxWeightKg - prevMetrics.maxWeightKg;
      const volumeDiff = curMetrics.totalVolumeKg - prevMetrics.totalVolumeKg;
      const repsDiff = curMetrics.totalReps - prevMetrics.totalReps;

      if (weightDiff > 0) {
        analyzedExercises.push({
          curEx,
          curMetrics,
          prevMatch,
          weightDiff,
          volumeDiff,
          repsDiff,
          status: 'INCREASED_WEIGHT',
          clauseVi: `Bài "${curEx.name}" tăng mức tạ lên ${curMetrics.maxWeightKg}kg (+${weightDiff}kg so với mức ${prevMetrics.maxWeightKg}kg ở buổi ${prevMatch.previousDateShort})`,
          clauseEn: `"${curEx.name}" increased top weight to ${curMetrics.maxWeightKg}kg (+${weightDiff}kg vs ${prevMetrics.maxWeightKg}kg on ${prevMatch.previousDateShort})`,
        });
      } else if (volumeDiff > 0 || repsDiff > 0) {
        analyzedExercises.push({
          curEx,
          curMetrics,
          prevMatch,
          weightDiff,
          volumeDiff,
          repsDiff,
          status: 'INCREASED_VOLUME',
          clauseVi: `Bài "${curEx.name}" giữ tạ ${curMetrics.maxWeightKg}kg và tăng volume lên ${curMetrics.totalVolumeKg.toLocaleString()}kg (+${volumeDiff.toLocaleString()}kg volume so với buổi ${prevMatch.previousDateShort})`,
          clauseEn: `"${curEx.name}" held ${curMetrics.maxWeightKg}kg with volume up to ${curMetrics.totalVolumeKg.toLocaleString()}kg (+${volumeDiff.toLocaleString()}kg vs ${prevMatch.previousDateShort})`,
        });
      } else if (weightDiff === 0 && Math.abs(volumeDiff) <= Math.max(15, curMetrics.totalVolumeKg * 0.08)) {
        analyzedExercises.push({
          curEx,
          curMetrics,
          prevMatch,
          weightDiff,
          volumeDiff,
          repsDiff,
          status: 'MAINTAINED',
          clauseVi: `Bài "${curEx.name}" duy trì phong độ ${curMetrics.maxWeightKg}kg (${curMetrics.totalVolumeKg.toLocaleString()}kg volume, tương đương buổi ${prevMatch.previousDateShort})`,
          clauseEn: `"${curEx.name}" maintained ${curMetrics.maxWeightKg}kg (${curMetrics.totalVolumeKg.toLocaleString()}kg volume, matching ${prevMatch.previousDateShort})`,
        });
      } else {
        const diffDescVi = weightDiff < 0 ? `${weightDiff}kg` : `${volumeDiff}kg volume`;
        const diffDescEn = weightDiff < 0 ? `${weightDiff}kg` : `${volumeDiff}kg volume`;
        analyzedExercises.push({
          curEx,
          curMetrics,
          prevMatch,
          weightDiff,
          volumeDiff,
          repsDiff,
          status: 'DECREASED',
          clauseVi: `Bài "${curEx.name}" mức tạ ${curMetrics.maxWeightKg}kg (${diffDescVi} so với buổi ${prevMatch.previousDateShort})`,
          clauseEn: `"${curEx.name}" lifted ${curMetrics.maxWeightKg}kg (${diffDescEn} vs ${prevMatch.previousDateShort})`,
        });
      }
    } else {
      analyzedExercises.push({
        curEx,
        curMetrics,
        prevMatch: null,
        weightDiff: 0,
        volumeDiff: 0,
        repsDiff: 0,
        status: 'NEW',
        clauseVi: `Bài "${curEx.name}" lần đầu ghi nhận (mốc ${curMetrics.maxWeightKg}kg, ${curMetrics.totalSets} sets)`,
        clauseEn: `"${curEx.name}" first time logged (baseline ${curMetrics.maxWeightKg}kg, ${curMetrics.totalSets} sets)`,
      });
    }
  }

  const weightGainItems = analyzedExercises.filter((a) => a.status === 'INCREASED_WEIGHT');
  const volumeGainItems = analyzedExercises.filter((a) => a.status === 'INCREASED_VOLUME');
  const maintainedItems = analyzedExercises.filter((a) => a.status === 'MAINTAINED');
  const decreasedItems = analyzedExercises.filter((a) => a.status === 'DECREASED');
  const newItems = analyzedExercises.filter((a) => a.status === 'NEW');

  // Đánh giá trạng thái tổng thể Progressive Overload
  let status: WorkoutSummary['progressiveOverloadStatus'] = 'MAINTAINED';
  let statusHeadlineVi = '';
  let statusHeadlineEn = '';

  if (weightGainItems.length > 0 || volumeGainItems.length > 0) {
    status = 'OVERLOAD_ACHIEVED';
    const gainCount = weightGainItems.length + volumeGainItems.length;
    statusHeadlineVi = `Chiến binh kỷ luật ${callName}! Bạn đã bứt phá Progressive Overload xuất sắc ở ${gainCount} bài tập hôm nay!`;
    statusHeadlineEn = `Outstanding Progressive Overload, ${nameEn}! You achieved strong progressive gains across ${gainCount} exercise(s) today!`;
  } else if (newItems.length === exercises.length) {
    status = 'FIRST_SESSION';
    statusHeadlineVi = `Chào ${callName}! Buổi tập hôm nay gồm ${exercises.length} bài đã thiết lập mốc cơ sở (Baseline) ban đầu cực kỳ chuẩn xác cho mục tiêu ${goalInfo.vi}.`;
    statusHeadlineEn = `Great work, ${nameEn}! Today's session with ${exercises.length} exercises sets a solid baseline for your ${goalInfo.en} goal.`;
  } else if (decreasedItems.length > maintainedItems.length && decreasedItems.length > 0) {
    status = 'DELOAD_FATIGUED';
    statusHeadlineVi = `Ghi nhận buổi tập hôm nay của ${callName}. Mức tạ/volume ở một số bài giảm nhẹ so với lần tập gần nhất, hãy lắng nghe cơ thể để hồi phục tốt nhất.`;
    statusHeadlineEn = `Session recorded, ${nameEn}. Output was slightly lower than previous sessions; treat this as an active deload/recovery day.`;
  } else {
    status = 'MAINTAINED';
    statusHeadlineVi = `Phong độ rất vững vàng ${callName}! Bạn đã kiểm soát tạ chuẩn chỉnh và duy trì tốt mức tạ ở các bài tập so với lần tập gần nhất.`;
    statusHeadlineEn = `Solid consistency, ${nameEn}! You maintained steady weights and controlled form compared to previous sessions.`;
  }

  // Tạo câu chi tiết từng bài
  const detailPartsVi: string[] = [];
  const detailPartsEn: string[] = [];

  if (weightGainItems.length > 0) {
    detailPartsVi.push(`Điểm sáng tăng tạ: ${weightGainItems.map((i) => i.clauseVi).join('; ')}`);
    detailPartsEn.push(`Weight gains: ${weightGainItems.map((i) => i.clauseEn).join('; ')}`);
  }
  if (volumeGainItems.length > 0) {
    detailPartsVi.push(`Tăng volume/rep: ${volumeGainItems.map((i) => i.clauseVi).join('; ')}`);
    detailPartsEn.push(`Volume/rep gains: ${volumeGainItems.map((i) => i.clauseEn).join('; ')}`);
  }
  if (maintainedItems.length > 0) {
    detailPartsVi.push(`Duy trì phong độ: ${maintainedItems.map((i) => i.clauseVi).join('; ')}`);
    detailPartsEn.push(`Maintained: ${maintainedItems.map((i) => i.clauseEn).join('; ')}`);
  }
  if (decreasedItems.length > 0) {
    detailPartsVi.push(`Cần lưu ý: ${decreasedItems.map((i) => i.clauseVi).join('; ')}`);
    detailPartsEn.push(`Deload notice: ${decreasedItems.map((i) => i.clauseEn).join('; ')}`);
  }
  if (newItems.length > 0 && newItems.length < exercises.length) {
    detailPartsVi.push(`Bài mới: ${newItems.map((i) => i.clauseVi).join('; ')}`);
    detailPartsEn.push(`New exercises: ${newItems.map((i) => i.clauseEn).join('; ')}`);
  }

  const detailsClauseVi = detailPartsVi.length > 0 ? ` ${detailPartsVi.join('. ')}.` : '';
  const detailsClauseEn = detailPartsEn.length > 0 ? ` ${detailPartsEn.join('. ')}.` : '';

  // RIR & Lời khuyên
  const rirClauseVi = ` RIR trung bình đạt ${currentMetrics.avgRir} cho thấy khả năng kiểm soát tạ rất tốt.`;
  const rirClauseEn = ` Average RIR of ${currentMetrics.avgRir} reflects disciplined weight control.`;

  let adviceVi = '';
  let adviceEn = '';
  if (status === 'OVERLOAD_ACHIEVED') {
    adviceVi = ` Với mục tiêu ${goalInfo.vi}, sự tăng tiến tạ liên tục này là chìa khóa vàng kích hoạt cơ bắp phát triển—hãy nạp đủ protein và ngủ trước 11h đêm nay để cơ bắp tổng hợp tối đa nhé!`;
    adviceEn = ` For your ${goalInfo.en} goal, this progressive stimulus triggers muscle growth—fuel up with protein and get deep sleep tonight!`;
  } else if (status === 'MAINTAINED') {
    adviceVi = ` Ở buổi tới, hãy thử tăng thêm 1-2 rep ở set cuối hoặc nâng thêm 1-2.5kg tạ ở bài tập chính để tiếp tục ép cơ bắp thích nghi.`;
    adviceEn = ` In your next session, aim for +1-2 extra reps on the final set or add +1-2.5kg to continue forcing muscle adaptation.`;
  } else if (status === 'DELOAD_FATIGUED') {
    adviceVi = ` Hãy coi đây là buổi Deload chiến lược. Bổ sung dinh dưỡng, uống đủ nước và ngủ thật sâu để buổi sau lấy lại 100% phong độ nhé!`;
    adviceEn = ` Treat this as a strategic recovery day. Prioritize nutrition and deep sleep to bounce back at 100% next time!`;
  } else {
    adviceVi = ` Hãy duy trì form chuẩn chỉnh này và ở buổi tập tới hãy thử tăng thêm 1-2 rep hoặc thêm 2.5kg tạ để kích hoạt Progressive Overload nhé!`;
    adviceEn = ` Keep up this clean execution, and aim for +1-2 reps or +2.5kg next session to drive Progressive Overload!`;
  }

  const aiFeedback = `${statusHeadlineVi}${detailsClauseVi}${rirClauseVi}${adviceVi}`.trim();
  const aiFeedbackEn = `${statusHeadlineEn}${detailsClauseEn}${rirClauseEn}${adviceEn}`.trim();

  // So sánh volume với các bài đã có lịch sử
  const comparedExercises = analyzedExercises.filter((a) => a.prevMatch !== null);
  matchedDates.sort((a, b) => b.localeCompare(a));
  const comparedDateKey = matchedDates.length > 0 ? matchedDates[0] : undefined;

  let volumeChangeKg: number | undefined = undefined;
  let volumeChangePct: number | undefined = undefined;

  if (comparedExercises.length > 0) {
    const curVolTotal = comparedExercises.reduce((sum, a) => sum + a.curMetrics.totalVolumeKg, 0);
    const prevVolTotal = comparedExercises.reduce((sum, a) => sum + (a.prevMatch?.previousMetrics.totalVolumeKg || 0), 0);
    volumeChangeKg = curVolTotal - prevVolTotal;
    volumeChangePct = prevVolTotal > 0 ? Math.round(((volumeChangeKg / prevVolTotal) * 100) * 10) / 10 : 0;
  }

  return {
    totalVolumeKg: currentMetrics.totalVolumeKg,
    totalSets: currentMetrics.totalSets,
    totalReps: currentMetrics.totalReps,
    avgRir: currentMetrics.avgRir,
    comparedDateKey,
    volumeChangeKg,
    volumeChangePct,
    progressiveOverloadStatus: status,
    aiFeedback,
    aiFeedbackEn,
    updatedAt: new Date().toISOString(),
  };
}
