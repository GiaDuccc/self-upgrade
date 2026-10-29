import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Info,
  Clock,
  Sun,
} from 'lucide-react';
import { SunMoonSplitIcon } from '~/components/Icons/SunMoonSplitIcon';
import { TaskItem, TaskScope } from '~/interface/discipline.interface';
import { TASK_CATEGORIES } from '~/utils/constants';
import { translateCategory, useLanguage } from '~/utils/i18n';
import {
  parseTaskTimes,
  timeToDec,
  formatDecToTime,
  addMinutesToTime,
  formatDurationText,
  sanitize24hTime,
  isTaskAllDay,
  HOURS_24_SUGGESTIONS,
} from '~/utils/taskTimeUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialTask: TaskItem | null;
  currentDateKey: string;
  existingTasks: TaskItem[];
  onSaveTask: (payload: {
    id?: string;
    title: string;
    category: string;
    timeHint: string;
    startTime?: string;
    endTime?: string;
    scope: TaskScope;
    dateKey: string;
    hour?: number;
    columnIndex?: number;
    isAllDay?: boolean;
  }) => Promise<boolean | void> | boolean | void;
  onDeleteTask?: (payload: {
    id: string;
    scope: TaskScope;
    dateKey: string;
  }) => Promise<void> | void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  mode = 'add',
  initialTask = null,
  currentDateKey,
  existingTasks = [],
  onSaveTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(TASK_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [scope, setScope] = useState<TaskScope>('all');
  const [errorMsg, setErrorMsg] = useState('');
  const { language, isEn } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialTask) {
        setTitle(initialTask.title || '');
        const isStandardCat = TASK_CATEGORIES.includes(initialTask.category);
        if (isStandardCat) {
          setCategory(initialTask.category);
          setCustomCategory('');
        } else {
          setCategory('Khác');
          setCustomCategory(initialTask.category || '');
        }
        const taskIsAllDay = isTaskAllDay(initialTask);
        setIsAllDay(taskIsAllDay);
        const parsed = parseTaskTimes(initialTask);
        setStartTime(parsed.startTime || '08:00');
        setEndTime(parsed.endTime || '09:00');
        setScope(initialTask.scope || 'all');
      } else {
        setTitle('');
        setCategory(TASK_CATEGORIES[0]);
        setCustomCategory('');
        const taskIsAllDay = Boolean(initialTask && isTaskAllDay(initialTask));
        setIsAllDay(taskIsAllDay);
        const parsed = parseTaskTimes(initialTask);
        setStartTime(parsed.startTime || '08:00');
        setEndTime(parsed.endTime || '09:00');
        setScope(initialTask?.scope || 'all');
      }
      setErrorMsg('');
    }
  }, [isOpen, mode, initialTask]);

  if (!isOpen) return null;

  const trimmedCurrentTitle = title.trim();

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    const sDec = timeToDec(val);
    const eDec = timeToDec(endTime);
    if (eDec <= sDec) {
      setEndTime(addMinutesToTime(val, 60));
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
  };

  const handleAddDuration = (mins: number) => {
    setEndTime(addMinutesToTime(startTime, mins));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedCurrentTitle) {
      setErrorMsg('Vui lòng nhập tên đầu việc!');
      return;
    }

    const finalCategory =
      category === 'Khác' && customCategory.trim()
        ? customCategory.trim()
        : category;

    if (isAllDay) {
      const saved = await onSaveTask({
        id: mode === 'edit' && initialTask?.id ? initialTask.id : undefined,
        title: trimmedCurrentTitle,
        category: finalCategory,
        timeHint: isEn ? 'All day' : 'Cả ngày',
        startTime: undefined,
        endTime: undefined,
        isAllDay: true,
        scope,
        dateKey: currentDateKey,
        hour: undefined,
        columnIndex: undefined,
      });

      if (saved !== false) {
        onClose();
      }
      return;
    }

    const cleanStart = sanitize24hTime(startTime, '08:00');
    let cleanEnd = sanitize24hTime(endTime, addMinutesToTime(cleanStart, 60));
    const sDec = timeToDec(cleanStart);
    let eDec = timeToDec(cleanEnd);
    if (eDec <= sDec) {
      cleanEnd = addMinutesToTime(cleanStart, 60);
      eDec = timeToDec(cleanEnd);
    }
    const finalStart = cleanStart;
    const finalEnd = cleanEnd;
    const finalTimeHint = `${finalStart} - ${finalEnd}`;
    const hourVal = Math.floor(sDec);
    const colVal = initialTask?.columnIndex;

    const saved = await onSaveTask({
      id: mode === 'edit' && initialTask?.id ? initialTask.id : undefined,
      title: trimmedCurrentTitle,
      category: finalCategory,
      timeHint: finalTimeHint,
      startTime: finalStart,
      endTime: finalEnd,
      isAllDay: false,
      scope,
      dateKey: currentDateKey,
      hour: hourVal,
      columnIndex: colVal,
    });

    if (saved !== false) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (mode === 'edit' && initialTask && onDeleteTask) {
      const confirmDelete = window.confirm(
        `Bạn có chắc muốn xoá đầu việc "${initialTask.title}" (${
          scope === 'all'
            ? 'Xoá vĩnh viễn trên tất cả các ngày'
            : scope === 'month'
            ? 'Xoá trong cả tháng này'
            : scope === 'week'
            ? 'Xoá trong tuần này'
            : 'Xoá chỉ ngày ' + currentDateKey
        })?`
      );
      if (confirmDelete) {
        await onDeleteTask({
          id: initialTask.id,
          scope,
          dateKey: currentDateKey,
        });
        onClose();
      }
    }
  };

  const scopeOptions: Array<{ id: TaskScope; title: string; desc: string }> = [
    {
      id: 'day',
      title: isEn ? 'Apply to Day' : 'Áp dụng ngày',
      desc: isEn ? `Only for ${currentDateKey}` : `Chỉ riêng ngày ${currentDateKey}`,
    },
    {
      id: 'week',
      title: isEn ? 'Apply to Week' : 'Áp dụng tuần',
      desc: isEn
        ? 'Applies to all 7 days of this week (Mon – Sun)'
        : 'Áp dụng cho 7 ngày của tuần này (T2 – CN)',
    },
    {
      id: 'month',
      title: isEn ? 'Apply to Month' : 'Áp dụng tháng',
      desc: isEn
        ? `All days in month ${currentDateKey.substring(0, 7)}`
        : `Toàn bộ các ngày trong tháng ${currentDateKey.substring(0, 7)}`,
    },
    {
      id: 'all',
      title: isEn ? 'Apply to All' : 'Áp dụng tất cả',
      desc: isEn
        ? 'Applies permanently across all days (System-wide)'
        : 'Áp dụng vĩnh viễn cho tất cả các ngày (Toàn hệ thống)',
    },
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" aria-hidden="true">
              {mode === 'add' ? <Plus size={18} /> : <Sparkles size={18} />}
            </div>
            <div>
              <h3 id="task-modal-title" className="modal-title">
                {mode === 'add'
                  ? isEn
                    ? 'Add New Task'
                    : 'Thêm đầu việc mới'
                  : isEn
                  ? 'Edit Task'
                  : 'Chỉnh sửa đầu việc'}
              </h3>
              <p className="modal-subtitle">
                {isEn ? 'Target date:' : 'Đang thao tác tại ngày:'}{' '}
                <code>{currentDateKey}</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label={isEn ? 'Close modal' : 'Đóng modal'}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMsg && (
            <div className="modal-error-alert" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="form-group">
            <div className="form-label-with-hint">
              <label htmlFor="task-title-input" className="form-label">
                {isEn ? 'TASK TITLE' : 'TÊN ĐẦU VIỆC'}{' '}
                <span className="required-star">*</span>
              </label>
            </div>
            <input
              id="task-title-input"
              type="text"
              className="form-input"
              placeholder={
                isEn
                  ? 'e.g., Run 5km, Learn English vocabulary, Listen to podcast...'
                  : 'VD: Chạy bộ 5km, Học từ vựng tiếng Anh, Nghe podcast...'
              }
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {isEn ? 'CATEGORY (SELECT ONE)' : 'TRƯỜNG / DANH MỤC (TÍCH CHỌN)'}
            </label>
            <div className="category-pills-wrap">
              {TASK_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    <span className="pill-check-box">
                      {isSelected ? <Check size={12} /> : null}
                    </span>
                    <span>{translateCategory(cat, language)}</span>
                  </button>
                );
              })}
            </div>

            {category === 'Khác' && (
              <input
                type="text"
                className="form-input form-input-sub"
                aria-label={isEn ? 'Custom category name' : 'Tên danh mục khác'}
                placeholder={
                  isEn ? 'Enter custom category...' : 'Nhập tên trường khác...'
                }
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          {/* CHỌN CHẾ ĐỘ: CẢ NGÀY (KHÔNG CỐ ĐỊNH GIỜ, CHỈ HIỆN Ở DANH SÁCH) vs KHUNG GIỜ CỤ THỂ TRÊN BẢNG 24H */}
          <div className="form-group task-schedule-mode-group">
            <div className={`task-allday-switch-box ${isAllDay ? 'active' : ''}`}>
              <label className="task-allday-switch-label" htmlFor="task-allday-toggle">
                <div className="task-allday-switch-left">
                  <div className="task-allday-title-row">
                    <SunMoonSplitIcon size={16} strokeWidth={2} className="task-allday-icon" />
                    <span className="task-allday-title">
                      {isEn
                        ? 'All-day task (No specific time)'
                        : 'Thực hiện cả ngày (không cố định giờ)'}
                    </span>
                  </div>
                  <span className="task-allday-desc">
                    {isEn
                      ? 'Only shows in List view (e.g. Drink 3L water, No junk food), excluded from the 24h timetable grid.'
                      : 'Chỉ hiển thị ở mục Danh sách (VD: Uống 3L nước, Không ăn vặt), không hiển thị trên bảng 24h.'}
                  </span>
                </div>
                <div className="toggle-switch-container">
                  <input
                    id="task-allday-toggle"
                    type="checkbox"
                    className="toggle-switch-input"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                  />
                  <span className="toggle-switch-slider" />
                </div>
              </label>
            </div>
          </div>

          {!isAllDay ? (
            <div className="form-group task-fixed-time-group">
              <div className="form-label-with-hint">
                <label className="form-label">
                  {isEn
                    ? 'EXECUTION TIME (00:00 – 23:59)'
                    : 'THỜI GIAN THỰC HIỆN (00:00 – 23:59)'}{' '}
                  <span className="required-star">*</span>
                </label>
                <span className="form-hint">
                  <Clock size={13} />
                  {isEn
                    ? 'Start time and end time (24h format: 00:00 to 23:59)'
                    : '2 ô thời gian bắt đầu và kết thúc (chuẩn 24h: 00:00 đến 23:59)'}
                </span>
              </div>

              <div className="task-time-range-inputs">
                <div className="time-field-box">
                  <label htmlFor="task-start-time" className="time-field-label">
                    {isEn ? 'Start Time (00:00 – 23:59)' : 'Giờ bắt đầu (00:00 – 23:59)'}
                  </label>
                  <input
                    id="task-start-time"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    className="form-input form-time-field"
                    placeholder="08:00"
                    list="task-24h-options"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    onBlur={() => {
                      const clean = sanitize24hTime(startTime, '08:00');
                      handleStartTimeChange(clean);
                    }}
                    required={!isAllDay}
                  />
                </div>

                <div className="time-range-separator">
                  <span>→</span>
                </div>

                <div className="time-field-box">
                  <label htmlFor="task-end-time" className="time-field-label">
                    {isEn ? 'End Time (00:00 – 23:59)' : 'Giờ kết thúc (00:00 – 23:59)'}
                  </label>
                  <input
                    id="task-end-time"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    className="form-input form-time-field"
                    placeholder="09:00"
                    list="task-24h-options"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    onBlur={() => {
                      const clean = sanitize24hTime(
                        endTime,
                        addMinutesToTime(startTime, 60)
                      );
                      handleEndTimeChange(clean);
                    }}
                    required={!isAllDay}
                  />
                </div>
              </div>

              <datalist id="task-24h-options">
                {HOURS_24_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>

              {/* Thông tin thời lượng & nút bấm tăng nhanh thời lượng */}
              <div className="duration-quick-row">
                <span className="duration-badge">
                  ⏱ {isEn ? 'Duration:' : 'Thời lượng:'}{' '}
                  <strong>{formatDurationText(startTime, endTime, isEn)}</strong>
                </span>
                <div className="duration-presets">
                  {[
                    { label: '+30p', mins: 30 },
                    { label: '+1h', mins: 60 },
                    { label: '+1h30', mins: 90 },
                    { label: '+2h', mins: 120 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="duration-preset-btn"
                      onClick={() => handleAddDuration(p.mins)}
                      title={
                        isEn
                          ? `Set duration to ${p.label}`
                          : `Đặt thời lượng kéo dài ${p.label}`
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="task-allday-notice">
              <SunMoonSplitIcon size={16} strokeWidth={2} />
              <span>
                {isEn
                  ? 'This task has no fixed time constraint. It will be tracked in your task list throughout the day.'
                  : 'Đầu việc này được thực hiện linh hoạt trong ngày, sẽ xuất hiện ở mục Danh sách để theo dõi và không đưa vào bảng 24h.'}
              </span>
            </div>
          )}

          <div className="form-group">
            <div className="form-label-with-hint">
              <label className="form-label">
                {isEn ? 'APPLICATION SCOPE' : 'PHẠM VI ÁP DỤNG'}
              </label>
              <span className="form-hint">
                <Info size={13} />
                {isEn
                  ? 'Choose where this change will take effect'
                  : 'Chọn phạm vi mà thay đổi này sẽ có hiệu lực'}
              </span>
            </div>

            <div className="scope-cards-grid">
              {scopeOptions.map((opt) => {
                const isChecked = scope === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`scope-option-card ${
                      isChecked ? 'scope-option-selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="task-scope"
                      value={opt.id}
                      checked={isChecked}
                      onChange={() => setScope(opt.id)}
                      className="scope-radio"
                    />
                    <div className="scope-card-content">
                      <div className="scope-card-header">
                        <span className="scope-radio-indicator">
                          {isChecked && <span className="scope-radio-dot" />}
                        </span>
                        <strong className="scope-title">{opt.title}</strong>
                      </div>
                      <p className="scope-desc">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            {mode === 'edit' ? (
              <button
                type="button"
                className="btn-delete-task"
                onClick={handleDelete}
                title={isEn ? 'Delete this task' : 'Xoá đầu việc này'}
              >
                <Trash2 size={15} />
                <span>{isEn ? 'Delete Task' : 'Xoá đầu việc'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="modal-footer-right">
              <button
                type="button"
                className="btn-minimal"
                onClick={onClose}
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="submit"
                className="btn-minimal btn-save-task"
              >
                {mode === 'add' ? (
                  <>
                    <Plus size={15} />
                    <span>{isEn ? 'Add Task' : 'Thêm đầu việc'}</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>{isEn ? 'Save Changes' : 'Lưu thay đổi'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

