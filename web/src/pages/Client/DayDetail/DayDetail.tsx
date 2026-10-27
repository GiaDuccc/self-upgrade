import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Calendar,
  Check,
  RotateCcw,
  Sparkles,
  Edit2,
  Plus,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Flame,
  Dumbbell,
} from 'lucide-react';
import {
  clearDayAPI,
  getDayDataAPI,
  markAllLevelAPI,
  setTaskLevelAPI,
  updateNoteAPI,
  saveDayCaloriesAPI,
  saveDayWaterAPI,
  saveDayWorkoutAPI,
  saveDayStatesAPI,
} from '~/apis/clientAPI/disciplineApi';
import { DayDataResponse, FoodItem, TaskItem, TaskLevelKey, WaterData, WorkoutExercise } from '~/interface/discipline.interface';
import { WorkoutTracker } from '~/components/WorkoutTracker/WorkoutTracker';
import { CaloriesTracker } from '~/components/CaloriesTracker/CaloriesTracker';
import { WaterTracker } from '~/components/WaterTracker/WaterTracker';
import { DailyStateModal } from '~/components/DailyStateModal/DailyStateModal';
import { DayDetailSkeleton } from '~/components/Skeleton/Skeleton';
import { ClientOutletContext } from '~/pages/Client/ClientPage';
import {
  formatDateKey,
  getTodayInfo,
  isTaskBoostedByProfile,
  PERSONALIZATION_OPTIONS,
  SCORING,
} from '~/utils/constants';
import {
  getLocalizedPersonalization,
  translateCategory,
  translateRankDesc,
  translateRankTitle,
  translateWeekday,
  useLanguage,
} from '~/utils/i18n';

const HOURS_24 = Array.from({ length: 25 }, (_, i) => i);
const COLUMNS_5 = Array.from({ length: 5 }, (_, i) => i);

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
    if (col < 0 || col > 4) {
      col = hourCounts[hour] || 0;
      hourCounts[hour] = col + 1;
    }
    while (col < 5 && gridMap.has(`${hour}_${col}`)) {
      col++;
    }
    if (col < 5) {
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
  const [, currMonthStr, currDayStr] = (activeDateKey || '').split('-');

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
    isCaloriesEnabled,
    isWorkoutEnabled,
  } = useOutletContext<ClientOutletContext>();
  const { language, isEn } = useLanguage();

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
  const [activeDayTab, setActiveDayTab] = useState<'todolist' | 'calories' | 'workout'>('todolist');
  const [isSavingCalories, setIsSavingCalories] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustNoteTextareaHeight = useCallback(() => {
    const textarea = noteTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.max(72, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustNoteTextareaHeight();
  }, [noteInput, activeDateKey, adjustNoteTextareaHeight]);

  useEffect(() => {
    if (!isCaloriesEnabled && activeDayTab === 'calories') {
      setActiveDayTab('todolist');
    }
    if (!isWorkoutEnabled && activeDayTab === 'workout') {
      setActiveDayTab('todolist');
    }
  }, [isCaloriesEnabled, isWorkoutEnabled, activeDayTab]);

  // Hooks phải được gọi trước mọi câu lệnh return sớm (Rules of Hooks)
  const rawCaloriesMeals = dayData?.dayRecord?.caloriesData?.meals;
  const caloriesMeals = useMemo(() => rawCaloriesMeals || [], [rawCaloriesMeals]);
  const caloriesSummary = dayData?.dayRecord?.caloriesData?.summary;
  const workoutData = dayData?.dayRecord?.workoutData;

  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isSavingStates, setIsSavingStates] = useState(false);

  const handleSaveDayStates = useCallback(
    async (states: { physicalState: string; mentalState: string; emotionalState: string }) => {
      setIsSavingStates(true);
      try {
        const updated = await saveDayStatesAPI({
          dateKey: activeDateKey,
          ...states,
        });
        setDayData(updated);
        refreshMonthStats();
        notifyAiCoach(`STATES_UPDATED_${Date.now()}`);
        toast.success(
          isEn
            ? 'Daily states updated successfully!'
            : 'Đã cập nhật trạng thái ngày thành công!'
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            (isEn ? 'Failed to update states' : 'Không thể cập nhật trạng thái')
        );
      } finally {
        setIsSavingStates(false);
      }
    },
    [activeDateKey, refreshMonthStats, notifyAiCoach, isEn]
  );

  const handleSaveWorkout = useCallback(
    async (workout: { targetMuscles: string[]; exercises: WorkoutExercise[] }) => {
      setIsSavingWorkout(true);
      try {
        const updated = await saveDayWorkoutAPI({
          dateKey: activeDateKey,
          targetMuscles: workout.targetMuscles,
          exercises: workout.exercises,
        });
        setDayData(updated);
        toast.success(
          workout.exercises.length === 0
            ? (isEn ? 'Workout cleared and saved!' : 'Đã xóa bài tập và lưu thành công!')
            : (isEn ? 'Workout saved and analyzed by AI Gym Coach!' : 'Đã lưu buổi tập và AI Gym đã phân tích!')
        );
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          (isEn ? 'Failed to save workout session!' : 'Không thể lưu buổi tập! Vui lòng thử lại.');
        toast.error(msg);
      } finally {
        setIsSavingWorkout(false);
      }
    },
    [activeDateKey, isEn]
  );

  const currentTasksList = dayData?.dayStats?.tasksList || [];
  const taskGridMap = useMemo(
    () => buildTaskGridMap(currentTasksList),
    [currentTasksList]
  );

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

  const [isSavingWater, setIsSavingWater] = useState(false);

  const handleSaveWater = useCallback(async (newWaterData: WaterData) => {
    setDayData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dayRecord: {
          ...prev.dayRecord,
          waterData: newWaterData,
        },
        dayStats: {
          ...prev.dayStats,
          waterData: newWaterData,
        },
      };
    });
    setIsSavingWater(true);
    try {
      await saveDayWaterAPI({
        dateKey: activeDateKey,
        waterData: newWaterData,
      });
      refreshMonthStats();
      notifyAiCoach(`${activeDateKey}|WATER|${newWaterData.currentMl}|${Date.now()}`);
    } catch {
      toast.error(isEn ? 'Failed to save water intake!' : 'Không thể lưu lượng nước!');
    } finally {
      setIsSavingWater(false);
    }
  }, [activeDateKey, refreshMonthStats, notifyAiCoach, isEn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === '1') {
        setActiveDayTab('todolist');
      } else if (e.key === '2' && isCaloriesEnabled) {
        setActiveDayTab('calories');
      } else if (e.key === '3' && isWorkoutEnabled) {
        setActiveDayTab('workout');
      } else if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const currentData = dayData?.dayRecord?.waterData;
        const currentMl = currentData?.currentMl || 0;
        const targetMl =
          currentData?.targetMl ||
          (userProfile?.weightKg
            ? Math.round((parseFloat(userProfile.weightKg) * 40) / 50) * 50
            : 2000);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (e.shiftKey) {
          if (currentMl > 0) {
            const nextMl = Math.max(0, currentMl - 250);
            const newLog = {
              id: `w_${Date.now()}_undo`,
              amount: -Math.min(currentMl, 250),
              time: timeStr,
            };
            const nextLogs = [newLog, ...(currentData?.logs || [])].slice(0, 30);
            handleSaveWater({
              targetMl,
              currentMl: nextMl,
              logs: nextLogs,
            });
            toast.info(isEn ? '💧 -250 ml water' : '💧 Đã trừ bớt 250 ml nước');
          }
        } else {
          const nextMl = currentMl + 250;
          const newLog = {
            id: `w_${Date.now()}_quick`,
            amount: 250,
            time: timeStr,
          };
          const nextLogs = [newLog, ...(currentData?.logs || [])].slice(0, 30);
          handleSaveWater({
            targetMl,
            currentMl: nextMl,
            logs: nextLogs,
          });
          toast.success(isEn ? '💧 +250 ml water logged!' : '💧 +250 ml nước đã nạp!');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dayData, isCaloriesEnabled, isEn, userProfile?.weightKg, handleSaveWater]);

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

    const loadDayData = (isRetry = false) => {
      getDayDataAPI(activeDateKey)
        .then((res) => {
          if (isMounted) {
            setDayData(res);
            setNoteInput(res.dayRecord?.note || '');
            setIsLoading(false);
            if (retryDayTimerRef.current) {
              clearTimeout(retryDayTimerRef.current);
              retryDayTimerRef.current = null;
            }
          }
        })
        .catch((err) => {
          if (isMounted) {
            const isNetworkOrColdStart =
              !err?.response ||
              err?.code === 'ERR_NETWORK' ||
              err?.code === 'ECONNABORTED' ||
              (err?.response?.status >= 502 && err?.response?.status <= 504);

            if (isNetworkOrColdStart) {
              // Tự động lên lịch thử tải lại chi tiết ngày sau 2.5s nếu chưa có dữ liệu
              if (retryDayTimerRef.current) {
                clearTimeout(retryDayTimerRef.current);
              }
              retryDayTimerRef.current = setTimeout(() => {
                if (isMounted) {
                  loadDayData(true);
                }
              }, 2500);
            } else if (!isRetry) {
              toast.error(isEn ? 'Failed to load day schedule!' : 'Không thể tải dữ liệu ngày!');
            }
            setIsLoading(false);
          }
        });
    };

    loadDayData();

    return () => {
      isMounted = false;
      if (retryDayTimerRef.current) {
        clearTimeout(retryDayTimerRef.current);
      }
    };
  }, [activeDateKey, dayRefreshTrigger, buildInitialDayData, isEn]);

  // Cuộn ngang mượt mà khi lăn chuột trên bảng Thời gian (trục X) - Việc làm (trục Y)
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      container.scrollLeft += delta;
      e.preventDefault();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isLoading, activeDayTab]);

  // Tự động đưa tầm nhìn ngang của bảng tới khung giờ có công việc đầu tiên trong ngày
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || currentTasksList.length === 0) return;
    const hours = currentTasksList.map((t) => resolveTaskHour(t));
    const minHour = Math.max(0, Math.min(...hours) - 1);
    container.scrollLeft = minHour * 160;
  }, [activeDateKey, isLoading, activeDayTab, currentTasksList.length]);

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
    return <DayDetailSkeleton />;
  }

  const { dayStats, dayRecord, weekday, day, month } = dayData;
  const tasksMap = dayRecord?.tasks || {};
  const isToday = activeDateKey === today.dateKey;
  const localizedOptions = getLocalizedPersonalization(language);

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

  const activePhysicalState =
    dayData?.dayRecord?.physicalState || userProfile?.physicalState || 'NORMAL';
  const activeMentalState =
    dayData?.dayRecord?.mentalState || userProfile?.mentalState || 'STEADY';
  const activeEmotionalState =
    dayData?.dayRecord?.emotionalState || userProfile?.emotionalState || 'CALM';

  const physObj =
    localizedOptions.physicalStates.find(
      (x) => x.id === activePhysicalState
    ) || localizedOptions.physicalStates[2];
  const mentObj =
    localizedOptions.mentalStates.find(
      (x) => x.id === activeMentalState
    ) || localizedOptions.mentalStates[2];
  const emoObj =
    localizedOptions.emotionalStates.find(
      (x) => x.id === activeEmotionalState
    ) || localizedOptions.emotionalStates[2];

  return (
    <div className="day-split-page-wrapper" id="day-detail-panel">
      <div className="day-split-container">
        {/* KHUNG 1 (BÊN TRÁI): ĐIỀU HƯỚNG, NỘI DUNG, ĐIỂM SỐ, VÀ GHI CHÚ NGÀY BÊN DƯỚI */}
        <section className="day-detail-section day-split-left-col">
          {/* Thanh điều hướng nhanh chuyển ngày & Thẻ ngày */}
          <div className="day-page-topbar">
            <div className="day-date-switcher">
              <button
                type="button"
                className="btn-minimal btn-icon"
                onClick={() => handleStepDay(-1)}
                title={isEn ? 'Previous day' : 'Ngày trước'}
                aria-label={isEn ? 'Previous day' : 'Ngày trước'}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="day-date-display">
                <span>{currDayStr} / {currMonthStr}</span>
              </div>
              <button
                type="button"
                className="btn-minimal btn-icon"
                onClick={() => handleStepDay(1)}
                title={isEn ? 'Next day' : 'Ngày sau'}
                aria-label={isEn ? 'Next day' : 'Ngày sau'}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="day-tag-row">
              <span className="day-badge-mono">{activeDateKey}</span>
              <span className="day-weekday-pill">
                {translateWeekday(weekday, language)}
              </span>
              {isToday && (
                <span className="today-indicator-pill">
                  {isEn ? 'Today' : 'Hôm nay'}
                </span>
              )}
            </div>
          </div>

          <div className="day-detail-title-group">
            <h2 className="section-heading">
              {isEn ? 'Day Detail & Check-in' : 'Chi tiết & Tích việc'}
            </h2>
            <p className="day-rank-desc">
              {translateRankDesc(dayStats.rank.description, language)}
            </p>
          </div>

          {/* Thẻ điểm số tổng hợp & Trạng thái & Nút thao tác */}
          <div className="day-score-summary-card">
            <div className="day-score-main">
              <div className="day-score-left">
                <span className="day-score-label">
                  {isEn ? 'ACHIEVED SCORE' : 'ĐIỂM ĐẠT ĐƯỢC'}
                </span>
                <div className="day-score-big-row">
                  <div className="day-score-big">{dayStats.percentage}%</div>
                  {dayStats.stateBonusPct !== 0 && (
                    <span
                      className="score-mod-pill"
                      title={
                        isEn
                          ? 'Score adjusted based on Physical, Mental, Emotional states & Discipline mode'
                          : 'Điều chỉnh điểm dựa trên Thể chất, Tinh thần, Cảm xúc & Chế độ kỷ luật'
                      }
                    >
                      {dayStats.stateBonusPct > 0
                        ? isEn
                          ? `+${dayStats.stateBonusPct}% resilience`
                          : `+${dayStats.stateBonusPct}% vượt khó`
                        : isEn
                        ? `${dayStats.stateBonusPct}% strict`
                        : `${dayStats.stateBonusPct}% kỷ luật`}
                    </span>
                  )}
                </div>
                <span className="day-score-raw">
                  {dayStats.rawPoints} / {dayStats.maxPoints}{' '}
                  {isEn ? 'pts' : 'điểm'} • {dayStats.checkedCount}/
                  {dayStats.totalTasks} {isEn ? 'tasks' : 'việc'}
                </span>
              </div>
              <div className="day-rank-box">
                <span className="day-rank-label">
                  {isEn ? 'RANK' : 'MỨC ĐẠT'}
                </span>
                <span className="day-rank-value">
                  {translateRankTitle(dayStats.rank.title, language)}
                </span>
              </div>
            </div>

            {/* PHẦN TRẠNG THÁI CÁ NHÂN: 3 Ô CÂN XỨNG & NÚT CẬP NHẬT */}
            <div className="day-state-section">
              <div className="day-state-header">
                <span className="day-state-section-label">
                  {isEn ? 'PERSONAL STATES' : 'TRẠNG THÁI HÔM NAY'}
                </span>
                <button
                  type="button"
                  className="btn-state-edit-link"
                  onClick={() => setIsStateModalOpen(true)}
                  title={
                    isEn
                      ? 'Update Physical, Mental & Emotional states for today'
                      : 'Cập nhật Thể chất, Tinh thần & Cảm xúc của ngày hôm nay'
                  }
                >
                  <UserCheck size={12} />
                  <span>{isEn ? 'Update' : 'Cập nhật'}</span>
                </button>
              </div>

              <div className="day-state-cards-grid">
                <div
                  className="state-mini-card"
                  title={physObj.desc}
                  onClick={() => setIsStateModalOpen(true)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="state-mini-label">{isEn ? 'Physical' : 'Thể chất'}</span>
                  <strong
                    className={`state-text-val state-text-${physObj.tier || 'good'}`}
                  >
                    {physObj.label.split('/')[0].trim()}
                  </strong>
                </div>

                <div
                  className="state-mini-card"
                  title={mentObj.desc}
                  onClick={() => setIsStateModalOpen(true)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="state-mini-label">{isEn ? 'Mental' : 'Tinh thần'}</span>
                  <strong
                    className={`state-text-val state-text-${mentObj.tier || 'good'}`}
                  >
                    {mentObj.label.split('/')[0].trim()}
                  </strong>
                </div>

                <div
                  className="state-mini-card"
                  title={emoObj.desc}
                  onClick={() => setIsStateModalOpen(true)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="state-mini-label">{isEn ? 'Emotional' : 'Cảm xúc'}</span>
                  <strong
                    className={`state-text-val state-text-${emoObj.tier || 'good'}`}
                  >
                    {emoObj.label.split('/')[0].trim()}
                  </strong>
                </div>
              </div>

              {dayData?.dayRecord?.sleepData && (
                <div
                  className="state-sleep-banner"
                  title={
                    isEn
                      ? `Sleep: ${dayData.dayRecord.sleepData.bedTime} - ${dayData.dayRecord.sleepData.wakeTime} (${Math.floor(dayData.dayRecord.sleepData.durationMinutes / 60)}h ${dayData.dayRecord.sleepData.durationMinutes % 60}m)${dayData.dayRecord.sleepData.source ? ` • Source: ${dayData.dayRecord.sleepData.source}` : ''}`
                      : `Giấc ngủ: ${dayData.dayRecord.sleepData.bedTime} - ${dayData.dayRecord.sleepData.wakeTime} (${Math.floor(dayData.dayRecord.sleepData.durationMinutes / 60)}h ${dayData.dayRecord.sleepData.durationMinutes % 60}m)${dayData.dayRecord.sleepData.source ? ` • Nguồn: ${dayData.dayRecord.sleepData.source}` : ''}`
                  }
                  onClick={onOpenProfileModal}
                  role="button"
                  tabIndex={0}
                >
                  <span className="state-sleep-title">🌙 {isEn ? 'Sleep:' : 'Giấc ngủ:'}</span>
                  <strong className="state-text-val state-text-good">
                    {Math.floor(dayData.dayRecord.sleepData.durationMinutes / 60)}h{dayData.dayRecord.sleepData.durationMinutes % 60 > 0 ? ` ${dayData.dayRecord.sleepData.durationMinutes % 60}m` : ''}
                    {dayData.dayRecord.sleepData.sleepScore ? ` (${dayData.dayRecord.sleepData.sleepScore}đ)` : ''}
                  </strong>
                </div>
              )}
            </div>

            <div
              className="progress-bar-track"
              title={
                isEn
                  ? `Daily progress: ${dayStats.percentage}%`
                  : `Tiến độ ngày: ${dayStats.percentage}%`
              }
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
                title={
                  isEn
                    ? 'Add a new task for this day/week/month'
                    : 'Thêm đầu việc mới cho ngày/tuần/tháng này'
                }
              >
                <Plus size={14} />
                <span>{isEn ? 'Add Task' : 'Thêm việc'}</span>
              </button>
              <button
                type="button"
                className="btn-minimal btn-sm"
                onClick={handleToggleAllTasks}
                title={
                  allTasksCompleted
                    ? isEn
                      ? 'Uncheck all tasks for today'
                      : 'Bỏ tích toàn bộ việc của ngày'
                    : isEn
                    ? `Check all ${currentTasksList.length} tasks (100%)`
                    : `Tích nhanh tất cả ${currentTasksList.length} việc (100%)`
                }
              >
                <CheckSquare size={14} />
                <span>
                  {allTasksCompleted
                    ? isEn
                      ? 'Uncheck All'
                      : 'Bỏ tích tất cả'
                    : isEn
                    ? 'Check All'
                    : 'Tích tất cả'}
                </span>
              </button>
              <button
                type="button"
                className="btn-minimal btn-sm"
                onClick={handleClearDay}
                title={
                  isEn
                    ? 'Reset all check-ins for this day'
                    : 'Xóa toàn bộ tích chọn của ngày này'
                }
              >
                <RotateCcw size={14} />
                <span>{isEn ? 'Reset Day' : 'Đặt lại ngày'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* KHUNG 2 (BÊN PHẢI): 2 NÚT TO-DO LIST VÀ CALORIES + BẢNG (TRỤC Y: VIỆC X, TRỤC X: THỜI GIAN) */}
        <section className="day-detail-section day-split-right-col">
          {/* Tab Bar: To-do List, Calories & Workout */}
          {(isCaloriesEnabled || isWorkoutEnabled) && (
            <div className="day-mode-tab-bar">
              <button
                type="button"
                className={`btn-minimal day-mode-btn ${activeDayTab === 'todolist' ? 'active' : ''}`}
                onClick={() => setActiveDayTab('todolist')}
              >
                <CheckSquare size={15} />
                <span>To-do List ({currentTasksList.length})</span>
              </button>
              {isCaloriesEnabled && (
                <button
                  type="button"
                  className={`btn-minimal day-mode-btn ${activeDayTab === 'calories' ? 'active' : ''}`}
                  onClick={() => setActiveDayTab('calories')}
                >
                  <Flame size={15} />
                  <span>
                    {isEn ? 'Calories & Nutrition' : 'Calories & Dinh dưỡng'}
                  </span>
                </button>
              )}
              {isWorkoutEnabled && (
                <button
                  type="button"
                  className={`btn-minimal day-mode-btn ${activeDayTab === 'workout' ? 'active' : ''}`}
                  onClick={() => setActiveDayTab('workout')}
                >
                  <Dumbbell size={15} />
                  <span>
                    {isEn ? 'Gym & Workout' : 'Tập Luyện (Gym)'}
                  </span>
                </button>
              )}
            </div>
          )}

          {activeDayTab === 'todolist' ? (
            <div className="day-table-pane">
              {currentTasksList.length === 0 ? (
                <div className="empty-tasks-placeholder">
                  <p>
                    {isEn
                      ? 'No tasks scheduled for this day yet.'
                      : 'Chưa có đầu việc nào cho ngày này.'}
                  </p>
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
                    <span>
                      {isEn ? 'Add Task Now' : 'Thêm đầu việc ngay'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="timetable-wrapper">
                  <div className="timetable-container" ref={tableContainerRef}>
                    <table className="timetable-table">
                      <thead>
                        <tr>
                          {/* Ô góc chia đôi chéo: Thời gian ở trên phải (trục X), Việc làm ở dưới trái (trục Y) */}
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
                                  stroke="var(--border-subtle)"
                                  strokeWidth="1"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </svg>
                              <span className="diagonal-label diagonal-time-label">
                                {isEn ? 'Time' : 'Thời gian'}
                              </span>
                              <span className="diagonal-label diagonal-task-label">
                                {isEn ? 'Tasks' : 'Việc làm'}
                              </span>
                            </div>
                          </th>

                          {/* Trục X: Thời gian từ 00:00 đến 24:00 */}
                          {HOURS_24.map((hour) => {
                            const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                            return (
                              <th key={hour} className="timetable-th timetable-th-col">
                                <div className="timetable-col-header-text">
                                  {hourLabel}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Trục Y: Việc 1 .. Việc 5 */}
                        {COLUMNS_5.map((colIdx) => (
                          <tr key={colIdx} className="timetable-row">
                            <td className="timetable-td timetable-td-time">
                              <span className="timetable-time-text">
                                {isEn ? `Task ${colIdx + 1}` : `Việc ${colIdx + 1}`}
                              </span>
                            </td>
                            {HOURS_24.map((hour) => {
                              const hourLabel = `${String(hour).padStart(2, '0')}:00`;
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
                                    key={hour}
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
                                      title={
                                        isEn
                                          ? 'Click to edit or delete this task'
                                          : 'Nhấp để chỉnh sửa hoặc xoá đầu việc này'
                                      }
                                    >
                                      <div className="grid-task-top">
                                        <div className="grid-task-left">
                                          <div className="grid-task-badge-row">
                                            <span className="grid-task-badge">
                                              {translateCategory(task.category, language)}
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
                                              ? isEn
                                                ? 'Unmark completion'
                                                : 'Bỏ tích hoàn thành'
                                              : isEn
                                              ? 'Mark task as completed'
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
                                  key={hour}
                                  className="timetable-td timetable-td-empty-cell"
                                  onClick={() =>
                                    handleEmptyCellClick(hour, colIdx)
                                  }
                                  title={
                                    isEn
                                      ? `Click to add task at ${hourLabel} (Row Task ${colIdx + 1})`
                                      : `Nhấp để thêm việc vào lúc ${hourLabel} (Hàng Việc ${colIdx + 1})`
                                  }
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* GHI CHÚ NGÀY (NẰM Ở MỤC TODOLIST DƯỚI BẢNG) */}
              <div className="day-note-box">
                <div className="day-note-header">
                  <label htmlFor="daily-note-input" className="day-note-label">
                    {isEn
                      ? `DAILY NOTE / SELF-REFLECTION (${day}/${month})`
                      : `GHI CHÚ / TỰ KIỂM ĐIỂM NGÀY ${day}/${month}`}
                  </label>
                  <span className="day-note-hint">
                    {isEn
                      ? 'AI Coach observes your note to provide personalized advice'
                      : 'AI Coach sẽ tự động quan sát ghi chú để đưa ra lời khuyên cá nhân hóa'}
                  </span>
                </div>
                <textarea
                  ref={noteTextareaRef}
                  id="daily-note-input"
                  rows={3}
                  className="day-note-input day-note-textarea"
                  placeholder={
                    isEn
                      ? 'Write down what went well today or what needs improvement (click Save to let AI analyze and give feedback)...'
                      : 'Ghi lại lý do hôm nay làm tốt hoặc viết điều cần chấn chỉnh (nhấn Lưu để AI phân tích và đưa ra nhận xét)...'
                  }
                  value={noteInput}
                  onChange={(e) => {
                    handleNoteInputChange(e.target.value);
                    adjustNoteTextareaHeight();
                  }}
                />

                <div className="day-note-actions">
                  <button
                    type="button"
                    className="btn-minimal btn-sm btn-note-cancel"
                    onClick={handleCancelNote}
                    disabled={isSavingNote || noteInput === (dayData?.dayRecord?.note || '')}
                    title={
                      isEn
                        ? 'Discard changes and restore previous note'
                        : 'Hủy các thay đổi và khôi phục nội dung cũ'
                    }
                  >
                    <RotateCcw size={13} />
                    <span>{isEn ? 'Cancel' : 'Hủy thay đổi'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-minimal btn-sm btn-save-task btn-note-save"
                    onClick={handleSaveNote}
                    disabled={isSavingNote || noteInput === (dayData?.dayRecord?.note || '')}
                    title={
                      isEn
                        ? 'Save note and trigger AI Coach feedback'
                        : 'Lưu ghi chú và kích hoạt AI Coach nhận xét'
                    }
                  >
                    <Check size={14} />
                    <span>
                      {isSavingNote
                        ? isEn
                          ? 'Saving...'
                          : 'Đang lưu...'
                        : isEn
                        ? 'Save Note'
                        : 'Lưu ghi chú'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : activeDayTab === 'calories' ? (
            <div className="day-calories-pane">
              <WaterTracker
                dateKey={activeDateKey}
                initialWaterData={dayData?.dayRecord?.waterData}
                userWeightKg={userProfile?.weightKg}
                onSaveWater={handleSaveWater}
                isSaving={isSavingWater}
              />
              <CaloriesTracker
                dateKey={activeDateKey}
                initialMeals={caloriesMeals}
                initialSummary={caloriesSummary}
                onSaveCalories={handleSaveCalories}
                isSaving={isSavingCalories}
              />
            </div>
          ) : (
            <div className="day-workout-pane">
              <WorkoutTracker
                dateKey={activeDateKey}
                initialWorkoutData={workoutData}
                userProfile={userProfile}
                onSaveWorkout={handleSaveWorkout}
                isSaving={isSavingWorkout}
              />
            </div>
          )}
        </section>
      </div>

      <DailyStateModal
        isOpen={isStateModalOpen}
        onClose={() => setIsStateModalOpen(false)}
        dateKey={activeDateKey}
        initialPhysicalState={activePhysicalState}
        initialMentalState={activeMentalState}
        initialEmotionalState={activeEmotionalState}
        onSaveStates={handleSaveDayStates}
        isSaving={isSavingStates}
      />
    </div>
  );
};

