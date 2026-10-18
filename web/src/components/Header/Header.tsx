import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Upload,
  Plus,
  UserCheck,
  LayoutDashboard,
  CheckSquare,
  LogOut,
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
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
  onExportJson,
  onImportJson,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboardPage = location.pathname === '/';
  const isDayDetailPage = location.pathname.startsWith('/day');
  const targetDayKey = selectedDateKey || getTodayInfo().dateKey;

  return (
    <header className="top-navbar">
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

      {/* ĐIỀU HƯỚNG TÁCH RIÊNG 2 PAGE: DASHBOARD & CHI TIẾT NGÀY */}
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
          className="btn-minimal"
          onClick={onExportJson}
          title="Tải file sao lưu dữ liệu (JSON)"
        >
          <Download size={14} />
          <span>Lưu file</span>
        </button>

        <button
          type="button"
          className="btn-minimal"
          onClick={() => fileInputRef.current?.click()}
          title="Khôi phục dữ liệu từ file JSON"
        >
          <Upload size={14} />
          <span>Nhập file</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={onImportJson}
        />

        <button
          type="button"
          className="btn-minimal btn-profile-header"
          onClick={onOpenProfileModal}
          title="Nhập thông tin cá nhân, Thể chất, Tinh thần & Cảm xúc để tối ưu chấm điểm và lời khuyên"
        >
          <UserCheck size={15} />
          <span>
            {userProfile.name?.trim()
              ? `${userProfile.name.trim()} • Cá nhân hóa`
              : 'Thông tin cá nhân'}
          </span>
        </button>

        <button
          type="button"
          className="btn-minimal btn-logout-header"
          onClick={onLogout}
          title="Đăng xuất tài khoản"
        >
          <LogOut size={14} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};

