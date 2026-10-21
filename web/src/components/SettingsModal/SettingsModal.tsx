import React from 'react';
import { Settings, Sun, Moon, Flame, X, Check } from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: (theme: 'light' | 'dark') => void;
  isCaloriesEnabled: boolean;
  onToggleCalories: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  isCaloriesEnabled,
  onToggleCalories,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-container settings-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="modal-title">CÀI ĐẶT HỆ THỐNG</h3>
              <p className="modal-subtitle">
                Tùy chỉnh giao diện hiển thị và các tính năng bổ trợ của ứng dụng
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Đóng cài đặt"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body settings-modal-body">
          {/* 1. GIAO DIỆN (THEME) */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">GIAO DIỆN</span>
              <h4 className="settings-section-title">Chế độ hiển thị màu sắc</h4>
              <p className="settings-section-desc">
                Chọn giao diện nền Sáng (Light) cổ điển hoặc Tối (Dark) dịu mắt ban đêm
              </p>
            </div>

            <div className="theme-options-grid">
              {/* Option Sáng */}
              <button
                type="button"
                className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onToggleTheme('light')}
              >
                <div className="theme-card-icon-box light-preview">
                  <Sun size={20} />
                </div>
                <div className="theme-card-info">
                  <div className="theme-card-title-row">
                    <strong>Chế độ Sáng</strong>
                    {theme === 'light' && (
                      <span className="theme-badge-current">
                        <Check size={12} /> Đang dùng
                      </span>
                    )}
                  </div>
                  <span className="theme-card-desc">
                    Tông giấy Kraft ấm áp, độ tương phản cao, tối ưu cho ban ngày
                  </span>
                </div>
              </button>

              {/* Option Tối */}
              <button
                type="button"
                className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onToggleTheme('dark')}
              >
                <div className="theme-card-icon-box dark-preview">
                  <Moon size={20} />
                </div>
                <div className="theme-card-info">
                  <div className="theme-card-title-row">
                    <strong>Chế độ Tối</strong>
                    {theme === 'dark' && (
                      <span className="theme-badge-current">
                        <Check size={12} /> Đang dùng
                      </span>
                    )}
                  </div>
                  <span className="theme-card-desc">
                    Nền tối dịu mắt, giảm căng thẳng thị giác khi làm việc ban đêm
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. THIẾT LẬP TÍNH NĂNG (FEATURES) */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">TÍNH NĂNG BỔ TRỢ</span>
              <h4 className="settings-section-title">Quản lý các module hệ thống</h4>
              <p className="settings-section-desc">
                Bật hoặc tắt các tính năng phù hợp với nhu cầu theo dõi của bạn
              </p>
            </div>

            <div className="feature-item-row">
              <div className="feature-item-icon-box">
                <Flame size={20} />
              </div>
              <div className="feature-item-text">
                <div className="feature-item-title-row">
                  <strong>Theo dõi Calories & Dinh dưỡng</strong>
                  <span className={`feature-status-tag ${isCaloriesEnabled ? 'status-enabled' : 'status-disabled'}`}>
                    {isCaloriesEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                  </span>
                </div>
                <p className="feature-item-desc">
                  Hiển thị tab ghi nhận bữa ăn, tính toán 5 chỉ số đa lượng và AI dinh dưỡng trong trang Chi tiết ngày. Tắt đi nếu bạn chỉ muốn tập trung hoàn toàn vào To-do list.
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isCaloriesEnabled}
                className={`toggle-switch-btn ${isCaloriesEnabled ? 'is-active' : ''}`}
                onClick={() => onToggleCalories(!isCaloriesEnabled)}
                title={isCaloriesEnabled ? 'Nhấn để tắt chế độ Calories' : 'Nhấn để bật chế độ Calories'}
              >
                <span className="toggle-switch-thumb" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer settings-modal-footer">
          <button
            type="button"
            className="btn-minimal btn-close-settings"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

