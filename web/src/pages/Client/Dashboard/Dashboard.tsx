import React, { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MonthlyLineChart, DistributionDonutChart } from '~/components/Charts/Charts';
import { MonthDaysGrid } from '~/components/MonthDaysGrid/MonthDaysGrid';
import { ClientOutletContext } from '~/pages/Client/ClientPage';
import { getTodayInfo } from '~/utils/constants';

export const Dashboard: React.FC = () => {
  const {
    currentYear,
    currentMonth,
    selectedDateKey,
    setSelectedDateKey,
    monthStats,
    isLoadingMonth,
  } = useOutletContext<ClientOutletContext>();

  const navigate = useNavigate();
  const today = useMemo(() => getTodayInfo(), []);

  if (isLoadingMonth || !monthStats) {
    return (
      <div className="page-loading-box">
        <span>Đang tải dữ liệu thống kê tháng {currentMonth}/{currentYear}...</span>
      </div>
    );
  }

  const selectedDayItem =
    monthStats.daysList.find((d) => d.dateKey === selectedDateKey) ||
    monthStats.daysList[0];

  const handleNavigateToDay = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    navigate(`/day/${dateKey}`);
  };

  return (
    <div className="overview-split-container">
      {/* CỘT BÊN TRÁI: BIỂU ĐỒ & THÔNG KÊ THÁNG */}
      <div className="overview-split-left-col">
        <div className="section-header-bar">
          <div>
            <h2 className="section-heading">
              TỔNG QUAN THỐNG KÊ THÁNG {currentMonth}/{currentYear}
            </h2>
            <p className="section-subtext">
              Thang điểm: Chưa chọn (0đ) • Tệ (1đ) • Tốt (5đ) • Hoàn Hảo (10đ)
            </p>
          </div>
          <div className="month-rank-pill">
            <span>Đánh giá tháng:</span>
            <strong>{monthStats.monthRank.title}</strong>
          </div>
        </div>

        {/* 4 Thẻ chỉ số tổng hợp tháng (dạng lưới 2x2 gọn gàng) */}
        <div className="stats-cards-grid stats-cards-grid-split">
          <div className="stat-card stat-card-highlight">
            <span className="stat-label">ĐIỂM TRUNG BÌNH (NGÀY ĐÃ TÍCH)</span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.avgActivePercentage}%
              </span>
              <span className="stat-tag">{monthStats.monthRank.title}</span>
            </div>
            <span className="stat-footnote">
              Tính trên {monthStats.activeDaysCount} ngày có hoạt động trong tháng
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">TỔNG ĐIỂM TÍCH LŨY THÁNG</span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.sumPoints.toLocaleString('vi-VN')}
              </span>
              <span className="stat-unit">
                / {monthStats.maxMonthPoints.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <span className="stat-footnote">
              Đạt {monthStats.overallMonthPercentage}% tổng điểm tối đa toàn tháng
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">SỐ NGÀY DUY TRÌ CHECK-IN</span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.activeDaysCount}
              </span>
              <span className="stat-unit">/ {monthStats.totalDays} ngày</span>
            </div>
            <span className="stat-footnote">
              {monthStats.perfectDaysCount} ngày đạt mức Hoàn Hảo (≥90%)
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">NGÀY PHONG ĐỘ CAO NHẤT</span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.bestDay ? `${monthStats.bestDay.percentage}%` : '—'}
              </span>
              {monthStats.bestDay && (
                <span className="stat-tag">
                  Ngày {monthStats.bestDay.day}/{currentMonth}
                </span>
              )}
            </div>
            <span className="stat-footnote">
              {monthStats.bestDay
                ? `${monthStats.bestDay.rawPoints}/${monthStats.bestDay.maxPoints} điểm (${monthStats.bestDay.rank.title})`
                : 'Chưa có dữ liệu ghi nhận trong tháng'}
            </span>
          </div>
        </div>

        {/* Khu vực 2 Biểu đồ: Biểu đồ Đường & Biểu đồ Tròn xếp dọc */}
        <div className="charts-split-stack">
          <MonthlyLineChart
            daysList={monthStats.daysList}
            selectedDateKey={selectedDayItem.dateKey}
            onSelectDay={handleNavigateToDay}
          />

          <DistributionDonutChart
            selectedDayStats={selectedDayItem}
            selectedDayLabel={`Ngày ${selectedDayItem.day}/${currentMonth}`}
            monthStats={monthStats}
          />
        </div>
      </div>

      {/* CỘT BÊN PHẢI: CHỈ ĐỂ CÁC NGÀY TRONG THÁNG */}
      <div className="overview-split-right-col">
        <MonthDaysGrid
          year={currentYear}
          month={currentMonth}
          daysList={monthStats.daysList}
          selectedDateKey={selectedDayItem.dateKey}
          todayDateKey={today.dateKey}
          onSelectDay={handleNavigateToDay}
        />
      </div>
    </div>
  );
};

