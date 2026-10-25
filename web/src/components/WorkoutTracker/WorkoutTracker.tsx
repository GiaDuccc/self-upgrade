import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Search,
  Flame,
  Zap,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  ExerciseSet,
  WorkoutData,
  WorkoutExercise,
  WorkoutSummary,
} from '~/interface/discipline.interface';
import { UserProfile } from '~/interface/user.interface';
import {
  MUSCLE_GROUP_OPTIONS,
  PRESET_EXERCISES_DATABASE,
  getPresetExercisesForMuscles,
  PresetExercise,
} from '~/constants/workoutLibrary';
import { useLanguage } from '~/utils/i18n';

export interface WorkoutTrackerProps {
  dateKey: string;
  initialWorkoutData?: WorkoutData;
  userProfile?: UserProfile;
  onSaveWorkout: (workout: {
    targetMuscles: string[];
    exercises: WorkoutExercise[];
  }) => Promise<void>;
  isSaving?: boolean;
}

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({
  dateKey,
  initialWorkoutData,
  userProfile,
  onSaveWorkout,
  isSaving = false,
}) => {
  const { isEn } = useLanguage();

  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(
    () => initialWorkoutData?.targetMuscles || []
  );
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    () => initialWorkoutData?.exercises || []
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Ô tìm kiếm & thêm bài tập nhanh
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [showRirTooltip, setShowRirTooltip] = useState(false);

  const lastDateKeyRef = useRef(dateKey);

  useEffect(() => {
    if (lastDateKeyRef.current !== dateKey) {
      lastDateKeyRef.current = dateKey;
      setSelectedMuscles(initialWorkoutData?.targetMuscles || []);
      setExercises(initialWorkoutData?.exercises || []);
      setHasUnsavedChanges(false);
      setExerciseSearchTerm('');
      setIsAddingCustom(false);
      return;
    }

    if (!hasUnsavedChanges) {
      setSelectedMuscles(initialWorkoutData?.targetMuscles || []);
      setExercises(initialWorkoutData?.exercises || []);
    }
  }, [dateKey, initialWorkoutData, hasUnsavedChanges]);

  // Toggle chọn nhóm cơ
  const handleToggleMuscle = (muscleId: string) => {
    setSelectedMuscles((prev) => {
      const exists = prev.includes(muscleId);
      const updated = exists
        ? prev.filter((m) => m !== muscleId)
        : [...prev, muscleId];
      setHasUnsavedChanges(true);
      return updated;
    });
  };

  // Danh sách bài tập gợi ý dựa theo các nhóm cơ đã chọn
  const filteredPresets = useMemo(() => {
    const list = getPresetExercisesForMuscles(selectedMuscles);
    if (!exerciseSearchTerm.trim()) return list;
    const term = exerciseSearchTerm.toLowerCase().trim();
    return list.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        ex.nameEn.toLowerCase().includes(term) ||
        ex.primaryMuscle.toLowerCase().includes(term)
    );
  }, [selectedMuscles, exerciseSearchTerm]);

  // Thêm một bài tập mới từ Preset hoặc Custom
  const handleAddExercise = (name: string, category = 'gym') => {
    const cleanName = name.trim();
    if (!cleanName) return;

    // Kiểm tra xem bài này đã có trong danh sách chưa
    const existing = exercises.find(
      (e) => e.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      // Nếu đã có thì thêm 1 set mới vào bài đó
      handleAddSet(existing.id);
      return;
    }

    const newEx: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      category,
      sets: [
        {
          setNumber: 1,
          weightKg: 20,
          reps: 10,
          rir: 2,
        },
      ],
    };

    setExercises((prev) => [...prev, newEx]);
    setHasUnsavedChanges(true);
    setExerciseSearchTerm('');
    setCustomExerciseName('');
    setIsAddingCustom(false);
  };

  // Xóa bài tập
  const handleDeleteExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    setHasUnsavedChanges(true);
  };

  // Thêm set cho một bài tập (tự động clone trọng lượng & rep từ set trước đó)
  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          setNumber: ex.sets.length + 1,
          weightKg: lastSet ? lastSet.weightKg : 20,
          reps: lastSet ? lastSet.reps : 10,
          rir: lastSet ? lastSet.rir : 2,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Xóa set của một bài tập
  const handleDeleteSet = (exerciseId: string, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.sets
          .filter((_, idx) => idx !== setIndex)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return {
          ...ex,
          sets: updatedSets,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Cập nhật giá trị của một set
  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: keyof ExerciseSet,
    val: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.sets.map((s, idx) => {
          if (idx !== setIndex) return s;
          return {
            ...s,
            [field]: Math.max(0, val),
          };
        });
        return {
          ...ex,
          sets: updatedSets,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Tính tổng volume tức thì của các bài tập trên màn hình
  const currentTotalVolume = useMemo(() => {
    let vol = 0;
    const userW = parseFloat(userProfile?.weightKg || '70') || 70;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        const w = Number(s.weightKg) || 0;
        const effW = w > 0 ? w : Math.round(userW * 0.6);
        vol += effW * (Number(s.reps) || 0);
      });
    });
    return vol;
  }, [exercises, userProfile]);

  const totalSetsCount = useMemo(() => {
    return exercises.reduce((acc, e) => acc + e.sets.length, 0);
  }, [exercises]);

  const handleSave = async () => {
    await onSaveWorkout({
      targetMuscles: selectedMuscles,
      exercises,
    });
    setHasUnsavedChanges(false);
  };

  const handleResetWorkout = () => {
    if (exercises.length === 0 && selectedMuscles.length === 0) return;
    if (
      window.confirm(
        isEn
          ? 'Are you sure you want to clear all exercises for this day?'
          : 'Bạn có chắc chắn muốn xóa toàn bộ bài tập của buổi hôm nay không?'
      )
    ) {
      setSelectedMuscles([]);
      setExercises([]);
      setHasUnsavedChanges(true);
    }
  };

  const summary = initialWorkoutData?.summary;

  return (
    <div className="workout-tracker-container">
      {/* 1. KHUNG CHỌN NHÓM CƠ (TARGET MUSCLES) */}
      <div className="workout-muscle-selector-card">
        <div className="workout-card-header">
          <div className="workout-header-title">
            <Dumbbell size={18} />
            <span>{isEn ? 'TARGET MUSCLE GROUPS / SPLIT' : 'NHÓM CƠ / LỊCH TẬP HÔM NAY'}</span>
          </div>
          <span className="workout-header-hint">
            {isEn
              ? 'Select all muscles you trained today'
              : 'Chọn các nhóm cơ bạn tập trong buổi hôm nay (có thể chọn nhiều)'}
          </span>
        </div>

        <div className="muscle-pill-group">
          {MUSCLE_GROUP_OPTIONS.map((m) => {
            const isSelected = selectedMuscles.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className={`muscle-pill-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleToggleMuscle(m.id)}
              >
                <span>{isEn ? m.labelEn : m.label}</span>
                {isSelected && <CheckCircle2 size={13} className="pill-check-icon" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. THƯ VIỆN BÀI TẬP GỢI Ý NHANH (PRESET EXERCISES SHELF) */}
      <div className="workout-preset-shelf-card">
        <div className="shelf-header">
          <div className="shelf-title-row">
            <strong>
              {isEn ? 'QUICK EXERCISE PICKER' : 'CHỌN NHANH BÀI TẬP'}
            </strong>
            <span className="shelf-badge">
              {filteredPresets.length} {isEn ? 'exercises' : 'bài tập'}
            </span>
          </div>

          <div className="shelf-search-bar">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="shelf-search-input"
              placeholder={
                isEn
                  ? 'Search exercises (e.g. Bench, Squat, Pull-up)...'
                  : 'Tìm kiếm bài tập (VD: Bench Press, Squat, Kéo xô)...'
              }
              value={exerciseSearchTerm}
              onChange={(e) => setExerciseSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="preset-chips-scrollable">
          {filteredPresets.slice(0, 16).map((preset) => {
            const isAdded = exercises.some(
              (e) => e.name.toLowerCase() === preset.name.toLowerCase()
            );
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip-btn ${isAdded ? 'is-added' : ''}`}
                onClick={() => handleAddExercise(preset.name, preset.category)}
                title={isEn ? `Add ${preset.nameEn}` : `Thêm bài ${preset.name}`}
              >
                <Plus size={12} />
                <span>{isEn ? preset.nameEn : preset.name}</span>
                <span className="preset-muscle-tag">
                  {isEn ? preset.primaryMuscleEn : preset.primaryMuscle}
                </span>
              </button>
            );
          })}

          {!isAddingCustom ? (
            <button
              type="button"
              className="preset-chip-btn chip-custom-trigger"
              onClick={() => setIsAddingCustom(true)}
            >
              <Plus size={12} />
              <span>{isEn ? 'Custom Exercise' : 'Thêm bài riêng'}</span>
            </button>
          ) : (
            <div className="custom-exercise-inline-form">
              <input
                type="text"
                className="custom-ex-input"
                placeholder={isEn ? 'Exercise name...' : 'Nhập tên bài tập...'}
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddExercise(customExerciseName);
                  } else if (e.key === 'Escape') {
                    setIsAddingCustom(false);
                  }
                }}
              />
              <button
                type="button"
                className="btn-minimal btn-sm"
                onClick={() => handleAddExercise(customExerciseName)}
                disabled={!customExerciseName.trim()}
              >
                {isEn ? 'Add' : 'Thêm'}
              </button>
              <button
                type="button"
                className="btn-minimal btn-sm"
                onClick={() => setIsAddingCustom(false)}
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. DANH SÁCH BÀI TẬP ĐÃ TẬP & CÁC HIỆP (LOGGED EXERCISES & SETS) */}
      <div className="workout-exercises-list-section">
        <div className="exercises-list-header">
          <div className="list-title">
            <strong>
              {isEn ? 'TODAY WORKOUT LOG' : 'BẢNG THEO DÕI CÁC HIỆP TẬP'}
            </strong>
            <span className="live-metrics-pill">
              🔥 Total Volume: <strong>{currentTotalVolume.toLocaleString()} kg</strong> ({totalSetsCount} sets)
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn-minimal btn-sm btn-rir-guide"
              onClick={() => setShowRirTooltip(!showRirTooltip)}
            >
              <HelpCircle size={13} />
              <span>{isEn ? 'What is RIR?' : 'RIR là gì?'}</span>
            </button>
          </div>
        </div>

        {showRirTooltip && (
          <div className="rir-explainer-banner">
            <strong>RIR (Reps in Reserve — Số rep dự trữ):</strong>
            <ul>
              <li><strong>RIR 0:</strong> Chạm ngưỡng thất bại hoàn toàn (Failure) — không thể làm thêm dù chỉ 1 rep.</li>
              <li><strong>RIR 1:</strong> Còn cố được đúng 1 rep nữa là tạch (Ngưỡng kích thích tăng cơ tối ưu 🔥).</li>
              <li><strong>RIR 2:</strong> Còn có thể đẩy thêm 2 rep (Vùng vàng Hypertrophy an toàn).</li>
              <li><strong>RIR 3 - 4:</strong> Hiệp khởi động hoặc rèn kỹ thuật, chưa chạm vùng căng thẳng sợi cơ.</li>
            </ul>
          </div>
        )}

        {exercises.length === 0 ? (
          <div className="empty-workout-box">
            <Dumbbell size={32} className="empty-icon" />
            <p>
              {isEn
                ? 'No exercises added yet. Pick from the quick shelf above or create a custom exercise to start logging!'
                : 'Chưa có bài tập nào. Hãy chọn nhanh từ danh mục ở trên hoặc nhấn "+ Thêm bài riêng" để bắt đầu ghi nhận!'}
            </p>
          </div>
        ) : (
          <div className="exercise-cards-stack">
            {exercises.map((ex, exIdx) => {
              const exVol = ex.sets.reduce((sum, s) => {
                const w = Number(s.weightKg) || 0;
                const effW = w > 0 ? w : Math.round((parseFloat(userProfile?.weightKg || '70') || 70) * 0.6);
                return sum + effW * (Number(s.reps) || 0);
              }, 0);

              return (
                <div key={ex.id} className="exercise-card">
                  <div className="exercise-card-top">
                    <div className="exercise-name-badge-group">
                      <span className="exercise-index">#{exIdx + 1}</span>
                      <strong className="exercise-title">{ex.name}</strong>
                      <span className="exercise-vol-tag">
                        Volume: {exVol.toLocaleString()} kg
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn-icon-minimal btn-delete-ex"
                      onClick={() => handleDeleteExercise(ex.id)}
                      title={isEn ? 'Remove exercise' : 'Xóa bài tập này'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Bảng các set */}
                  <div className="sets-table-wrapper">
                    <table className="sets-table">
                      <thead>
                        <tr>
                          <th className="col-set">SET</th>
                          <th className="col-weight">{isEn ? 'WEIGHT (KG)' : 'TRỌNG LƯỢNG (KG)'}</th>
                          <th className="col-reps">{isEn ? 'REPS' : 'SỐ REP'}</th>
                          <th className="col-rir">
                            RIR <span className="th-hint">(0-5)</span>
                          </th>
                          <th className="col-action"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((s, sIdx) => (
                          <tr key={sIdx} className="set-row">
                            <td className="col-set">
                              <span className="set-num-pill">{s.setNumber}</span>
                            </td>
                            <td className="col-weight">
                              <div className="input-with-unit">
                                <input
                                  type="number"
                                  min={0}
                                  max={500}
                                  step={0.5}
                                  className="set-input weight-input"
                                  value={s.weightKg}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      ex.id,
                                      sIdx,
                                      'weightKg',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                                <span className="unit-label">kg</span>
                              </div>
                            </td>
                            <td className="col-reps">
                              <input
                                type="number"
                                min={1}
                                max={100}
                                className="set-input reps-input"
                                value={s.reps}
                                onChange={(e) =>
                                  handleUpdateSet(
                                    ex.id,
                                    sIdx,
                                    'reps',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                              />
                            </td>
                            <td className="col-rir">
                              <select
                                className="set-select rir-select"
                                value={s.rir}
                                onChange={(e) =>
                                  handleUpdateSet(
                                    ex.id,
                                    sIdx,
                                    'rir',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                              >
                                <option value={0}>0 (Failure 🔥)</option>
                                <option value={1}>1 (Rất nặng)</option>
                                <option value={2}>2 (Chuẩn đẹp)</option>
                                <option value={3}>3 (Vừa sức)</option>
                                <option value={4}>4 (Khởi động)</option>
                                <option value={5}>5+ (Nhẹ)</option>
                              </select>
                            </td>
                            <td className="col-action">
                              <button
                                type="button"
                                className="btn-icon-minimal btn-delete-set"
                                onClick={() => handleDeleteSet(ex.id, sIdx)}
                                title={isEn ? 'Delete set' : 'Xóa set'}
                                disabled={ex.sets.length <= 1}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="exercise-card-bottom">
                    <button
                      type="button"
                      className="btn-minimal btn-sm btn-add-set"
                      onClick={() => handleAddSet(ex.id)}
                    >
                      <Plus size={13} />
                      <span>{isEn ? 'Add Set' : 'Thêm hiệp (Set)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. THANH HÀNH ĐỘNG DƯỚI CÙNG (SAVE & RESET) */}
        <div className="workout-bottom-actions">
          <button
            type="button"
            className="btn-minimal btn-sm btn-reset-workout"
            onClick={handleResetWorkout}
            disabled={exercises.length === 0 && selectedMuscles.length === 0}
          >
            <RotateCcw size={14} />
            <span>{isEn ? 'Reset Workout' : 'Xóa trắng buổi tập'}</span>
          </button>

          <button
            type="button"
            className="btn-minimal btn-save-workout"
            onClick={handleSave}
            disabled={isSaving || exercises.length === 0}
          >
            {isSaving ? (
              <>
                <span className="spinner-sm" />
                <span>{isEn ? 'Analyzing Workout...' : 'AI Đang phân tích...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>
                  {isEn
                    ? 'Save & AI Training Analysis'
                    : 'Lưu & Phân tích AI Huấn Luyện'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. KHUNG NHẬN XÉT AI WORKOUT COACH (AI PROGRESSIVE OVERLOAD INSIGHT) */}
      {summary && (
        <div className="workout-ai-coach-card">
          <div className="ai-coach-header">
            <div className="ai-coach-title">
              <Sparkles size={18} className="ai-sparkle-icon" />
              <strong>
                {isEn ? 'AI WORKOUT COACH INSIGHT' : 'AI HUẤN LUYỆN VIÊN PHÂN TÍCH TIẾN ĐỘ'}
              </strong>
            </div>

            {summary.progressiveOverloadStatus && (
              <span
                className={`overload-status-badge status-${summary.progressiveOverloadStatus.toLowerCase()}`}
              >
                {summary.progressiveOverloadStatus === 'OVERLOAD_ACHIEVED' && (
                  <>
                    <TrendingUp size={13} />
                    <span>{isEn ? 'OVERLOAD ACHIEVED 🔥' : 'TĂNG TẢI THÀNH CÔNG 🔥'}</span>
                  </>
                )}
                {summary.progressiveOverloadStatus === 'MAINTAINED' && (
                  <>
                    <Zap size={13} />
                    <span>{isEn ? 'PERFORMANCE MAINTAINED ⚡' : 'DUY TRÌ PHONG ĐỘ ⚡'}</span>
                  </>
                )}
                {summary.progressiveOverloadStatus === 'DELOAD_FATIGUED' && (
                  <>
                    <ShieldCheck size={13} />
                    <span>{isEn ? 'DELOAD / SYSTEMIC REST 🛌' : 'HỒI PHỤC / DELOAD 🛌'}</span>
                  </>
                )}
                {summary.progressiveOverloadStatus === 'FIRST_SESSION' && (
                  <>
                    <CheckCircle2 size={13} />
                    <span>{isEn ? 'BASELINE ESTABLISHED 🎯' : 'MỐC CƠ SỞ BAN ĐẦU 🎯'}</span>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="ai-metrics-ribbon">
            <div className="ribbon-metric">
              <span className="metric-label">{isEn ? 'Total Volume' : 'Tổng Volume'}</span>
              <strong className="metric-val">{summary.totalVolumeKg.toLocaleString()} kg</strong>
            </div>

            <div className="ribbon-metric">
              <span className="metric-label">{isEn ? 'Sets & Reps' : 'Tổng Hiệp & Rep'}</span>
              <strong className="metric-val">
                {summary.totalSets} sets • {summary.totalReps} reps
              </strong>
            </div>

            <div className="ribbon-metric">
              <span className="metric-label">{isEn ? 'Average RIR' : 'RIR Trung bình'}</span>
              <strong className="metric-val">
                {summary.avgRir} <span className="metric-sub">(Dự trữ)</span>
              </strong>
            </div>

            {summary.comparedDateKey && typeof summary.volumeChangePct === 'number' && (
              <div className="ribbon-metric">
                <span className="metric-label">
                  {isEn ? 'Volume vs Prev Session' : 'So với buổi trước'}
                </span>
                <strong
                  className={`metric-val ${
                    summary.volumeChangePct >= 0 ? 'gain-pos' : 'gain-neg'
                  }`}
                >
                  {summary.volumeChangePct >= 0
                    ? `+${summary.volumeChangePct}%`
                    : `${summary.volumeChangePct}%`}
                </strong>
              </div>
            )}
          </div>

          <div className="ai-coach-message-body">
            <p className="ai-feedback-text">
              {isEn ? summary.aiFeedbackEn || summary.aiFeedback : summary.aiFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
