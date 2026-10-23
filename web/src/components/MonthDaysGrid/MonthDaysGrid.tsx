import React from 'react';
import { MonthDayItem } from '~/interface/discipline.interface';
import { translateRankTitle, translateWeekday, useLanguage } from '~/utils/i18n';

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
  const { language, isEn } = useLanguage();

  return (
    <section className="month-days-section">
      <div className="section-header-bar">
        <div>
          <h2 className="section-heading">
            {isEn
              ? `DAYS IN MONTH ${month}/${year}`
              : `DANH SÁCH CÁC NGÀY TRONG THÁNG ${month}/{year}`}
          </h2>
          <p className="section-subtext">
            {isEn
              ? 'Click any day below to open its detailed schedule & task check-in page'
              : 'Nhấn vào bất kỳ ngày nào bên dưới để chuyển sang trang chi tiết & tích công việc của ngày đó'}
          </p>
        </div>

        <div className="grid-legend-pills">
          <span className="legend-pill">
            <span className="dot dot-perfect" />{' '}
            {isEn ? 'Perfect (≥90%)' : 'Hoàn Hảo (≥90%)'}
          </span>
          <span className="legend-pill">
            <span className="dot dot-good" />{' '}
            {isEn ? 'Good (70–89%)' : 'Tốt (70–89%)'}
          </span>
          <span className="legend-pill">
            <span className="dot dot-mid" />{' '}
            {isEn ? 'Average / Poor (<70%)' : 'Trung bình / Tệ (<70%)'}
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
                  <span className="day-cell-weekday">
                    {translateWeekday(item.weekday, language)}
                  </span>
                </div>
                {isToday && (
                  <span className="day-cell-today-tag">
                    {isEn ? 'Today' : 'Hôm nay'}
                  </span>
                )}
              </div>

              <div className="day-cell-middle">
                <span className="day-cell-percent">{item.percentage}%</span>
                <span className="day-cell-rank-tag">
                  {translateRankTitle(item.rank.title, language)}
                </span>
              </div>

              <div className="day-cell-bar">
                <div
                  className="day-cell-bar-fill"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <div className="day-cell-footer">
                <span>
                  {item.checkedCount}/{item.totalTasks} {isEn ? 'tasks' : 'việc'}
                </span>
                <span>
                  {item.rawPoints}
                  {isEn ? ' pts' : 'đ'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
