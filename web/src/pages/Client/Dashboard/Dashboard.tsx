import React, { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MonthlyBarChart, DistributionDonutChart } from '~/components/Charts/Charts';
import { MonthDaysGrid } from '~/components/MonthDaysGrid/MonthDaysGrid';
import { DashboardSkeleton } from '~/components/Skeleton/Skeleton';
import { ClientOutletContext } from '~/pages/Client/ClientPage';
import { getTodayInfo } from '~/utils/constants';
import { translateRankTitle, useLanguage } from '~/utils/i18n';

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
  const { language, isEn } = useLanguage();

  if (isLoadingMonth || !monthStats) {
    return <DashboardSkeleton />;
  }

  const selectedDayItem =
    monthStats.daysList.find((d) => d.dateKey === selectedDateKey) ||
    monthStats.daysList[0];

  const handleNavigateToDay = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    navigate(`/day/${dateKey}`);
  };

  const monthRankTitle = translateRankTitle(monthStats.monthRank.title, language);

  return (
    <div className="overview-split-container">
      {/* CỘT BÊN TRÁI: BIỂU ĐỒ & THỐNG KÊ THÁNG */}
      <div className="overview-split-left-col">
        <div className="section-header-bar">
          <div>
            <h2 className="section-heading">
              {isEn
                ? `MONTHLY OVERVIEW — ${currentMonth}/${currentYear}`
                : `TỔNG QUAN THỐNG KÊ THÁNG ${currentMonth}/${currentYear}`}
            </h2>
            {/* <p className="section-subtext">
              {isEn
                ? 'Scoring Scale: Unselected (0pt) • Poor (1pt) • Good (5pts) • Perfect (10pts)'
                : 'Thang điểm: Chưa chọn (0đ) • Tệ (1đ) • Tốt (5đ) • Hoàn Hảo (10đ)'}
            </p> */}
          </div>
          <div className="month-rank-pill">
            <span>{isEn ? 'Monthly Rank:' : 'Đánh giá tháng:'}</span>
            <strong>{monthRankTitle}</strong>
          </div>
        </div>

        {/* 4 Thẻ chỉ số tổng hợp tháng (dạng lưới 2x2 gọn gàng) */}
        <div className="stats-cards-grid stats-cards-grid-split">
          <div className="stat-card stat-card-highlight">
            <span className="stat-label">
              {isEn ? 'AVERAGE SCORE (ACTIVE DAYS)' : 'ĐIỂM TRUNG BÌNH (NGÀY ĐÃ TÍCH)'}
            </span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.avgActivePercentage}%
              </span>
              <span className="stat-tag">{monthRankTitle}</span>
            </div>
            <span className="stat-footnote">
              {isEn
                ? `Calculated across ${monthStats.activeDaysCount} active days this month`
                : `Tính trên ${monthStats.activeDaysCount} ngày có hoạt động trong tháng`}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              {isEn ? 'TOTAL ACCUMULATED POINTS' : 'TỔNG ĐIỂM TÍCH LŨY THÁNG'}
            </span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.sumPoints.toLocaleString(isEn ? 'en-US' : 'vi-VN')}
              </span>
              <span className="stat-unit">
                / {monthStats.maxMonthPoints.toLocaleString(isEn ? 'en-US' : 'vi-VN')}
                {isEn ? ' pts' : 'đ'}
              </span>
            </div>
            <span className="stat-footnote">
              {isEn
                ? `Reached ${monthStats.overallMonthPercentage}% of maximum monthly points`
                : `Đạt ${monthStats.overallMonthPercentage}% tổng điểm tối đa toàn tháng`}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              {isEn ? 'ACTIVE CHECK-IN DAYS' : 'SỐ NGÀY DUY TRÌ CHECK-IN'}
            </span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.activeDaysCount}
              </span>
              <span className="stat-unit">
                / {monthStats.totalDays} {isEn ? 'days' : 'ngày'}
              </span>
            </div>
            <span className="stat-footnote">
              {isEn
                ? `${monthStats.perfectDaysCount} days reached Perfect rank (>85%)`
                : `${monthStats.perfectDaysCount} ngày đạt mức Hoàn Hảo (>85%)`}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              {isEn ? 'PEAK PERFORMANCE DAY' : 'NGÀY PHONG ĐỘ CAO NHẤT'}
            </span>
            <div className="stat-value-row">
              <span className="stat-big-number">
                {monthStats.bestDay ? `${monthStats.bestDay.percentage}%` : '—'}
              </span>
              {monthStats.bestDay && (
                <span className="stat-tag">
                  {isEn ? 'Day' : 'Ngày'} {monthStats.bestDay.day}/{currentMonth}
                </span>
              )}
            </div>
            <span className="stat-footnote">
              {monthStats.bestDay
                ? isEn
                  ? `${monthStats.bestDay.rawPoints}/${monthStats.bestDay.maxPoints} pts (${translateRankTitle(monthStats.bestDay.rank.title, language)})`
                  : `${monthStats.bestDay.rawPoints}/${monthStats.bestDay.maxPoints} điểm (${monthStats.bestDay.rank.title})`
                : isEn
                ? 'No records logged this month yet'
                : 'Chưa có dữ liệu ghi nhận trong tháng'}
            </span>
          </div>
        </div>

        {/* Khu vực 2 Biểu đồ: Biểu đồ Cột & Biểu đồ Tròn xếp dọc */}
        <div className="charts-split-stack">
          <MonthlyBarChart
            daysList={monthStats.daysList}
            selectedDateKey={selectedDayItem.dateKey}
            onSelectDay={handleNavigateToDay}
          />

          <DistributionDonutChart
            selectedDayStats={selectedDayItem}
            selectedDayLabel={
              isEn
                ? `Day ${selectedDayItem.day}/${currentMonth}`
                : `Ngày ${selectedDayItem.day}/${currentMonth}`
            }
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
