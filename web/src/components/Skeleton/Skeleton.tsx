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
  // Mô phỏng 31 ngày trong lịch
  const calendarCells = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="overview-split-container sk-dashboard-wrapper" role="status" aria-label="Loading dashboard...">
      {/* CỘT TRÁI: THỐNG KÊ & BIỂU ĐỒ */}
      <div className="overview-split-left-col">
        {/* Tiêu đề & Badge */}
        <div className="section-header-bar">
          <div>
            <SkeletonBox width="300px" height="26px" style={{ marginBottom: 8 }} />
            <SkeletonBox width="420px" height="14px" />
          </div>
          <SkeletonBox width="140px" height="34px" borderRadius="999px" />
        </div>

        {/* 4 Thẻ chỉ số tổng hợp (2x2) */}
        <div className="stats-cards-grid stats-cards-grid-split">
          {/* Card 1 */}
          <div className="stat-card stat-card-highlight">
            <SkeletonBox width="140px" height="12px" style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <SkeletonBox width="85px" height="38px" />
              <SkeletonBox width="70px" height="22px" borderRadius="999px" />
            </div>
            <SkeletonBox width="190px" height="12px" />
          </div>

          {/* Card 2 */}
          <div className="stat-card">
            <SkeletonBox width="160px" height="12px" style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <SkeletonBox width="95px" height="38px" />
              <SkeletonBox width="60px" height="20px" />
            </div>
            <SkeletonBox width="180px" height="12px" />
          </div>

          {/* Card 3 */}
          <div className="stat-card">
            <SkeletonBox width="150px" height="12px" style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <SkeletonBox width="70px" height="38px" />
              <SkeletonBox width="65px" height="20px" />
            </div>
            <SkeletonBox width="170px" height="12px" />
          </div>

          {/* Card 4 */}
          <div className="stat-card">
            <SkeletonBox width="160px" height="12px" style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <SkeletonBox width="80px" height="38px" />
              <SkeletonBox width="65px" height="22px" borderRadius="999px" />
            </div>
            <SkeletonBox width="190px" height="12px" />
          </div>
        </div>

        {/* 2 Thẻ biểu đồ (Đường & Tròn) */}
        <div className="charts-split-stack">
          {/* Biểu đồ Đường */}
          <div className="sk-chart-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="220px" height="20px" />
              <SkeletonBox width="100px" height="24px" borderRadius="999px" />
            </div>
            <div className="sk-chart-canvas-sim">
              {[45, 60, 35, 75, 90, 65, 80, 50, 85, 95, 70, 85, 90, 60].map((h, idx) => (
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
                  <SkeletonBox width="100%" height="100%" borderRadius="4px" />
                </div>
              ))}
            </div>
          </div>

          {/* Biểu đồ Phân bổ Tròn */}
          <div className="sk-chart-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="200px" height="20px" />
              <SkeletonBox width="90px" height="24px" borderRadius="999px" />
            </div>
            <div className="sk-donut-canvas-sim">
              <div className="sk-donut-circle sk-shimmer-base" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, maxWidth: 240 }}>
                <SkeletonBox width="100%" height="18px" />
                <SkeletonBox width="80%" height="18px" />
                <SkeletonBox width="65%" height="18px" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: LỊCH CÁC NGÀY TRONG THÁNG */}
      <div className="overview-split-right-col">
        <section className="month-days-section">
          <div className="section-header-bar">
            <div>
              <SkeletonBox width="240px" height="22px" style={{ marginBottom: 8 }} />
              <SkeletonBox width="320px" height="13px" />
            </div>
            <div className="grid-legend-pills">
              <SkeletonBox width="90px" height="22px" borderRadius="999px" />
              <SkeletonBox width="90px" height="22px" borderRadius="999px" />
              <SkeletonBox width="100px" height="22px" borderRadius="999px" />
            </div>
          </div>

          <div className="month-days-grid">
            {calendarCells.map((dayNum) => (
              <div key={dayNum} className="sk-grid-cell-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SkeletonBox width="26px" height="20px" />
                  <SkeletonBox width="24px" height="12px" />
                </div>
                <SkeletonBox width="100%" height="22px" borderRadius="4px" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const DayDetailSkeleton: React.FC = () => {
  const taskRows = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div className="day-split-page-wrapper sk-day-detail-wrapper" role="status" aria-label="Loading day schedule...">
      <div className="day-split-container">
        {/* CỘT TRÁI: ĐIỀU HƯỚNG, ĐIỂM SỐ, TRẠNG THÁI */}
        <section className="day-detail-section day-split-left-col">
          {/* Thanh chuyển ngày */}
          <div className="day-page-topbar">
            <div className="day-date-switcher">
              <SkeletonBox width="32px" height="32px" borderRadius="6px" />
              <SkeletonBox width="95px" height="24px" />
              <SkeletonBox width="32px" height="32px" borderRadius="6px" />
            </div>
            <div className="day-tag-row">
              <SkeletonBox width="95px" height="24px" borderRadius="4px" />
              <SkeletonBox width="60px" height="24px" borderRadius="999px" />
              <SkeletonBox width="65px" height="24px" borderRadius="999px" />
            </div>
          </div>

          {/* Tiêu đề trang */}
          <div className="day-detail-title-group">
            <SkeletonBox width="240px" height="28px" style={{ marginBottom: 8 }} />
            <SkeletonBox width="340px" height="14px" />
          </div>

          {/* Thẻ điểm số tổng hợp & Trạng thái */}
          <div className="sk-day-score-card">
            <div className="day-score-main">
              <div className="day-score-left">
                <SkeletonBox width="120px" height="12px" style={{ marginBottom: 8 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <SkeletonBox width="110px" height="46px" />
                  <SkeletonBox width="95px" height="24px" borderRadius="999px" />
                </div>
                <SkeletonBox width="170px" height="14px" />
              </div>
              <div className="day-rank-box">
                <SkeletonBox width="55px" height="12px" style={{ marginBottom: 8 }} />
                <SkeletonBox width="90px" height="26px" borderRadius="6px" />
              </div>
            </div>

            {/* Trạng thái 3 ô */}
            <div className="day-state-section">
              <div className="day-state-header">
                <SkeletonBox width="140px" height="14px" />
                <SkeletonBox width="75px" height="24px" borderRadius="6px" />
              </div>
              <div className="sk-state-mini-grid">
                <div className="sk-state-cell">
                  <SkeletonBox width="45px" height="11px" />
                  <SkeletonBox width="65px" height="18px" />
                </div>
                <div className="sk-state-cell">
                  <SkeletonBox width="45px" height="11px" />
                  <SkeletonBox width="65px" height="18px" />
                </div>
                <div className="sk-state-cell">
                  <SkeletonBox width="45px" height="11px" />
                  <SkeletonBox width="65px" height="18px" />
                </div>
              </div>
            </div>
          </div>

          {/* Module Lượng nước & Ghi chú */}
          <div className="sk-card-container" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <SkeletonBox width="140px" height="16px" />
              <SkeletonBox width="65px" height="20px" />
            </div>
            <SkeletonBox width="100%" height="42px" borderRadius="6px" />
          </div>
        </section>

        {/* CỘT PHẢI: TO-DO LIST & CÁC MODULE */}
        <section className="day-detail-section day-split-right-col">
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <SkeletonBox width="140px" height="38px" borderRadius="6px" />
            <SkeletonBox width="160px" height="38px" borderRadius="6px" />
            <SkeletonBox width="135px" height="38px" borderRadius="6px" />
          </div>

          {/* Danh sách nhiệm vụ to-do */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {taskRows.map((idx) => (
              <div key={idx} className="sk-task-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <SkeletonBox width="20px" height="20px" borderRadius="4px" />
                  <SkeletonBox width="44px" height="22px" borderRadius="4px" />
                  <SkeletonBox width={idx % 2 === 0 ? '240px' : '180px'} height="16px" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SkeletonBox width="80px" height="26px" borderRadius="999px" />
                  <SkeletonBox width="26px" height="26px" borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

