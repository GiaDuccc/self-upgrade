import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { TaskItem, TaskScope } from '~/interface/discipline.interface';
import { TASK_CATEGORIES } from '~/utils/constants';

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
    scope: TaskScope;
    dateKey: string;
    hour?: number;
    columnIndex?: number;
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
  const [timeHint, setTimeHint] = useState('');
  const [scope, setScope] = useState<TaskScope>('all');
  const [errorMsg, setErrorMsg] = useState('');

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
        const hour = initialTask.hour;
        const defaultTime =
          initialTask.timeHint ||
          (typeof hour === 'number'
            ? `${String(hour).padStart(2, '0')}:00`
            : '08:00');
        setTimeHint(defaultTime);
        setScope(initialTask.scope || 'all');
      } else {
        setTitle('');
        setCategory(TASK_CATEGORIES[0]);
        setCustomCategory('');
        // Tự động điền trước khung giờ mà người dùng đã nhấn vào trên bảng
        const hour = initialTask?.hour;
        const defaultTime =
          initialTask?.timeHint ||
          (typeof hour === 'number'
            ? `${String(hour).padStart(2, '0')}:00`
            : '08:00');
        setTimeHint(defaultTime);
        setScope(initialTask?.scope || 'all');
      }
      setErrorMsg('');
    }
  }, [isOpen, mode, initialTask]);

  if (!isOpen) return null;

  const trimmedCurrentTitle = title.trim();
  const isDuplicateName =
    trimmedCurrentTitle.length > 0 &&
    existingTasks.some(
      (t) =>
        t.id !== initialTask?.id &&
        t.title &&
        t.title.trim().toLowerCase() === trimmedCurrentTitle.toLowerCase()
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedCurrentTitle) {
      setErrorMsg('Vui lòng nhập tên đầu việc!');
      return;
    }

    if (isDuplicateName) {
      setErrorMsg(
        `Đầu việc "${trimmedCurrentTitle}" đã tồn tại trong danh sách! Vui lòng đặt tên khác.`
      );
      return;
    }

    const finalCategory =
      category === 'Khác' && customCategory.trim()
        ? customCategory.trim()
        : category;

    let hourVal: number | undefined = undefined;
    if (timeHint) {
      const match = timeHint.match(/(\d{1,2}):\d{2}/);
      if (match) {
        hourVal = parseInt(match[1], 10);
      } else {
        const matchH = timeHint.match(/(\d{1,2})h/);
        if (matchH) {
          hourVal = parseInt(matchH[1], 10);
        } else {
          const num = parseInt(timeHint, 10);
          if (!isNaN(num) && num >= 0 && num <= 24) hourVal = num;
        }
      }
    }
    if (hourVal === undefined && initialTask?.hour !== undefined) {
      hourVal = initialTask.hour;
    }
    if (typeof hourVal === 'number' && !isNaN(hourVal)) {
      hourVal = Math.max(0, Math.min(24, hourVal));
    }

    const colVal = initialTask?.columnIndex;

    const saved = await onSaveTask({
      id: mode === 'edit' && initialTask?.id ? initialTask.id : undefined,
      title: trimmedCurrentTitle,
      category: finalCategory,
      timeHint: timeHint.trim() || 'Mỗi ngày',
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
      title: 'Áp dụng ngày',
      desc: `Chỉ riêng ngày ${currentDateKey}`,
    },
    {
      id: 'week',
      title: 'Áp dụng tuần',
      desc: 'Áp dụng cho 7 ngày của tuần này (T2 – CN)',
    },
    {
      id: 'month',
      title: 'Áp dụng tháng',
      desc: `Toàn bộ các ngày trong tháng ${currentDateKey.substring(0, 7)}`,
    },
    {
      id: 'all',
      title: 'Áp dụng tất cả',
      desc: 'Áp dụng vĩnh viễn cho tất cả các ngày (Toàn hệ thống)',
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
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              {mode === 'add' ? <Plus size={18} /> : <Sparkles size={18} />}
            </div>
            <div>
              <h3 className="modal-title">
                {mode === 'add' ? 'Thêm đầu việc mới' : 'Chỉnh sửa đầu việc'}
              </h3>
              <p className="modal-subtitle">
                Đang thao tác tại ngày: <code>{currentDateKey}</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMsg && <div className="modal-error-alert">{errorMsg}</div>}

          <div className="form-group">
            <div className="form-label-with-hint">
              <label htmlFor="task-title-input" className="form-label">
                TÊN ĐẦU VIỆC <span className="required-star">*</span>
              </label>
              {isDuplicateName && (
                <span className="live-duplicate-badge">⚠️ Trùng tên</span>
              )}
            </div>
            <input
              id="task-title-input"
              type="text"
              className={`form-input ${isDuplicateName ? 'form-input-error' : ''}`}
              placeholder="VD: Chạy bộ 5km, Học từ vựng tiếng Anh, Nghe podcast..."
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
              TRƯỜNG / DANH MỤC (TÍCH CHỌN)
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
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {category === 'Khác' && (
              <input
                type="text"
                className="form-input form-input-sub"
                placeholder="Nhập tên trường khác..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          <div className="form-group">
            <div className="form-label-with-hint">
              <label htmlFor="task-time-input" className="form-label">
                THỜI GIAN THỰC HIỆN (00:00 – 24:00) <span className="required-star">*</span>
              </label>
              <span className="form-hint">
                <Clock size={13} />
                Khung giờ hiển thị trên bảng thời khóa biểu
              </span>
            </div>
            <div className="form-time-input-wrap">
              <input
                id="task-time-input"
                type="text"
                list="quick-hours-list"
                className="form-input form-time-field"
                placeholder="VD: 08:00, 14:30, 22:00..."
                value={timeHint}
                onChange={(e) => setTimeHint(e.target.value)}
                required
              />
              <datalist id="quick-hours-list">
                {Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            {/* Phím bấm chọn nhanh khung giờ */}
            <div className="quick-hours-strip">
              {['05:00', '07:00', '08:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', '22:00'].map((qh) => (
                <button
                  key={qh}
                  type="button"
                  className={`quick-hour-btn ${timeHint === qh || timeHint.startsWith(qh) ? 'active' : ''}`}
                  onClick={() => setTimeHint(qh)}
                >
                  {qh}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-with-hint">
              <label className="form-label">PHẠM VI ÁP DỤNG</label>
              <span className="form-hint">
                <Info size={13} />
                Chọn phạm vi mà thay đổi này sẽ có hiệu lực
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
                title="Xoá đầu việc này"
              >
                <Trash2 size={15} />
                <span>Xoá đầu việc</span>
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
                Hủy
              </button>
              <button
                type="submit"
                className="btn-minimal btn-save-task"
              >
                {mode === 'add' ? (
                  <>
                    <Plus size={15} />
                    <span>Thêm đầu việc</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Lưu thay đổi</span>
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

