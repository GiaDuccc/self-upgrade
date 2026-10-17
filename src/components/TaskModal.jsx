import React, { useState, useEffect } from 'react';
import { TASK_CATEGORIES } from '../config/settings';
import {
  X,
  Plus,
  Trash2,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export function TaskModal({
  isOpen,
  onClose,
  mode = 'add', // 'add' | 'edit'
  initialTask = null,
  currentDateKey,
  onSaveTask,
  onDeleteTask,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(TASK_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [timeHint, setTimeHint] = useState('');
  const [scope, setScope] = useState('all'); // 'day' | 'week' | 'month' | 'all'
  const [errorMsg, setErrorMsg] = useState('');

  // Khi modal mở lên, load dữ liệu
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
        setTimeHint(initialTask.timeHint || '');
        setScope(initialTask.scope || 'all');
      } else {
        setTitle('');
        setCategory(TASK_CATEGORIES[0]);
        setCustomCategory('');
        setTimeHint('');
        setScope('all');
      }
      setErrorMsg('');
    }
  }, [isOpen, mode, initialTask]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên đầu việc!');
      return;
    }

    const finalCategory =
      category === 'Khác' && customCategory.trim()
        ? customCategory.trim()
        : category;

    onSaveTask({
      id: mode === 'edit' && initialTask?.id ? initialTask.id : undefined,
      title: title.trim(),
      category: finalCategory,
      timeHint: timeHint.trim() || 'Mỗi ngày',
      scope,
      dateKey: currentDateKey,
    });

    onClose();
  };

  const handleDelete = () => {
    if (mode === 'edit' && initialTask && onDeleteTask) {
      const confirmDelete = window.confirm(
        `Mày có chắc muốn xoá đầu việc "${initialTask.title}" (${
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
        onDeleteTask({
          id: initialTask.id,
          scope,
          dateKey: currentDateKey,
        });
        onClose();
      }
    }
  };

  const scopeOptions = [
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

          {/* 1. Tên đầu việc */}
          <div className="form-group">
            <label htmlFor="task-title-input" className="form-label">
              TÊN ĐẦU VIỆC <span className="required-star">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              className="form-input"
              placeholder="VD: Chạy bộ 5km, Học từ vựng tiếng Anh, Nghe podcast..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
            />
          </div>

          {/* 2. Trường / Danh mục (Tích chọn) */}
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

          {/* 3. Mục chi tiết (Gợi ý thời gian, định lượng) */}
          <div className="form-group">
            <label htmlFor="task-detail-input" className="form-label">
              MỤC CHI TIẾT (THỜI GIAN / ĐỊNH LƯỢNG)
            </label>
            <input
              id="task-detail-input"
              type="text"
              className="form-input"
              placeholder="VD: 30 phút, Trước 06:00, 10 trang sách, Chuyên sâu..."
              value={timeHint}
              onChange={(e) => setTimeHint(e.target.value)}
            />
          </div>

          {/* 4. Phạm vi áp dụng (Áp dụng ngày, tuần, tháng, tất cả) */}
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

          {/* Modal Footer */}
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
}
