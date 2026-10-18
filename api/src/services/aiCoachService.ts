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

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
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

const getCoachingMessage = async (
  userId: string,
  payload: { dateKey?: string; mode?: 'greeting' | 'feedback' }
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
    promptContext = `
Bạn là AI Coach cá nhân hóa của ứng dụng rèn luyện kỷ luật "Self Upgrade".
Người dùng vừa có thay đổi (tích việc, đổi mức độ, hoặc viết nhật ký ghi chú).
Hãy quan sát toàn bộ dữ liệu hiện tại và đưa ra DUY NHẤT 1 CÂU nhận xét ngẫu nhiên, trực diện, sắc sảo, khen nếu tốt hoặc chê nhẹ kèm việc cần dứt điểm tiếp theo.

THÔNG TIN NGƯỜI DÙNG:
- Tên/Biệt danh: ${callName}
${userProfile.age ? `- Tuổi: ${userProfile.age}` : ''}
${userProfile.weightKg ? `- Thể trạng: Nặng ${userProfile.weightKg}kg, Cao ${userProfile.heightCm}cm (${bmiStr})` : ''}
- Trạng thái: Thể chất "${physObj.label}", Tinh thần "${mentObj.label}", Cảm xúc "${emoObj.label}"
- Mục tiêu trọng tâm: ${goalObj.label}
- Phong cách huấn luyện: ${coachingStyle.label}

DỮ LIỆU BẢNG VIỆC NGÀY ${targetDateKey}:
- Tiến độ: ${dayStats.percentage || 0}% (${dayStats.rawPoints || 0}/${dayStats.maxPoints || 120} điểm)
- Việc ĐÃ LÀM (${completedTasks.length} việc): ${completedTasks.length > 0 ? completedTasks.join(', ') : 'Chưa tích việc nào'}
- Việc CHƯA LÀM (${pendingTasks.length} việc): ${pendingTasks.length > 0 ? pendingTasks.slice(0, 5).join(', ') : 'Đã hoàn thành toàn bộ mục tiêu'}
${noteText ? `- Ghi chú vừa viết: "${noteText}"` : ''}

PHONG CÁCH DIỄN ĐẠT LẦN NÀY: "${randomVibe}"
GỢI Ý MỞ CÂU: "${randomOpener}"
RANDOM SEED: ${randomSeed}

${historyPromptBlock}

QUY TẮC BẮT BUỘC:
1. ĐÚNG 1 CÂU DUY NHẤT (khoảng 18–35 từ), sinh động, bất ngờ, có chất riêng, KHÔNG DÙNG VĂN MẪU.
2. TUYỆT ĐỐI KHÔNG mở đầu một màu rập khuôn. Hãy thay đổi linh hoạt cách mở câu (dùng thán từ, đặt tên ${callName} ở giữa hoặc cuối câu, hoặc vào thẳng phân tích).
3. Nhắc trực tiếp vào việc đã làm / chưa làm hoặc nội dung ghi chú. Nếu điểm còn thấp (<45%) hoặc có việc "Tệ", hãy thẳng thắn chê nhẹ và thúc giục việc cần làm ngay.
4. Tuyệt đối KHÔNG viết tiêu đề, KHÔNG xuống dòng, KHÔNG gạch đầu dòng, KHÔNG thêm dấu ngoặc kép bao bọc.
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
  }

  const updatedHistory = [message, ...recentHistory].slice(0, MAX_HISTORY_TRACKED);
  userRecentMessagesMap.set(userId, updatedHistory);

  return { message };
};

export const aiCoachService = {
  getCoachingMessage,
};
