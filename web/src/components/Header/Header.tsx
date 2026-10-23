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
} from 'lucide-react';
import { UserProfile } from '~/interface/user.interface';
import { getTodayInfo } from '~/utils/constants';

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
}) => {
  const navigate = useNavigate();
  const location = useLocation();

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
          <div>
            <h1 className="brand-title">
              SELF UPGRADE
              {userProfile.name?.trim()
                ? ` — ${userProfile.name.trim().toUpperCase()}`
                : ''}
            </h1>
            <p className="brand-subtitle">
              {userProfile.personalMotto?.trim()
                ? `“${userProfile.personalMotto.trim()}”`
                : userEmail || 'Hệ thống theo dõi kỷ luật & điểm hiệu suất cá nhân'}
            </p>
          </div>
        </div>

        {/* ĐIỀU HƯỚNG TÁCH RIÊNG 2 PAGE: DASHBOARD & CHI TIẾT NGÀY (CỐ ĐỊNH Ở GÓC PHẢI) */}
        <nav className="page-nav-tabs" aria-label="Điều hướng trang">
          <button
            type="button"
            className={`btn-minimal nav-tab-btn ${isDashboardPage ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <LayoutDashboard size={15} />
            <span>Tổng quan tháng</span>
          </button>
          <button
            type="button"
            className={`btn-minimal nav-tab-btn ${isDayDetailPage ? 'active' : ''}`}
            onClick={() => navigate(`/day/${targetDayKey}`)}
          >
            <CheckSquare size={15} />
            <span>Chi tiết ngày ({targetDayKey.slice(8, 10)}/{targetDayKey.slice(5, 7)})</span>
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
            aria-label="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="month-display">
            <Calendar size={15} />
            <span>
              Tháng {String(currentMonth).padStart(2, '0')} / {currentYear}
            </span>
          </div>
          <button
            type="button"
            className="btn-minimal btn-icon"
            onClick={onNextMonth}
            aria-label="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          type="button"
          className="btn-minimal"
          onClick={onJumpToday}
        >
          Hôm nay
        </button>

        <button
          type="button"
          className="btn-minimal btn-add-header"
          onClick={onOpenAddTaskModal}
          title="Thêm một đầu việc / thói quen mới"
        >
          <Plus size={15} />
          <span>Thêm đầu việc</span>
        </button>

        <button
          type="button"
          className="btn-minimal btn-profile-header"
          onClick={onOpenProfileModal}
          title="Thông tin cá nhân, Thể chất, Tinh thần & Cảm xúc"
        >
          <UserCheck size={15} />
          <span>
            {userProfile.name?.trim()
              ? userProfile.name.trim()
              : 'Hồ sơ'}
          </span>
        </button>

        <button
          type="button"
          className="btn-minimal btn-settings-header"
          onClick={onOpenSettingsModal}
          title="Cài đặt hệ thống: Giao diện sáng/tối, bật/tắt calories, sao lưu dữ liệu, đăng xuất..."
          aria-label="Cài đặt hệ thống"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  </header>
);
});

