import React, { useState } from 'react';
import { MonthDayItem, MonthStats } from '~/interface/discipline.interface';
import { translateRankTitle, useLanguage } from '~/utils/i18n';

interface MonthlyLineChartProps {
  daysList: MonthDayItem[];
  selectedDateKey: string;
  onSelectDay: (dateKey: string) => void;
}

export const MonthlyLineChart: React.FC<MonthlyLineChartProps> = ({
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
  const padTop = 22;
  const padBottom = 34;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const count = daysList.length || 30;

  const getX = (index: number) => {
    if (count <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (count - 1)) * plotWidth;
  };

  const getY = (percentage: number) => {
    const clamped = Math.max(0, Math.min(100, percentage || 0));
    return padTop + plotHeight - (clamped / 100) * plotHeight;
  };

  const points = daysList.map((d, idx) => ({
    x: getX(idx),
    y: getY(d.percentage),
    ...d,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints =
    points.length > 0
      ? `${points[0].x},${padTop + plotHeight} ${polylinePoints} ${
          points[points.length - 1].x
        },${padTop + plotHeight}`
      : '';

  const yTicks = [0, 25, 50, 75, 100];

  const activePoint =
    hoveredDay ||
    points.find((p) => p.dateKey === selectedDateKey) ||
    null;

  return (
    <div className="chart-box">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">
            {isEn
              ? 'LINE CHART — DAILY PERFORMANCE (%)'
              : 'BIỂU ĐỒ ĐƯỜNG — HIỆU SUẤT THEO NGÀY (%)'}
          </h3>
          <p className="chart-subtitle">
            {isEn
              ? 'Click any point on the chart to open that day’s detail & check-in page'
              : 'Nhấn vào điểm bất kỳ trên biểu đồ để mở trang chi tiết & tích việc ngày đó'}
          </p>
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

      <div className="line-chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="line-chart-svg"
          role="img"
          aria-label="Biểu đồ đường điểm số trong tháng"
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

          {areaPoints && (
            <polygon points={areaPoints} fill="var(--chart-area)" />
          )}

          {polylinePoints && (
            <polyline
              fill="none"
              stroke="var(--chart-line)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {points.map((pt) => {
            const isSelected = pt.dateKey === selectedDateKey;
            if (!isSelected) return null;
            return (
              <line
                key={`guide-${pt.dateKey}`}
                x1={pt.x}
                y1={padTop}
                x2={pt.x}
                y2={padTop + plotHeight}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.55"
              />
            );
          })}

          {points.map((pt) => {
            const isSelected = pt.dateKey === selectedDateKey;
            const isHovered = hoveredDay?.dateKey === pt.dateKey;
            const hasData = pt.checkedCount > 0;
            const showDayLabel =
              pt.day === 1 ||
              pt.day % 5 === 0 ||
              pt.day === count ||
              isSelected;

            return (
              <g
                key={pt.dateKey}
                className="chart-point-group"
                onClick={() => onSelectDay(pt.dateKey)}
                onMouseEnter={() => setHoveredDay(pt)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <rect
                  x={pt.x - plotWidth / count / 2}
                  y={padTop}
                  width={Math.max(14, plotWidth / count)}
                  height={plotHeight + 24}
                  fill="transparent"
                />

                {(isSelected || isHovered) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={6.5}
                    fill="var(--bg-surface)"
                    stroke="var(--border-color)"
                    strokeWidth="2"
                  />
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 4 : hasData ? 3.2 : 2.2}
                  fill={
                    isSelected || hasData
                      ? 'var(--chart-line)'
                      : 'var(--bg-mixed)'
                  }
                  stroke="var(--border-color)"
                  strokeWidth={hasData || isSelected ? '1.5' : '1'}
                />

                {showDayLabel && (
                  <text
                    x={pt.x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`chart-axis-text ${
                      isSelected ? 'chart-axis-text-active' : ''
                    }`}
                  >
                    {pt.day}
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
      ? `${selectedDayStats.checkedCount}/${selectedDayStats.totalTasks || 5} tasks done`
      : `${selectedDayStats.checkedCount}/${selectedDayStats.totalTasks || 5} việc hoàn thành`
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
                    ? `${Math.max(0, (selectedDayStats.totalTasks || 5) - selectedDayStats.checkedCount)} tasks left`
                    : `${Math.max(0, (selectedDayStats.totalTasks || 5) - selectedDayStats.checkedCount)} việc còn lại`
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

