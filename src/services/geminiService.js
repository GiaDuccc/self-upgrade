/**
 * Dịch vụ AI Coach sử dụng Google Gemini API
 */
import { PERSONALIZATION_OPTIONS } from '../config/settings';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash';

// Cache cục bộ lưu tạm trong phiên để tránh gọi lặp lại cùng một trạng thái
const localCache = new Map();

/**
 * Tạo prompt và gửi yêu cầu đến Gemini API để nhận 1 câu nhận xét duy nhất
 */
export async function getAiCoachingMessage({
  userProfile = {},
  selectedDayItem = {},
  dayRecord = {},
  tasksList = [],
}) {
  const tasksMap = dayRecord?.tasks || {};
  const noteText = (dayRecord?.note || '').trim();

  // 1. Phân loại việc đã làm và việc chưa làm
  const completedTasks = [];
  const pendingTasks = [];

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

  // 2. Tìm chi tiết trạng thái cá nhân
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

  // Tính BMI nếu có
  const weight = parseFloat(userProfile.weightKg);
  const height = parseFloat(userProfile.heightCm);
  const bmiStr =
    weight > 25 && height > 100
      ? `BMI ~${Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10}`
      : '';

  // 3. Tạo cache key dựa trên toàn bộ trạng thái hiện tại
  const cacheKey = [
    selectedDayItem?.dateKey || '',
    selectedDayItem?.percentage || 0,
    completedTasks.join(','),
    pendingTasks.length,
    userProfile.physicalState,
    userProfile.mentalState,
    userProfile.emotionalState,
    noteText,
  ].join('|');

  if (localCache.has(cacheKey)) {
    return localCache.get(cacheKey);
  }

  // Nếu không có API Key, dùng bộ sinh câu thông minh cục bộ
  if (!API_KEY) {
    const fallbackMsg = generateLocalCoachingFallback({
      userProfile,
      selectedDayItem,
      completedTasks,
      pendingTasks,
      noteText,
      physObj,
      mentObj,
      emoObj,
    });
    return fallbackMsg;
  }

  // 4. Xây dựng prompt chi tiết cho Gemini
  const callName = userProfile.name?.trim() ? userProfile.name.trim() : 'bạn';
  const promptContext = `
Bạn là AI Coach cá nhân hóa của ứng dụng rèn luyện kỷ luật "Self Upgrade".
Hãy quan sát toàn bộ dữ liệu ngày hôm nay của người dùng và đưa ra DUY NHẤT 1 CÂU ngắn gọn nhận xét, động viên, chê nhẹ (nếu lười/buông thả) và gợi ý việc cần làm tiếp theo.

THÔNG TIN NGƯỜI DÙNG:
- Tên/Biệt danh: ${callName}
${userProfile.age ? `- Tuổi: ${userProfile.age}` : ''}
${userProfile.weightKg ? `- Thể trạng: Nặng ${userProfile.weightKg}kg, Cao ${userProfile.heightCm}cm (${bmiStr})` : ''}
${userProfile.sleepTargetHours ? `- Mục tiêu giấc ngủ: ${userProfile.sleepTargetHours}h/ngày` : ''}
${userProfile.personalMotto ? `- Châm ngôn sống: "${userProfile.personalMotto}"` : ''}
- Trạng thái hiện tại: Thể chất "${physObj.label}", Tinh thần "${mentObj.label}", Cảm xúc "${emoObj.label}"
- Mục tiêu trọng tâm: ${goalObj.label}
- Phong cách huấn luyện ưa thích: ${coachingStyle.label}

DỮ LIỆU NGÀY HÔM NAY:
- Điểm đạt được: ${selectedDayItem?.percentage || 0}% (${selectedDayItem?.rawPoints || 0}/${selectedDayItem?.maxPoints || 120} điểm)
- Xếp hạng ngày: ${selectedDayItem?.rank?.title || 'Chưa ghi nhận'}
- Việc ĐÃ LÀM (${completedTasks.length} việc): ${completedTasks.length > 0 ? completedTasks.join(', ') : 'Chưa làm việc nào'}
- Việc CHƯA LÀM (${pendingTasks.length} việc): ${pendingTasks.length > 0 ? pendingTasks.slice(0, 5).join(', ') : 'Đã hoàn thành tất cả'}
${noteText ? `- Ghi chú/Nhật ký người dùng viết hôm nay: "${noteText}"` : '- Người dùng chưa viết ghi chú gì.'}

QUY TẮC BẮT BUỘC:
1. Đưa ra ĐÚNG 1 CÂU DUY NHẤT (tối đa 25-35 từ), trực tiếp, sắc bén, có tâm.
2. Xưng hô tự nhiên, gọi tên ${callName}.
3. Nếu điểm thấp (<45%) hoặc có việc "Tệ": Hãy phê bình thẳng thắn hoặc nhắc nhở nhẹ kèm việc cần làm gấp. Nếu làm tốt (>=70%): Hãy khen ngợi và động viên giữ vững phong độ.
4. Tận dụng thông tin thể chất, tinh thần, ghi chú hoặc tên việc cụ thể để câu nói mang tính cá nhân hoá sâu sắc.
5. Tuyệt đối KHÔNG chào hỏi (như "Chào Minh", "Xin chào"), KHÔNG thêm dấu ngoặc kép bọc ngoài, KHÔNG xuống dòng hay gạch đầu dòng.
`.trim();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptContext }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 120,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    let text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Làm sạch chuỗi: bỏ ngoặc kép thừa ở 2 đầu, giữ lại 1 câu duy nhất
    text = text.replace(/^["'“]+|["'”]+$/g, '').trim();
    if (text.includes('\n')) {
      text = text.split('\n')[0].trim();
    }

    if (text) {
      localCache.set(cacheKey, text);
      return text;
    }
  } catch (err) {
    console.warn('Gemini API call failed, using intelligent fallback:', err);
  }

  // Fallback nếu API gặp lỗi
  const fallback = generateLocalCoachingFallback({
    userProfile,
    selectedDayItem,
    completedTasks,
    pendingTasks,
    noteText,
    physObj,
    mentObj,
    emoObj,
  });
  localCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Thuật toán sinh câu huấn luyện dự phòng khi offline hoặc chưa cấu hình API
 */
function generateLocalCoachingFallback({
  userProfile,
  selectedDayItem,
  completedTasks,
  pendingTasks,
  noteText,
  physObj,
  mentObj,
}) {
  const callName = userProfile.name?.trim() ? userProfile.name.trim() : 'bạn';
  const pct = selectedDayItem?.percentage || 0;

  if (completedTasks.length === 0) {
    if (userProfile.physicalState === 'TIRED' || userProfile.physicalState === 'EXHAUSTED') {
      return `Dù cơ thể đang ${physObj.label.toLowerCase()}, ${callName} hãy bắt đầu ngay bằng 1 việc nhẹ nhàng nhất thay vì để cả ngày trôi qua vô ích nhé!`;
    }
    return `Đã có kế hoạch nhưng chưa bắt tay vào việc nào đâu ${callName}, hãy mở màn ngay bằng một thói quen mức Hoàn Hảo đi!`;
  }

  if (pct < 40) {
    const suggest = pendingTasks[0] || 'mục tiêu tiếp theo';
    return `Mới đạt ${pct}% là còn hơi lơ là đấy ${callName}, hãy xốc lại tinh thần và dứt điểm ngay việc "${suggest}" trước khi kết thúc ngày!`;
  }

  if (pct < 70) {
    return `Đang có nhịp độ khá ổn ở mức ${pct}%, ${callName} cố gắng đẩy thêm 1-2 việc lên Hoàn Hảo để ngày hôm nay thực sự bứt phá!`;
  }

  if (pct >= 90) {
    return `Kỷ luật thép tuyệt vời với ${pct}% điểm hôm nay, ${callName} nhớ nghỉ ngơi đúng giờ để bảo toàn năng lượng cho ngày mai nhé!`;
  }

  return `Một ngày tiến bộ rõ rệt với ${pct}% hoàn thành, hãy giữ vững đà tự nâng cấp bản thân này nhé ${callName}!`;
}

