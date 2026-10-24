import { CaloriesSummary, FoodItem, TaskItem, UserProfile } from '~/types';
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

export interface TimeOfDayContext {
  hour: number;
  minute: number;
  timeStr: string;
  periodLabel: string;
  periodLabelEn: string;
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
  // BƯỚC 2: CHẾ ĐỘ GREETING (KHI MỚI VÀO APP / RELOAD TRANG)
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

    const greetingCandidates: Array<{ vi: string; en: string }> = [
      {
        vi: `Ơ kìa ${callName}, ${timeCtx.periodLabel.toLowerCase()} với thể chất ${physLabel.toLowerCase()} và tinh thần ${mentLabel.toLowerCase()}${streakNoteVi} chính là thời điểm vàng để bạn bứt phá mục tiêu "${nextTaskVi}" ngay đấy!`,
        en: `Hey ${nameEn}, this ${timeCtx.periodLabelEn.toLowerCase()} with your ${physLabelEn.toLowerCase()} body and ${mentLabelEn.toLowerCase()} mind${streakNoteEn} is the golden window to crush "${nextTaskEn}"!`,
      },
      {
        vi: `Nhìn xem ai vừa mở bảng kỷ luật lúc ${timeCtx.timeStr} này, ${callName} đang ở mức ${pct}% hôm nay—hãy giữ trọn sự tập trung để nâng cấp bản thân hướng tới mục tiêu ${goalLabel.toLowerCase()} nhé!`,
        en: `Look who just opened the discipline board at ${timeCtx.timeStr}! You’re at ${pct}% today, ${nameEn}—stay locked in on your ${goalLabelEn.toLowerCase()} goal!`,
      },
      {
        vi: `Chà chà ${callName}, tinh thần đang ${mentLabel.toLowerCase()} thế này mà để sự trì hoãn thắng thế thì tiếc lắm, bắt tay xử gọn "${nextTaskVi}" trong ${timeCtx.periodLabel.toLowerCase()} nay thôi!`,
        en: `With your mind feeling ${mentLabelEn.toLowerCase()} right now, ${nameEn}, letting procrastination win would be a waste—dive straight into "${nextTaskEn}" this ${timeCtx.periodLabelEn.toLowerCase()}!`,
      },
      {
        vi: `Thẳng thắn nhé ${callName}: kỷ luật thép không tự nhiên sinh ra, hãy biến năng lượng ${physLabel.toLowerCase()} lúc ${timeCtx.timeStr} này thành điểm số thực tế trên bảng việc ngay nào!`,
        en: `Let’s be real, ${nameEn}: iron discipline isn't built by chance—channel your ${physLabelEn.toLowerCase()} energy at ${timeCtx.timeStr} into real progress on the board right now!`,
      },
      {
        vi: `Khởi động nhịp độ chiến binh thôi ${callName}${streakNoteVi}, hoàn thành dứt khoát "${nextTaskVi}" sẽ giúp ${timeCtx.periodLabel.toLowerCase()} của bạn tràn đầy khí thế!`,
        en: `Time to activate warrior mode, ${nameEn}${streakNoteEn}—knocking out "${nextTaskEn}" decisively will set your ${timeCtx.periodLabelEn.toLowerCase()} on fire!`,
      },
      {
        vi: `Một ${timeCtx.periodLabel.toLowerCase()} tỉnh táo đang chờ ${callName} ghi dấu ấn, hãy giữ vững tâm thế ${mentLabel.toLowerCase()} và chinh phục trọn vẹn lịch trình hôm nay nhé!`,
        en: `A productive ${timeCtx.periodLabelEn.toLowerCase()} awaits your mark, ${nameEn}—keep that ${mentLabelEn.toLowerCase()} mindset and dominate today’s schedule!`,
      },
      {
        vi: `Ủa alo ${callName}, đồng hồ đã điểm ${timeCtx.timeStr} rồi đấy, đừng chỉ ngắm bảng việc nữa mà hãy mở màn cú hích kỷ luật bằng "${nextTaskVi}" ngay đi!`,
        en: `Clock’s ticking at ${timeCtx.timeStr}, ${nameEn}—don’t just stare at the dashboard, ignite your discipline momentum with "${nextTaskEn}" right now!`,
      },
    ];

    if (pct >= 80) {
      greetingCandidates.unshift({
        vi: `Đỉnh cao đấy ${callName}, mới ${timeCtx.timeStr} mà bảng kỷ luật đã cán mốc ${pct}%${streakNoteVi}—giữ vững phong độ hủy diệt này đến cuối ngày nhé!`,
        en: `Outstanding work, ${nameEn}! Reaching ${pct}% by ${timeCtx.timeStr}${streakNoteEn} is elite execution—carry this unstoppable momentum through the rest of the day!`,
      });
    }

    const chosen = pickNonRepeating(greetingCandidates, history);
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

  const isLateNight = timeCtx.hour >= 22;
  const nextStepAdviceVi =
    pendingTasks.length === 0
      ? 'Toàn bộ mục tiêu hôm nay đã hoàn tất mỹ mãn, hãy tận hưởng buổi tối thư giãn xứng đáng nhé!'
      : isLateNight
      ? `Hiện đã là ${timeCtx.timeStr} đêm muộn, hãy khép lại công việc để chuẩn bị ngủ trước 11h nhé!`
      : `Tiếp tục giữ nhịp độ này và xử lý gọn "${nextTaskVi}" trong ${timeCtx.periodLabel.toLowerCase()} nay nào!`;

  const nextStepAdviceEn =
    pendingTasks.length === 0
      ? 'Every single goal for today is complete—enjoy your well-deserved rest tonight!'
      : isLateNight
      ? `It’s already ${timeCtx.timeStr} late at night—wrap up your work and get ready for sleep before 11 PM!`
      : `Keep this momentum rolling and tackle "${nextTaskEn}" next this ${timeCtx.periodLabelEn.toLowerCase()}!`;

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
