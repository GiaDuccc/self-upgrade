import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  THEME,
  DAILY_TASKS,
  applyThemeToRoot,
} from './config/settings';
import {
  formatDateKey,
  getTodayInfo,
  loadAllRecords,
  saveAllRecords,
  calculateMonthStats,
  generateSampleDataForMonth,
} from './utils/storageAndStats';
import { MonthlyLineChart, DistributionDonutChart } from './components/Charts';
import { MonthDaysGrid } from './components/MonthDaysGrid';
import { DayDetailPanel } from './components/DayDetailPanel';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Upload,
  Wand2,
} from 'lucide-react';

export default function App() {
  const today = useMemo(() => getTodayInfo(), []);

  const [currentYear, setCurrentYear] = useState(today.year);
  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [selectedDateKey, setSelectedDateKey] = useState(today.dateKey);
  const [records, setRecords] = useState(() => loadAllRecords());

  const fileInputRef = useRef(null);

  // Đồng bộ bảng màu từ file cấu hình tập trung (src/config/settings.js)
  useEffect(() => {
    applyThemeToRoot(THEME);
  }, []);

  // Tự động lưu xuống LocalStorage mỗi khi records thay đổi
  useEffect(() => {
    saveAllRecords(records);
  }, [records]);

  // Tính toán thống kê toàn tháng và từng ngày (tự động tính lại khi tích bất kỳ việc nào)
  const monthStats = useMemo(
    () => calculateMonthStats(currentYear, currentMonth, records),
    [currentYear, currentMonth, records]
  );

  // Ngày đang được chọn
  const selectedDayItem = useMemo(() => {
    return (
      monthStats.daysList.find((d) => d.dateKey === selectedDateKey) ||
      monthStats.daysList[0]
    );
  }, [monthStats, selectedDateKey]);

  const selectedDayRecord = records[selectedDayItem?.dateKey] || {};

  // Chuyển tháng trước / sau
  const handlePrevMonth = () => {
    let nextY = currentYear;
    let nextM = currentMonth - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    setSelectedDateKey(formatDateKey(nextY, nextM, 1));
  };

  const handleNextMonth = () => {
    let nextY = currentYear;
    let nextM = currentMonth + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    setSelectedDateKey(formatDateKey(nextY, nextM, 1));
  };

  const handleJumpToday = () => {
    const t = getTodayInfo();
    setCurrentYear(t.year);
    setCurrentMonth(t.month);
    setSelectedDateKey(t.dateKey);
  };

  // Chọn 1 ngày từ danh sách tháng hoặc từ biểu đồ
  const handleSelectDay = (dateKey, scrollToDetail = false) => {
    setSelectedDateKey(dateKey);
    if (scrollToDetail) {
      const el = document.getElementById('day-detail-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Tích mức độ (Tệ / Tốt / Hoàn Hảo) cho 1 đầu việc của ngày đang chọn
  const handleSetTaskLevel = (taskId, levelKey) => {
    const targetDateKey = selectedDayItem.dateKey;
    setRecords((prev) => {
      const existingDay = prev[targetDateKey] || {};
      const existingTasks = { ...(existingDay.tasks || {}) };

      if (levelKey === 'NONE') {
        delete existingTasks[taskId];
      } else {
        existingTasks[taskId] = levelKey;
      }

      return {
        ...prev,
        [targetDateKey]: {
          ...existingDay,
          tasks: existingTasks,
        },
      };
    });
  };

  // Tích nhanh tất cả các việc trong ngày đang chọn
  const handleMarkAllLevel = (levelKey) => {
    const targetDateKey = selectedDayItem.dateKey;
    setRecords((prev) => {
      const existingDay = prev[targetDateKey] || {};
      const newTasks = {};
      if (levelKey !== 'NONE') {
        DAILY_TASKS.forEach((t) => {
          newTasks[t.id] = levelKey;
        });
      }
      return {
        ...prev,
        [targetDateKey]: {
          ...existingDay,
          tasks: newTasks,
        },
      };
    });
  };

  // Xóa dữ liệu ngày đang chọn
  const handleClearDay = () => {
    const targetDateKey = selectedDayItem.dateKey;
    setRecords((prev) => {
      const copy = { ...prev };
      delete copy[targetDateKey];
      return copy;
    });
  };

  // Cập nhật ghi chú ngày
  const handleChangeNote = (noteText) => {
    const targetDateKey = selectedDayItem.dateKey;
    setRecords((prev) => {
      const existingDay = prev[targetDateKey] || {};
      return {
        ...prev,
        [targetDateKey]: {
          ...existingDay,
          note: noteText,
        },
      };
    });
  };

  // Tạo dữ liệu mẫu 7 ngày đầu tháng để xem thử biểu đồ
  const handleLoadSampleData = () => {
    setRecords((prev) =>
      generateSampleDataForMonth(currentYear, currentMonth, prev)
    );
  };

  // Xuất file backup JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `self-upgrade-backup-${today.dateKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nhập file backup JSON
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && typeof parsed === 'object') {
          setRecords(parsed);
        }
      } catch (err) {
        alert('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app-shell">
      {/* HEADER BAR */}
      <header className="top-navbar">
        <div className="brand-block">
          <div className="brand-logo-mark">SU</div>
          <div>
            <h1 className="brand-title">SELF UPGRADE</h1>
            <p className="brand-subtitle">
              Hệ thống theo dõi kỷ luật & điểm hiệu suất cá nhân
            </p>
          </div>
        </div>

        <div className="navbar-controls">
          <div className="month-switcher">
            <button
              type="button"
              className="btn-minimal btn-icon"
              onClick={handlePrevMonth}
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
              onClick={handleNextMonth}
              aria-label="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="btn-minimal"
            onClick={handleJumpToday}
          >
            Hôm nay
          </button>

          <button
            type="button"
            className="btn-minimal"
            onClick={handleLoadSampleData}
            title="Điền dữ liệu mẫu 7 ngày đầu tháng để xem hiệu ứng biểu đồ"
          >
            <Wand2 size={14} />
            <span>Dữ liệu mẫu</span>
          </button>

          <button
            type="button"
            className="btn-minimal"
            onClick={handleExportJson}
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
            onChange={handleImportJson}
          />
        </div>
      </header>

      <main className="main-container">
        {/* ================================================================
            PHẦN 1 (BÊN TRÊN): TỔNG ĐIỂM THỐNG KÊ THÁNG & BIỂU ĐỒ
           ================================================================ */}
        <section className="overview-top-section">
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

          {/* 4 Thẻ chỉ số tổng hợp tháng */}
          <div className="stats-cards-grid">
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
                  ? `${monthStats.bestDay.rawPoints}/120 điểm (${monthStats.bestDay.rank.title})`
                  : 'Chưa có dữ liệu ghi nhận trong tháng'}
              </span>
            </div>
          </div>

          {/* Khu vực 2 Biểu đồ: Biểu đồ Đường & Biểu đồ Tròn */}
          <div className="charts-grid">
            <MonthlyLineChart
              daysList={monthStats.daysList}
              selectedDateKey={selectedDayItem.dateKey}
              onSelectDay={(dateKey) => handleSelectDay(dateKey, false)}
            />

            <DistributionDonutChart
              selectedDayStats={selectedDayItem}
              selectedDayLabel={`Ngày ${selectedDayItem.day}/${currentMonth}`}
              monthStats={monthStats}
            />
          </div>
        </section>

        {/* ================================================================
            PHẦN 2 (BÊN DƯỚI): NHỮNG NGÀY TRONG THÁNG & CHI TIẾT TÍCH VIỆC NGÀY ĐÓ
           ================================================================ */}
        <MonthDaysGrid
          year={currentYear}
          month={currentMonth}
          daysList={monthStats.daysList}
          selectedDateKey={selectedDayItem.dateKey}
          todayDateKey={today.dateKey}
          onSelectDay={handleSelectDay}
        />

        <DayDetailPanel
          selectedDateKey={selectedDayItem.dateKey}
          selectedDayItem={selectedDayItem}
          dayRecord={selectedDayRecord}
          onSetTaskLevel={handleSetTaskLevel}
          onMarkAllLevel={handleMarkAllLevel}
          onClearDay={handleClearDay}
          onChangeNote={handleChangeNote}
          isToday={selectedDayItem.dateKey === today.dateKey}
        />
      </main>

      <footer className="app-footer">
        <span>
          SELF UPGRADE — Minimalist Personal Discipline Tracker • Cấu hình màu tập trung tại{' '}
          <code>src/config/settings.js</code>
        </span>
      </footer>
    </div>
  );
}
