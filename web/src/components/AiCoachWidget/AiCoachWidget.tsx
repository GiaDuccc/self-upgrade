import React, { useState, useEffect, useRef } from 'react';
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

  const openWithAutoClose = (seconds = 5) => {
    setIsOpen(true);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, seconds * 1000);
  };

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
          // Chỉ khi dữ liệu API trả về thì mới hiện đoạn chat
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
  // Mở ngay ô chat ra ngoài với hiệu ứng 3 chấm đang chat (chưa có nội dung), khi API trả về thì hiện nội dung
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

    // Ngay khi có thay đổi: Mở ô chat ra ngay lập tức và bật hiệu ứng 3 chấm đang gõ
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    setIsOpen(true);
    setIsAiLoading(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const msg = await getAiCoachingMessageAPI({
          dateKey,
          mode: 'feedback',
          changeSignal: triggerSignal,
        });
        if (msg) {
          setAiMessage(msg);
          setIsAiLoading(false);
          // Sau khi nội dung về thì hiện ra và đếm lùi 6 giây tự thu về
          openWithAutoClose(6);
        } else {
          setIsAiLoading(false);
          openWithAutoClose(4);
        }
      } catch {
        setIsAiLoading(false);
        openWithAutoClose(4);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
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
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    // Mở ngay ô chat và hiện 3 chấm đang gõ
    setIsOpen(true);
    setIsAiLoading(true);

    try {
      const msg = await getAiCoachingMessageAPI({
        dateKey,
        mode: 'feedback',
        changeSignal: lastSignalRef.current,
      });
      if (msg) {
        setAiMessage(msg);
        setIsAiLoading(false);
        openWithAutoClose(6);
      } else {
        setIsAiLoading(false);
        openWithAutoClose(3);
      }
    } catch {
      setIsAiLoading(false);
      openWithAutoClose(3);
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

