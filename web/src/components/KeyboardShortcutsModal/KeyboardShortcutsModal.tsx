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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-shortcuts-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Keyboard size={18} className="modal-title-icon" />
            <h2 className="modal-title">
              {isEn ? 'Keyboard Shortcuts' : 'Phím tắt nhanh (Keyboard Shortcuts)'}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'Đóng'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="shortcuts-modal-body">
          {/* NHÓM 1: ĐIỀU HƯỚNG */}
          <div className="shortcuts-group">
            <div className="shortcuts-group-title">
              <Navigation size={14} />
              <span>{isEn ? 'Navigation' : 'Điều hướng'}</span>
            </div>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Jump to Today' : 'Về ngày Hôm nay'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">T</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Month Overview' : 'Về Tổng quan tháng'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">M</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Previous Day / Month' : 'Ngày trước / Tháng trước'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">←</kbd>
                  <span className="shortcut-or">/</span>
                  <kbd className="shortcut-kbd">[</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Next Day / Month' : 'Ngày sau / Tháng sau'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">→</kbd>
                  <span className="shortcut-or">/</span>
                  <kbd className="shortcut-kbd">]</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* NHÓM 2: THAO TÁC NGÀY & KỶ LUẬT */}
          <div className="shortcuts-group">
            <div className="shortcuts-group-title">
              <CheckSquare size={14} />
              <span>{isEn ? 'Day & Habit Actions' : 'Thao tác ngày & Kỷ luật'}</span>
            </div>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Add New Task' : 'Thêm đầu việc mới'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">A</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Switch to To-do List' : 'Chuyển sang To-do List'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">1</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Switch to Calories' : 'Chuyển sang Calories'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">2</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Quick Log Water (+250 ml)' : 'Tích nhanh 1 ly nước (+250 ml)'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">W</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Undo Water (-250 ml)' : 'Trừ bớt nước (-250 ml)'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">Shift</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-kbd">W</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* NHÓM 3: HỆ THỐNG & CỬA SỔ */}
          <div className="shortcuts-group">
            <div className="shortcuts-group-title">
              <Settings size={14} />
              <span>{isEn ? 'System & Windows' : 'Hệ thống & Cửa sổ'}</span>
            </div>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Open Profile & States' : 'Hồ sơ & Trạng thái thể chất'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">P</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Open Settings' : 'Cài đặt hệ thống'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">S</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Show Shortcuts Guide' : 'Xem bảng phím tắt này'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">?</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-desc">
                  {isEn ? 'Close any Modal' : 'Đóng cửa sổ modal'}
                </div>
                <div className="shortcut-keys">
                  <kbd className="shortcut-kbd">Esc</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="shortcuts-hint-box">
            💡 {isEn
              ? 'Note: Shortcuts are temporarily disabled when typing inside input or text note fields.'
              : 'Lưu ý: Phím tắt sẽ tự động tạm tắt khi bạn đang gõ nội dung trong ô nhập liệu hoặc ghi chú.'}
          </div>
        </div>
      </div>
    </div>
  );
};

