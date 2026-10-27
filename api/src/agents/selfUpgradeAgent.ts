import {
  calculateWorkoutMetrics,
  findBestMatchingPreviousWorkout,
} from './tools/workoutKnowledgeTool';
import { CaloriesSummary, DayRecord, FoodItem, TaskItem, UserProfile, WorkoutExercise, WorkoutSummary } from '~/types';
import {
  AgentMemorySnapshot,
  getEpisodicHistory,
  recordEpisodicMemory,
} from './memory/agentMemoryEngine';
import {
  calculateSingleItemMacros,
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
  'Thức dậy lúc 5h': 'Wake up at 5:00 AM',
  'Thức dậy lúc 5h sáng': 'Wake up at 5:00 AM',
  'Học tiếng Anh': 'Learn English',
  'Làm việc': 'Focused Work',
  'Học code': 'Learn to Code',
  'Chơi game 2 ván': 'Limit gaming to 2 matches',
  'Ngủ trưa': 'Midday Power Nap',
  'Uống 3 lít nước': 'Drink 3L of water',
  'Uống đủ 2 lít nước': 'Drink 2L of water',
  'Tập gym': 'Gym Workout',
  'Không ăn vặt': 'No Junk Food',
  'Ngủ trước 11h': 'Sleep before 11:00 PM',
  'Đi ngủ trước 11h đêm': 'Sleep before 11:00 PM',
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

function translateTaskTitle(title: string | undefined): string {
  if (!title) return 'your goal';
  const cleanTitle = title.replace(/\s*\(lúc.*?\)\s*$/i, '').trim();
  if (TASK_TITLE_EN_MAP[cleanTitle]) return TASK_TITLE_EN_MAP[cleanTitle];
  const lower = cleanTitle.toLowerCase();
  if (lower.includes('thức dậy') || lower.includes('5h')) return 'Wake up at 5 AM';
  if (lower.includes('tiếng anh') || lower.includes('ngoại ngữ')) return 'Learn English';
  if (lower.includes('học code') || lower.includes('lập trình')) return 'Learn to Code';
  if (lower.includes('làm việc') || lower.includes('deep work')) return 'Focused Work';
  if (lower.includes('chơi game') || lower.includes('game')) return 'Limit Gaming';
  if (lower.includes('thể dục') || lower.includes('gym')) return 'Gym Workout';
  if (lower.includes('ăn vặt') || lower.includes('đồ ngọt')) return 'No Junk Food';
  if (lower.includes('đọc sách')) return 'Reading session';
  if (lower.includes('nước')) return 'Drink Water';
  if (lower.includes('ngủ trước') || lower.includes('đi ngủ')) return 'Sleep before 11 PM';
  if (lower.includes('ngủ trưa')) return 'Midday Power Nap';
  return cleanTitle;
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
  const nameEn = callName === 'bạn' ? 'friend' : callName;

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
            vi: `Đã ${timeCtx.timeStr} đêm muộn rồi đấy ${callName}, hãy rời xa các màn hình và chuẩn bị đi ngủ trước 11h để sáng mai thức dậy tràn đầy năng lượng nhé!`,
            en: `It’s already ${timeCtx.timeStr} late night, ${nameEn}! Step away from screens and get ready to sleep before 11 PM to wake up fully energized tomorrow!`,
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
      pct >= 70
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
          en: `Hold on ${nameEn}, the clock shows ${timeCtx.timeStr} and you’ve already ticked "${taskTitleEn}"! Make sure you didn't click the wrong box—save this one for tonight before 11 PM!`,
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
        en: `Wait a second, ${nameEn}! It’s only ${timeCtx.timeStr} right now, but you’ve already checked off "${taskTitleEn}" scheduled for ${scheduledTimeStr}? Did you accidentally tap the wrong task, or did you genuinely knock it out early ahead of schedule?`,
      },
      {
        vi: `Khoan đã ${callName}, đồng hồ mới chỉ ${timeCtx.timeStr} mà bạn đã đánh dấu xong "${taskTitleVi}" dự kiến cho khung ${scheduledTimeStr} rồi à? Nếu bạn làm sớm thật thì quá đỉnh, còn nếu lỡ tay bấm nhầm thì nhớ kiểm tra lại kẻo lệch bảng theo dõi nhé!`,
        en: `Hold on ${nameEn}, it's just ${timeCtx.timeStr} and you already marked "${taskTitleEn}" (scheduled at ${scheduledTimeStr}) as complete! If you truly crushed it early, kudos to you! But if it was a slip of the finger, make sure to double-check!`,
      },
      {
        vi: `Ủa alo ${callName}! Bây giờ mới ${timeCtx.timeStr} mà mục "${taskTitleVi}" (khung ${scheduledTimeStr}) đã thấy tích ${lvl === 'PERFECT' ? 'Hoàn Hảo' : 'xong'} rồi. Bạn có vô tình chạm nhầm nút không, hay là hôm nay đổi lịch làm việc này sớm hơn thế?`,
        en: `Hey ${nameEn}! Clock says ${timeCtx.timeStr}, yet "${taskTitleEn}" (set for ${scheduledTimeStr}) is already checked. Did you tap it by mistake, or did you shuffle your schedule to finish it early today?`,
      },
      {
        vi: `Thấy ${callName} tích "${taskTitleVi}" sớm hơn lịch trình (${scheduledTimeStr}) khi mới ${timeCtx.timeStr}. Bạn có lỡ tay ấn nhầm không nè? Kỷ luật tự giác là trung thực với từng mốc giờ, xác nhận lại giúp mình nha!`,
        en: `Noticed you checked "${taskTitleEn}" earlier than its scheduled ${scheduledTimeStr} time slot while it's only ${timeCtx.timeStr}, ${nameEn}. Was that a misclick? True discipline means honest tracking—double check when you get a moment!`,
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
        en: `Hydrating up to ${ml}ml/${targetMl}ml (${waterPct}%) is a great way to keep your brain sharp, ${nameEn}! Now ride that clarity and knock out "${nextTaskEn}" to push your ${pct}% score even higher.`,
      },
      {
        vi: `Ghi nhận ${callName} vừa bổ sung nước (${ml}ml)—cơ thể đủ nước thì hiệu suất tập trung mới đạt đỉnh được! Hiện bảng việc đang ở mức ${pct}%, hãy tiếp tục dứt điểm "${nextTaskVi}" trong ${timeCtx.periodLabel.toLowerCase()} này nào.`,
        en: `Noted your ${ml}ml water intake, ${nameEn}—staying hydrated keeps your focus at peak performance! With your board at ${pct}%, let’s tackle "${nextTaskEn}" this ${timeCtx.periodLabelEn.toLowerCase()}.`,
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
            en: `Reading your note "${noteSnippet}" shows real self-awareness, ${nameEn}! Sitting at ${pct}% today, turn that reflection into concrete action by tackling "${nextTaskEn}" next.`,
          },
          {
            vi: `Viết nhật ký phản tư là thói quen của những người có tư duy phát triển mạnh mẽ đấy ${callName}! Tiến độ hôm nay đang đạt ${pct}%, tiếp tục giữ vững nhịp độ với "${nextTaskVi}" để khép lại ngày thật trọn vẹn nào.`,
            en: `Journaling and self-reflection are hallmarks of a strong growth mindset, ${nameEn}! You’re at ${pct}% today—keep the rhythm going with "${nextTaskEn}" for a strong finish.`,
          },
        ]
      : [
          {
            vi: `Đã cập nhật lại phần ghi chú trong ngày rồi nhé ${callName}. Tiến độ hiện tại đang là ${pct}%, hãy dồn sự tập trung vào "${nextTaskVi}" tiếp theo nào!`,
            en: `Updated your daily note, ${nameEn}. Current progress stands at ${pct}%—channel your focus into "${nextTaskEn}" next!`,
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
        en: `Profile updated: ${physLabelEn.toLowerCase()} body and ${mentLabelEn.toLowerCase()} mind, ${nameEn}! Personalization weights are tuned—now conquer "${nextTaskEn}" to elevate your ${pct}% score.`,
      },
      {
        vi: `Lắng nghe cơ thể (${physLabel.toLowerCase()}) và tâm trí (${mentLabel.toLowerCase()}) giúp ${callName} phân bổ sức lực thông minh hơn nhiều đấy! Cùng giữ đà ${pct}% hiện tại và tiến thẳng tới mục tiêu "${nextTaskVi}" nào.`,
        en: `Listening to your body (${physLabelEn.toLowerCase()}) and mind (${mentLabelEn.toLowerCase()}) helps you pace your energy smartly, ${nameEn}! Build on your ${pct}% progress and take down "${nextTaskEn}" next.`,
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
    nextStepAdviceVi = `Hiện đã là ${timeCtx.timeStr} đêm muộn, hãy khép lại công việc để chuẩn bị ngủ trước 11h nhé!`;
    nextStepAdviceEn = `It’s already ${timeCtx.timeStr} late at night—wrap up your work and get ready for sleep before 11 PM!`;
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
        en: `Unchecked "${taskTitleEn}" and dropped back to ${pct}%, ${nameEn}? Honesty with yourself is great, but don’t leave it unfinished—do it for real and check it back off with pride!`,
      },
      {
        vi: `Thấy ${callName} vừa rút lại dấu tích ở việc "${taskTitleVi}" (tiến độ hiện tại: ${pct}%). Không sao cả, thà chậm mà chắc—hãy xốc lại tinh thần và hoàn thành "${nextTaskVi}" ngay bây giờ nào!`,
        en: `Noticed you unchecked "${taskTitleEn}" (current progress: ${pct}%), ${nameEn}. No worries—quality over speed; rally your focus and knock out "${nextTaskEn}" right now!`,
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
        en: `Only a "Bad" rating on "${taskTitleEn}"${hourSuffixEn} today, ${nameEn}? With your score at ${pct}%, stop settling for less and bounce back with a Perfect execution on "${nextTaskEn}"!`,
      },
      {
        vi: `Thẳng thắn nhé ${callName}: hoàn thành "${taskTitleVi}" ở mức Tệ là lời cảnh báo sự tập trung đang đi xuống đấy! Hiện bạn đạt ${pct}%, hãy chấn chỉnh lại ngay và dồn 100% tâm sức vào "${nextTaskVi}" tiếp theo nào.`,
        en: `Let’s be honest, ${nameEn}: logging "Bad" on "${taskTitleEn}" is a warning sign that your focus is slipping! You’re at ${pct}%—tighten up your discipline and give 100% to "${nextTaskEn}" next.`,
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
        vi: `Ghi nhận ${callName} đã hoàn thành "${taskTitleVi}"${hourSuffixVi} ở mức Tốt, đưa tổng tiến độ lên ${pct}%! Chỉ cần rướn thêm một chút sự tỉ mỉ nữa là chạm chuẩn Hoàn Hảo rồi—${nextStepAdviceVi}`,
        en: `Solid job completing "${taskTitleEn}"${hourSuffixEn} at a Good level, pushing your score to ${pct}%, ${nameEn}! Just a bit more precision gets you to Perfect—${nextStepAdviceEn}`,
      },
      {
        vi: `Xử lý xong "${taskTitleVi}" ở mức Tốt là bước tiến vững chắc đấy ${callName} (${pct}% điểm kỷ luật). ${memClause ? memClause.vi + ' — ' : ''}${nextStepAdviceVi}`,
        en: `Checking off "${taskTitleEn}" at a Good level is steady progress, ${nameEn} (${pct}% discipline score). ${memClause ? memClause.en + ' — ' : ''}${nextStepAdviceEn}`,
      },
    ];
    const chosen = pickNonRepeating(goodPool, history);
    recordEpisodicMemory(userId, chosen.vi);
    return { message: chosen.vi, messageEn: chosen.en };
  }

  // Tích mức HOÀN HẢO (PERFECT) hoặc làm mới nhận xét chung
  const perfectPool: Array<{ vi: string; en: string }> = [
    {
      vi: `Khét đấy ${callName}! Chốt hạ "${taskTitleVi}"${hourSuffixVi} ở mức Hoàn Hảo giúp bảng kỷ luật vọt lên ${pct}% cực kỳ thuyết phục. ${nextStepAdviceVi}`,
      en: `Sharp execution, ${nameEn}! Locking in "${taskTitleEn}"${hourSuffixEn} at Perfect propels your discipline score to an impressive ${pct}%. ${nextStepAdviceEn}`,
    },
    {
      vi: `Một cú tích Hoàn Hảo cho "${taskTitleVi}"${hourSuffixVi} không chê vào đâu được, ${callName} đang nắm giữ ${pct}% điểm kỷ luật hôm nay! ${memClause ? memClause.vi + '. ' : ''}${nextStepAdviceVi}`,
      en: `A flawless Perfect completion on "${taskTitleEn}"${hourSuffixEn}, ${nameEn}—you now hold a ${pct}% discipline score today! ${memClause ? memClause.en + '. ' : ''}${nextStepAdviceEn}`,
    },
    {
      vi: `Đúng chất chiến binh kỷ luật! Dứt điểm "${taskTitleVi}"${hourSuffixVi} gọn gàng đưa tiến độ hôm nay cán mốc ${pct}% rồi đấy ${callName}. ${nextStepAdviceVi}`,
      en: `True warrior discipline! Knocking out "${taskTitleEn}"${hourSuffixEn} cleanly brings today’s progress to ${pct}%, ${nameEn}. ${nextStepAdviceEn}`,
    },
    {
      vi: `Sự kiên định của ${callName} thể hiện rõ qua việc hoàn thành xuất sắc "${taskTitleVi}"${hourSuffixVi} (tổng đạt ${pct}%). ${nextStepAdviceVi}`,
      en: `Your consistency shines through with an excellent completion of "${taskTitleEn}"${hourSuffixEn} (now at ${pct}%), ${nameEn}. ${nextStepAdviceEn}`,
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
export function runNutritionistAgent(params: {
  profile: UserProfile;
  dateKey: string;
  meals: FoodItem[];
  previousSummary?: CaloriesSummary;
}): { summary: CaloriesSummary; meals: FoodItem[] } {
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
          'Chưa có món ăn nào được ghi lại cho ngày này. Hãy thêm các món bạn ăn từ 6h sáng đến 9h tối nhé!',
        aiFeedbackEn:
          'No meals logged yet for this day. Please add the meals you eat between 6:00 AM and 9:00 PM!',
        updatedAt: new Date().toISOString(),
      },
      meals: [],
    };
  }

  // BƯỚC 1: GỌI TOOL TÍNH TOÁN CHÍNH XÁC 5 CHỈ SỐ MACRO CHO TỪNG MÓN ĂN
  const analyzedMeals = meals.map((m) => calculateSingleItemMacros(m));

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
  const nameEn = callName === 'bạn' ? 'you' : callName;

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
  const nameEn = callName === 'bạn' ? 'friend' : callName;
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
  const matched = findBestMatchingPreviousWorkout(targetMuscles, exercises, allRecords, dateKey);

  const GOAL_LABELS: Record<string, { vi: string; en: string }> = {
    HYPERTROPHY: { vi: 'Tăng cơ bắp tối đa (Hypertrophy)', en: 'Hypertrophy / Muscle Growth' },
    STRENGTH: { vi: 'Tăng sức mạnh (Strength)', en: 'Strength & Powerlifting' },
    FAT_LOSS: { vi: 'Giảm mỡ & Săn chắc (Fat Loss)', en: 'Fat Loss & Recomp' },
    ENDURANCE: { vi: 'Sức bền & Thể lực (Endurance)', en: 'Endurance & Conditioning' },
    GENERAL_FITNESS: { vi: 'Duy trì sức khỏe (General Fitness)', en: 'General Fitness' },
  };

  const goalInfo = GOAL_LABELS[workoutGoal] || GOAL_LABELS.HYPERTROPHY;

  if (!matched) {
    // Buổi tập đầu tiên (Chưa có buổi so sánh tương đương trong quá khứ)
    const feedbackVi = `Chào ${callName}! Buổi tập hôm nay gồm ${exercises.length} bài (${currentMetrics.totalSets} sets, tổng volume ${currentMetrics.totalVolumeKg.toLocaleString()}kg, RIR trung bình ${currentMetrics.avgRir}) đã thiết lập mốc cơ sở (Baseline) cực kỳ chuẩn xác cho mục tiêu ${goalInfo.vi}. RIR ở mức ${currentMetrics.avgRir} cho thấy bạn đang kiểm soát tạ tốt—hãy duy trì form này và ở buổi tập tới hãy thử tăng thêm 1-2 rep hoặc thêm 2.5kg tạ để kích hoạt Progressive Overload nhé!`;

    const feedbackEn = `Great work, ${nameEn}! Today’s session with ${exercises.length} exercises (${currentMetrics.totalSets} sets, total volume ${currentMetrics.totalVolumeKg.toLocaleString()}kg, average RIR ${currentMetrics.avgRir}) sets a rock-solid baseline for your ${goalInfo.en} goal. Controlling weights at RIR ${currentMetrics.avgRir} reflects clean form—in your next session, aim for 1-2 extra reps or add +2.5kg to drive Progressive Overload!`;

    return {
      totalVolumeKg: currentMetrics.totalVolumeKg,
      totalSets: currentMetrics.totalSets,
      totalReps: currentMetrics.totalReps,
      avgRir: currentMetrics.avgRir,
      progressiveOverloadStatus: 'FIRST_SESSION',
      aiFeedback: feedbackVi,
      aiFeedbackEn: feedbackEn,
      updatedAt: new Date().toISOString(),
    };
  }

  // Có buổi tập tương đồng trong quá khứ để so sánh
  const prevMetrics = calculateWorkoutMetrics(matched.previousWorkout.exercises, userWeight);
  const volumeChangeKg = currentMetrics.totalVolumeKg - prevMetrics.totalVolumeKg;
  const volumeChangePct =
    prevMetrics.totalVolumeKg > 0
      ? Math.round((volumeChangeKg / prevMetrics.totalVolumeKg) * 1000) / 10
      : 0;

  const [, prevM, prevD] = matched.previousDateKey.split('-');
  const prevDateShort = `${prevD}/${prevM}`;

  // So sánh từng bài trùng nhau
  const exerciseGains: string[] = [];
  const exerciseGainsEn: string[] = [];

  for (const curEx of currentMetrics.exerciseList) {
    const prevEx = prevMetrics.exerciseMetricsMap.get(curEx.name.trim().toLowerCase());
    if (prevEx) {
      const weightDiff = curEx.maxWeightKg - prevEx.maxWeightKg;
      const volDiff = curEx.totalVolumeKg - prevEx.totalVolumeKg;
      if (weightDiff > 0) {
        exerciseGains.push(`"${curEx.name}" tăng mức tạ lên ${curEx.maxWeightKg}kg (+${weightDiff}kg)`);
        exerciseGainsEn.push(`"${curEx.name}" increased top weight to ${curEx.maxWeightKg}kg (+${weightDiff}kg)`);
      } else if (volDiff > 0) {
        exerciseGains.push(`"${curEx.name}" tăng volume (+${volDiff}kg)`);
        exerciseGainsEn.push(`"${curEx.name}" volume surged (+${volDiff}kg)`);
      }
    }
  }

  let status: WorkoutSummary['progressiveOverloadStatus'] = 'MAINTAINED';
  let statusHeadlineVi = '';
  let statusHeadlineEn = '';

  if (volumeChangePct >= 2.5 || exerciseGains.length > 0) {
    status = 'OVERLOAD_ACHIEVED';
    statusHeadlineVi = `Chiến binh kỷ luật ${callName}! Bạn đã bứt phá Progressive Overload xuất sắc với tổng volume tăng ${volumeChangeKg >= 0 ? `+${volumeChangeKg.toLocaleString()}kg` : `${volumeChangeKg.toLocaleString()}kg`} (+${volumeChangePct}% so với buổi ${prevDateShort}).`;
    statusHeadlineEn = `Outstanding Progressive Overload, ${nameEn}! Total training volume climbed ${volumeChangeKg >= 0 ? `+${volumeChangeKg.toLocaleString()}kg` : `${volumeChangeKg.toLocaleString()}kg`} (+${volumeChangePct}% compared to ${prevDateShort}).`;
  } else if (volumeChangePct >= -3) {
    status = 'MAINTAINED';
    statusHeadlineVi = `Phong độ rất ổn định ${callName}! Buổi tập hôm nay duy trì mức volume tương đương buổi ${prevDateShort} (${currentMetrics.totalVolumeKg.toLocaleString()}kg so với ${prevMetrics.totalVolumeKg.toLocaleString()}kg), RIR trung bình ${currentMetrics.avgRir} kiểm soát tạ chuẩn chỉnh.`;
    statusHeadlineEn = `Solid consistency, ${nameEn}! Today’s session maintained matching volume compared to ${prevDateShort} (${currentMetrics.totalVolumeKg.toLocaleString()}kg vs ${prevMetrics.totalVolumeKg.toLocaleString()}kg) with disciplined RIR at ${currentMetrics.avgRir}.`;
  } else {
    status = 'DELOAD_FATIGUED';
    statusHeadlineVi = `Ghi nhận buổi tập ${callName}. Volume hôm nay (${currentMetrics.totalVolumeKg.toLocaleString()}kg) giảm ${Math.abs(volumeChangeKg).toLocaleString()}kg (${volumeChangePct}%) so với buổi ${prevDateShort}.`;
    statusHeadlineEn = `Session recorded, ${nameEn}. Total volume (${currentMetrics.totalVolumeKg.toLocaleString()}kg) dropped by ${Math.abs(volumeChangeKg).toLocaleString()}kg (${volumeChangePct}%) compared to ${prevDateShort}.`;
  }

  const highlightClauseVi =
    exerciseGains.length > 0
      ? ` Điểm sáng nổi bật: ${exerciseGains.slice(0, 2).join(', ')}.`
      : '';
  const highlightClauseEn =
    exerciseGainsEn.length > 0
      ? ` Notable gains: ${exerciseGainsEn.slice(0, 2).join(', ')}.`
      : '';

  let adviceVi = '';
  let adviceEn = '';

  if (status === 'OVERLOAD_ACHIEVED') {
    adviceVi = `Với mục tiêu ${goalInfo.vi}, việc kích thích liên tục này là chìa khóa vàng để nở cơ—hãy nạp đủ protein và ngủ trước 11h đêm nay để cơ bắp tổng hợp tối đa nhé!`;
    adviceEn = `For your ${goalInfo.en} goal, this progressive stimulus is the ultimate hypertrophy trigger—fuel up with quality protein and get deep sleep tonight!`;
  } else if (status === 'MAINTAINED') {
    adviceVi = `Buổi tới hãy thử tăng 1 rep ở set cuối của các bài compound chính để tiếp tục ép cơ bắp thích nghi.`;
    adviceEn = `In your next session, push for +1 rep on the final set of compound lifts to force muscle adaptation.`;
  } else {
    adviceVi = `Nếu cảm thấy cơ bắp chưa kịp hồi phục, hãy coi đây là buổi Deload chiến lược. Bổ sung dinh dưỡng và ngủ thật sâu để buổi sau lấy lại 100% phong độ!`;
    adviceEn = `If systemic fatigue was high, treat this as a strategic Deload. Prioritize nutrition and deep rest to bounce back at 100% next time!`;
  }

  const aiFeedback = `${statusHeadlineVi}${highlightClauseVi} ${adviceVi}`.trim();
  const aiFeedbackEn = `${statusHeadlineEn}${highlightClauseEn} ${adviceEn}`.trim();

  return {
    totalVolumeKg: currentMetrics.totalVolumeKg,
    totalSets: currentMetrics.totalSets,
    totalReps: currentMetrics.totalReps,
    avgRir: currentMetrics.avgRir,
    comparedDateKey: matched.previousDateKey,
    volumeChangeKg,
    volumeChangePct,
    progressiveOverloadStatus: status,
    aiFeedback,
    aiFeedbackEn,
    updatedAt: new Date().toISOString(),
  };
}
