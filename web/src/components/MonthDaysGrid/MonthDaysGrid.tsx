import React from 'react';
import { MonthDayItem } from '~/interface/discipline.interface';

interface MonthDaysGridProps {
  year: number;
  month: number;
  daysList: MonthDayItem[];
  selectedDateKey: string;
  todayDateKey: string;
  onSelectDay: (dateKey: string) => void;
}

export const MonthDaysGrid: React.FC<MonthDaysGridProps> = ({
  year,
  month,
  daysList = [],
  selectedDateKey,
  todayDateKey,
  onSelectDay,
}) => {
  return (
    <section className="month-days-section">
      <div className="section-header-bar">
        <div>
          <h2 className="section-heading">
            DANH SÁCH CÁC NGÀY TRONG THÁNG {month}/{year}
          </h2>
          <p className="section-subtext">
            Nhấn vào bất kỳ ngày nào bên dưới để chuyển sang trang chi tiết & tích công việc của ngày đó
          </p>
        </div>

        <div className="grid-legend-pills">
          <span className="legend-pill">
            <span className="dot dot-perfect" /> Hoàn Hảo (≥90%)
          </span>
          <span className="legend-pill">
            <span className="dot dot-good" /> Tốt (70–89%)
          </span>
          <span className="legend-pill">
            <span className="dot dot-mid" /> Trung bình / Tệ (&lt;70%)
          </span>
        </div>
      </div>

      <div className="month-days-grid">
        {daysList.map((item) => {
          const isSelected = item.dateKey === selectedDateKey;
          const isToday = item.dateKey === todayDateKey;
          const hasData = item.checkedCount > 0;

          return (
            <button
              key={item.dateKey}
              type="button"
              className={`day-cell-card ${isSelected ? 'selected' : ''} ${
                hasData ? 'has-data' : 'empty-day'
              }`}
              onClick={() => onSelectDay(item.dateKey)}
            >
              <div className="day-cell-top">
                <div className="day-cell-number-wrap">
                  <span className="day-cell-num">
                    {String(item.day).padStart(2, '0')}
                  </span>
                  <span className="day-cell-weekday">{item.weekday}</span>
                </div>
                {isToday && <span className="day-cell-today-tag">Hôm nay</span>}
              </div>

              <div className="day-cell-middle">
                <span className="day-cell-percent">{item.percentage}%</span>
                <span className="day-cell-rank-tag">{item.rank.title}</span>
              </div>

              <div className="day-cell-bar">
                <div
                  className="day-cell-bar-fill"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <div className="day-cell-footer">
                <span>
                  {item.checkedCount}/{item.totalTasks} việc
                </span>
                <span>{item.rawPoints}đ</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

