import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  UserCheck,
  LayoutDashboard,
  CheckSquare,
  Settings,
  Keyboard,
} from 'lucide-react';
import { UserProfile } from '~/interface/user.interface';
import { getTodayInfo } from '~/utils/constants';
import { useLanguage } from '~/utils/i18n';

interface HeaderProps {
  currentYear: number;
  currentMonth: number;
  selectedDateKey: string;
  userProfile: UserProfile;
  userEmail?: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday: () => void;
  onOpenAddTaskModal: () => void;
  onOpenProfileModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenShortcutsModal: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  currentYear,
  currentMonth,
  selectedDateKey,
  userProfile,
  userEmail,
  onPrevMonth,
  onNextMonth,
  onJumpToday,
  onOpenAddTaskModal,
  onOpenProfileModal,
  onOpenSettingsModal,
  onOpenShortcutsModal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEn } = useLanguage();

  const isDashboardPage = location.pathname === '/';
  const isDayDetailPage = location.pathname.startsWith('/day');
  const routeDateMatch = location.pathname.match(/^\/day\/(\d{4}-\d{2}-\d{2})/);
  const targetDayKey = routeDateMatch ? routeDateMatch[1] : (selectedDateKey || getTodayInfo().dateKey);

  return (
    <header className="top-navbar">
      {/* HÀNG TRÊN: BRAND BÊN TRÁI & NAV TABS CỐ ĐỊNH Ở GÓC PHẢI */}
      <div className="top-navbar-row-top">
        <div className="brand-block" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo-mark">SU</div>
          <div className="brand-text-block">
            <h1 className="brand-title">
              SELF UPGRADE
              {userProfile.name?.trim() && (
                <span className="brand-user-name">
                  {` — ${userProfile.name.trim().toUpperCase()}`}
                </span>
              )}
            </h1>
            <p className="brand-subtitle">
              {userProfile.personalMotto?.trim()
                ? `“${userProfile.personalMotto.trim()}”`
                : userEmail ||
                  (isEn
                    ? 'Personal Discipline & Performance Tracking System'
                    : 'Hệ thống theo dõi kỷ luật & điểm hiệu suất cá nhân')}
            </p>
          </div>
        </div>

        {/* ĐIỀU HƯỚNG TÁCH RIÊNG 2 PAGE: DASHBOARD & CHI TIẾT NGÀY (CỐ ĐỊNH Ở GÓC PHẢI) */}
        <nav className="page-nav-tabs" aria-label={isEn ? 'Page navigation' : 'Điều hướng trang'}>
          <button
            type="button"
            className={`btn-minimal nav-tab-btn ${isDashboardPage ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <LayoutDashboard size={15} />
            <span className="nav-tab-text-desktop">{isEn ? 'Monthly Overview' : 'Tổng quan tháng'}</span>
            <span className="nav-tab-text-mobile">{isEn ? 'Month' : 'Tháng'}</span>
          </button>
          <button
            type="button"
            className={`btn-minimal nav-tab-btn ${isDayDetailPage ? 'active' : ''}`}
            onClick={() => {
              const savedTab = localStorage.getItem('activeDayTab');
              const query = savedTab && savedTab !== 'todolist' ? `?tab=${savedTab}` : '';
              navigate(`/day/${targetDayKey}${query}`);
            }}
          >
            <CheckSquare size={15} />
            <span className="nav-tab-text-desktop">
              {isEn ? 'Day Detail' : 'Chi tiết ngày'} ({targetDayKey.slice(8, 10)}/{targetDayKey.slice(5, 7)})
            </span>
            <span className="nav-tab-text-mobile">
              {targetDayKey.slice(8, 10)}/{targetDayKey.slice(5, 7)}
            </span>
          </button>
        </nav>
      </div>

      {/* HÀNG DƯỚI: PHÍA BÊN TRÁI LÀ NAVBAR CONTROLS */}
      <div className="top-navbar-row-bottom">
        <div className="navbar-controls">
          <div className="month-switcher">
            <button
              type="button"
              className="btn-minimal btn-icon"
              onClick={onPrevMonth}
              aria-label={isEn ? 'Previous month' : 'Tháng trước'}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="month-display">
              <Calendar size={14} />
              <span className="month-text-desktop">
                {isEn ? 'Month' : 'Tháng'} {String(currentMonth).padStart(2, '0')} / {currentYear}
              </span>
              <span className="month-text-mobile">
                {String(currentMonth).padStart(2, '0')}/{currentYear}
              </span>
            </div>
            <button
              type="button"
              className="btn-minimal btn-icon"
              onClick={onNextMonth}
              aria-label={isEn ? 'Next month' : 'Tháng sau'}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="btn-minimal btn-today-header"
            onClick={onJumpToday}
            title={isEn ? 'Today' : 'Hôm nay'}
          >
            <span className="header-btn-text">{isEn ? 'Today' : 'Hôm nay'}</span>
            <span className="header-btn-icon-label">HN</span>
          </button>

          <button
            type="button"
            className="btn-minimal btn-add-header"
            onClick={onOpenAddTaskModal}
            title={isEn ? 'Add a new task / habit' : 'Thêm một đầu việc / thói quen mới'}
          >
            <Plus size={15} />
            <span className="header-btn-text">{isEn ? 'Add Task' : 'Thêm đầu việc'}</span>
          </button>

          <button
            type="button"
            className="btn-minimal btn-profile-header"
            onClick={onOpenProfileModal}
            title={
              isEn
                ? 'Personal Profile, Physical, Mental & Emotional States'
                : 'Thông tin cá nhân, Thể chất, Tinh thần & Cảm xúc'
            }
          >
            <UserCheck size={15} />
            <span className="header-btn-text">
              {userProfile.name?.trim()
                ? userProfile.name.trim()
                : isEn
                ? 'Profile'
                : 'Hồ sơ'}
            </span>
          </button>

          <button
            type="button"
            className="btn-minimal btn-shortcuts-header"
            onClick={onOpenShortcutsModal}
            title={
              isEn
                ? 'Keyboard Shortcuts (?)'
                : 'Phím tắt nhanh (?)'
            }
            aria-label={isEn ? 'Keyboard Shortcuts' : 'Phím tắt nhanh'}
          >
            <Keyboard size={16} />
          </button>

          <button
            type="button"
            className="btn-minimal btn-settings-header"
            onClick={onOpenSettingsModal}
            title={
              isEn
                ? 'System Settings: Theme, Language, Calories, Backup, Sign Out...'
                : 'Cài đặt hệ thống: Giao diện sáng/tối, ngôn ngữ, bật/tắt calories, sao lưu dữ liệu, đăng xuất...'
            }
            aria-label={isEn ? 'System Settings' : 'Cài đặt hệ thống'}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
});
