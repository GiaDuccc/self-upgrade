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

  // 1. KHI VÀO DỰ ÁN: Gọi BE lấy câu lời chào + lời nhắc, hiển thị 5s rồi thu về
  useEffect(() => {
    let isCancelled = false;
    setIsOpen(true);
    setIsAiLoading(true);

    getAiCoachingMessageAPI({
      dateKey,
      mode: 'greeting',
    })
      .then((msg) => {
        if (!isCancelled) {
          setAiMessage(msg);
          setIsAiLoading(false);
          openWithAutoClose(5);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsAiLoading(false);
          openWithAutoClose(4);
        }
      });

    return () => {
      isCancelled = true;
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  // 2. KHI CÓ THAY ĐỔI (tích việc, ghi chú, đổi trạng thái cá nhân): Phóng ra trả lời, sau 5s thu về
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

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsOpen(true);
      setIsAiLoading(true);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);

      try {
        const msg = await getAiCoachingMessageAPI({
          dateKey,
          mode: 'feedback',
        });
        setAiMessage(msg);
        setIsAiLoading(false);
        openWithAutoClose(5);
      } catch {
        setIsAiLoading(false);
        openWithAutoClose(4);
      }
    }, 600);

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
    setIsOpen(true);
    setIsAiLoading(true);

    try {
      const msg = await getAiCoachingMessageAPI({
        dateKey,
        mode: 'feedback',
      });
      setAiMessage(msg);
      setIsAiLoading(false);
      openWithAutoClose(6);
    } catch {
      setIsAiLoading(false);
      openWithAutoClose(4);
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
          {isAiLoading && !aiMessage ? (
            <div className="ai-typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-text">AI đang phân tích...</span>
            </div>
          ) : (
            <p className={`ai-bubble-message ${isAiLoading ? 'is-loading-pulse' : ''}`}>
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

