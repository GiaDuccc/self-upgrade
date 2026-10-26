import React from 'react';
import './Skeleton.css';

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = '16px',
  borderRadius,
  className = '',
  style = {},
}) => {
  return (
    <span
      className={`sk-box sk-shimmer-base ${className}`}
      style={{
        width,
        height,
        borderRadius: borderRadius !== undefined ? borderRadius : undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  const calendarCells = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="overview-split-container" role="status" aria-label="Loading dashboard...">
      {/* CỘT BÊN TRÁI: 580PX */}
      <div className="overview-split-left-col">
        {/* Tiêu đề & Badge */}
        <div className="section-header-bar">
          <div>
            <SkeletonBox width="280px" height="26px" style={{ marginBottom: 6 }} />
            <SkeletonBox width="390px" height="14px" />
          </div>
          <SkeletonBox width="140px" height="32px" borderRadius="999px" />
        </div>

        {/* 4 Thẻ chỉ số tổng hợp (2x2) */}
        <div className="stats-cards-grid stats-cards-grid-split">
          {/* Card 1 */}
          <div className="stat-card stat-card-highlight sk-stat-card">
            <SkeletonBox width="150px" height="12px" />
            <div className="stat-value-row" style={{ marginTop: 6, marginBottom: 6 }}>
              <SkeletonBox width="85px" height="34px" />
              <SkeletonBox width="70px" height="22px" borderRadius="999px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <SkeletonBox width="190px" height="11px" />
              <SkeletonBox width="130px" height="11px" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="stat-card sk-stat-card">
            <SkeletonBox width="160px" height="12px" />
            <div className="stat-value-row" style={{ marginTop: 6, marginBottom: 6 }}>
              <SkeletonBox width="95px" height="34px" />
              <SkeletonBox width="60px" height="20px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <SkeletonBox width="180px" height="11px" />
              <SkeletonBox width="120px" height="11px" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="stat-card sk-stat-card">
            <SkeletonBox width="150px" height="12px" />
            <div className="stat-value-row" style={{ marginTop: 6, marginBottom: 6 }}>
              <SkeletonBox width="75px" height="34px" />
              <SkeletonBox width="65px" height="20px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <SkeletonBox width="170px" height="11px" />
              <SkeletonBox width="140px" height="11px" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="stat-card sk-stat-card">
            <SkeletonBox width="160px" height="12px" />
            <div className="stat-value-row" style={{ marginTop: 6, marginBottom: 6 }}>
              <SkeletonBox width="80px" height="34px" />
              <SkeletonBox width="65px" height="22px" borderRadius="999px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <SkeletonBox width="185px" height="11px" />
              <SkeletonBox width="115px" height="11px" />
            </div>
          </div>
        </div>

        {/* 2 Thẻ biểu đồ */}
        <div className="charts-split-stack">
          {/* Biểu đồ Đường */}
          <div className="chart-box sk-chart-box-line">
            <div className="chart-header">
              <div>
                <SkeletonBox width="230px" height="18px" style={{ marginBottom: 4 }} />
                <SkeletonBox width="340px" height="12px" />
              </div>
              <SkeletonBox width="105px" height="24px" borderRadius="4px" />
            </div>
            <div className="sk-line-canvas">
              {[45, 60, 35, 75, 90, 65, 80, 50, 85, 95, 70, 85, 90, 60, 80, 92].map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}
                >
                  <SkeletonBox width="100%" height="100%" borderRadius="3px" />
                </div>
              ))}
            </div>
          </div>

          {/* Biểu đồ Phân bổ Tròn */}
          <div className="chart-box sk-chart-box-donut">
            <div className="chart-header">
              <div>
                <SkeletonBox width="240px" height="18px" style={{ marginBottom: 4 }} />
                <SkeletonBox width="280px" height="12px" style={{ marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <SkeletonBox width="110px" height="28px" borderRadius="6px" />
                  <SkeletonBox width="90px" height="28px" borderRadius="6px" />
                </div>
              </div>
            </div>
            <div className="sk-donut-canvas">
              <div className="sk-donut-circle-shape sk-shimmer-base" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxWidth: 240 }}>
                <SkeletonBox width="100%" height="16px" />
                <SkeletonBox width="85%" height="16px" />
                <SkeletonBox width="70%" height="16px" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT BÊN PHẢI: MINMAX(0, 1FR) - LỊCH 31 NGÀY */}
      <div className="overview-split-right-col">
        <section className="month-days-section">
          <div className="section-header-bar">
            <div>
              <SkeletonBox width="250px" height="22px" style={{ marginBottom: 6 }} />
              <SkeletonBox width="330px" height="13px" />
            </div>
            <div className="grid-legend-pills">
              <SkeletonBox width="90px" height="22px" borderRadius="999px" />
              <SkeletonBox width="90px" height="22px" borderRadius="999px" />
              <SkeletonBox width="110px" height="22px" borderRadius="999px" />
            </div>
          </div>

          <div className="month-days-grid">
            {calendarCells.map((dayNum) => (
              <div key={dayNum} className="day-cell-card sk-day-cell">
                <div className="day-cell-top">
                  <div className="day-cell-number-wrap">
                    <SkeletonBox width="24px" height="20px" />
                    <SkeletonBox width="22px" height="12px" />
                  </div>
                  {dayNum % 7 === 0 && <SkeletonBox width="45px" height="16px" borderRadius="999px" />}
                </div>
                <SkeletonBox width="75%" height="18px" borderRadius="999px" />
                <SkeletonBox width="100%" height="5px" borderRadius="999px" />
                <SkeletonBox width="60%" height="12px" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const DayDetailSkeleton: React.FC = () => {
  return (
    <div className="day-split-page-wrapper" id="day-detail-panel" role="status" aria-label="Loading day schedule...">
      <div className="day-split-container">
        {/* CỘT TRÁI: 460PX */}
        <section className="day-detail-section day-split-left-col">
          {/* Thanh chuyển ngày */}
          <div className="day-page-topbar">
            <div className="day-date-switcher">
              <SkeletonBox width="32px" height="32px" borderRadius="6px" />
              <SkeletonBox width="90px" height="24px" />
              <SkeletonBox width="32px" height="32px" borderRadius="6px" />
            </div>
            <div className="day-tag-row">
              <SkeletonBox width="95px" height="24px" borderRadius="4px" />
              <SkeletonBox width="60px" height="24px" borderRadius="4px" />
              <SkeletonBox width="65px" height="24px" borderRadius="4px" />
            </div>
          </div>

          {/* Tiêu đề & mô tả */}
          <div className="day-detail-title-group">
            <SkeletonBox width="220px" height="26px" style={{ marginBottom: 4 }} />
            <SkeletonBox width="360px" height="14px" />
          </div>

          {/* Thẻ điểm số tổng hợp & Trạng thái cá nhân */}
          <div className="day-score-summary-card sk-day-score-summary">
            <div className="day-score-main">
              <div className="day-score-left">
                <SkeletonBox width="115px" height="12px" style={{ marginBottom: 6 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <SkeletonBox width="105px" height="46px" />
                  <SkeletonBox width="95px" height="24px" borderRadius="999px" />
                </div>
                <SkeletonBox width="165px" height="13px" />
              </div>
              <div className="day-rank-box">
                <SkeletonBox width="50px" height="12px" style={{ marginBottom: 6 }} />
                <SkeletonBox width="90px" height="26px" borderRadius="6px" />
              </div>
            </div>

            {/* Trạng thái cá nhân */}
            <div className="day-state-section">
              <div className="day-state-header">
                <SkeletonBox width="140px" height="14px" />
                <SkeletonBox width="75px" height="24px" borderRadius="6px" />
              </div>
              <div className="day-state-cards-grid">
                <div className="state-mini-card sk-state-mini">
                  <SkeletonBox width="45px" height="10px" />
                  <SkeletonBox width="60px" height="16px" />
                </div>
                <div className="state-mini-card sk-state-mini">
                  <SkeletonBox width="45px" height="10px" />
                  <SkeletonBox width="60px" height="16px" />
                </div>
                <div className="state-mini-card sk-state-mini">
                  <SkeletonBox width="45px" height="10px" />
                  <SkeletonBox width="60px" height="16px" />
                </div>
              </div>
              <div className="sk-sleep-banner">
                <SkeletonBox width="120px" height="16px" />
                <SkeletonBox width="70px" height="16px" />
              </div>
            </div>

            {/* Progress bar */}
            <SkeletonBox width="100%" height="8px" borderRadius="999px" />

            {/* Thao tác nhanh */}
            <div className="day-quick-actions">
              <SkeletonBox width="100px" height="34px" borderRadius="6px" />
              <SkeletonBox width="95px" height="34px" borderRadius="6px" />
              <SkeletonBox width="105px" height="34px" borderRadius="6px" />
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: MINMAX(0, 1FR) */}
        <section className="day-detail-section day-split-right-col">
          {/* Tab Bar: To-do List, Calories, Workout */}
          <div className="day-mode-tab-bar" style={{ display: 'flex', gap: 10 }}>
            <SkeletonBox width="140px" height="38px" borderRadius="6px" />
            <SkeletonBox width="165px" height="38px" borderRadius="6px" />
            <SkeletonBox width="140px" height="38px" borderRadius="6px" />
          </div>

          {/* Timetable Matrix Skeleton 1:1 */}
          <div className="sk-timetable-skeleton">
            {/* Header row: Corner + 24 hours */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(34, 34, 32, 0.08)' }}>
              <div className="sk-timetable-corner" />
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="sk-timetable-header-cell">
                  <SkeletonBox width="50px" height="14px" style={{ margin: '0 auto' }} />
                </div>
              ))}
            </div>
            {/* 5 Task rows: Việc 1 .. Việc 5 */}
            {Array.from({ length: 5 }, (_, rIdx) => (
              <div key={rIdx} className="sk-timetable-row">
                <div className="sk-timetable-y-cell">
                  <SkeletonBox width="45px" height="14px" />
                </div>
                {Array.from({ length: 10 }, (_, cIdx) => (
                  <div key={cIdx} className="sk-timetable-task-cell">
                    {(rIdx + cIdx) % 3 === 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <SkeletonBox width="18px" height="18px" borderRadius="4px" />
                          <SkeletonBox width="40px" height="16px" borderRadius="999px" />
                        </div>
                        <SkeletonBox width="85%" height="13px" />
                        <SkeletonBox width="50%" height="11px" />
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Ghi chú ngày 1:1 */}
          <div className="day-note-box sk-day-note-box">
            <div className="day-note-header">
              <SkeletonBox width="200px" height="16px" />
              <SkeletonBox width="120px" height="13px" />
            </div>
            <SkeletonBox width="100%" height="56px" borderRadius="6px" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <SkeletonBox width="100px" height="32px" borderRadius="6px" />
              <SkeletonBox width="110px" height="32px" borderRadius="6px" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export const AuthSkeleton: React.FC<{ mode?: 'signin' | 'signup' }> = ({ mode = 'signin' }) => {
  return (
    <div className="auth-page-shell" role="status" aria-label="Loading authentication...">
      <div className="auth-card" style={{ animation: 'fadeIn 0.25s ease-out' }}>
        <div className="server-reconnect-banner" style={{ margin: 0, padding: '8px 14px' }}>
          <span className="reconnect-pulse-dot" />
          <span style={{ fontSize: '0.78rem' }}>
            Máy chủ đang khởi động... Đang tự động kết nối
          </span>
        </div>

        <div className="auth-brand-header">
          <SkeletonBox width="48px" height="48px" borderRadius="50%" />
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6 }}>
            <SkeletonBox width={mode === 'signup' ? '200px' : '160px'} height="24px" />
            <SkeletonBox width="100%" height="13px" />
          </div>
        </div>

        <div className="auth-form">
          {/* Ô nhập Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonBox width="110px" height="13px" />
            <SkeletonBox width="100%" height="44px" borderRadius="8px" />
          </div>

          {/* Ô nhập Mật khẩu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonBox width="130px" height="13px" />
            <SkeletonBox width="100%" height="44px" borderRadius="8px" />
          </div>

          {/* Ô Nhập lại mật khẩu nếu là trang Đăng ký */}
          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBox width="160px" height="13px" />
              <SkeletonBox width="100%" height="44px" borderRadius="8px" />
            </div>
          )}

          {/* Nút Submit */}
          <SkeletonBox width="100%" height="46px" borderRadius="8px" style={{ marginTop: 6 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SkeletonBox width="200px" height="14px" />
        </div>
      </div>
    </div>
  );
};
