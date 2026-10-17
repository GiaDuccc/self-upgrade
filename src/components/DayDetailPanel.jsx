import React, { useEffect, useMemo, useState } from 'react';
import {
  DAILY_TASKS,
  LEVEL_LIST,
  SCORING,
  FEEDBACK_POOLS,
  TASK_SPECIFIC_NOTES,
  DEFAULT_USER_PROFILE,
  isTaskBoostedByProfile,
  buildPersonalizedCoaching,
} from '../config/settings';
import {
  Check,
  RotateCcw,
  Sparkles,
  Shuffle,
  MessageSquareQuote,
  AlertTriangle,
  Award,
  Compass,
  Edit2,
  Plus,
  UserCheck,
  Activity,
} from 'lucide-react';

function getPoolKey(percentage, checkedCount) {
  if (checkedCount === 0 && percentage === 0) return 'UNRATED';
  if (percentage < 25) return 'VERY_LOW';
  if (percentage < 45) return 'LOW';
  if (percentage < 70) return 'MEDIUM';
  if (percentage < 90) return 'GOOD';
  return 'PERFECT';
}

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

  const poolKey = getPoolKey(
    selectedDayItem.percentage,
    selectedDayItem.checkedCount
  );
  const currentPool = FEEDBACK_POOLS[poolKey] || FEEDBACK_POOLS.UNRATED;

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [taskSpotlightSeed, setTaskSpotlightSeed] = useState(0);

  // Mỗi khi điểm số ngày đó thay đổi hoặc đổi ngày, chọn ngẫu nhiên 1 thông điệp mới theo đúng mức điểm
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * currentPool.length);
    setQuoteIndex(randomIdx);
    setTaskSpotlightSeed(Math.random());
  }, [
    selectedDateKey,
    selectedDayItem.rawPoints,
    selectedDayItem.checkedCount,
    poolKey,
    currentPool.length,
  ]);

  const handleShuffleQuote = () => {
    if (currentPool.length <= 1) return;
    setQuoteIndex((prev) => {
      let next = Math.floor(Math.random() * currentPool.length);
      if (next === prev) {
        next = (prev + 1) % currentPool.length;
      }
      return next;
    });
    setTaskSpotlightSeed(Math.random());
  };

  const activeFeedback =
    currentPool[quoteIndex % currentPool.length] || currentPool[0];

  // Phân tích cá nhân hóa dựa trên Thể chất, Tinh thần, Cảm xúc + Kết quả ngày
  const personalizedInsight = useMemo(
    () => buildPersonalizedCoaching(userProfile, selectedDayItem, tasksMap),
    [userProfile, selectedDayItem, tasksMap]
  );

  // Lấy ngẫu nhiên các nhận xét chi tiết dựa trên những đầu việc đang bị Tệ hoặc đạt Hoàn Hảo
  const specificTaskComments = useMemo(() => {
    const badNotes = [];
    const perfectNotes = [];

    currentTasksList.forEach((task) => {
      const lvl = tasksMap[task.id];
      const noteEntry = TASK_SPECIFIC_NOTES[task.id];
      if (!noteEntry) return;
      if (lvl === 'BAD' && noteEntry.BAD) {
        badNotes.push({
          id: task.id,
          title: task.title,
          type: 'BAD',
          text: noteEntry.BAD,
        });
      } else if (lvl === 'PERFECT' && noteEntry.PERFECT) {
        perfectNotes.push({
          id: task.id,
          title: task.title,
          type: 'PERFECT',
          text: noteEntry.PERFECT,
        });
      }
    });

    const shuffleArr = (arr) =>
      [...arr].sort(
        (a, b) =>
          Math.sin(a.id.length + taskSpotlightSeed * 100) -
          Math.cos(b.id.length + taskSpotlightSeed * 100)
      );

    const pickedBad = shuffleArr(badNotes).slice(0, 2);
    const pickedPerfect = shuffleArr(perfectNotes).slice(
      0,
      pickedBad.length > 0 ? 1 : 2
    );

    return [...pickedBad, ...pickedPerfect];
  }, [currentTasksList, tasksMap, taskSpotlightSeed]);

  // Tính số điểm cần thêm để lên mức tiếp theo
  const nextMilestoneInfo = useMemo(() => {
    const pct = selectedDayItem.percentage;
    const raw = selectedDayItem.rawPoints;
    const max = selectedDayItem.maxPoints;

    if (pct < 45) {
      const targetPts = Math.ceil(0.45 * max);
      return `Cần thêm ~${Math.max(1, Math.round(targetPts - raw))}đ để thoát mức Tệ và lên Trung Bình (45%).`;
    }
    if (pct < 70) {
      const targetPts = Math.ceil(0.7 * max);
      return `Cần thêm ~${Math.max(1, Math.round(targetPts - raw))}đ để đạt mốc Tốt (70%).`;
    }
    if (pct < 90) {
      const targetPts = Math.ceil(0.9 * max);
      return `Chỉ cần thêm ~${Math.max(1, Math.round(targetPts - raw))}đ nữa là chạm ngưỡng Hoàn Hảo (90%)!`;
    }
    if (pct < 100) {
      return `Chỉ còn cách tuyệt đối 100% khoảng ${Math.max(1, Math.round(max - raw))}đ nữa thôi!`;
    }
    return `Đã đạt điểm tối đa 100% trong ngày hôm nay!`;
  }, [selectedDayItem]);

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

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${selectedDayItem.percentage}%` }}
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

        {/* CỘT PHẢI: Mục Lời khuyên, Lời động viên, Lời chê dựa theo kết quả ngày + Thể chất/Tinh thần/Cảm xúc */}
        <aside className="daily-feedback-sidebar">
          <div className="feedback-card">
            <div className="feedback-card-top">
              <div className="feedback-badge-group">
                <span className="feedback-type-tag">{activeFeedback.tag}</span>
                <span className="feedback-score-pill">
                  Mức {selectedDayItem.percentage}%
                </span>
              </div>

              <button
                type="button"
                className="btn-minimal btn-sm"
                onClick={handleShuffleQuote}
                title="Đổi ngẫu nhiên câu nhận xét khác theo mức điểm hiện tại"
              >
                <Shuffle size={13} />
                <span>Đổi câu</span>
              </button>
            </div>

            {/* Nhận xét cá nhân hóa trực diện dựa trên trạng thái & điểm */}
            <div className="feedback-quote-box">
              <div className="feedback-tone-row">
                <Activity size={17} />
                <h3 className="feedback-tone-title">
                  {personalizedInsight.stateHeadline}
                </h3>
              </div>
              <p className="feedback-main-message">
                {personalizedInsight.stateCritiqueOrPraise}
              </p>
              <p className="feedback-random-subquote">
                <MessageSquareQuote size={14} style={{ display: 'inline', marginRight: '5px' }} />
                “{activeFeedback.message}”
              </p>
            </div>

            <div className="feedback-advice-box">
              <div className="feedback-sub-header">
                <Compass size={15} />
                <span>LỜI KHUYÊN HÀNH ĐỘNG (THEO TRẠNG THÁI CỦA {personalizedInsight.callName.toUpperCase()})</span>
              </div>
              <p className="feedback-advice-text">
                {personalizedInsight.stateActionableAdvice}
              </p>
              {personalizedInsight.bioMetricsHint && (
                <p className="feedback-bio-hint">
                  • {personalizedInsight.bioMetricsHint}
                </p>
              )}
            </div>

            {/* Nhận xét chi tiết theo các việc cụ thể vừa tích (Tệ / Hoàn Hảo) */}
            <div className="feedback-specific-list">
              <div className="feedback-sub-header">
                <span>ĐIỂM NHẤN TRONG NGÀY</span>
              </div>

              {specificTaskComments.length > 0 ? (
                <div className="specific-items-wrap">
                  {specificTaskComments.map((item) => (
                    <div
                      key={item.id}
                      className={`specific-comment-item ${
                        item.type === 'BAD' ? 'is-bad' : 'is-perfect'
                      }`}
                    >
                      <div className="specific-item-title">
                        {item.type === 'BAD' ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Award size={14} />
                        )}
                        <strong>{item.title}:</strong>
                        <span className="specific-level-badge">
                          {item.type === 'BAD' ? 'Đang Tệ' : 'Hoàn Hảo'}
                        </span>
                      </div>
                      <p className="specific-item-text">{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="specific-empty-hint">
                  Hãy tích các đầu việc bên trái (Tệ / Tốt / Hoàn Hảo) để nhận phân tích thẳng thắn cho từng thói quen.
                </p>
              )}
            </div>

            {/* Mục tiêu bậc tiếp theo */}
            <div className="feedback-milestone-bar">
              <span className="milestone-label">MỤC TIÊU TIẾP THEO</span>
              <p className="milestone-text">{nextMilestoneInfo}</p>
            </div>
          </div>

          {/* Ghi chú / Nhật ký cá nhân nằm gọn ngay dưới khung phản hồi bên phải */}
          <div className="day-note-box">
            <label htmlFor="daily-note-input" className="day-note-label">
              GHI CHÚ / TỰ KIỂM ĐIỂM NGÀY {selectedDayItem.day}
            </label>
            <textarea
              id="daily-note-input"
              rows={3}
              className="day-note-input day-note-textarea"
              placeholder="Ghi lại lý do hôm nay làm tốt hoặc lời tự hứa chấn chỉnh vào ngày mai..."
              value={dayRecord?.note || ''}
              onChange={(e) => onChangeNote(e.target.value)}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
