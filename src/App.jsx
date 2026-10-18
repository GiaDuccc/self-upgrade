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
  loadTaskConfig,
  saveTaskConfig,
  loadUserProfile,
  saveUserProfile,
  getWeekDates,
  getDaysInMonth,
} from './utils/storageAndStats';
import { MonthlyLineChart, DistributionDonutChart } from './components/Charts';
import { MonthDaysGrid } from './components/MonthDaysGrid';
import { DayDetailPanel } from './components/DayDetailPanel';
import { AiCoachWidget } from './components/AiCoachWidget';
import { TaskModal } from './components/TaskModal';
import { ProfileModal } from './components/ProfileModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Upload,
  Plus,
  UserCheck,
} from 'lucide-react';

export default function App() {
  const today = useMemo(() => getTodayInfo(), []);

  const [currentYear, setCurrentYear] = useState(today.year);
  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [selectedDateKey, setSelectedDateKey] = useState(today.dateKey);
  const [records, setRecords] = useState(() => loadAllRecords());
  const [taskConfig, setTaskConfig] = useState(() => loadTaskConfig());
  const [userProfile, setUserProfile] = useState(() => loadUserProfile());

  // Trạng thái của TaskModal (Thêm mới hoặc Chỉnh sửa)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState('add'); // 'add' | 'edit'
  const [editingTask, setEditingTask] = useState(null);

  // Trạng thái của ProfileModal (Cá nhân hóa: Thể chất, Tinh thần, Cảm xúc)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Đồng bộ bảng màu từ file cấu hình tập trung (src/config/settings.js)
  useEffect(() => {
    applyThemeToRoot(THEME);
  }, []);

  // Tự động lưu records xuống LocalStorage mỗi khi thay đổi
  useEffect(() => {
    saveAllRecords(records);
  }, [records]);

  // Tự động lưu taskConfig xuống LocalStorage mỗi khi thay đổi
  useEffect(() => {
    saveTaskConfig(taskConfig);
  }, [taskConfig]);

  // Tự động lưu userProfile xuống LocalStorage mỗi khi thay đổi
  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

  // Tính toán thống kê toàn tháng và từng ngày (tự động tính lại khi tích việc, đổi task hoặc đổi trạng thái cá nhân)
  const monthStats = useMemo(
    () =>
      calculateMonthStats(
        currentYear,
        currentMonth,
        records,
        taskConfig,
        userProfile
      ),
    [currentYear, currentMonth, records, taskConfig, userProfile]
  );

  // Ngày đang được chọn
  const selectedDayItem = useMemo(() => {
    return (
      monthStats.daysList.find((d) => d.dateKey === selectedDateKey) ||
      monthStats.daysList[0]
    );
  }, [monthStats, selectedDateKey]);

  const selectedDayRecord = records[selectedDayItem?.dateKey] || {};

  // Tập hợp danh sách tất cả các đầu việc hiện có để kiểm tra trùng tên
  const allKnownTasks = useMemo(() => {
    const list = [...(selectedDayItem?.tasksList || [])];
    (taskConfig.globalTasks || []).forEach((gt) => {
      if (!list.some((t) => t.id === gt.id)) {
        list.push(gt);
      }
    });
    (taskConfig.customTasks || []).forEach((ct) => {
      if (!list.some((t) => t.id === ct.id)) {
        list.push(ct);
      }
    });
    return list;
  }, [selectedDayItem, taskConfig]);

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

  // Mở modal thêm đầu việc mới
  const handleOpenAddTaskModal = () => {
    setTaskModalMode('add');
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Mở modal chỉnh sửa đầu việc khi nhấn vào một thẻ công việc
  const handleEditTask = (task) => {
    setTaskModalMode('edit');
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Lưu đầu việc (Thêm mới hoặc Cập nhật)
  const handleSaveTask = ({ id, title, category, timeHint, scope, dateKey }) => {
    const trimmedTitle = title.trim();
    const normalizedNewTitle = trimmedTitle.toLowerCase();

    // Kiểm tra trùng tên an toàn trước khi lưu
    const isDuplicate = allKnownTasks.some(
      (t) =>
        t.id !== id &&
        t.title &&
        t.title.trim().toLowerCase() === normalizedNewTitle
    );

    if (isDuplicate) {
      alert(`Đầu việc "${trimmedTitle}" đã tồn tại trong danh sách! Vui lòng chọn tên khác.`);
      return false;
    }

    const monthKey = dateKey.substring(0, 7);
    const weekDates = getWeekDates(dateKey);

    setTaskConfig((prev) => {
      const newConfig = {
        globalTasks: [...(prev.globalTasks || [])],
        customTasks: [...(prev.customTasks || [])],
        excludedTaskIds: { ...(prev.excludedTaskIds || {}) },
        taskOverrides: { ...(prev.taskOverrides || {}) },
      };

      if (id) {
        // CHẾ ĐỘ CHỈNH SỬA (EDIT)
        if (scope === 'all') {
          newConfig.globalTasks = newConfig.globalTasks.map((t) =>
            t.id === id ? { ...t, title, category, timeHint } : t
          );
          newConfig.customTasks = newConfig.customTasks.map((t) =>
            t.id === id ? { ...t, title, category, timeHint } : t
          );
        } else if (scope === 'day') {
          newConfig.taskOverrides[dateKey] = {
            ...(newConfig.taskOverrides[dateKey] || {}),
            [id]: { title, category, timeHint },
          };
        } else if (scope === 'week') {
          weekDates.forEach((d) => {
            newConfig.taskOverrides[d] = {
              ...(newConfig.taskOverrides[d] || {}),
              [id]: { title, category, timeHint },
            };
          });
        } else if (scope === 'month') {
          const daysCount = getDaysInMonth(currentYear, currentMonth);
          for (let d = 1; d <= daysCount; d++) {
            const dk = formatDateKey(currentYear, currentMonth, d);
            newConfig.taskOverrides[dk] = {
              ...(newConfig.taskOverrides[dk] || {}),
              [id]: { title, category, timeHint },
            };
          }
        }
      } else {
        // CHẾ ĐỘ THÊM MỚI (ADD)
        const newId = `task_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 6)}`;
        const newTaskItem = {
          id: newId,
          title,
          category,
          timeHint,
          scope,
          dateKey,
          weekDates,
          monthKey,
        };

        if (scope === 'all') {
          newConfig.globalTasks.push(newTaskItem);
        } else {
          newConfig.customTasks.push(newTaskItem);
        }
      }

      return newConfig;
    });
  };

  // Xoá đầu việc (tuỳ theo phạm vi ngày / tuần / tháng / tất cả)
  const handleDeleteTask = ({ id, scope, dateKey }) => {
    const weekDates = getWeekDates(dateKey);

    setTaskConfig((prev) => {
      const newConfig = {
        globalTasks: [...(prev.globalTasks || [])],
        customTasks: [...(prev.customTasks || [])],
        excludedTaskIds: { ...(prev.excludedTaskIds || {}) },
        taskOverrides: { ...(prev.taskOverrides || {}) },
      };

      if (scope === 'all') {
        newConfig.globalTasks = newConfig.globalTasks.filter((t) => t.id !== id);
        newConfig.customTasks = newConfig.customTasks.filter((t) => t.id !== id);
      } else if (scope === 'day') {
        const curEx = newConfig.excludedTaskIds[dateKey] || [];
        if (!curEx.includes(id)) {
          newConfig.excludedTaskIds[dateKey] = [...curEx, id];
        }
      } else if (scope === 'week') {
        weekDates.forEach((d) => {
          const curEx = newConfig.excludedTaskIds[d] || [];
          if (!curEx.includes(id)) {
            newConfig.excludedTaskIds[d] = [...curEx, id];
          }
        });
      } else if (scope === 'month') {
        const daysCount = getDaysInMonth(currentYear, currentMonth);
        for (let d = 1; d <= daysCount; d++) {
          const dk = formatDateKey(currentYear, currentMonth, d);
          const curEx = newConfig.excludedTaskIds[dk] || [];
          if (!curEx.includes(id)) {
            newConfig.excludedTaskIds[dk] = [...curEx, id];
          }
        }
      }

      return newConfig;
    });
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
    const tasksForDay = selectedDayItem.tasksList || DAILY_TASKS;

    setRecords((prev) => {
      const existingDay = prev[targetDateKey] || {};
      const newTasks = {};
      if (levelKey !== 'NONE') {
        tasksForDay.forEach((t) => {
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

  // Xuất file backup JSON (bao gồm lịch sử tích, công việc tuỳ chỉnh và hồ sơ cá nhân)
  const handleExportJson = () => {
    const backupData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      records,
      taskConfig,
      userProfile,
    };
    const dataStr = JSON.stringify(backupData, null, 2);
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
          if (parsed.records) {
            setRecords(parsed.records);
            if (parsed.taskConfig) {
              setTaskConfig(parsed.taskConfig);
            }
            if (parsed.userProfile) {
              setUserProfile(parsed.userProfile);
            }
          } else {
            setRecords(parsed);
          }
          alert('Khôi phục dữ liệu thành công!');
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
            <h1 className="brand-title">
              SELF UPGRADE
              {userProfile.name?.trim() ? ` — ${userProfile.name.trim().toUpperCase()}` : ''}
            </h1>
            <p className="brand-subtitle">
              {userProfile.personalMotto?.trim()
                ? `“${userProfile.personalMotto.trim()}”`
                : 'Hệ thống theo dõi kỷ luật & điểm hiệu suất cá nhân'}
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

          {/* MỤC THÊM ĐẦU VIỆC */}
          <button
            type="button"
            className="btn-minimal btn-add-header"
            onClick={handleOpenAddTaskModal}
            title="Thêm một đầu việc / thói quen mới"
          >
            <Plus size={15} />
            <span>Thêm đầu việc</span>
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

          {/* MỤC NHẬP THÔNG TIN CÁ NHÂN HÓA Ở GÓC BÊN PHẢI CỦA HEADER */}
          <button
            type="button"
            className="btn-minimal btn-profile-header"
            onClick={() => setIsProfileModalOpen(true)}
            title="Nhập thông tin cá nhân, Thể chất, Tinh thần & Cảm xúc để tối ưu chấm điểm và lời khuyên"
          >
            <UserCheck size={15} />
            <span>
              {userProfile.name?.trim()
                ? `${userProfile.name.trim()} • Cá nhân hóa`
                : 'Thông tin cá nhân'}
            </span>
          </button>
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
                Thang điểm: Chưa chọn (0đ) • Tệ (1đ) • Tốt (5đ) • Hoàn Hảo (10đ) — Tự động điều chỉnh theo Thể chất, Tinh thần & Mục tiêu trọng tâm
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
                  ? `${monthStats.bestDay.rawPoints}/${monthStats.bestDay.maxPoints} điểm (${monthStats.bestDay.rank.title})`
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
          userProfile={userProfile}
          onSetTaskLevel={handleSetTaskLevel}
          onMarkAllLevel={handleMarkAllLevel}
          onClearDay={handleClearDay}
          onChangeNote={handleChangeNote}
          isToday={selectedDayItem.dateKey === today.dateKey}
          onEditTask={handleEditTask}
          onOpenAddTaskModal={handleOpenAddTaskModal}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
        />
      </main>

      <footer className="app-footer">
        <span>
          SELF UPGRADE — Minimalist Personal Discipline Tracker • Cấu hình màu tập trung tại{' '}
          <code>src/config/settings.js</code>
        </span>
      </footer>

      {/* MODAL THÊM / CHỈNH SỬA ĐẦU VIỆC */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        mode={taskModalMode}
        initialTask={editingTask}
        currentDateKey={selectedDayItem.dateKey}
        existingTasks={allKnownTasks}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* MODAL CÁ NHÂN HÓA: THỂ CHẤT, TINH THẦN, CẢM XÚC */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={(newProf) => setUserProfile(newProf)}
      />

      {/* AI COACH FLOATING WIDGET (LAYER TRÊN CÙNG, GÓC DƯỚI BÊN PHẢI) */}
      <AiCoachWidget
        userProfile={userProfile}
        selectedDayItem={selectedDayItem}
        dayRecord={selectedDayRecord}
        tasksList={selectedDayItem?.tasksList || DAILY_TASKS}
      />
    </div>
  );
}
