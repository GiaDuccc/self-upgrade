import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { getAiCoachingMessageAPI } from '~/apis/clientAPI/aiCoachApi';
import { UserProfile } from '~/interface/user.interface';
import { useLanguage } from '~/utils/i18n';

interface AiCoachWidgetProps {
  dateKey: string;
  triggerSignal: string;
  userProfile: UserProfile;
}

const sanitizeAiMessage = (msg: unknown): string => {
  if (!msg) return '';
  if (typeof msg !== 'string') return String(msg);
  const trimmed = msg.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      const extracted =
        obj.message ||
        obj.coach_message ||
        obj.coachMessage ||
        obj.greeting ||
        obj.feedback ||
        obj.text ||
        obj.content ||
        obj.vietnamese ||
        obj.vi ||
        Object.values(obj).find((v) => typeof v === 'string') ||
        '';
      return typeof extracted === 'string' ? extracted.trim() : '';
    } catch {
      return trimmed;
    }
  }
  return trimmed;
};

const VIET_ACCENT_REGEX =
  /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/i;

const isRealEnglish = (text: unknown): boolean => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 5) return false;
  // Loại bỏ phần văn bản trong dấu ngoặc kép hoặc nháy đơn (như tên việc hoặc tên riêng)
  const stripped = trimmed
    .replace(/"[^"]*"/g, '')
    .replace(/“[^”]*”/g, '')
    .replace(/'[^']*'/g, '');
  // Đếm số ký tự có dấu tiếng Việt còn lại
  const matches = stripped.match(
    /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/gi
  );
  // Nếu chỉ có 1-2 ký tự đặc thù hoặc không có, câu tiếng Anh vẫn hợp lệ
  if (matches && matches.length > 2) return false;
  return true;
};

const DEFAULT_EN_GREETINGS = [
  'Welcome back! Use discipline as your launchpad to conquer every goal today!',
  'Keep up that winning spirit and unleash your full potential today!',
  'A great opportunity to push your limits today—let’s get right to work!',
  'Today’s discipline shapes tomorrow’s excellence. Stay focused and consistent!',
];

const DEFAULT_EN_FEEDBACKS = [
  'Solid execution! Every completed task builds relentless momentum towards your daily goals.',
  'Great discipline on this task! Keep your focus sharp and conquer the rest of your day.',
  'Excellent consistency! Turn this victory into momentum for your upcoming objectives.',
  'Well done staying accountable! Keep pushing your limits with high standards today.',
];

const normalizeMessagePair = (
  rawVi?: string,
  rawEn?: string,
  isFeedback = false
): { vi: string; en: string } => {
  let vi = sanitizeAiMessage(rawVi);
  let en = sanitizeAiMessage(rawEn);

  const fallbackEn = () => {
    if (isFeedback) {
      return DEFAULT_EN_FEEDBACKS[Math.floor(Math.random() * DEFAULT_EN_FEEDBACKS.length)];
    }
    return DEFAULT_EN_GREETINGS[Math.floor(Math.random() * DEFAULT_EN_GREETINGS.length)];
  };

  if (!vi && !en) {
    vi = '⚠️ Hết thời gian chờ phản hồi từ AI (Timeout 6s). Máy chủ đang phản hồi chậm, vui lòng thử lại!';
    en = '⚠️ AI response timed out (6s). Server is responding slowly, please try again!';
  } else if (!vi && en) {
    vi = en;
  } else if (vi && !en) {
    en = vi.startsWith('⚠️')
      ? '⚠️ AI response timed out (6s). Server is responding slowly, please try again!'
      : fallbackEn();
  }

  // Nếu 'en' bị rỗng hoặc là tiếng Việt hoặc giống hệt 'vi', thay bằng câu tiếng Anh chuẩn theo ngữ cảnh
  if (en && (!isRealEnglish(en) || en === vi)) {
    en = fallbackEn();
  }

  return { vi, en };
};

export const AiCoachWidget: React.FC<AiCoachWidgetProps> = ({
  dateKey,
  triggerSignal,
  userProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ vi: string; en: string }>({ vi: '', en: '' });
  const { isEn } = useLanguage();

  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignalRef = useRef('');
  const dateKeyRef = useRef(dateKey);
  dateKeyRef.current = dateKey;

  // Lưu controller hủy request đang chạy & ID của request mới nhất
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const openWithAutoClose = (seconds = 6) => {
    setIsOpen(true);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, seconds * 1000);
  };

  const resolveErrorBubbleMessage = (error: any): string => {
    const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
    if (serverMsg) return String(serverMsg);
    if (
      error?.code === 'ECONNABORTED' ||
      error?.message?.toLowerCase().includes('timeout')
    ) {
      return '⚠️ Hết thời gian chờ phản hồi từ AI (Timeout 6s). Máy chủ đang phản hồi chậm, vui lòng thử lại!';
    }
    return `⚠️ Lỗi phản hồi từ AI (${error?.message || 'Không thể kết nối máy chủ'}). Vui lòng thử lại!`;
  };

  // Hủy mọi request & timer khi unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // 1. KHI VÀO DỰ ÁN: Gọi BE lấy câu lời chào + lời nhắc, khi CÓ DỮ LIỆU TRẢ VỀ (hoặc lỗi timeout) thì mở đoạn chat
  useEffect(() => {
    const cacheKey = `ai_coach_greeting_${dateKeyRef.current}`;
    const cachedGreeting = sessionStorage.getItem(cacheKey);

    // Nếu trong phiên làm việc đã có lời chào của ngày này, tái sử dụng ngay lập tức (không gọi lại API)
    if (cachedGreeting) {
      try {
        const parsed = JSON.parse(cachedGreeting);
        if (parsed.vi || parsed.en) {
          // Nếu đang ở chế độ tiếng Anh nhưng cache cũ không có tiếng Anh hợp lệ -> xóa cache để gọi lại API
          if (isEn && (!isRealEnglish(parsed.en) || parsed.en === parsed.vi)) {
            sessionStorage.removeItem(cacheKey);
          } else {
            const normalized = normalizeMessagePair(parsed.vi, parsed.en);
            setAiMessages(normalized);
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
            } catch {}
            setIsAiLoading(false);
            openWithAutoClose(5);
            return;
          }
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++latestRequestIdRef.current;

    setIsAiLoading(true);
    console.log(`🤖 [AI Coach FE] Đang gửi request lấy lời chào khởi đầu (#${requestId})...`);

    const now = new Date();
    getAiCoachingMessageAPI(
      {
        dateKey: dateKeyRef.current,
        mode: 'greeting',
        language: isEn ? 'en' : 'vi',
        clientHour: now.getHours(),
        clientMinute: now.getMinutes(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
      },
      controller.signal
    )
      .then((res) => {
        if (requestId !== latestRequestIdRef.current || controller.signal.aborted) {
          return;
        }
        const newMessages = normalizeMessagePair(res.message, res.messageEn);
        console.log(`✅ [AI Coach FE] Nhận phản hồi khởi đầu (#${requestId}):`, newMessages);
        setAiMessages(newMessages);
        setIsAiLoading(false);
        openWithAutoClose(6);

        // Lưu vào cache nếu phản hồi hợp lệ (không phải câu thông báo lỗi)
        if (newMessages.vi && !newMessages.vi.startsWith('⚠️')) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(newMessages));
          } catch {}
        }
      })
      .catch((error: any) => {
        if (
          controller.signal.aborted ||
          axios.isCancel(error) ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        if (requestId === latestRequestIdRef.current) {
          const errMsg = resolveErrorBubbleMessage(error);
          console.warn(`⚠️ [AI Coach FE] Lỗi lấy lời chào ban đầu (#${requestId}):`, errMsg);
          setAiMessages({ vi: errMsg, en: errMsg });
          setIsAiLoading(false);
          openWithAutoClose(6);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  // 2. KHI CÓ THAY ĐỔI (tích việc, lưu ghi chú, đổi trạng thái cá nhân):
  // Nếu có lượt tích mới, HỦY NGAY request cũ đang chờ và thay bằng dữ liệu của lượt tích mới
  useEffect(() => {
    if (!triggerSignal || triggerSignal === lastSignalRef.current || triggerSignal.startsWith('WORKOUT_')) {
      return;
    }

    // 1. Hủy ngay request AI Coach đang chạy dở trước đó
    if (abortControllerRef.current) {
      console.log('⚡ [AI Coach FE] Hủy request AI đang chạy do có lượt thao tác mới!');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Hủy timer debounce trước đó
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 3. Tăng id phiên request để phân biệt và chỉ nhận kết quả của lượt tích mới nhất
    const requestId = ++latestRequestIdRef.current;

    // 4. Mở ô chat ra ngay lập tức và bật hiệu ứng 3 chấm đang gõ
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    setIsOpen(true);
    setIsAiLoading(true);

    // 5. Debounce 800ms: gom nhóm toàn bộ các lượt tích liên tiếp trong thời gian thao tác
    debounceTimerRef.current = setTimeout(async () => {
      lastSignalRef.current = triggerSignal;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      console.log(`🤖 [AI Coach FE] Gửi request phân tích (#${requestId}) | Signal: "${triggerSignal}"`);

      try {
        const now = new Date();
        const res = await getAiCoachingMessageAPI(
          {
            dateKey: dateKeyRef.current,
            mode: 'feedback',
            changeSignal: triggerSignal,
            language: isEn ? 'en' : 'vi',
            clientHour: now.getHours(),
            clientMinute: now.getMinutes(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
          },
          controller.signal
        );

        // Chỉ cập nhật nội dung nếu đây vẫn là request mới nhất
        if (requestId === latestRequestIdRef.current && !controller.signal.aborted) {
          const newMessages = normalizeMessagePair(res.message, res.messageEn, true);
          console.log(`✅ [AI Coach FE] Nhận phản hồi (#${requestId}):`, newMessages);
          setAiMessages(newMessages);
          setIsAiLoading(false);
          openWithAutoClose(6);
        }
      } catch (error: any) {
        // Nếu bị hủy bởi lượt tích mới tiếp theo, bỏ qua an toàn
        if (
          controller.signal.aborted ||
          axios.isCancel(error) ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          console.log(`🛑 [AI Coach FE] Request #${requestId} đã bị hủy bởi lượt thao tác mới.`);
          return;
        }
        const errMsg = resolveErrorBubbleMessage(error);
        console.error(`❌ [AI Coach FE] Lỗi request #${requestId}:`, errMsg);
        if (requestId === latestRequestIdRef.current) {
          setAiMessages({ vi: errMsg, en: errMsg });
          setIsAiLoading(false);
          openWithAutoClose(6);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }, 800);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [triggerSignal]);

  const handleToggleBubble = () => {
    if (isOpen) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      setIsOpen(false);
    } else {
      openWithAutoClose(7);
    }
  };

  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);

    const requestId = ++latestRequestIdRef.current;
    setIsOpen(true);
    setIsAiLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    console.log(`🔄 [AI Coach FE] Làm mới thủ công (#${requestId})...`);

    try {
      const res = await getAiCoachingMessageAPI(
        {
          dateKey: dateKeyRef.current,
          mode: 'feedback',
          changeSignal: lastSignalRef.current,
          language: isEn ? 'en' : 'vi',
        },
        controller.signal
      );
      if (requestId === latestRequestIdRef.current && !controller.signal.aborted) {
        const newMessages = normalizeMessagePair(res.message, res.messageEn);
        console.log(`✅ [AI Coach FE] Nhận phản hồi làm mới (#${requestId}):`, newMessages);
        setAiMessages(newMessages);
        setIsAiLoading(false);
        openWithAutoClose(6);

        if (newMessages.vi && !newMessages.vi.startsWith('⚠️')) {
          try {
            sessionStorage.setItem(`ai_coach_greeting_${dateKeyRef.current}`, JSON.stringify(newMessages));
          } catch {}
        }
      }
    } catch (error: any) {
      if (
        controller.signal.aborted ||
        axios.isCancel(error) ||
        error?.name === 'CanceledError' ||
        error?.name === 'AbortError' ||
        error?.code === 'ERR_CANCELED'
      ) {
        console.log(`🛑 [AI Coach FE] Request làm mới #${requestId} đã bị hủy.`);
        return;
      }
      const errMsg = resolveErrorBubbleMessage(error);
      console.error(`❌ [AI Coach FE] Lỗi làm mới #${requestId}:`, errMsg);
      if (requestId === latestRequestIdRef.current) {
        setAiMessages({ vi: errMsg, en: errMsg });
        setIsAiLoading(false);
        openWithAutoClose(6);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleCloseManually = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setIsOpen(false);
  };

  return (
    <div className="ai-floating-coach" id="ai-floating-coach">
      <div
        className={`ai-floating-bubble ${isOpen ? 'is-open' : 'is-closed'}`}
        role="dialog"
        aria-label={isEn ? 'AI Coach Reminder' : 'Lời nhắc AI Coach'}
      >
        <div className="ai-speech-bubble-header">
          <div className="ai-speech-badge">
            <Sparkles size={13} />
            <span>AI COACH</span>
          </div>

          <div className="ai-bubble-actions">
            <button
              type="button"
              className="btn-ai-reload"
              onClick={handleManualRefresh}
              disabled={isAiLoading}
              title={
                isEn
                  ? 'Get another feedback from AI'
                  : 'Nhận một câu nhận xét khác từ AI'
              }
            >
              <RefreshCw size={11} className={isAiLoading ? 'spin-anim' : ''} />
              <span>{isEn ? 'Refresh' : 'Đổi câu'}</span>
            </button>
            <button
              type="button"
              className="btn-ai-close"
              onClick={handleCloseManually}
              title={isEn ? 'Collapse bubble' : 'Thu gọn bong bóng'}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="ai-speech-bubble-body">
          {isAiLoading ? (
            <div
              className="ai-typing-indicator"
              aria-label={isEn ? 'AI is analyzing' : 'AI đang phân tích'}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-text">
                {isEn ? 'AI is thinking...' : 'AI đang suy nghĩ...'}
              </span>
            </div>
          ) : (
            <p className="ai-bubble-message">
              {sanitizeAiMessage(
                isEn
                  ? (isRealEnglish(aiMessages.en) ? aiMessages.en : normalizeMessagePair(aiMessages.vi, aiMessages.en).en)
                  : (aiMessages.vi || aiMessages.en)
              ) ||
                (isEn
                  ? 'Check off your daily tasks to let AI coach you.'
                  : 'Hãy tích các việc trong ngày để AI đồng hành cùng bạn.')}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`ai-floating-avatar-btn ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggleBubble}
        title={
          isOpen
            ? isEn
              ? 'Collapse AI bubble'
              : 'Thu gọn bong bóng AI'
            : isEn
            ? 'Open AI Coach reminder'
            : 'Mở xem lời nhắc từ AI Coach'
        }
        aria-label="AI Coach Avatar"
      >
        <img
          src="/logo.png"
          alt="Self Upgrade Logo"
          className="ai-floating-avatar-img"
        />
        {isAiLoading && <span className="ai-avatar-glow-ring" />}
      </button>
    </div>
  );
};

