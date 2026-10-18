import React, { useEffect, useMemo, useState } from 'react';
import {
  DAILY_TASKS,
  LEVEL_LIST,
  SCORING,
  DEFAULT_USER_PROFILE,
  isTaskBoostedByProfile,
  buildPersonalizedCoaching,
} from '../config/settings';
import {
  Check,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Edit2,
  Plus,
  UserCheck,
} from 'lucide-react';
import { getAiCoachingMessage } from '../services/geminiService';

export function DayDetailPanel({
  selectedDateKey,
  selectedDayItem,
  dayRecord,
  userProfile = DEFAULT_USER_PROFILE,
  onSetTaskLevel,
  onMarkAllLevel,
  onClearDay,
  onChangeNote,
  isToday,
  onEditTask,
  onOpenAddTaskModal,
  onOpenProfileModal,
}) {
  if (!selectedDayItem) return null;

  const tasksMap = dayRecord?.tasks || {};
  const currentTasksList = selectedDayItem.tasksList || DAILY_TASKS;

  const [aiMessage, setAiMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Phân tích cá nhân hóa dựa trên Thể chất, Tinh thần, Cảm xúc (dùng cho các chip trạng thái trên ô điểm)
  const personalizedInsight = useMemo(
    () => buildPersonalizedCoaching(userProfile, selectedDayItem, tasksMap),
    [userProfile, selectedDayItem, tasksMap]
  );

  // Tự động kích hoạt Gemini AI mỗi khi có thay đổi:
  // - Tích việc / đổi mức độ việc (tasksMap)
  // - Viết xong ghi chú (dayRecord?.note)
  // - Đổi ngày (selectedDateKey)
  // - Cập nhật profile / trạng thái (userProfile)
  // - Bấm nút làm mới
  useEffect(() => {
    let isCancelled = false;
    setIsAiLoading(true);

    const timer = setTimeout(async () => {
      try {
        const msg = await getAiCoachingMessage({
          userProfile,
          selectedDayItem,
          dayRecord,
          tasksList: currentTasksList,
        });
        if (!isCancelled) {
          setAiMessage(msg);
          setIsAiLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setIsAiLoading(false);
        }
      }
    }, 600);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    selectedDateKey,
    JSON.stringify(tasksMap),
    dayRecord?.note,
    selectedDayItem?.percentage,
    userProfile,
    currentTasksList,
    refreshCount,
  ]);

  return (
    <section className="day-detail-section" id="day-detail-panel">
      <div className="day-detail-header">
        <div className="day-detail-title-group">
          <div className="day-tag-row">
            <span className="day-badge-mono">{selectedDateKey}</span>
            <span className="day-weekday-pill">{selectedDayItem.weekday}</span>
            {isToday && <span className="today-indicator-pill">Hôm nay</span>}
          </div>
          <h2 className="section-heading">
            Chi tiết & Tích việc — Ngày {selectedDayItem.day}
          </h2>
          <p className="day-rank-desc">{selectedDayItem.rank.description}</p>
        </div>

        <div className="day-score-summary-card">
          <div className="day-score-main">
            <div className="day-score-left">
              <span className="day-score-label">ĐIỂM ĐẠT ĐƯỢC (ĐÃ CÁ NHÂN HÓA)</span>
              <div className="day-score-big-row">
                <div className="day-score-big">
                  {selectedDayItem.percentage}%
                </div>
                {selectedDayItem.stateBonusPct !== 0 && (
                  <span className="score-mod-pill" title="Điều chỉnh điểm dựa trên Thể chất, Tinh thần, Cảm xúc & Chế độ kỷ luật">
                    {selectedDayItem.stateBonusPct > 0
                      ? `+${selectedDayItem.stateBonusPct}% vượt khó`
                      : `${selectedDayItem.stateBonusPct}% kỷ luật`}
                  </span>
                )}
              </div>
              <span className="day-score-raw">
                {selectedDayItem.rawPoints} / {selectedDayItem.maxPoints} điểm •{' '}
                {selectedDayItem.checkedCount}/{selectedDayItem.totalTasks} việc
              </span>
            </div>
            <div className="day-rank-box">
              <span className="day-rank-label">MỨC ĐẠT</span>
              <span className="day-rank-value">{selectedDayItem.rank.title}</span>
            </div>
          </div>

          {/* DÒNG TRẠNG THÁI THỂ CHẤT, TINH THẦN, CẢM XÚC & NÚT CẬP NHẬT TRẠNG THÁI */}
          <div className="score-card-state-row">
            <div className="personal-state-strip">
              <span
                className="state-chip"
                title={personalizedInsight.physObj.desc}
                onClick={onOpenProfileModal}
                style={{ cursor: 'pointer' }}
              >
                Thể chất:{' '}
                <strong className={`state-text-val state-text-${personalizedInsight.physObj.tier || 'good'}`}>
                  {personalizedInsight.physObj.label.split('/')[0].trim()}
                </strong>
              </span>
              <span
                className="state-chip"
                title={personalizedInsight.mentObj.desc}
                onClick={onOpenProfileModal}
                style={{ cursor: 'pointer' }}
              >
                Tinh thần:{' '}
                <strong className={`state-text-val state-text-${personalizedInsight.mentObj.tier || 'good'}`}>
                  {personalizedInsight.mentObj.label.split('/')[0].trim()}
                </strong>
              </span>
              <span
                className="state-chip"
                title={personalizedInsight.emoObj.desc}
                onClick={onOpenProfileModal}
                style={{ cursor: 'pointer' }}
              >
                Cảm xúc:{' '}
                <strong className={`state-text-val state-text-${personalizedInsight.emoObj.tier || 'good'}`}>
                  {personalizedInsight.emoObj.label.split('/')[0].trim()}
                </strong>
              </span>
            </div>

            {onOpenProfileModal && (
              <button
                type="button"
                className="btn-minimal btn-sm btn-state-quick"
                onClick={onOpenProfileModal}
                title="Cập nhật Thể chất, Tinh thần & Cảm xúc cá nhân"
              >
                <UserCheck size={14} />
                <span>Trạng thái</span>
              </button>
            )}
          </div>

          <div
            className="progress-bar-track"
            title={`Tiến độ ngày: ${selectedDayItem.percentage}%`}
          >
            <div
              className="progress-bar-fill"
              style={{
                opacity: selectedDayItem.percentage > 0 ? 1 : 0,
                clipPath: `inset(0 ${Math.max(0, 100 - selectedDayItem.percentage)}% 0 0 round 999px)`,
                WebkitClipPath: `inset(0 ${Math.max(0, 100 - selectedDayItem.percentage)}% 0 0 round 999px)`,
              }}
            />
          </div>

          <div className="day-quick-actions">
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={() => onOpenAddTaskModal && onOpenAddTaskModal()}
              title="Thêm đầu việc mới cho ngày/tuần/tháng này"
            >
              <Plus size={14} />
              <span>Thêm việc</span>
            </button>
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={() => onMarkAllLevel('PERFECT')}
              title={`Tích nhanh tất cả ${currentTasksList.length} việc ở mức Hoàn Hảo (100%)`}
            >
              <Sparkles size={14} />
              <span>Tất cả Hoàn Hảo</span>
            </button>
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={onClearDay}
              title="Xóa toàn bộ tích chọn của ngày này"
            >
              <RotateCcw size={14} />
              <span>Đặt lại ngày</span>
            </button>
          </div>
        </div>
      </div>

      {/* BỐ CỤC 2 CỘT: BÊN TRÁI LÀ CÁC ĐẦU VIỆC — BÊN PHẢI LÀ LỜI KHUYÊN / ĐỘNG VIÊN / LỜI CHÊ CÁ NHÂN HÓA */}
      <div className="day-workspace-layout">
        {/* CỘT TRÁI: Danh sách các đầu việc trong ngày */}
        <div className="tasks-grid">
          {currentTasksList.length === 0 ? (
            <div className="empty-tasks-placeholder">
              <p>Chưa có đầu việc nào cho ngày này.</p>
              <button
                type="button"
                className="btn-minimal"
                onClick={() => onOpenAddTaskModal && onOpenAddTaskModal()}
              >
                <Plus size={15} />
                <span>Thêm đầu việc ngay</span>
              </button>
            </div>
          ) : (
            currentTasksList.map((task, idx) => {
              const currentLevelKey = tasksMap[task.id] || 'NONE';
              const currentScoreObj = SCORING[currentLevelKey] || SCORING.NONE;
              const isBoosted = isTaskBoostedByProfile(task, userProfile);
              const weight = isBoosted ? 1.25 : 1;
              const weightedPoints =
                Math.round(currentScoreObj.points * weight * 10) / 10;

              return (
                <div
                  key={task.id}
                  className={`task-card ${
                    currentLevelKey !== 'NONE' ? 'task-card-checked' : ''
                  }`}
                  onClick={() => onEditTask && onEditTask(task)}
                  title="Nhấn vào thẻ để chỉnh sửa hoặc xoá đầu việc này"
                >
                  <div className="task-card-top">
                    <div className="task-index-title">
                      <span className="task-index">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="task-title-row">
                          <h4 className="task-title">{task.title}</h4>
                          <span className="task-edit-indicator" title="Chỉnh sửa/Xoá">
                            <Edit2 size={12} />
                          </span>
                        </div>
                        <span className="task-meta">
                          {task.category} • {task.timeHint}
                          {isBoosted && (
                            <strong className="boost-inline-tag"> • ★ ×1.25</strong>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="task-current-point">
                      {currentLevelKey !== 'NONE' ? (
                        <span className="point-pill active">
                          +{weightedPoints}đ
                        </span>
                      ) : (
                        <span className="point-pill">0đ</span>
                      )}
                    </div>
                  </div>

                  <div
                    className="task-level-buttons"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {LEVEL_LIST.map((lvl) => {
                      const isSelected = currentLevelKey === lvl.key;
                      const lvlPts = Math.round(lvl.points * weight * 10) / 10;
                      return (
                        <button
                          key={lvl.key}
                          type="button"
                          className={`level-btn ${isSelected ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetTaskLevel(
                              task.id,
                              isSelected ? 'NONE' : lvl.key
                            );
                          }}
                        >
                          <span className="level-btn-name">{lvl.label}</span>
                          <span className="level-btn-pts">
                            {isSelected ? <Check size={12} /> : `${lvlPts}đ`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CỘT PHẢI: AI COACH BÓNG THOẠI & GHI CHÚ */}
        <aside className="daily-feedback-sidebar">
          <div className="ai-coach-card">
            {/* KHUNG BÓNG THOẠI AI CHAT */}
            <div className="ai-chat-bubble-wrap">
              <div className="ai-speech-bubble">
                <div className="ai-speech-bubble-header">
                  <div className="ai-speech-badge">
                    <Sparkles size={13} />
                    <span>AI COACH</span>
                  </div>
                  <button
                    type="button"
                    className="btn-ai-reload"
                    onClick={() => setRefreshCount((c) => c + 1)}
                    disabled={isAiLoading}
                    title="Nhận một câu nhận xét khác từ AI"
                  >
                    <RefreshCw size={11} className={isAiLoading ? 'spin-anim' : ''} />
                    <span>Đổi câu</span>
                  </button>
                </div>

                <div className="ai-speech-bubble-body">
                  {isAiLoading && !aiMessage ? (
                    <div className="ai-typing-indicator">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-text">AI đang phân tích ngày của bạn...</span>
                    </div>
                  ) : (
                    <p className={`ai-bubble-message ${isAiLoading ? 'is-loading-pulse' : ''}`}>
                      {aiMessage || 'Hãy tích các đầu việc hoặc viết ghi chú để AI bắt đầu đồng hành cùng bạn.'}
                    </p>
                  )}
                </div>
              </div>

              {/* BOX TRÒN CHỨA LOGO (AVATAR AI) Ở GÓC DƯỚI ĐUÔI BÓNG THOẠI */}
              <div className="ai-avatar-footer-row">
                <div className="ai-avatar-text-block">
                  <span className="ai-avatar-name">Self Upgrade AI</span>
                  <span className="ai-avatar-sub">
                    {isAiLoading ? 'Đang suy nghĩ...' : 'Huấn luyện viên tự động'}
                  </span>
                </div>
                <div className="ai-avatar-circle-box" title="AI Huấn Luyện Viên Kỷ Luật">
                  <img src="/logo.png" alt="Self Upgrade Logo" className="ai-avatar-logo" />
                </div>
              </div>
            </div>

            {/* GHI CHÚ / TỰ KIỂM ĐIỂM NGÀY */}
            <div className="day-note-box">
              <label htmlFor="daily-note-input" className="day-note-label">
                GHI CHÚ / TỰ KIỂM ĐIỂM NGÀY {selectedDayItem.day}
              </label>
              <textarea
                id="daily-note-input"
                rows={3}
                className="day-note-input day-note-textarea"
                placeholder="Ghi lại lý do hôm nay làm tốt hoặc viết điều cần chấn chỉnh (AI sẽ tự động đọc và nhận xét)..."
                value={dayRecord?.note || ''}
                onChange={(e) => onChangeNote(e.target.value)}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
