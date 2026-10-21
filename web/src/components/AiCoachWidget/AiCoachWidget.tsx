import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { getAiCoachingMessageAPI } from '~/apis/clientAPI/aiCoachApi';
import { UserProfile } from '~/interface/user.interface';

interface AiCoachWidgetProps {
  dateKey: string;
  triggerSignal: string;
  userProfile: UserProfile;
}

export const AiCoachWidget: React.FC<AiCoachWidgetProps> = ({
  dateKey,
  triggerSignal,
  userProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMountRef = useRef(true);
  const lastSignalRef = useRef('');

  // Lưu controller hủy request đang chạy & ID của request mới nhất
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const openWithAutoClose = (seconds = 5) => {
    setIsOpen(true);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, seconds * 1000);
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

  // 1. KHI VÀO DỰ ÁN: Gọi BE lấy câu lời chào + lời nhắc, khi CÓ DỮ LIỆU TRẢ VỀ thì MỚI mở đoạn chat
  useEffect(() => {
    let isCancelled = false;
    setIsAiLoading(true);

    getAiCoachingMessageAPI({
      dateKey,
      mode: 'greeting',
    })
      .then((msg) => {
        if (!isCancelled && msg) {
          setAiMessage(msg);
          setIsAiLoading(false);
          openWithAutoClose(5);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsAiLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  // 2. KHI CÓ THAY ĐỔI (tích việc, lưu ghi chú, đổi trạng thái cá nhân):
  // Nếu có lượt tích mới, HỦY NGAY request cũ đang chờ và thay bằng dữ liệu của lượt tích mới
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      lastSignalRef.current = triggerSignal;
      return;
    }

    if (!triggerSignal || triggerSignal === lastSignalRef.current) {
      return;
    }
    lastSignalRef.current = triggerSignal;

    // 1. Hủy ngay request AI Coach đang chạy dở trước đó
    if (abortControllerRef.current) {
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

    // 5. Debounce 400ms: gom nhóm các lượt tích liên tiếp trong thời gian ngắn
    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const msg = await getAiCoachingMessageAPI(
          {
            dateKey,
            mode: 'feedback',
            changeSignal: triggerSignal,
          },
          controller.signal
        );

        // Chỉ cập nhật nội dung nếu đây vẫn là request mới nhất
        if (requestId === latestRequestIdRef.current && msg) {
          setAiMessage(msg);
          setIsAiLoading(false);
          openWithAutoClose(6);
        }
      } catch (error: any) {
        // Nếu bị hủy bởi lượt tích mới tiếp theo, bỏ qua an toàn
        if (
          axios.isCancel(error) ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        if (requestId === latestRequestIdRef.current) {
          setIsAiLoading(false);
          openWithAutoClose(4);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [triggerSignal, dateKey, userProfile]);

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

    try {
      const msg = await getAiCoachingMessageAPI(
        {
          dateKey,
          mode: 'feedback',
          changeSignal: lastSignalRef.current,
        },
        controller.signal
      );
      if (requestId === latestRequestIdRef.current && msg) {
        setAiMessage(msg);
        setIsAiLoading(false);
        openWithAutoClose(6);
      }
    } catch (error: any) {
      if (
        axios.isCancel(error) ||
        error?.name === 'CanceledError' ||
        error?.name === 'AbortError' ||
        error?.code === 'ERR_CANCELED'
      ) {
        return;
      }
      if (requestId === latestRequestIdRef.current) {
        setIsAiLoading(false);
        openWithAutoClose(3);
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
        aria-label="Lời nhắc AI Coach"
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
              title="Nhận một câu nhận xét khác từ AI"
            >
              <RefreshCw size={11} className={isAiLoading ? 'spin-anim' : ''} />
              <span>Đổi câu</span>
            </button>
            <button
              type="button"
              className="btn-ai-close"
              onClick={handleCloseManually}
              title="Thu gọn bong bóng"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="ai-speech-bubble-body">
          {isAiLoading ? (
            <div className="ai-typing-indicator" aria-label="AI đang phân tích">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-text">AI đang suy nghĩ...</span>
            </div>
          ) : (
            <p className="ai-bubble-message">
              {aiMessage || 'Hãy tích các việc trong ngày để AI đồng hành cùng bạn.'}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`ai-floating-avatar-btn ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggleBubble}
        title={isOpen ? 'Thu gọn bong bóng AI' : 'Mở xem lời nhắc từ AI Coach'}
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

