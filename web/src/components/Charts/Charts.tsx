import React, { useState } from 'react';
import { MonthDayItem, MonthStats } from '~/interface/discipline.interface';
import { translateRankTitle, useLanguage } from '~/utils/i18n';

interface MonthlyBarChartProps {
  daysList: MonthDayItem[];
  selectedDateKey: string;
  onSelectDay: (dateKey: string) => void;
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({
  daysList = [],
  selectedDateKey,
  onSelectDay,
}) => {
  const [hoveredDay, setHoveredDay] = useState<MonthDayItem | null>(null);
  const { language, isEn } = useLanguage();

  const width = 760;
  const height = 230;
  const padLeft = 42;
  const padRight = 20;
  const padTop = 26;
  const padBottom = 34;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const count = daysList.length || 31;
  const slotWidth = plotWidth / count;
  const barWidth = Math.max(7, Math.min(14, slotWidth * 0.62));

  const getY = (percentage: number) => {
    const clamped = Math.max(0, Math.min(100, percentage || 0));
    return padTop + plotHeight - (clamped / 100) * plotHeight;
  };

  const yTicks = [0, 25, 50, 75, 100];

  const activePoint =
    hoveredDay ||
    daysList.find((p) => p.dateKey === selectedDateKey) ||
    null;

  return (
    <div className="chart-box">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">
            {isEn
              ? 'COLUMN CHART — DAILY PERFORMANCE (%)'
              : 'BIỂU ĐỒ CỘT — HIỆU SUẤT THEO NGÀY (%)'}
          </h3>
          {activePoint && (
            <div className="chart-active-badge">
              <span>
                {isEn ? 'Day' : 'Ngày'} {activePoint.day}:
              </span>
              <strong>{activePoint.percentage}%</strong>
              <span className="chart-badge-sub">
                ({activePoint.rawPoints}/{activePoint.maxPoints}
                {isEn ? ' pts' : 'đ'} •{' '}
                {translateRankTitle(activePoint.rank.title, language)})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bar-chart-wrapper line-chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="bar-chart-svg line-chart-svg"
          role="img"
          aria-label={
            isEn
              ? 'Monthly daily performance bar chart'
              : 'Biểu đồ cột hiệu suất theo ngày trong tháng'
          }
        >
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--chart-grid)"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="chart-axis-text"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {daysList.map((d, idx) => {
            const isSelected = d.dateKey === selectedDateKey;
            const isHovered = hoveredDay?.dateKey === d.dateKey;
            const clamped = Math.max(0, Math.min(100, d.percentage || 0));
            const centerX = padLeft + (idx + 0.5) * slotWidth;
            const barX = centerX - barWidth / 2;
            const barHeight = (clamped / 100) * plotHeight;
            const barY = padTop + plotHeight - barHeight;
            const hasData = d.checkedCount > 0;

            const showDayLabel =
              d.day === 1 ||
              d.day % 5 === 0 ||
              d.day === count ||
              isSelected;

            return (
              <g
                key={d.dateKey}
                className={`chart-bar-group ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectDay(d.dateKey)}
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                tabIndex={0}
                role="button"
                aria-label={
                  isEn
                    ? `Day ${d.day}: ${d.percentage}%, ${translateRankTitle(d.rank.title, language)}`
                    : `Ngày ${d.day}: ${d.percentage}%, ${translateRankTitle(d.rank.title, language)}`
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDay(d.dateKey);
                  }
                }}
              >
                {/* Vùng hit-box bắt tương tác click/hover trọn vẹn cả slot */}
                <rect
                  x={centerX - slotWidth / 2}
                  y={padTop}
                  width={slotWidth}
                  height={plotHeight + 24}
                  fill="transparent"
                />

                {/* Highlight nền phía sau khi cột được chọn */}
                {isSelected && (
                  <rect
                    x={centerX - slotWidth / 2 + 1}
                    y={padTop}
                    width={slotWidth - 2}
                    height={plotHeight}
                    fill="var(--chart-area)"
                    rx="3"
                  />
                )}

                {/* Cột track nền mờ thể hiện 100% capacity */}
                <rect
                  x={barX}
                  y={padTop}
                  width={barWidth}
                  height={plotHeight}
                  fill="var(--level-none)"
                  opacity={isSelected ? 0.6 : 0.35}
                  rx="2"
                />

                {/* Cột giá trị thực tế */}
                {clamped > 0 ? (
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={Math.max(3, barHeight)}
                    rx="2"
                    className="chart-bar-rect"
                    fill={
                      isSelected
                        ? 'var(--text-primary)'
                        : hasData
                        ? 'var(--chart-line)'
                        : 'var(--bg-mixed)'
                    }
                    stroke={isSelected ? 'var(--border-color)' : 'none'}
                    strokeWidth={isSelected ? '1' : '0'}
                  />
                ) : (
                  /* Vạch đáy 2px cho ngày có 0% */
                  <rect
                    x={barX}
                    y={padTop + plotHeight - 2}
                    width={barWidth}
                    height={2}
                    rx="1"
                    className="chart-bar-rect"
                    fill={isSelected ? 'var(--text-primary)' : 'var(--border-subtle)'}
                  />
                )}

                {/* Nhãn % nhỏ trên đỉnh cột khi được chọn hoặc hover */}
                {(isSelected || isHovered) && clamped > 0 && (
                  <text
                    x={centerX}
                    y={Math.max(padTop - 6, barY - 6)}
                    textAnchor="middle"
                    className="chart-bar-val-text"
                  >
                    {clamped}%
                  </text>
                )}

                {/* Nhãn ngày trên trục X */}
                {showDayLabel && (
                  <text
                    x={centerX}
                    y={height - 10}
                    textAnchor="middle"
                    className={`chart-axis-text ${
                      isSelected ? 'chart-axis-text-active' : ''
                    }`}
                  >
                    {d.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Giữ lại alias MonthlyLineChart để đảm bảo tính tương thích ngược hoàn toàn nếu có nơi cần dùng
export const MonthlyLineChart = MonthlyBarChart;

interface DistributionDonutChartProps {
  selectedDayStats: MonthDayItem;
  selectedDayLabel: string;
  monthStats: MonthStats;
}

export const DistributionDonutChart: React.FC<DistributionDonutChartProps> = ({
  selectedDayStats,
  selectedDayLabel,
  monthStats,
}) => {
  const [scope, setScope] = useState<'DAY' | 'MONTH'>('MONTH');
  const { language, isEn } = useLanguage();

  const isDayScope = scope === 'DAY';

  const centerPercent = Math.min(
    100,
    Math.max(
      0,
      isDayScope
        ? selectedDayStats.percentage
        : monthStats.avgActivePercentage
    )
  );

  const centerSubLabel = isDayScope
    ? isEn
      ? `${selectedDayStats.checkedCount}/${selectedDayStats.totalTasks ?? 0} tasks done`
      : `${selectedDayStats.checkedCount}/${selectedDayStats.totalTasks ?? 0} việc hoàn thành`
    : isEn
    ? `${monthStats.activeDaysCount}/${monthStats.totalDays} active days`
    : `${monthStats.activeDaysCount}/${monthStats.totalDays} ngày đã tích`;

  const size = 180;
  const strokeWidth = 22;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dashLength = (centerPercent / 100) * circumference;

  return (
    <div className="chart-box">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">
            {isEn
              ? 'DONUT CHART — COMPLETION PROGRESS (%)'
              : 'BIỂU ĐỒ TRÒN — TIẾN ĐỘ HOÀN THÀNH (%)'}
          </h3>
          <p className="chart-subtitle">
            {isDayScope
              ? isEn
                ? `Task completion rate for ${selectedDayLabel}`
                : `Tỷ lệ hoàn thành công việc của ${selectedDayLabel}`
              : isEn
              ? `Average completion performance in ${monthStats.month}/${monthStats.year}`
              : `Hiệu suất hoàn thành trung bình trong tháng ${monthStats.month}/${monthStats.year}`}
          </p>
          <div className="segmented-toggle" role="tablist">
            <button
              type="button"
              className={`seg-btn ${isDayScope ? 'active' : ''}`}
              onClick={() => setScope('DAY')}
            >
              {isEn ? 'Selected Day' : 'Ngày đang chọn'}
            </button>
            <button
              type="button"
              className={`seg-btn ${!isDayScope ? 'active' : ''}`}
              onClick={() => setScope('MONTH')}
            >
              {isEn ? 'Whole Month' : 'Cả tháng'}
            </button>
          </div>
        </div>
      </div>

      <div className="donut-chart-layout">
        <div className="donut-svg-container">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="donut-svg"
            role="img"
            aria-label={
              isEn
                ? 'Donut chart of completion progress'
                : 'Biểu đồ tròn tiến độ hoàn thành'
            }
          >
            {/* Vòng nền 100% */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--level-none)"
              strokeWidth={strokeWidth}
            />

            {/* Vòng tiến độ phần trăm đã hoàn thành */}
            {centerPercent > 0 && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="var(--text-primary)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={0}
                transform={`rotate(-90 ${center} ${center})`}
                style={{
                  transition:
                    'stroke-dasharray 0.35s ease, stroke-dashoffset 0.35s ease',
                }}
              />
            )}

            {/* Viền trang trí ngoài & trong */}
            <circle
              cx={center}
              cy={center}
              r={radius + strokeWidth / 2}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth="1"
            />
            <circle
              cx={center}
              cy={center}
              r={radius - strokeWidth / 2}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth="1"
            />
          </svg>

          <div className="donut-center-info">
            <span className="donut-percent">{centerPercent}%</span>
            <span className="donut-sub">{centerSubLabel}</span>
          </div>
        </div>

        <div className="donut-legend">
          <div className="legend-row">
            <div className="legend-left">
              <span
                className="legend-swatch"
                style={{ backgroundColor: 'var(--text-primary)' }}
              />
              <span className="legend-label">
                {isEn ? 'Completed' : 'Đã hoàn thành'}
              </span>
              <span className="legend-pts">
                ({isDayScope
                  ? isEn
                    ? `${selectedDayStats.checkedCount}/${selectedDayStats.totalTasks || 5} tasks`
                    : `${selectedDayStats.checkedCount}/${selectedDayStats.totalTasks || 5} việc`
                  : isEn
                  ? `${monthStats.activeDaysCount}/${monthStats.totalDays} days`
                  : `${monthStats.activeDaysCount}/${monthStats.totalDays} ngày`})
              </span>
            </div>
            <div className="legend-right">
              <strong>{centerPercent}%</strong>
            </div>
          </div>

          <div className="legend-row">
            <div className="legend-left">
              <span
                className="legend-swatch"
                style={{ backgroundColor: 'var(--level-none)' }}
              />
              <span className="legend-label">
                {isEn ? 'Remaining' : 'Chưa hoàn thành'}
              </span>
              <span className="legend-pts">
                ({isDayScope
                  ? isEn
                    ? `${Math.max(0, (selectedDayStats.totalTasks || 5) - selectedDayStats.checkedCount)} tasks`
                    : `${Math.max(0, (selectedDayStats.totalTasks || 5) - selectedDayStats.checkedCount)} việc`
                  : isEn
                  ? `${Math.max(0, monthStats.totalDays - monthStats.activeDaysCount)} unlogged days`
                  : `${Math.max(0, monthStats.totalDays - monthStats.activeDaysCount)} ngày chưa ghi`})
              </span>
            </div>
            <div className="legend-right">
              <strong>{Math.max(0, 100 - centerPercent)}%</strong>
            </div>
          </div>

          <div className="legend-row">
            <div className="legend-left">
              <span
                className="legend-swatch"
                style={{ backgroundColor: 'var(--border-subtle)' }}
              />
              <span className="legend-label">{isEn ? 'Rank' : 'Đánh giá'}</span>
              <span className="legend-pts">
                ({translateRankTitle(
                  isDayScope ? selectedDayStats.rank.title : monthStats.monthRank.title,
                  language
                )})
              </span>
            </div>
            <div className="legend-right">
              <strong>
                {isDayScope
                  ? `${selectedDayStats.rawPoints}/${selectedDayStats.maxPoints}${isEn ? ' pts' : 'đ'}`
                  : `${monthStats.sumPoints}/${monthStats.maxMonthPoints}${isEn ? ' pts' : 'đ'}`}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

