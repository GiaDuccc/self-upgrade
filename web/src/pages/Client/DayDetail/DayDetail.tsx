import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Check,
  RotateCcw,
  Sparkles,
  Edit2,
  Plus,
  UserCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Flame,
} from 'lucide-react';
import {
  clearDayAPI,
  getDayDataAPI,
  markAllLevelAPI,
  setTaskLevelAPI,
  updateNoteAPI,
  saveDayCaloriesAPI,
} from '~/apis/clientAPI/disciplineApi';
import { DayDataResponse, FoodItem, TaskItem, TaskLevelKey } from '~/interface/discipline.interface';
import { CaloriesTracker } from '~/components/CaloriesTracker/CaloriesTracker';
import { ClientOutletContext } from '~/pages/Client/ClientPage';
import {
  formatDateKey,
  getTodayInfo,
  isTaskBoostedByProfile,
  PERSONALIZATION_OPTIONS,
  SCORING,
} from '~/utils/constants';

const HOURS_24 = Array.from({ length: 25 }, (_, i) => i);
const COLUMNS_10 = Array.from({ length: 10 }, (_, i) => i);

const DEFAULT_TASK_HOURS: Record<string, number> = {
  wake_5am: 5,
  learn_english: 7,
  work: 8,
  learn_code: 9,
  play_2_games: 11,
  nap: 13,
  drink_3l_water: 15,
  gym: 17,
  no_junk_food: 19,
  sleep_before_11pm: 22,
};

function resolveTaskHour(task: TaskItem): number {
  if (typeof task.hour === 'number' && task.hour >= 0 && task.hour <= 24) {
    return task.hour;
  }
  if (task.timeHint) {
    const match = task.timeHint.match(/(\d{1,2}):\d{2}/);
    if (match) return parseInt(match[1], 10);
    const matchH = task.timeHint.match(/(\d{1,2})h/);
    if (matchH) return parseInt(matchH[1], 10);
  }
  if (DEFAULT_TASK_HOURS[task.id] !== undefined) {
    return DEFAULT_TASK_HOURS[task.id];
  }
  return 8;
}

function buildTaskGridMap(tasks: TaskItem[]): Map<string, TaskItem> {
  const gridMap = new Map<string, TaskItem>();
  const hourCounts: Record<number, number> = {};

  tasks.forEach((task) => {
    const hour = resolveTaskHour(task);
    let col = typeof task.columnIndex === 'number' ? task.columnIndex : -1;
    if (col < 0 || col > 9) {
      col = hourCounts[hour] || 0;
      hourCounts[hour] = col + 1;
    }
    while (col < 10 && gridMap.has(`${hour}_${col}`)) {
      col++;
    }
    if (col < 10) {
      gridMap.set(`${hour}_${col}`, task);
    }
  });

  return gridMap;
}

export const DayDetail: React.FC = () => {
  const { dateKey: paramDateKey } = useParams<{ dateKey: string }>();
  const navigate = useNavigate();
  const today = getTodayInfo();
  const activeDateKey = paramDateKey || today.dateKey;

  const {
    userProfile,
    monthStats,
    setSelectedDateKey,
    refreshMonthStats,
    onOpenAddTaskModal,
    onEditTask,
    onOpenProfileModal,
    notifyAiCoach,
    dayRefreshTrigger,
  } = useOutletContext<ClientOutletContext>();

  const buildInitialDayData = useCallback(
    (key: string): DayDataResponse | null => {
      if (!monthStats) return null;
      const found = monthStats.daysList.find((d) => d.dateKey === key);
      if (!found) return null;

      return {
        dateKey: key,
        year: monthStats.year,
        month: monthStats.month,
        day: found.day,
        weekday: found.weekday,
        dayStats: {
          rawPoints: found.rawPoints,
          maxPoints: found.maxPoints,
          basePercentage: found.basePercentage,
          stateBonusPct: found.stateBonusPct,
          percentage: found.percentage,
          checkedCount: found.checkedCount,
          totalTasks: found.totalTasks,
          counts: found.counts,
          rank: found.rank,
          note: found.note || '',
          tasksList: found.tasksList || [],
          tasksMap: found.tasksMap || {},
          taskHours: found.taskHours || {},
        },
        dayRecord: {
          tasks: found.tasksMap || {},
          taskHours: found.taskHours || {},
          note: found.note || '',
        },
        profile: userProfile,
        isProfileSetup: true,
        settings: {} as any,
      };
    },
    [monthStats, userProfile]
  );

  const [dayData, setDayData] = useState<DayDataResponse | null>(() =>
    buildInitialDayData(activeDateKey)
  );
  const [noteInput, setNoteInput] = useState(() => {
    const init = buildInitialDayData(activeDateKey);
    return init?.dayRecord?.note || '';
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !buildInitialDayData(activeDateKey);
  });
  const [activeDayTab, setActiveDayTab] = useState<'todolist' | 'calories'>('todolist');
  const [isSavingCalories, setIsSavingCalories] = useState(false);
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hooks phải được gọi trước mọi câu lệnh return sớm (Rules of Hooks)
  const rawCaloriesMeals = dayData?.dayRecord?.caloriesData?.meals;
  const caloriesMeals = useMemo(() => rawCaloriesMeals || [], [rawCaloriesMeals]);
  const caloriesSummary = dayData?.dayRecord?.caloriesData?.summary;

  const handleSaveCalories = async (meals: FoodItem[]) => {
    setIsSavingCalories(true);
    try {
      const updated = await saveDayCaloriesAPI({
        dateKey: activeDateKey,
        meals,
      });
      setDayData(updated);
      toast.success('Đã lưu thực đơn và cập nhật phân tích AI thành công!');
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        'Không thể lưu thực đơn dinh dưỡng! Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsSavingCalories(false);
    }
  };

  useEffect(() => {
    setSelectedDateKey(activeDateKey);
    let isMounted = true;

    // Nếu activeDateKey khác với dữ liệu hiện tại, lập tức dựng dữ liệu tức thì từ monthStats (nếu có)
    if (!dayData || dayData.dateKey !== activeDateKey) {
      const init = buildInitialDayData(activeDateKey);
      if (init) {
        setDayData(init);
        setNoteInput(init.dayRecord?.note || '');
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    }

    getDayDataAPI(activeDateKey)
      .then((res) => {
        if (isMounted) {
          setDayData(res);
          setNoteInput(res.dayRecord?.note || '');
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          toast.error('Không thể tải dữ liệu ngày!');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeDateKey, dayRefreshTrigger, buildInitialDayData]);

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Khóa cuộn trang ngoài khi di chuột vào bảng: kể cả khi cuộn hết trên/dưới cũng không cuộn web bên ngoài
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();

      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (isHorizontal) {
        container.scrollLeft += e.deltaX !== 0 ? e.deltaX : e.deltaY;
      } else {
        container.scrollTop += e.deltaY;
      }

      e.preventDefault();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isLoading, activeDayTab]);

  const handleToggleTask = async (taskId: string) => {
    const currentLevel = dayData?.dayRecord?.tasks?.[taskId] || 'NONE';
    const isCurrentlyChecked = currentLevel !== 'NONE';
    const nextLevel: TaskLevelKey = isCurrentlyChecked ? 'NONE' : 'PERFECT';

    const taskObj = dayData?.dayStats?.tasksList?.find((t) => t.id === taskId);
    const hour = taskObj ? resolveTaskHour(taskObj) : 8;
    const nextHours = nextLevel === 'PERFECT' ? [hour] : [];

    // Cập nhật lạc quan (Optimistic update)
    if (dayData) {
      setDayData((prev) => {
        if (!prev) return prev;
        const currentTasks = { ...(prev.dayRecord?.tasks || {}) };
        const currentTaskHours = { ...(prev.dayRecord?.taskHours || {}) };

        if (nextLevel === 'NONE') {
          delete currentTasks[taskId];
          delete currentTaskHours[taskId];
        } else {
          currentTasks[taskId] = nextLevel;
          currentTaskHours[taskId] = nextHours;
        }

        return {
          ...prev,
          dayRecord: {
            ...(prev.dayRecord || {}),
            tasks: currentTasks,
            taskHours: currentTaskHours,
          },
        };
      });
    }

    try {
      const updated = await setTaskLevelAPI({
        dateKey: activeDateKey,
        taskId,
        levelKey: nextLevel,
        hours: nextHours,
      });
      setDayData(updated);
      refreshMonthStats();
      notifyAiCoach(`${activeDateKey}|${taskId}|${nextLevel}|${hour}h|${Date.now()}`);
    } catch {
      toast.error('Lỗi cập nhật việc!');
      getDayDataAPI(activeDateKey).then(setDayData);
    }
  };

  const handleEmptyCellClick = (hour: number, colIndex: number) => {
    const timeFormatted = `${String(hour).padStart(2, '0')}:00`;
    onOpenAddTaskModal({
      hour,
      columnIndex: colIndex,
      timeHint: timeFormatted,
    });
  };

  const handleEditTaskClick = (task: TaskItem) => {
    const taskHour = resolveTaskHour(task);
    const hourLabel = `${String(taskHour).padStart(2, '0')}:00`;
    onEditTask({
      ...task,
      hour: taskHour,
      timeHint:
        task.timeHint && /\d{1,2}/.test(task.timeHint)
          ? task.timeHint
          : hourLabel,
    });
  };

  const handleMarkAllLevel = async (levelKey: TaskLevelKey) => {
    try {
      const updated = await markAllLevelAPI({
        dateKey: activeDateKey,
        levelKey,
      });
      setDayData(updated);
      refreshMonthStats();
      notifyAiCoach(`${activeDateKey}|ALL|${levelKey}|${Date.now()}`);
    } catch {
      toast.error('Lỗi tích nhanh công việc!');
    }
  };

  const handleClearDay = async () => {
    try {
      const updated = await clearDayAPI({ dateKey: activeDateKey });
      setDayData(updated);
      setNoteInput('');
      refreshMonthStats();
      notifyAiCoach(`${activeDateKey}|CLEAR|${Date.now()}`);
    } catch {
      toast.error('Lỗi đặt lại ngày!');
    }
  };

  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleNoteInputChange = (val: string) => {
    setNoteInput(val);
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      const updated = await updateNoteAPI({
        dateKey: activeDateKey,
        note: noteInput,
      });
      setDayData(updated);
      toast.success('Đã lưu ghi chú thành công!');
      // Chỉ khi nhấn nút Lưu mới kích hoạt API lưu ghi chú và gọi API Gemini AI Coach
      notifyAiCoach(`${activeDateKey}|NOTE|${noteInput.trim()}|${Date.now()}`);
    } catch {
      toast.error('Lỗi lưu ghi chú!');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelNote = () => {
    // Khôi phục lại nội dung ban đầu từ server
    setNoteInput(dayData?.dayRecord?.note || '');
    toast.info('Đã hủy thay đổi ghi chú');
  };

  const handleStepDay = (offset: number) => {
    const [y, m, d] = activeDateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d + offset);
    const nextKey = formatDateKey(
      dt.getFullYear(),
      dt.getMonth() + 1,
      dt.getDate()
    );
    navigate(`/day/${nextKey}`);
  };

  if (isLoading || !dayData) {
    return (
      <div className="page-loading-box">
        <span>Đang tải chi tiết công việc ngày {activeDateKey}...</span>
      </div>
    );
  }

  const { dayStats, dayRecord, weekday, day, month } = dayData;
  const tasksMap = dayRecord?.tasks || {};
  const currentTasksList = dayStats.tasksList || [];
  const isToday = activeDateKey === today.dateKey;

  const taskGridMap = useMemo(
    () => buildTaskGridMap(currentTasksList),
    [currentTasksList]
  );

  const allTasksCompleted =
    currentTasksList.length > 0 &&
    currentTasksList.every((t) => (tasksMap[t.id] || 'NONE') !== 'NONE');

  const handleToggleAllTasks = () => {
    if (allTasksCompleted) {
      handleMarkAllLevel('NONE');
    } else {
      handleMarkAllLevel('PERFECT');
    }
  };

  const physObj =
    PERSONALIZATION_OPTIONS.physicalStates.find(
      (x) => x.id === userProfile.physicalState
    ) || PERSONALIZATION_OPTIONS.physicalStates[2];
  const mentObj =
    PERSONALIZATION_OPTIONS.mentalStates.find(
      (x) => x.id === userProfile.mentalState
    ) || PERSONALIZATION_OPTIONS.mentalStates[2];
  const emoObj =
    PERSONALIZATION_OPTIONS.emotionalStates.find(
      (x) => x.id === userProfile.emotionalState
    ) || PERSONALIZATION_OPTIONS.emotionalStates[2];

  return (
    <section className="day-detail-section" id="day-detail-panel">
      {/* Thanh điều hướng nhanh giữa bảng Tổng quan & chuyển ngày */}
      <div className="day-page-topbar">
        <button
          type="button"
          className="btn-minimal"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={15} />
          <span>Quay lại Tổng quan tháng</span>
        </button>

        <div className="day-stepper-btns">
          <button
            type="button"
            className="btn-minimal btn-sm"
            onClick={() => handleStepDay(-1)}
          >
            <ChevronLeft size={14} />
            <span>Ngày trước</span>
          </button>
          <button
            type="button"
            className="btn-minimal btn-sm"
            onClick={() => handleStepDay(1)}
          >
            <span>Ngày sau</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="day-detail-header">
        <div className="day-detail-title-group">
          <div className="day-tag-row">
            <span className="day-badge-mono">{activeDateKey}</span>
            <span className="day-weekday-pill">{weekday}</span>
            {isToday && <span className="today-indicator-pill">Hôm nay</span>}
          </div>
          <h2 className="section-heading">
            Chi tiết & Tích việc — Ngày {day}/{month}
          </h2>
          <p className="day-rank-desc">{dayStats.rank.description}</p>
        </div>

        <div className="day-score-summary-card">
          <div className="day-score-main">
            <div className="day-score-left">
              <span className="day-score-label">
                ĐIỂM ĐẠT ĐƯỢC (ĐÃ CÁ NHÂN HÓA)
              </span>
              <div className="day-score-big-row">
                <div className="day-score-big">{dayStats.percentage}%</div>
                {dayStats.stateBonusPct !== 0 && (
                  <span
                    className="score-mod-pill"
                    title="Điều chỉnh điểm dựa trên Thể chất, Tinh thần, Cảm xúc & Chế độ kỷ luật"
                  >
                    {dayStats.stateBonusPct > 0
                      ? `+${dayStats.stateBonusPct}% vượt khó`
                      : `${dayStats.stateBonusPct}% kỷ luật`}
                  </span>
                )}
              </div>
              <span className="day-score-raw">
                {dayStats.rawPoints} / {dayStats.maxPoints} điểm •{' '}
                {dayStats.checkedCount}/{dayStats.totalTasks} việc
              </span>
            </div>
            <div className="day-rank-box">
              <span className="day-rank-label">MỨC ĐẠT</span>
              <span className="day-rank-value">{dayStats.rank.title}</span>
            </div>
          </div>

          <div className="score-card-state-row">
            <div className="personal-state-strip">
              <span
                className="state-chip"
                title={physObj.desc}
                onClick={onOpenProfileModal}
                style={{ cursor: 'pointer' }}
              >
                Thể chất:{' '}
                <strong
                  className={`state-text-val state-text-${physObj.tier || 'good'}`}
                >
                  {physObj.label.split('/')[0].trim()}
                </strong>
              </span>
              <span
                className="state-chip"
                title={mentObj.desc}
                onClick={onOpenProfileModal}
                style={{ cursor: 'pointer' }}
              >
                Tinh thần:{' '}
                <strong
                  className={`state-text-val state-text-${mentObj.tier || 'good'}`}
                >
                  {mentObj.label.split('/')[0].trim()}
                </strong>
              </span>
              <span
                className="state-chip"
                title={emoObj.desc}
                onClick={onOpenProfileModal}
                style={{ cursor: 'pointer' }}
              >
                Cảm xúc:{' '}
                <strong
                  className={`state-text-val state-text-${emoObj.tier || 'good'}`}
                >
                  {emoObj.label.split('/')[0].trim()}
                </strong>
              </span>
            </div>

            <button
              type="button"
              className="btn-minimal btn-sm btn-state-quick"
              onClick={onOpenProfileModal}
              title="Cập nhật Thể chất, Tinh thần & Cảm xúc cá nhân"
            >
              <UserCheck size={14} />
              <span>Trạng thái</span>
            </button>
          </div>

          <div
            className="progress-bar-track"
            title={`Tiến độ ngày: ${dayStats.percentage}%`}
          >
            <div
              className="progress-bar-fill"
              style={{
                opacity: dayStats.percentage > 0 ? 1 : 0,
                clipPath: `inset(0 ${Math.max(0, 100 - dayStats.percentage)}% 0 0 round 999px)`,
                WebkitClipPath: `inset(0 ${Math.max(0, 100 - dayStats.percentage)}% 0 0 round 999px)`,
              }}
            />
          </div>

          <div className="day-quick-actions">
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={() => {
                const nowH = new Date().getHours();
                onOpenAddTaskModal({
                  hour: nowH,
                  columnIndex: 0,
                  timeHint: `${String(nowH).padStart(2, '0')}:00`,
                });
              }}
              title="Thêm đầu việc mới cho ngày/tuần/tháng này"
            >
              <Plus size={14} />
              <span>Thêm việc</span>
            </button>
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={handleToggleAllTasks}
              title={
                allTasksCompleted
                  ? 'Bỏ tích toàn bộ việc của ngày'
                  : `Tích nhanh tất cả ${currentTasksList.length} việc (100%)`
              }
            >
              <CheckSquare size={14} />
              <span>{allTasksCompleted ? 'Bỏ tích tất cả' : 'Tích tất cả'}</span>
            </button>
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={handleClearDay}
              title="Xóa toàn bộ tích chọn của ngày này"
            >
              <RotateCcw size={14} />
              <span>Đặt lại ngày</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 NÚT TAB TRÊN CÙNG: TO-DO LIST & CALORIES */}
      <div className="day-mode-tab-bar">
        <button
          type="button"
          className={`btn-minimal day-mode-btn ${activeDayTab === 'todolist' ? 'active' : ''}`}
          onClick={() => setActiveDayTab('todolist')}
        >
          <CheckSquare size={15} />
          <span>To-do List ({currentTasksList.length})</span>
        </button>
        <button
          type="button"
          className={`btn-minimal day-mode-btn ${activeDayTab === 'calories' ? 'active' : ''}`}
          onClick={() => setActiveDayTab('calories')}
        >
          <Flame size={15} />
          <span>
            Calories & Dinh dưỡng
            {dayRecord?.caloriesData?.meals?.length ? ` (${dayRecord.caloriesData.meals.length} món)` : ''}
          </span>
        </button>
      </div>

      {activeDayTab === 'todolist' ? (
        <div className="day-workspace-layout">
          {currentTasksList.length === 0 ? (
            <div className="empty-tasks-placeholder">
              <p>Chưa có đầu việc nào cho ngày này.</p>
              <button
                type="button"
                className="btn-minimal"
                onClick={() => {
                  const nowH = new Date().getHours();
                  onOpenAddTaskModal({
                    hour: nowH,
                    columnIndex: 0,
                    timeHint: `${String(nowH).padStart(2, '0')}:00`,
                  });
                }}
              >
                <Plus size={15} />
                <span>Thêm đầu việc ngay</span>
              </button>
            </div>
          ) : (
            <div className="timetable-wrapper">
              <div className="timetable-container" ref={tableContainerRef}>
                <table className="timetable-table">
                  <thead>
                    <tr>
                      {/* Ô góc chia đôi chéo như Excel: Việc cần làm ở trên phải, Thời gian ở dưới trái */}
                      <th className="timetable-th timetable-corner-th">
                        <div className="diagonal-cell">
                          <svg
                            className="diagonal-svg"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <line
                              x1="0"
                              y1="0"
                              x2="100"
                              y2="100"
                              stroke="rgba(34, 34, 32, 0.15)"
                              strokeWidth="1"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                          <span className="diagonal-label diagonal-task-label">
                            Việc cần làm
                          </span>
                          <span className="diagonal-label diagonal-time-label">
                            Thời gian
                          </span>
                        </div>
                      </th>

                      {/* 10 cột tiêu đề Việc 1, Việc 2, ..., Việc 10 */}
                      {COLUMNS_10.map((colIdx) => (
                        <th key={colIdx} className="timetable-th timetable-th-col">
                          <div className="timetable-col-header-text">
                            Việc {colIdx + 1}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS_24.map((hour) => {
                      const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                      return (
                        <tr key={hour} className="timetable-row">
                          <td className="timetable-td timetable-td-time">
                            <span className="timetable-time-text">
                              {hourLabel}
                            </span>
                          </td>
                          {COLUMNS_10.map((colIdx) => {
                            const task = taskGridMap.get(`${hour}_${colIdx}`);

                            if (task) {
                              const isTaskChecked =
                                (tasksMap[task.id] || 'NONE') !== 'NONE';
                              const isBoosted = isTaskBoostedByProfile(
                                task,
                                userProfile
                              );

                              return (
                                <td
                                  key={colIdx}
                                  className={`timetable-td timetable-td-task-cell ${
                                    isTaskChecked
                                      ? 'cell-has-task-checked'
                                      : 'cell-has-task'
                                  }`}
                                >
                                  <div
                                    className={`grid-task-card ${
                                      isTaskChecked
                                        ? 'grid-task-card-checked'
                                        : ''
                                    }`}
                                    onClick={() => handleEditTaskClick(task)}
                                    title="Nhấp để chỉnh sửa hoặc xoá đầu việc này"
                                  >
                                    <div className="grid-task-top">
                                      <div className="grid-task-left">
                                        <div className="grid-task-badge-row">
                                          <span className="grid-task-badge">
                                            {task.category || 'Mục tiêu'}
                                          </span>
                                          {isBoosted && (
                                            <span className="grid-task-boost">
                                              ★ ×1.25
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="grid-task-title">
                                          {task.title}
                                        </h4>
                                        <div className="grid-task-meta">
                                          <span>
                                            {task.timeHint || hourLabel}
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className="grid-task-right"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleTask(task.id);
                                        }}
                                        title={
                                          isTaskChecked
                                            ? 'Bỏ tích hoàn thành'
                                            : 'Tích hoàn thành việc này'
                                        }
                                      >
                                        <button
                                          type="button"
                                          className={`timetable-checkbox ${
                                            isTaskChecked ? 'checked' : ''
                                          }`}
                                        >
                                          {isTaskChecked && (
                                            <Check
                                              size={14}
                                              strokeWidth={3}
                                            />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={colIdx}
                                className="timetable-td timetable-td-empty-cell"
                                onClick={() =>
                                  handleEmptyCellClick(hour, colIdx)
                                }
                                title={`Nhấp để thêm việc vào lúc ${hourLabel} (Cột Việc ${colIdx + 1})`}
                              >
                                <div className="grid-empty-target">
                                  <Plus
                                    size={14}
                                    className="grid-empty-plus-icon"
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* PHẦN GHI CHÚ NẰM Ở DƯỚI CÙNG CỦA TO DO LIST */}
        <div className="day-note-box">
          <div className="day-note-header">
            <label htmlFor="daily-note-input" className="day-note-label">
              GHI CHÚ / TỰ KIỂM ĐIỂM NGÀY {day}/{month}
            </label>
            <span className="day-note-hint">
              AI Coach sẽ tự động quan sát ghi chú để đưa ra lời khuyên cá nhân hóa
            </span>
          </div>
          <textarea
            id="daily-note-input"
            rows={3}
            className="day-note-input day-note-textarea"
            placeholder="Ghi lại lý do hôm nay làm tốt hoặc viết điều cần chấn chỉnh (nhấn Lưu để AI phân tích và đưa ra nhận xét)..."
            value={noteInput}
            onChange={(e) => handleNoteInputChange(e.target.value)}
          />

          <div className="day-note-actions">
            <button
              type="button"
              className="btn-minimal btn-sm btn-note-cancel"
              onClick={handleCancelNote}
              disabled={isSavingNote || noteInput === (dayData?.dayRecord?.note || '')}
              title="Hủy các thay đổi và khôi phục nội dung cũ"
            >
              <RotateCcw size={13} />
              <span>Hủy thay đổi</span>
            </button>
            <button
              type="button"
              className="btn-minimal btn-sm btn-save-task btn-note-save"
              onClick={handleSaveNote}
              disabled={isSavingNote || noteInput === (dayData?.dayRecord?.note || '')}
              title="Lưu ghi chú và kích hoạt AI Coach nhận xét"
            >
              <Check size={14} />
              <span>{isSavingNote ? 'Đang lưu...' : 'Lưu ghi chú'}</span>
            </button>
          </div>
        </div>
      </div>
      ) : (
        <CaloriesTracker
          dateKey={activeDateKey}
          initialMeals={caloriesMeals}
          initialSummary={caloriesSummary}
          onSaveCalories={handleSaveCalories}
          isSaving={isSavingCalories}
        />
      )}
    </section>
  );
};

