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

import { CaloriesSummary, FoodItem, UserProfile } from '~/types';

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

function generateDiverseFallback({
  mode,
  callName,
  percentage,
  completedTasks,
  pendingTasks,
  physLabel,
  mentLabel,
  recentHistory,
}: {
  mode: string;
  callName: string;
  percentage: number;
  completedTasks: string[];
  pendingTasks: string[];
  physLabel: string;
  mentLabel: string;
  recentHistory: string[];
}): string {
  const pct = percentage || 0;
  const targetTask = pendingTasks[0] || 'mục tiêu kế tiếp';
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

  if (completedTasks.length === 0) {
    const zeroPool = [
      `Ủa alo ${callName}, mở app nhìn đồng hồ mà chưa dứt điểm việc nào là định để cả ngày trôi qua vô ích sao?`,
      `Kế hoạch nằm sẵn trên giấy rồi đấy ${callName}, đứng dậy hoàn thành ngay "${targetTask}" để lấy đà đi chứ!`,
      `Này ${callName}, sự trì hoãn đang thắng 1-0 đấy, lập tức mở màn bằng một thói quen Hoàn Hảo để lật ngược tình thế đi!`,
      `Chờ đợi động lực là cái bẫy đấy ${callName}, bắt tay vào làm ngay việc nhẹ nhất thay vì ngắm bảng việc!`,
    ];
    return pickRandom(zeroPool);
  }

  if (pct < 40) {
    const lowPool = [
      `Mới được ${pct}% thôi sao hả ${callName}, tốc độ này còn quá chậm, dẹp ngay mạng xã hội và dứt điểm việc "${targetTask}" đi!`,
      `Nhìn con số ${pct}% đi ${callName}, nếu không tăng tốc thì cuối ngày lại ngồi tiếc nuối đấy, hành động ngay!`,
      `Tích được ${recentDone} là tốt rồi nhưng ${pct}% vẫn là vùng báo động đỏ đấy nhé ${callName}, xốc lại tinh thần dứt điểm nốt việc!`,
      `Thẳng thắn nhé ${callName}: ${pct}% là chưa đạt tiêu chuẩn tự nâng cấp đâu, đừng dễ dãi với bản thân nữa!`,
    ];
    return pickRandom(lowPool);
  }

  if (pct < 70) {
    const midPool = [
      `Khá lắm ${callName}, đã đi được hơn nửa chặng đường ở mức ${pct}%, đẩy thêm 1-2 việc lên Hoàn Hảo là ngày hôm nay cực kỳ mỹ mãn!`,
      `Đang có đà quán tính rất tốt với ${pct}%, ${callName} đừng buông lỏng mà hãy xử lý dứt điểm luôn "${targetTask}" nhé!`,
      `Nhịp điệu kỷ luật hôm nay của ${callName} bén đấy, giữ vững phong độ này để chạm mốc xuất sắc trước khi trời tối!`,
      `Điểm số ${pct}% chứng minh nỗ lực có thật, cố thêm một chút nữa thôi là bạn bỏ xa sự lười biếng ngày hôm qua rồi ${callName}!`,
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
  tasksList: Array<{ id: string; title: string }>,
  stateLabels: { phys: string; ment: string; emo: string }
): { detail: string; short: string } | null {
  if (!signal) return null;
  const parts = signal.split('|');

  if (parts[0] === 'PROFILE') {
    return {
      detail: `Người dùng vừa cập nhật trạng thái cá nhân: Thể chất "${stateLabels.phys}", Tinh thần "${stateLabels.ment}", Cảm xúc "${stateLabels.emo}".`,
      short: `Vừa cập nhật trạng thái (thể chất ${stateLabels.phys.toLowerCase()}),`,
    };
  }

  if (parts.length < 3) return null;
  const kind = parts[1];

  if (kind === 'ALL') {
    const lvl = LEVEL_LABELS[parts[2]] || parts[2];
    return {
      detail: `Người dùng vừa bấm tích nhanh TẤT CẢ ${tasksList.length} việc ở mức "${lvl}" cùng lúc.`,
      short: `Tích nhanh tất cả ở mức ${lvl} luôn à,`,
    };
  }

  if (kind === 'CLEAR') {
    return {
      detail: 'Người dùng vừa bấm "Đặt lại ngày" — xóa toàn bộ tích chọn của ngày này.',
      short: 'Vừa xóa sạch bảng việc để làm lại từ đầu,',
    };
  }

  if (kind === 'NOTE') {
    const noteText = parts.slice(2, -1).join('|').trim();
    return {
      detail: noteText
        ? `Người dùng vừa lưu ghi chú tự kiểm điểm: "${noteText.slice(0, 400)}".`
        : 'Người dùng vừa xóa trống ghi chú của ngày.',
      short: 'Đọc ghi chú vừa viết rồi nhé,',
    };
  }

  // Tích / đổi mức một việc cụ thể
  const task = tasksList.find((t) => t.id === kind);
  const levelKey = parts[2];
  const lvl = LEVEL_LABELS[levelKey] || levelKey;
  const title = task?.title || 'một đầu việc';
  if (levelKey === 'NONE') {
    return {
      detail: `Người dùng vừa BỎ TÍCH việc "${title}" (chuyển về trạng thái chưa làm).`,
      short: `Vừa bỏ tích "${title}" à,`,
    };
  }
  return {
    detail: `Người dùng vừa tích việc "${title}" ở mức "${lvl}".`,
    short: `Vừa tích "${title}" mức ${lvl},`,
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
  const targetDateKey = payload.dateKey || getTodayInfo().dateKey;

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

  tasksList.forEach((t) => {
    const lvl = tasksMap[t.id];
    if (lvl && lvl !== 'NONE') {
      const lvlText =
        lvl === 'PERFECT' ? 'Hoàn Hảo' : lvl === 'GOOD' ? 'Tốt' : 'Tệ';
      completedTasks.push(`${t.title} (${lvlText})`);
    } else {
      pendingTasks.push(t.title);
    }
  });

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
      ? describeRecentChange(payload.changeSignal, tasksList, {
          phys: physObj.label,
          ment: mentObj.label,
          emo: emoObj.label,
        })
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
Người dùng vừa mở/truy cập vào ứng dụng.
Hãy quan sát hồ sơ cá nhân và đưa ra DUY NHẤT 1 CÂU gồm: lời chào ngẫu nhiên + lời nhắc nhở tinh thần/kỷ luật cho ngày hôm nay.

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
      : 'THAY ĐỔI GẦN NHẤT: Không xác định (người dùng bấm xem lại nhận xét) — hãy nhận xét việc vừa hoàn thành gần nhất trong danh sách ĐÃ LÀM.';

    promptContext = `
Bạn là AI Coach cá nhân hóa của ứng dụng rèn luyện kỷ luật "Self Upgrade".
Người dùng vừa có một thay đổi trên bảng việc. Nhiệm vụ: phản hồi NGAY vào thay đổi gần nhất trước, sau đó mới nhận xét tổng quan tiến độ cả ngày.

${recentChangeBlock}

THÔNG TIN NGƯỜI DÙNG:
- Tên/Biệt danh: ${callName}
${userProfile.age ? `- Tuổi: ${userProfile.age}` : ''}
${userProfile.weightKg ? `- Thể trạng: Nặng ${userProfile.weightKg}kg, Cao ${userProfile.heightCm}cm (${bmiStr})` : ''}
- Trạng thái: Thể chất "${physObj.label}", Tinh thần "${mentObj.label}", Cảm xúc "${emoObj.label}"
- Mục tiêu trọng tâm: ${goalObj.label}
- Phong cách huấn luyện: ${coachingStyle.label}

TỔNG QUAN BẢNG VIỆC NGÀY ${targetDateKey} (SAU THAY ĐỔI):
- Tiến độ: ${dayStats.percentage || 0}% (${dayStats.rawPoints || 0}/${dayStats.maxPoints || 120} điểm)
- Việc ĐÃ LÀM (${completedTasks.length} việc): ${completedTasks.length > 0 ? completedTasks.join(', ') : 'Chưa tích việc nào'}
- Việc CHƯA LÀM (${pendingTasks.length} việc): ${pendingTasks.length > 0 ? pendingTasks.slice(0, 5).join(', ') : 'Đã hoàn thành toàn bộ mục tiêu'}
${noteText ? `- Ghi chú trong ngày: "${noteText}"` : ''}

PHONG CÁCH DIỄN ĐẠT LẦN NÀY: "${randomVibe}"
RANDOM SEED: ${randomSeed}

${historyPromptBlock}

QUY TẮC BẮT BUỘC:
1. Viết ĐÚNG 2 CÂU ngắn liền nhau (tổng khoảng 25–45 từ), sinh động, có chất riêng, KHÔNG DÙNG VĂN MẪU.
2. CÂU 1: Phản hồi TRỰC TIẾP vào THAY ĐỔI GẦN NHẤT — gọi đúng tên việc vừa tích/bỏ tích và mức độ (hoặc nội dung ghi chú / hành động vừa làm). Khen nếu là mức Hoàn Hảo/Tốt, chê thẳng nếu mức Tệ hoặc vừa bỏ tích, phản hồi đúng nội dung nếu là ghi chú.
3. CÂU 2: Nối sang TỔNG QUAN cả ngày — nhắc tiến độ % hiện tại và chỉ ra 1 việc CHƯA LÀM cần dứt điểm tiếp theo (nếu đã xong hết thì khen tổng kết).
4. Đa dạng cách mở câu (thán từ, đặt tên ${callName} ở giữa/cuối câu...), không rập khuôn.
5. Tuyệt đối KHÔNG viết tiêu đề, KHÔNG xuống dòng, KHÔNG gạch đầu dòng, KHÔNG thêm dấu ngoặc kép bao bọc.
`.trim();
  }

  let message = await callGeminiCascade(promptContext);

  if (!message) {
    message = generateDiverseFallback({
      mode,
      callName,
      percentage: dayStats.percentage,
      completedTasks,
      pendingTasks,
      physLabel: physObj.label,
      mentLabel: mentObj.label,
      recentHistory,
    });
    // Fallback: vẫn ưu tiên nhắc tới thay đổi gần nhất trước
    if (mode === 'feedback' && recentChange) {
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
