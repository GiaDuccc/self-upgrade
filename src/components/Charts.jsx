import React, { useState } from 'react';
import { SCORING } from '../config/settings';

/**
 * Biểu đồ Đường (Line Chart) hiển thị % điểm đạt được qua các ngày trong tháng.
 * Cập nhật tức thì mỗi khi người dùng tích công việc trong ngày.
 */
export function MonthlyLineChart({
  daysList = [],
  selectedDateKey,
  onSelectDay,
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const width = 760;
  const height = 230;
  const padLeft = 42;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 34;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const count = daysList.length || 30;

  const getX = (index) => {
    if (count <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (count - 1)) * plotWidth;
  };

  const getY = (percentage) => {
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
          <h3 className="chart-title">BIỂU ĐỒ ĐƯỜNG — HIỆU SUẤT THEO NGÀY (%)</h3>
          <p className="chart-subtitle">
            Nhấn vào điểm bất kỳ trên biểu đồ để xem hoặc tích việc ngày đó
          </p>
        </div>
        {activePoint && (
          <div className="chart-active-badge">
            <span>Ngày {activePoint.day}:</span>
            <strong>{activePoint.percentage}%</strong>
            <span className="chart-badge-sub">
              ({activePoint.rawPoints}/{activePoint.maxPoints}đ • {activePoint.rank.title})
            </span>
          </div>
        )}
      </div>

      <div className="line-chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="line-chart-svg"
          role="img"
          aria-label="Biểu đồ đường điểm số trong tháng"
        >
          {/* Lưới ngang 0% -> 100% */}
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

          {/* Vùng đổ bóng dưới đường biểu đồ */}
          {areaPoints && (
            <polygon points={areaPoints} fill="var(--chart-area)" />
          )}

          {/* Đường nối chính */}
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

          {/* Đường gióng dọc cho ngày đang chọn */}
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

          {/* Các nút điểm ngày */}
          {points.map((pt, idx) => {
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
                onClick={() => onSelectDay && onSelectDay(pt.dateKey)}
                onMouseEnter={() => setHoveredDay(pt)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Vùng click rộng để dễ tương tác */}
                <rect
                  x={pt.x - plotWidth / count / 2}
                  y={padTop}
                  width={Math.max(14, plotWidth / count)}
                  height={plotHeight + 24}
                  fill="transparent"
                />

                {/* Vòng tròn ngoài khi đang được chọn */}
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

                {/* Điểm dữ liệu */}
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

                {/* Nhãn ngày ở trục X */}
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
}

/**
 * Biểu đồ Tròn (Donut Chart) hiển thị tỷ lệ các mức: Hoàn Hảo, Tốt, Tệ, Chưa chọn.
 * Hỗ trợ xem trực tiếp Ngày đang chọn hoặc Tổng hợp cả tháng, tự động nhảy số ngay khi tích.
 */
export function DistributionDonutChart({
  selectedDayStats,
  selectedDayLabel,
  monthStats,
}) {
  const [scope, setScope] = useState('DAY'); // 'DAY' | 'MONTH'

  const isDayScope = scope === 'DAY';
  const counts = isDayScope
    ? selectedDayStats.counts
    : monthStats.monthCounts;

  const totalItems =
    counts.PERFECT + counts.GOOD + counts.BAD + counts.NONE;

  const centerPercent = isDayScope
    ? selectedDayStats.percentage
    : monthStats.avgActivePercentage;

  const centerSubLabel = isDayScope
    ? `${selectedDayStats.rawPoints}/${selectedDayStats.maxPoints} điểm`
    : `${monthStats.activeDaysCount}/${monthStats.totalDays} ngày đã tích`;

  const segments = [
    {
      key: 'PERFECT',
      label: SCORING.PERFECT.label,
      count: counts.PERFECT,
      color: 'var(--level-perfect)',
      pointsInfo: '10đ/việc',
    },
    {
      key: 'GOOD',
      label: SCORING.GOOD.label,
      count: counts.GOOD,
      color: 'var(--level-good)',
      pointsInfo: '5đ/việc',
    },
    {
      key: 'BAD',
      label: SCORING.BAD.label,
      count: counts.BAD,
      color: 'var(--level-bad)',
      pointsInfo: '1đ/việc',
    },
    {
      key: 'NONE',
      label: SCORING.NONE.label,
      count: counts.NONE,
      color: 'var(--level-none)',
      pointsInfo: '0đ',
    },
  ];

  // Vẽ SVG Donut bằng stroke-dasharray
  const size = 180;
  const strokeWidth = 22;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <div className="chart-box">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">BIỂU ĐỒ TRÒN — TỶ LỆ MỨC ĐỘ</h3>
          <p className="chart-subtitle">
            {isDayScope
              ? `Phân bổ 12 đầu việc của ${selectedDayLabel}`
              : `Phân bổ các ngày đã tích trong tháng ${monthStats.month}/${monthStats.year}`}
          </p>
        </div>

        <div className="segmented-toggle" role="tablist">
          <button
            type="button"
            className={`seg-btn ${isDayScope ? 'active' : ''}`}
            onClick={() => setScope('DAY')}
          >
            Ngày đang chọn
          </button>
          <button
            type="button"
            className={`seg-btn ${!isDayScope ? 'active' : ''}`}
            onClick={() => setScope('MONTH')}
          >
            Cả tháng
          </button>
        </div>
      </div>

      <div className="donut-chart-layout">
        <div className="donut-svg-container">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="donut-svg"
          >
            {/* Vòng nền mặc định khi tổng = 0 */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--level-none)"
              strokeWidth={strokeWidth}
            />

            {totalItems > 0 &&
              segments.map((seg) => {
                if (seg.count <= 0) return null;
                const ratio = seg.count / totalItems;
                const dashLength = ratio * circumference;
                const dashOffset = -accumulatedAngle * circumference;
                accumulatedAngle += ratio;

                return (
                  <circle
                    key={seg.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dashLength} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{
                      transition:
                        'stroke-dasharray 0.35s ease, stroke-dashoffset 0.35s ease',
                    }}
                  />
                );
              })}

            {/* Viền mảnh bao quanh để giữ chất minimalist sắc nét */}
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
          {segments.map((seg) => {
            const pct =
              totalItems > 0
                ? Math.round((seg.count / totalItems) * 100)
                : 0;
            return (
              <div key={seg.key} className="legend-row">
                <div className="legend-left">
                  <span
                    className="legend-swatch"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="legend-label">{seg.label}</span>
                  <span className="legend-pts">({seg.pointsInfo})</span>
                </div>
                <div className="legend-right">
                  <strong>{seg.count}</strong>
                  <span className="legend-pct">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
