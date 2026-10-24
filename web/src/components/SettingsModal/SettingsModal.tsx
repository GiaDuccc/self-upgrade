import React, { useRef, useEffect } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Flame,
  Dumbbell,
  X,
  Check,
  Download,
  Upload,
  LogOut,
  Globe,
  Keyboard,
} from 'lucide-react';
import { AppLanguage } from '~/utils/i18n';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: (theme: 'light' | 'dark') => void;
  language: AppLanguage;
  onToggleLanguage: (lang: AppLanguage) => void;
  isCaloriesEnabled: boolean;
  onToggleCalories: (enabled: boolean) => void;
  isWorkoutEnabled?: boolean;
  onToggleWorkout?: (enabled: boolean) => void;
  onOpenShortcutsModal?: () => void;
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
  language,
  onToggleLanguage,
  isCaloriesEnabled,
  onToggleCalories,
  isWorkoutEnabled = true,
  onToggleWorkout,
  onOpenShortcutsModal,
  onExportJson,
  onImportJson,
  onLogout,
  userEmail,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEn = language === 'en';

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
              <h3 className="modal-title">
                {isEn ? 'SYSTEM SETTINGS' : 'CÀI ĐẶT HỆ THỐNG'}
              </h3>
              <p className="modal-subtitle">
                {isEn
                  ? 'Customize display theme, language, modules, data backup and account'
                  : 'Tùy chỉnh giao diện, ngôn ngữ, tính năng, sao lưu dữ liệu và tài khoản'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label={isEn ? 'Close settings' : 'Đóng cài đặt'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body settings-modal-body">
          {/* 1. GIAO DIỆN (THEME) */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">
                {isEn ? 'APPEARANCE' : 'GIAO DIỆN'}
              </span>
              <h4 className="settings-section-title">
                {isEn ? 'Color Theme Mode' : 'Chế độ hiển thị màu sắc'}
              </h4>
              <p className="settings-section-desc">
                {isEn
                  ? 'Choose classic Light Kraft paper theme or eye-friendly Dark mode'
                  : 'Chọn giao diện nền Sáng (Light) cổ điển hoặc Tối (Dark) dịu mắt ban đêm'}
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
                    <strong>{isEn ? 'Light Mode' : 'Chế độ Sáng'}</strong>
                    {theme === 'light' && (
                      <span className="theme-badge-current">
                        <Check size={12} /> {isEn ? 'Active' : 'Đang dùng'}
                      </span>
                    )}
                  </div>
                  <span className="theme-card-desc">
                    {isEn
                      ? 'Warm Kraft paper tone, high contrast, optimal for daytime'
                      : 'Tông giấy Kraft ấm áp, độ tương phản cao, tối ưu cho ban ngày'}
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
                    <strong>{isEn ? 'Dark Mode' : 'Chế độ Tối'}</strong>
                    {theme === 'dark' && (
                      <span className="theme-badge-current">
                        <Check size={12} /> {isEn ? 'Active' : 'Đang dùng'}
                      </span>
                    )}
                  </div>
                  <span className="theme-card-desc">
                    {isEn
                      ? 'Soothing dark background, reduces eye strain at night'
                      : 'Nền tối dịu mắt, giảm căng thẳng thị giác khi làm việc ban đêm'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. NGÔN NGỮ HIỂN THỊ (LANGUAGE) */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">
                {isEn ? 'LANGUAGE' : 'NGÔN NGỮ HIỂN THỊ'}
              </span>
              <h4 className="settings-section-title">
                {isEn ? 'Interface Language' : 'Ngôn ngữ giao diện màn hình'}
              </h4>
              <p className="settings-section-desc">
                {isEn
                  ? 'Applies only to screen labels. User inputs and API payloads remain unchanged.'
                  : 'Chỉ đổi nhãn hiển thị trên màn hình, giữ nguyên nội dung người dùng nhập và dữ liệu gửi API.'}
              </p>
            </div>

            <div className="theme-options-grid">
              <button
                type="button"
                className={`theme-card ${language === 'vi' ? 'active' : ''}`}
                onClick={() => onToggleLanguage('vi')}
              >
                <div className="theme-card-icon-box light-preview">
                  <Globe size={18} />
                </div>
                <div className="theme-card-info">
                  <div className="theme-card-title-row">
                    <strong>Tiếng Việt (VI)</strong>
                    {language === 'vi' && (
                      <span className="theme-badge-current">
                        <Check size={12} /> {isEn ? 'Active' : 'Đang dùng'}
                      </span>
                    )}
                  </div>
                  <span className="theme-card-desc">
                    {isEn
                      ? 'Default Vietnamese interface for all screens'
                      : 'Giao diện tiếng Việt mặc định cho toàn bộ hệ thống'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`theme-card ${language === 'en' ? 'active' : ''}`}
                onClick={() => onToggleLanguage('en')}
              >
                <div className="theme-card-icon-box dark-preview">
                  <Globe size={18} />
                </div>
                <div className="theme-card-info">
                  <div className="theme-card-title-row">
                    <strong>English (EN)</strong>
                    {language === 'en' && (
                      <span className="theme-badge-current">
                        <Check size={12} /> {isEn ? 'Active' : 'Đang dùng'}
                      </span>
                    )}
                  </div>
                  <span className="theme-card-desc">
                    {isEn
                      ? 'Clean English UI for discipline tracking & analytics'
                      : 'Giao diện tiếng Anh tối giản cho theo dõi kỷ luật & thống kê'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. THIẾT LẬP TÍNH NĂNG (FEATURES) */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">
                {isEn ? 'ADD-ON MODULES' : 'TÍNH NĂNG BỔ TRỢ'}
              </span>
              <h4 className="settings-section-title">
                {isEn ? 'System Modules Management' : 'Quản lý các module hệ thống'}
              </h4>
              <p className="settings-section-desc">
                {isEn
                  ? 'Enable or disable modules based on your tracking preferences'
                  : 'Bật hoặc tắt các tính năng phù hợp với nhu cầu theo dõi của bạn'}
              </p>
            </div>

            <div className="feature-item-row">
              <div className="feature-item-icon-box">
                <Flame size={20} />
              </div>
              <div className="feature-item-text">
                <div className="feature-item-title-row">
                  <strong>
                    {isEn
                      ? 'Calories & Nutrition Tracker'
                      : 'Theo dõi Calories & Dinh dưỡng'}
                  </strong>
                  <span
                    className={`feature-status-tag ${
                      isCaloriesEnabled ? 'status-enabled' : 'status-disabled'
                    }`}
                  >
                    {isCaloriesEnabled
                      ? isEn
                        ? 'ENABLED'
                        : 'ĐANG BẬT'
                      : isEn
                      ? 'DISABLED'
                      : 'ĐÃ TẮT'}
                  </span>
                </div>
                <p className="feature-item-desc">
                  {isEn
                    ? 'Show meal logging tab, 5 macro metrics and AI Nutritionist in Day Detail. Disable to focus purely on your To-do list.'
                    : 'Hiển thị tab ghi nhận bữa ăn, tính toán 5 chỉ số đa lượng và AI dinh dưỡng trong trang Chi tiết ngày. Tắt đi nếu bạn chỉ muốn tập trung hoàn toàn vào To-do list.'}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isCaloriesEnabled}
                className={`toggle-switch-btn ${isCaloriesEnabled ? 'is-active' : ''}`}
                onClick={() => onToggleCalories(!isCaloriesEnabled)}
                title={
                  isCaloriesEnabled
                    ? isEn
                      ? 'Click to disable Calories mode'
                      : 'Nhấn để tắt chế độ Calories'
                    : isEn
                    ? 'Click to enable Calories mode'
                    : 'Nhấn để bật chế độ Calories'
                }
              >
                <span className="toggle-switch-thumb" />
              </button>
            </div>

            {/* Gym & Workout Tracker Module */}
            <div className="feature-item-row" style={{ marginTop: '12px' }}>
              <div className="feature-item-icon-box">
                <Dumbbell size={20} />
              </div>
              <div className="feature-item-text">
                <div className="feature-item-title-row">
                  <strong>
                    {isEn
                      ? 'Gym & Workout Tracker'
                      : 'Theo dõi Tập luyện (Gym Tracker)'}
                  </strong>
                  <span
                    className={`feature-status-tag ${
                      isWorkoutEnabled ? 'status-enabled' : 'status-disabled'
                    }`}
                  >
                    {isWorkoutEnabled
                      ? isEn
                        ? 'ENABLED'
                        : 'ĐANG BẬT'
                      : isEn
                      ? 'DISABLED'
                      : 'ĐÃ TẮT'}
                  </span>
                </div>
                <p className="feature-item-desc">
                  {isEn
                    ? 'Log gym sessions, sets, reps, RIR and analyze Progressive Overload with AI Coach in Day Detail.'
                    : 'Ghi chép buổi tập gym, set, rep, RIR và phân tích Progressive Overload cùng AI Huấn Luyện Viên trong Chi tiết ngày.'}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isWorkoutEnabled}
                className={`toggle-switch-btn ${isWorkoutEnabled ? 'is-active' : ''}`}
                onClick={() => onToggleWorkout?.(!isWorkoutEnabled)}
                title={
                  isWorkoutEnabled
                    ? isEn
                      ? 'Click to disable Workout mode'
                      : 'Nhấn để tắt chế độ Tập luyện'
                    : isEn
                    ? 'Click to enable Workout mode'
                    : 'Nhấn để bật chế độ Tập luyện'
                }
              >
                <span className="toggle-switch-thumb" />
              </button>
            </div>
          </div>

          {/* 4. PHÍM TẮT NHANH (SHORTCUTS) */}
          {onOpenShortcutsModal && (
            <div className="settings-section">
              <div className="settings-section-header">
                <span className="settings-section-tag">
                  {isEn ? 'PRODUCTIVITY' : 'NĂNG SUẤT'}
                </span>
                <h4 className="settings-section-title">
                  {isEn ? 'Keyboard Shortcuts Guide' : 'Bảng tra cứu phím tắt nhanh'}
                </h4>
                <p className="settings-section-desc">
                  {isEn
                    ? 'Boost your workflow efficiency with instant hotkeys for navigation, habits, and water tracking'
                    : 'Tăng tốc thao tác quản lý kỷ luật với các phím tắt nhanh chuyển ngày, tích việc và nạp nước'}
                </p>
              </div>

              <div className="settings-action-grid" style={{ gridTemplateColumns: '1fr' }}>
                <button
                  type="button"
                  className="settings-action-btn"
                  onClick={() => {
                    onClose();
                    onOpenShortcutsModal();
                  }}
                  title={isEn ? 'View all keyboard shortcuts' : 'Xem danh sách toàn bộ phím tắt'}
                >
                  <Keyboard size={15} />
                  <span>
                    {isEn ? 'View All Keyboard Shortcuts (?)' : 'Xem bảng toàn bộ phím tắt nhanh (?)'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 5. DỮ LIỆU & SAO LƯU (BACKUP) */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">
                {isEn ? 'DATA & BACKUP' : 'DỮ LIỆU & SAO LƯU'}
              </span>
              <h4 className="settings-section-title">
                {isEn ? 'Backup & Restore Data' : 'Sao lưu và khôi phục dữ liệu'}
              </h4>
              <p className="settings-section-desc">
                {isEn
                  ? 'Export a JSON backup of all your progress or restore data from another device'
                  : 'Xuất file JSON sao lưu toàn bộ quá trình hoặc khôi phục dữ liệu từ máy tính khác'}
              </p>
            </div>

            <div className="settings-action-grid">
              <button
                type="button"
                className="settings-action-btn"
                onClick={onExportJson}
                title={
                  isEn
                    ? 'Download backup data file (.json)'
                    : 'Tải file sao lưu dữ liệu (.json)'
                }
              >
                <Download size={15} />
                <span>
                  {isEn ? 'Save File (Export JSON)' : 'Lưu file (Xuất JSON)'}
                </span>
              </button>

              <button
                type="button"
                className="settings-action-btn"
                onClick={() => fileInputRef.current?.click()}
                title={
                  isEn
                    ? 'Import backup file (.json) into system'
                    : 'Nhập file sao lưu (.json) vào hệ thống'
                }
              >
                <Upload size={15} />
                <span>
                  {isEn ? 'Import File (Restore)' : 'Nhập file (Khôi phục)'}
                </span>
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

          {/* 5. TÀI KHOẢN & PHIÊN ĐĂNG NHẬP */}
          <div className="settings-section">
            <div className="settings-section-header">
              <span className="settings-section-tag">
                {isEn ? 'ACCOUNT' : 'TÀI KHOẢN'}
              </span>
              <h4 className="settings-section-title">
                {isEn ? 'Active Session' : 'Phiên đăng nhập'}
              </h4>
              <p className="settings-section-desc">
                {userEmail
                  ? isEn
                    ? `Signed in as: ${userEmail}`
                    : `Đang đăng nhập với tài khoản: ${userEmail}`
                  : isEn
                  ? 'Sign out of your account on this browser'
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
              title={isEn ? 'Sign out of account' : 'Đăng xuất tài khoản'}
            >
              <LogOut size={15} />
              <span>{isEn ? 'Sign Out' : 'Đăng xuất tài khoản'}</span>
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
            {isEn ? 'Close' : 'Đóng'}
          </button>
        </div>
      </div>
    </div>
  );
};
