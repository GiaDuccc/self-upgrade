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
import { DayDataResponse, FoodItem, TaskLevelKey } from '~/interface/discipline.interface';
import { CaloriesTracker } from '~/components/CaloriesTracker/CaloriesTracker';
import { ClientOutletContext } from '~/pages/Client/ClientPage';
import {
  formatDateKey,
  getTodayInfo,
  isTaskBoostedByProfile,
  LEVEL_LIST,
  PERSONALIZATION_OPTIONS,
  SCORING,
} from '~/utils/constants';

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
        },
        dayRecord: {
          tasks: found.tasksMap || {},
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

  const handleSetTaskLevel = async (taskId: string, levelKey: TaskLevelKey) => {
    // 1. Cập nhật lạc quan (Optimistic update) ngay lập tức trên UI
    if (dayData) {
      const currentLevel = dayData.dayRecord?.tasks?.[taskId] || 'NONE';
      const nextLevel = currentLevel === levelKey ? 'NONE' : levelKey;
      setDayData((prev) => {
        if (!prev) return prev;
        const currentTasks = prev.dayRecord?.tasks || {};
        return {
          ...prev,
          dayRecord: {
            ...(prev.dayRecord || {}),
            tasks: { ...currentTasks, [taskId]: nextLevel },
          },
        };
      });
    }

    try {
      // 2. Gọi API nền lưu vào CSDL
      const updated = await setTaskLevelAPI({
        dateKey: activeDateKey,
        taskId,
        levelKey,
      });
      // 3. Cập nhật state với số điểm & xếp hạng chính xác từ backend trả về
      setDayData(updated);
      refreshMonthStats();
      notifyAiCoach(`${activeDateKey}|${taskId}|${levelKey}|${Date.now()}`);
    } catch {
      toast.error('Lỗi cập nhật điểm công việc!');
      // Tải lại để rollback nếu lỗi
      getDayDataAPI(activeDateKey).then(setDayData);
    }
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
              onClick={onOpenAddTaskModal}
              title="Thêm đầu việc mới cho ngày/tuần/tháng này"
            >
              <Plus size={14} />
              <span>Thêm việc</span>
            </button>
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={() => handleMarkAllLevel('PERFECT')}
              title={`Tích nhanh tất cả ${currentTasksList.length} việc ở mức Hoàn Hảo (100%)`}
            >
              <Sparkles size={14} />
              <span>Tất cả Hoàn Hảo</span>
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
          <div className="tasks-grid">
          {currentTasksList.length === 0 ? (
            <div className="empty-tasks-placeholder">
              <p>Chưa có đầu việc nào cho ngày này.</p>
              <button
                type="button"
                className="btn-minimal"
                onClick={onOpenAddTaskModal}
              >
                <Plus size={15} />
                <span>Thêm đầu việc ngay</span>
              </button>
            </div>
          ) : (
            currentTasksList.map((task, idx) => {
              const currentLevelKey = tasksMap[task.id] || 'NONE';
              const currentScoreObj = SCORING[currentLevelKey] || SCORING.NONE;
              const isBoosted = isTaskBoostedByProfile(task, userProfile);
              const weight = isBoosted ? 1.25 : 1;
              const weightedPoints =
                Math.round(currentScoreObj.points * weight * 10) / 10;

              return (
                <div
                  key={task.id}
                  className={`task-card ${
                    currentLevelKey !== 'NONE' ? 'task-card-checked' : ''
                  }`}
                  onClick={() => onEditTask(task)}
                  title="Nhấn vào thẻ để chỉnh sửa hoặc xoá đầu việc này"
                >
                  <div className="task-card-top">
                    <div className="task-index-title">
                      <span className="task-index">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="task-title-row">
                          <h4 className="task-title">{task.title}</h4>
                          <span
                            className="task-edit-indicator"
                            title="Chỉnh sửa/Xoá"
                          >
                            <Edit2 size={12} />
                          </span>
                        </div>
                        <span className="task-meta">
                          {task.category} • {task.timeHint || task.target || 'Mỗi ngày'}
                          {isBoosted && (
                            <strong className="boost-inline-tag">
                              {' '}
                              • ★ ×1.25
                            </strong>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="task-current-point">
                      {currentLevelKey !== 'NONE' ? (
                        <span className="point-pill active">
                          +{weightedPoints}đ
                        </span>
                      ) : (
                        <span className="point-pill">0đ</span>
                      )}
                    </div>
                  </div>

                  <div
                    className="task-level-buttons"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {LEVEL_LIST.map((lvl) => {
                      const isSelected = currentLevelKey === lvl.key;
                      const lvlPts =
                        Math.round(lvl.points * weight * 10) / 10;
                      return (
                        <button
                          key={lvl.key}
                          type="button"
                          className={`level-btn ${isSelected ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetTaskLevel(
                              task.id,
                              isSelected ? 'NONE' : lvl.key
                            );
                          }}
                        >
                          <span className="level-btn-name">{lvl.label}</span>
                          <span className="level-btn-pts">
                            {isSelected ? <Check size={12} /> : `${lvlPts}đ`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

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

