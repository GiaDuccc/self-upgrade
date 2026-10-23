import React, { useRef, useEffect } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Flame,
  X,
  Check,
  Download,
  Upload,
  LogOut,
} from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: (theme: 'light' | 'dark') => void;
  isCaloriesEnabled: boolean;
  onToggleCalories: (enabled: boolean) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout?: () => void;
  userEmail?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  isCaloriesEnabled,
  onToggleCalories,
  onExportJson,
  onImportJson,
  onLogout,
  userEmail,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Khóa cuộn trang nền khi mở modal
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
                Tùy chỉnh giao diện, tính năng, sao lưu dữ liệu và tài khoản
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

          {/* 3. DỮ LIỆU & SAO LƯU (BACKUP) */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">DỮ LIỆU & SAO LƯU</span>
              <h4 className="settings-section-title">Sao lưu và khôi phục dữ liệu</h4>
              <p className="settings-section-desc">
                Xuất file JSON sao lưu toàn bộ quá trình hoặc khôi phục dữ liệu từ máy tính khác
              </p>
            </div>

            <div className="settings-action-grid">
              <button
                type="button"
                className="settings-action-btn"
                onClick={onExportJson}
                title="Tải file sao lưu dữ liệu (.json)"
              >
                <Download size={15} />
                <span>Lưu file (Xuất JSON)</span>
              </button>

              <button
                type="button"
                className="settings-action-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Nhập file sao lưu (.json) vào hệ thống"
              >
                <Upload size={15} />
                <span>Nhập file (Khôi phục)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={onImportJson}
              />
            </div>
          </div>

          {/* 4. TÀI KHOẢN & PHIÊN ĐĂNG NHẬP */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">TÀI KHOẢN</span>
              <h4 className="settings-section-title">Phiên đăng nhập</h4>
              <p className="settings-section-desc">
                {userEmail
                  ? `Đang đăng nhập với tài khoản: ${userEmail}`
                  : 'Đăng xuất tài khoản khỏi trình duyệt này'}
              </p>
            </div>

            <button
              type="button"
              className="settings-logout-btn"
              onClick={() => {
                onClose();
                onLogout?.();
              }}
              title="Đăng xuất tài khoản"
            >
              <LogOut size={15} />
              <span>Đăng xuất tài khoản</span>
            </button>
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

