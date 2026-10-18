import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { getAiCoachingMessage } from '../services/geminiService';

export function AiCoachWidget({
  userProfile = {},
  selectedDayItem = {},
  dayRecord = {},
  tasksList = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  const autoCloseTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const lastStateHashRef = useRef('');

  // Hàm mở bong bóng và tự động thu về sau số giây quy định
  const openWithAutoClose = (seconds = 5) => {
    setIsOpen(true);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, seconds * 1000);
  };

  // 1. KHI VÀO DỰ ÁN: Phân tích profile & đưa ra 1 câu lời chào + lời nhắc, sau đó thu về
  useEffect(() => {
    let isCancelled = false;
    setIsOpen(true);
    setIsAiLoading(true);

    getAiCoachingMessage({
      userProfile,
      selectedDayItem,
      dayRecord,
      tasksList,
      mode: 'greeting',
    })
      .then((msg) => {
        if (!isCancelled) {
          setAiMessage(msg);
          setIsAiLoading(false);
          // Giữ câu chào mở 5 giây rồi tự thu về
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
  }, []); // Chỉ kích hoạt 1 lần khi mở/truy cập vào dự án

  // 2. KHI CÓ THAY ĐỔI: Tích việc, đổi mức độ, viết ghi chú, cập nhật trạng thái
  // Phóng ra trả lời, sau 5s thì thu về
  useEffect(() => {
    // Bỏ qua lần mount đầu tiên vì đã có greeting ở trên
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const initialTasksMap = JSON.stringify(dayRecord?.tasks || {});
      const initialNote = (dayRecord?.note || '').trim();
      lastStateHashRef.current = `${selectedDayItem?.dateKey}|${initialTasksMap}|${initialNote}|${selectedDayItem?.percentage}`;
      return;
    }

    const currentTasksMap = JSON.stringify(dayRecord?.tasks || {});
    const currentNote = (dayRecord?.note || '').trim();
    const currentHash = `${selectedDayItem?.dateKey}|${currentTasksMap}|${currentNote}|${selectedDayItem?.percentage}|${userProfile.physicalState}|${userProfile.mentalState}|${userProfile.emotionalState}`;

    // Kiểm tra nếu không có thay đổi và không phải bấm làm mới
    if (currentHash === lastStateHashRef.current && refreshCount === 0) {
      return;
    }
    lastStateHashRef.current = currentHash;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce 600ms (đặc biệt hữu ích khi người dùng đang gõ ghi chú hoặc tích liên tục)
    debounceTimerRef.current = setTimeout(async () => {
      setIsOpen(true);
      setIsAiLoading(true);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);

      try {
        const msg = await getAiCoachingMessage({
          userProfile,
          selectedDayItem,
          dayRecord,
          tasksList,
          mode: 'feedback',
        });
        setAiMessage(msg);
        setIsAiLoading(false);
        // Sau 5s đoạn chat tự thu về
        openWithAutoClose(5);
      } catch (err) {
        setIsAiLoading(false);
        openWithAutoClose(4);
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [
    selectedDayItem?.dateKey,
    JSON.stringify(dayRecord?.tasks || {}),
    dayRecord?.note,
    selectedDayItem?.percentage,
    userProfile,
    refreshCount,
  ]);

  // Nhấn vào icon tròn logo để chủ động mở/đóng xem lại lời nhắc
  const handleToggleBubble = () => {
    if (isOpen) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      setIsOpen(false);
    } else {
      openWithAutoClose(7); // Khi người dùng tự mở thì hiển thị 7 giây
    }
  };

  const handleManualRefresh = async (e) => {
    e.stopPropagation();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setIsOpen(true);
    setIsAiLoading(true);

    try {
      const msg = await getAiCoachingMessage({
        userProfile,
        selectedDayItem,
        dayRecord,
        tasksList,
        mode: 'feedback',
      });
      setAiMessage(msg);
      setIsAiLoading(false);
      openWithAutoClose(6);
    } catch (err) {
      setIsAiLoading(false);
      openWithAutoClose(4);
    }
  };

  const handleCloseManually = (e) => {
    e.stopPropagation();
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setIsOpen(false);
  };

  return (
    <div className="ai-floating-coach" id="ai-floating-coach">
      {/* KHUNG BÓNG THOẠI AI CHAT (LAYER TRÊN CÙNG) */}
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

      {/* BOX TRÒN CHỨA LOGO Ở GÓC DƯỚI BÊN PHẢI */}
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
}

