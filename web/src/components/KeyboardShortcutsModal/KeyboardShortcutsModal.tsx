import React, { useEffect } from 'react';
import { X, Keyboard, Navigation, CheckSquare, Settings } from 'lucide-react';
import { useLanguage } from '~/utils/i18n';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isEn } = useLanguage();

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

  if (!isOpen) return null;

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
        className="modal-container modal-shortcuts-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER CHUẨN DESIGN SYSTEM CỦA DỰ ÁN */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Keyboard size={18} />
            </div>
            <div>
              <h3 className="modal-title">
                {isEn ? 'KEYBOARD SHORTCUTS' : 'PHÍM TẮT NHANH'}
              </h3>
              <p className="modal-subtitle">
                {isEn
                  ? 'Boost daily workflow efficiency with instant hotkeys'
                  : 'Tăng tốc độ điều hướng và ghi nhận kỷ luật với các tổ hợp phím tắt'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label={isEn ? 'Close shortcuts' : 'Đóng phím tắt'}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY: BỐ CỤC 2 CỘT CÂN ĐỐI, VỪA VẶN MÀN HÌNH KHÔNG BỊ CUỘN */}
        <div className="modal-body shortcuts-modal-body">
          <div className="shortcuts-two-columns">
            {/* CỘT TRÁI: ĐIỀU HƯỚNG & HỆ THỐNG */}
            <div className="shortcuts-col">
              {/* NHÓM 1: ĐIỀU HƯỚNG */}
              <div className="shortcuts-group-card">
                <div className="shortcuts-group-header">
                  <div className="shortcuts-group-title-row">
                    <Navigation size={13} className="shortcuts-group-icon" />
                    <span className="shortcuts-group-tag">
                      {isEn ? 'NAVIGATION' : 'ĐIỀU HƯỚNG'}
                    </span>
                  </div>
                  <span className="shortcuts-group-count">4</span>
                </div>

                <div className="shortcuts-list">
                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Jump to Today' : 'Về ngày Hôm nay'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">T</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Month Overview' : 'Về Tổng quan tháng'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">M</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Previous Day / Month' : 'Ngày trước / Tháng trước'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">←</kbd>
                      <span className="kbd-sep">{isEn ? 'or' : 'hoặc'}</span>
                      <kbd className="shortcut-kbd">[</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Next Day / Month' : 'Ngày sau / Tháng sau'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">→</kbd>
                      <span className="kbd-sep">{isEn ? 'or' : 'hoặc'}</span>
                      <kbd className="shortcut-kbd">]</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* NHÓM 2: HỆ THỐNG & CỬA SỔ */}
              <div className="shortcuts-group-card">
                <div className="shortcuts-group-header">
                  <div className="shortcuts-group-title-row">
                    <Settings size={13} className="shortcuts-group-icon" />
                    <span className="shortcuts-group-tag">
                      {isEn ? 'SYSTEM & WINDOWS' : 'HỆ THỐNG & CỬA SỔ'}
                    </span>
                  </div>
                  <span className="shortcuts-group-count">4</span>
                </div>

                <div className="shortcuts-list">
                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Profile & Physical States' : 'Hồ sơ & Trạng thái thể chất'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">P</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'System Settings' : 'Cài đặt hệ thống'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">S</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Show Shortcuts Guide' : 'Xem bảng phím tắt này'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">?</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Close any Modal' : 'Đóng cửa sổ modal'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: THAO TÁC NGÀY & KỶ LUẬT */}
            <div className="shortcuts-col">
              <div className="shortcuts-group-card">
                <div className="shortcuts-group-header">
                  <div className="shortcuts-group-title-row">
                    <CheckSquare size={13} className="shortcuts-group-icon" />
                    <span className="shortcuts-group-tag">
                      {isEn ? 'DAY & HABIT ACTIONS' : 'THAO TÁC NGÀY & KỶ LUẬT'}
                    </span>
                  </div>
                  <span className="shortcuts-group-count">5</span>
                </div>

                <div className="shortcuts-list">
                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Add New Task' : 'Thêm đầu việc mới'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">A</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Switch to To-do List' : 'Chuyển sang To-do List'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">1</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Switch to Calories & Nutrition' : 'Chuyển sang Calories & Dinh dưỡng'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">2</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Switch to Gym & Workout' : 'Chuyển sang Tập luyện (Gym)'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">3</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Quick Log Water (+250 ml)' : 'Tích nhanh 1 ly nước (+250 ml)'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">W</kbd>
                    </div>
                  </div>

                  <div className="shortcut-row">
                    <span className="shortcut-label">
                      {isEn ? 'Undo Water (-250 ml)' : 'Trừ bớt nước (-250 ml)'}
                    </span>
                    <div className="shortcut-keys">
                      <kbd className="shortcut-kbd">Shift</kbd>
                      <span className="kbd-sep">+</span>
                      <kbd className="shortcut-kbd">W</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER CHUẨN DESIGN SYSTEM */}
        <div className="modal-footer shortcuts-modal-footer">
          <div className="shortcuts-hint-pill">
            <span className="shortcuts-hint-icon">💡</span>
            <span>
              {isEn
                ? 'Hotkeys automatically pause when typing in note or input fields.'
                : 'Phím tắt sẽ tự động tạm dừng khi bạn đang nhập văn bản hoặc ghi chú.'}
            </span>
          </div>
          <button
            type="button"
            className="btn-minimal btn-sm btn-close-shortcuts"
            onClick={onClose}
          >
            {isEn ? 'Got it (Esc)' : 'Đã hiểu (Esc)'}
          </button>
        </div>
      </div>
    </div>
  );
};
