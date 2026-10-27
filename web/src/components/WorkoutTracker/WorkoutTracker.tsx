import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import {
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

// Icon mũi tên dạng khối bo cạnh cho cụm stepper tăng / giảm
const SolidTriangleUp: React.FC = () => (
  <svg
    width="9"
    height="7"
    viewBox="0 0 12 10"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
    strokeLinecap="round"
    style={{ display: 'block' }}
  >
    <polygon points="6,2 9.5,8 2.5,8" />
  </svg>
);

const SolidTriangleDown: React.FC = () => (
  <svg
    width="9"
    height="7"
    viewBox="0 0 12 10"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
    strokeLinecap="round"
    style={{ display: 'block' }}
  >
    <polygon points="6,8 9.5,2 2.5,2" />
  </svg>
);

export interface UIExerciseSet {
  setNumber: number;
  weightKg: number | string;
  reps: number | string;
  rir: number | string;
}

export interface UIWorkoutExercise {
  id: string;
  name: string;
  category: string;
  sets: UIExerciseSet[];
}

// Helper chuẩn hóa dữ liệu workout để so sánh sự thay đổi chính xác
const serializeWorkout = (
  muscles: string[] = [],
  exs: Array<{ name: string; category?: string; sets: Array<{ weightKg: number | string; reps: number | string; rir: number | string }> }> = []
): string => {
  return JSON.stringify({
    muscles: [...muscles].sort(),
    exercises: exs.map((e) => ({
      name: (e.name || '').trim().toLowerCase(),
      category: e.category || 'gym',
      sets: (e.sets || []).map((s) => ({
        weightKg: s.weightKg === '' ? 0 : Number(s.weightKg) || 0,
        reps: s.reps === '' ? 0 : Number(s.reps) || 0,
        rir: s.rir === '' ? 2 : Number(s.rir) || 0,
      })),
    })),
  });
};

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
  const [exercises, setExercises] = useState<UIWorkoutExercise[]>(() =>
    (initialWorkoutData?.exercises || []).map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      sets: e.sets.map((s) => ({
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps,
        rir: s.rir,
      })),
    }))
  );

  // Exercise ID đang được chọn để nhập / sửa tên
  const [focusedExId, setFocusedExId] = useState<string | null>(null);
  const [showRirTooltip, setShowRirTooltip] = useState(false);

  // Đóng popover gợi ý khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.exercise-title-container')) {
        setFocusedExId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Kiểm tra xem người dùng có thực hiện thay đổi nào so với dữ liệu ban đầu/đã lưu không
  const isChanged = useMemo(() => {
    return (
      serializeWorkout(selectedMuscles, exercises) !==
      serializeWorkout(
        initialWorkoutData?.targetMuscles,
        initialWorkoutData?.exercises
      )
    );
  }, [selectedMuscles, exercises, initialWorkoutData]);

  const lastDateKeyRef = useRef(dateKey);

  useEffect(() => {
    if (lastDateKeyRef.current !== dateKey) {
      lastDateKeyRef.current = dateKey;
      setSelectedMuscles(initialWorkoutData?.targetMuscles || []);
      setExercises(
        (initialWorkoutData?.exercises || []).map((e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          sets: e.sets.map((s) => ({
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            rir: s.rir,
          })),
        }))
      );
      setFocusedExId(null);
      return;
    }

    if (!isChanged) {
      setSelectedMuscles(initialWorkoutData?.targetMuscles || []);
      setExercises(
        (initialWorkoutData?.exercises || []).map((e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          sets: e.sets.map((s) => ({
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            rir: s.rir,
          })),
        }))
      );
    }
  }, [dateKey, initialWorkoutData, isChanged]);

  // Toggle chọn nhóm cơ
  const handleToggleMuscle = (muscleId: string) => {
    setSelectedMuscles((prev) => {
      const exists = prev.includes(muscleId);
      return exists ? prev.filter((m) => m !== muscleId) : [...prev, muscleId];
    });
  };

  // Lấy gợi ý bài tập theo tên đang nhập & nhóm cơ đã chọn
  const getSuggestions = (searchTerm: string): PresetExercise[] => {
    const cleanTerm = (searchTerm || '').trim().toLowerCase();
    if (!cleanTerm) {
      const muscleList = getPresetExercisesForMuscles(selectedMuscles);
      return muscleList.slice(0, 8);
    }
    return PRESET_EXERCISES_DATABASE.filter(
      (item) =>
        item.name.toLowerCase().includes(cleanTerm) ||
        item.nameEn.toLowerCase().includes(cleanTerm) ||
        item.primaryMuscle.toLowerCase().includes(cleanTerm)
    ).slice(0, 8);
  };

  // Thêm một thẻ bài tập mới (chưa có tên)
  const handleAddNewExerciseCard = () => {
    const newId = `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEx: UIWorkoutExercise = {
      id: newId,
      name: '',
      category: 'gym',
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
    // Không bắt buộc phải mở ngay dropdown mà để hiện ra bình thường như người dùng yêu cầu,
    // hoặc có thể người dùng nhấn vào để nhập tên
    setFocusedExId(newId);

    setTimeout(() => {
      const el = document.getElementById(`exercise-card-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const inputEl = el.querySelector<HTMLInputElement>('.exercise-title-input');
        if (inputEl) {
          inputEl.focus();
        }
      }
    }, 60);
  };

  // Cập nhật tên bài tập khi người dùng gõ phím
  const handleUpdateExerciseName = (exerciseId: string, name: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, name } : ex))
    );
  };

  // Chọn một bài tập từ danh sách gợi ý
  const handleSelectSuggestion = (
    exerciseId: string,
    selectedName: string,
    category: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, name: selectedName, category: category || ex.category }
          : ex
      )
    );
    setFocusedExId(null);
  };

  // Xóa bài tập
  const handleDeleteExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    if (focusedExId === exerciseId) {
      setFocusedExId(null);
    }
  };

  // Thêm set cho một bài tập (tự động clone trọng lượng & rep từ set trước đó)
  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: UIExerciseSet = {
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
  };

  // Cập nhật tạ (cho phép xóa trống "")
  const handleUpdateWeight = (
    exerciseId: string,
    setIndex: number,
    rawVal: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        if (rawVal === '') {
          updatedSets[setIndex] = { ...updatedSets[setIndex], weightKg: '' };
        } else {
          const num = parseFloat(rawVal);
          if (!isNaN(num) && num >= 0) {
            updatedSets[setIndex] = { ...updatedSets[setIndex], weightKg: rawVal };
          }
        }
        return { ...ex, sets: updatedSets };
      })
    );
  };

  // Nút custom tăng / giảm tạ với bước nhảy ± 2.5 kg
  const handleStepWeight = (
    exerciseId: string,
    setIndex: number,
    stepDelta: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        const currentVal =
          updatedSets[setIndex].weightKg === ''
            ? 0
            : parseFloat(String(updatedSets[setIndex].weightKg)) || 0;
        const nextVal = Math.max(
          0,
          Math.round((currentVal + stepDelta) * 10) / 10
        );
        updatedSets[setIndex] = { ...updatedSets[setIndex], weightKg: nextVal };
        return { ...ex, sets: updatedSets };
      })
    );
  };

  // Cập nhật rep (cho phép xóa trống "")
  const handleUpdateReps = (
    exerciseId: string,
    setIndex: number,
    rawVal: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        if (rawVal === '') {
          updatedSets[setIndex] = { ...updatedSets[setIndex], reps: '' };
        } else {
          const num = parseInt(rawVal, 10);
          if (!isNaN(num) && num >= 0) {
            updatedSets[setIndex] = { ...updatedSets[setIndex], reps: num };
          }
        }
        return { ...ex, sets: updatedSets };
      })
    );
  };

  // Nút custom tăng / giảm reps với bước nhảy ± 1
  const handleStepReps = (
    exerciseId: string,
    setIndex: number,
    stepDelta: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        const currentVal =
          updatedSets[setIndex].reps === ''
            ? 0
            : parseInt(String(updatedSets[setIndex].reps), 10) || 0;
        const nextVal = Math.max(0, currentVal + stepDelta);
        updatedSets[setIndex] = { ...updatedSets[setIndex], reps: nextVal };
        return { ...ex, sets: updatedSets };
      })
    );
  };

  // Cập nhật RIR khi người dùng gõ vào ô input (cho phép xóa rỗng hoặc nhập số 0-10)
  const handleUpdateRir = (
    exerciseId: string,
    setIndex: number,
    rawVal: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        if (rawVal === '') {
          updatedSets[setIndex] = { ...updatedSets[setIndex], rir: '' };
        } else {
          const num = parseInt(rawVal, 10);
          if (!isNaN(num) && num >= 0 && num <= 10) {
            updatedSets[setIndex] = { ...updatedSets[setIndex], rir: num };
          }
        }
        return { ...ex, sets: updatedSets };
      })
    );
  };

  // Nút custom tăng / giảm RIR với bước nhảy ± 1 (tối thiểu 0, tối đa 10)
  const handleStepRir = (
    exerciseId: string,
    setIndex: number,
    stepDelta: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        const currentVal =
          updatedSets[setIndex].rir === ''
            ? 2
            : parseInt(String(updatedSets[setIndex].rir), 10) || 0;
        const nextVal = Math.min(10, Math.max(0, currentVal + stepDelta));
        updatedSets[setIndex] = { ...updatedSets[setIndex], rir: nextVal };
        return { ...ex, sets: updatedSets };
      })
    );
  };

  // Tính tổng volume tức thì của các bài tập trên màn hình
  const currentTotalVolume = useMemo(() => {
    let vol = 0;
    const userW = parseFloat(userProfile?.weightKg || '70') || 70;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        const w = s.weightKg === '' ? 0 : Number(s.weightKg) || 0;
        const effW = w > 0 ? w : Math.round(userW * 0.6);
        const r = s.reps === '' ? 0 : Number(s.reps) || 0;
        vol += effW * r;
      });
    });
    return vol;
  }, [exercises, userProfile]);

  const totalSetsCount = useMemo(() => {
    return exercises.reduce((acc, e) => acc + e.sets.length, 0);
  }, [exercises]);

  // Lưu: Các ô trống tự động chuyển về 0 (hoặc mặc định RIR = 2)
  const handleSave = async () => {
    const sanitizedExercises: WorkoutExercise[] = exercises.map((ex, exIdx) => ({
      id: ex.id,
      name:
        ex.name.trim() ||
        (isEn ? `Exercise #${exIdx + 1}` : `Bài tập #${exIdx + 1}`),
      category: ex.category || 'gym',
      sets: ex.sets.map((s, sIdx) => ({
        setNumber: sIdx + 1,
        weightKg:
          s.weightKg === '' || s.weightKg === null || isNaN(Number(s.weightKg))
            ? 0
            : Math.max(0, parseFloat(String(s.weightKg))),
        reps:
          s.reps === '' || s.reps === null || isNaN(Number(s.reps))
            ? 0
            : Math.max(0, parseInt(String(s.reps), 10)),
        rir:
          s.rir === '' || s.rir === null || isNaN(Number(s.rir))
            ? 2
            : Math.max(0, parseInt(String(s.rir), 10)),
      })),
    }));

    setExercises(
      sanitizedExercises.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        sets: e.sets.map((s) => ({
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          rir: s.rir,
        })),
      }))
    );

    setFocusedExId(null);

    await onSaveWorkout({
      targetMuscles: selectedMuscles,
      exercises: sanitizedExercises,
    });
  };

  const summary = initialWorkoutData?.summary;

  return (
    <div className="workout-tracker-container">
      {/* 1. KHUNG CHỌN NHÓM CƠ (TARGET MUSCLES) */}
      <div className="workout-muscle-selector-card">
        <div className="workout-card-header">
          <div className="workout-header-title">
            <Dumbbell size={18} />
            <span>
              {isEn
                ? 'TARGET MUSCLE GROUPS / SPLIT'
                : 'NHÓM CƠ / LỊCH TẬP HÔM NAY'}
            </span>
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
                {isSelected && (
                  <CheckCircle2 size={13} className="pill-check-icon" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DANH SÁCH BÀI TẬP ĐÃ TẬP & CÁC HIỆP (LOGGED EXERCISES & SETS) */}
      <div className="workout-exercises-list-section">
        <div className="exercises-list-header">
          <div className="list-title">
            <strong>
              {isEn ? 'TODAY WORKOUT LOG' : 'BẢNG THEO DÕI CÁC HIỆP TẬP'}
            </strong>
            <span className="live-metrics-pill">
              🔥 Total Volume:{' '}
              <strong>{currentTotalVolume.toLocaleString()} kg</strong> (
              {totalSetsCount} sets)
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
              <li>
                <strong>RIR 0:</strong> Chạm ngưỡng thất bại hoàn toàn (Failure)
                — không thể làm thêm dù chỉ 1 rep.
              </li>
              <li>
                <strong>RIR 1:</strong> Còn cố được đúng 1 rep nữa là tạch
                (Ngưỡng kích thích tăng cơ tối ưu 🔥).
              </li>
              <li>
                <strong>RIR 2:</strong> Còn có thể đẩy thêm 2 rep (Vùng vàng
                Hypertrophy an toàn).
              </li>
              <li>
                <strong>RIR 3 - 4:</strong> Hiệp khởi động hoặc rèn kỹ thuật,
                chưa chạm vùng căng thẳng sợi cơ.
              </li>
            </ul>
          </div>
        )}

        {exercises.length === 0 ? (
          <div className="empty-workout-box">
            <Dumbbell size={32} className="empty-icon" />
            <p>
              {isEn
                ? 'No exercises added yet. Click "+ Add Exercise" below to start logging!'
                : 'Chưa có bài tập nào. Hãy nhấn nút "+ Thêm bài tập" bên dưới để bắt đầu ghi nhận!'}
            </p>
            <button
              type="button"
              className="btn-minimal btn-add-exercise-bottom"
              onClick={handleAddNewExerciseCard}
            >
              <Plus size={15} />
              <span>{isEn ? 'Add Exercise' : 'Thêm bài tập'}</span>
            </button>
          </div>
        ) : (
          <div className="exercise-cards-stack">
            {exercises.map((ex, exIdx) => {
              const exVol = ex.sets.reduce((sum, s) => {
                const w = s.weightKg === '' ? 0 : Number(s.weightKg) || 0;
                const effW =
                  w > 0
                    ? w
                    : Math.round(
                        (parseFloat(userProfile?.weightKg || '70') || 70) * 0.6
                      );
                const r = s.reps === '' ? 0 : Number(s.reps) || 0;
                return sum + effW * r;
              }, 0);

              const suggestionsList = getSuggestions(ex.name);

              return (
                <div
                  key={ex.id}
                  id={`exercise-card-${ex.id}`}
                  className="exercise-card"
                >
                  <div className="exercise-card-top">
                    <div className="exercise-name-badge-group">
                      <span className="exercise-index">#{exIdx + 1}</span>

                      {/* KHU VỰC NHẬP / CHỌN TÊN BÀI TẬP VỚI AUTOCOMPLETE */}
                      <div className="exercise-title-container">
                        {focusedExId === ex.id ? (
                          <div className="exercise-title-input-wrapper">
                            <input
                              type="text"
                              className="exercise-title-input"
                              placeholder={
                                isEn
                                  ? 'Type exercise name...'
                                  : 'Nhập tên bài tập...'
                              }
                              value={ex.name}
                              onChange={(e) =>
                                handleUpdateExerciseName(ex.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setFocusedExId(null);
                                }
                              }}
                              autoFocus
                            />

                            {/* Dropdown gợi ý bài tập */}
                            <div className="exercise-suggestions-popover">
                              <div className="suggestions-header">
                                <span>
                                  {isEn
                                    ? 'Exercise suggestions'
                                    : 'Gợi ý bài tập'}
                                </span>
                                <span className="suggestions-sub">
                                  {isEn
                                    ? 'Click to select or keep typing custom name'
                                    : 'Nhấn để chọn hoặc tự gõ tên riêng'}
                                </span>
                              </div>
                              <div className="suggestions-list">
                                {suggestionsList.map((item) => (
                                  <div
                                    key={item.id}
                                    className="suggestion-item"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectSuggestion(
                                        ex.id,
                                        isEn ? item.nameEn : item.name,
                                        item.category
                                      );
                                    }}
                                  >
                                    <span className="suggestion-name">
                                      {isEn ? item.nameEn : item.name}
                                    </span>
                                    <span className="suggestion-muscle">
                                      {isEn
                                        ? item.primaryMuscleEn
                                        : item.primaryMuscle}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`exercise-title-pill ${!ex.name.trim() ? 'is-empty' : ''}`}
                            onClick={() => setFocusedExId(ex.id)}
                            role="button"
                            tabIndex={0}
                            title={
                              isEn
                                ? 'Click to enter/edit exercise name'
                                : 'Nhấn để nhập hoặc sửa tên bài tập'
                            }
                          >
                            {ex.name.trim() ? (
                              <>
                                <strong className="exercise-title">
                                  {ex.name}
                                </strong>
                                <Edit2
                                  size={12}
                                  className="exercise-title-edit-icon"
                                />
                              </>
                            ) : (
                              <span className="exercise-title-unnamed">
                                ✍️{' '}
                                {isEn
                                  ? 'Click to enter exercise name...'
                                  : 'Chưa có tên — Nhấn để nhập tên'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

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
                          <th className="col-weight">
                            {isEn ? 'WEIGHT (KG)' : 'TRỌNG LƯỢNG (KG)'}
                          </th>
                          <th className="col-reps">
                            {isEn ? 'REPS' : 'SỐ REP'}
                          </th>
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
                              <span className="set-num-pill">
                                {s.setNumber}
                              </span>
                            </td>
                            {/* Ô NHẬP TẠ VỚI MŨI TÊN TĂNG GIẢM DẠNG KHỐI BO CẠNH (± 2.5 KG) - ĐÃ BỎ CHỮ KG BÊN CẠNH */}
                            <td className="col-weight">
                              <div className="stepper-input-wrapper">
                                <input
                                  type="number"
                                  min={0}
                                  max={500}
                                  step={0.5}
                                  className="stepper-native-input weight-input"
                                  value={s.weightKg}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleUpdateWeight(
                                      ex.id,
                                      sIdx,
                                      e.target.value
                                    )
                                  }
                                />
                                <div className="stepper-arrows-col">
                                  <button
                                    type="button"
                                    className="stepper-arrow-btn stepper-arrow-up"
                                    onClick={() =>
                                      handleStepWeight(ex.id, sIdx, 2.5)
                                    }
                                    tabIndex={-1}
                                    title={
                                      isEn
                                        ? 'Increase by 2.5 kg'
                                        : 'Tăng 2.5 kg'
                                    }
                                    aria-label="Increase weight"
                                  >
                                    <SolidTriangleUp />
                                  </button>
                                  <button
                                    type="button"
                                    className="stepper-arrow-btn stepper-arrow-down"
                                    onClick={() =>
                                      handleStepWeight(ex.id, sIdx, -2.5)
                                    }
                                    tabIndex={-1}
                                    title={
                                      isEn
                                        ? 'Decrease by 2.5 kg'
                                        : 'Giảm 2.5 kg'
                                    }
                                    aria-label="Decrease weight"
                                  >
                                    <SolidTriangleDown />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Ô NHẬP REPS VỚI MŨI TÊN TĂNG GIẢM DẠNG KHỐI BO CẠNH (± 1 REP) */}
                            <td className="col-reps">
                              <div className="stepper-input-wrapper">
                                <input
                                  type="number"
                                  min={0}
                                  max={200}
                                  className="stepper-native-input reps-input"
                                  value={s.reps}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleUpdateReps(
                                      ex.id,
                                      sIdx,
                                      e.target.value
                                    )
                                  }
                                />
                                <div className="stepper-arrows-col">
                                  <button
                                    type="button"
                                    className="stepper-arrow-btn stepper-arrow-up"
                                    onClick={() =>
                                      handleStepReps(ex.id, sIdx, 1)
                                    }
                                    tabIndex={-1}
                                    title={
                                      isEn ? 'Increase by 1 rep' : 'Tăng 1 rep'
                                    }
                                    aria-label="Increase reps"
                                  >
                                    <SolidTriangleUp />
                                  </button>
                                  <button
                                    type="button"
                                    className="stepper-arrow-btn stepper-arrow-down"
                                    onClick={() =>
                                      handleStepReps(ex.id, sIdx, -1)
                                    }
                                    tabIndex={-1}
                                    title={
                                      isEn ? 'Decrease by 1 rep' : 'Giảm 1 rep'
                                    }
                                    aria-label="Decrease reps"
                                  >
                                    <SolidTriangleDown />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Ô NHẬP RIR VỚI MŨI TÊN TĂNG GIẢM DẠNG KHỐI BO CẠNH (± 1 RIR) */}
                            <td className="col-rir">
                              <div
                                className="stepper-input-wrapper"
                                title={
                                  s.rir === 0
                                    ? isEn ? 'RIR 0: Failure (no reps left)' : 'RIR 0: Hết sức hoàn toàn (Failure)'
                                    : s.rir === 1
                                    ? isEn ? 'RIR 1: 1 rep in reserve' : 'RIR 1: Còn dư 1 rep'
                                    : s.rir === 2
                                    ? isEn ? 'RIR 2: Hypertrophy target' : 'RIR 2: Chuẩn mục tiêu tăng cơ'
                                    : isEn ? `RIR ${s.rir}: ${s.rir} reps left` : `RIR ${s.rir}: Còn dư ${s.rir} rep`
                                }
                              >
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  className="stepper-native-input rir-input"
                                  value={s.rir}
                                  placeholder="2"
                                  onChange={(e) =>
                                    handleUpdateRir(
                                      ex.id,
                                      sIdx,
                                      e.target.value
                                    )
                                  }
                                />
                                <div className="stepper-arrows-col">
                                  <button
                                    type="button"
                                    className="stepper-arrow-btn stepper-arrow-up"
                                    onClick={() =>
                                      handleStepRir(ex.id, sIdx, 1)
                                    }
                                    tabIndex={-1}
                                    title={
                                      isEn ? 'Increase RIR (+1)' : 'Tăng RIR (+1)'
                                    }
                                    aria-label="Increase RIR"
                                  >
                                    <SolidTriangleUp />
                                  </button>
                                  <button
                                    type="button"
                                    className="stepper-arrow-btn stepper-arrow-down"
                                    onClick={() =>
                                      handleStepRir(ex.id, sIdx, -1)
                                    }
                                    tabIndex={-1}
                                    title={
                                      isEn ? 'Decrease RIR (-1)' : 'Giảm RIR (-1)'
                                    }
                                    aria-label="Decrease RIR"
                                  >
                                    <SolidTriangleDown />
                                  </button>
                                </div>
                              </div>
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

        {/* 3. THANH HÀNH ĐỘNG DƯỚI CÙNG: NÚT THÊM BÀI TẬP VÀ NÚT LƯU CÙNG HÀNG */}
        <div className="workout-bottom-actions">
          <button
            type="button"
            className="btn-minimal btn-add-exercise-bottom"
            onClick={handleAddNewExerciseCard}
          >
            <Plus size={15} />
            <span>{isEn ? 'Add Exercise' : 'Thêm bài tập'}</span>
          </button>

          <button
            type="button"
            className="btn-minimal btn-save-workout"
            onClick={handleSave}
            disabled={isSaving || !isChanged}
            title={
              !isChanged
                ? isEn
                  ? 'No changes to save'
                  : 'Chưa có thay đổi mới để lưu'
                : undefined
            }
          >
            {isSaving ? (
              <>
                <span className="spinner-sm" />
                <span>
                  {isEn ? 'Analyzing Workout...' : 'AI Đang phân tích...'}
                </span>
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

      {/* 4. KHUNG NHẬN XÉT AI WORKOUT COACH (AI PROGRESSIVE OVERLOAD INSIGHT) */}
      {summary && exercises.length > 0 && (
        <div className="workout-ai-coach-card">
          <div className="ai-coach-header">
            <div className="ai-coach-title">
              <Sparkles size={18} className="ai-sparkle-icon" />
              <strong>
                {isEn
                  ? 'AI WORKOUT COACH INSIGHT'
                  : 'AI HUẤN LUYỆN VIÊN PHÂN TÍCH TIẾN ĐỘ'}
              </strong>
            </div>

            {summary.progressiveOverloadStatus && (
              <span
                className={`overload-status-badge status-${summary.progressiveOverloadStatus.toLowerCase()}`}
              >
                {summary.progressiveOverloadStatus === 'OVERLOAD_ACHIEVED' && (
                  <>
                    <TrendingUp size={13} />
                    <span>
                      {isEn
                        ? 'OVERLOAD ACHIEVED 🔥'
                        : 'TĂNG TẢI THÀNH CÔNG 🔥'}
                    </span>
                  </>
                )}
                {summary.progressiveOverloadStatus === 'MAINTAINED' && (
                  <>
                    <Zap size={13} />
                    <span>
                      {isEn
                        ? 'PERFORMANCE MAINTAINED ⚡'
                        : 'DUY TRÌ PHONG ĐỘ ⚡'}
                    </span>
                  </>
                )}
                {summary.progressiveOverloadStatus === 'DELOAD_FATIGUED' && (
                  <>
                    <ShieldCheck size={13} />
                    <span>
                      {isEn
                        ? 'DELOAD / SYSTEMIC REST 🛌'
                        : 'HỒI PHỤC / DELOAD 🛌'}
                    </span>
                  </>
                )}
                {summary.progressiveOverloadStatus === 'FIRST_SESSION' && (
                  <>
                    <CheckCircle2 size={13} />
                    <span>
                      {isEn
                        ? 'BASELINE ESTABLISHED 🎯'
                        : 'MỐC CƠ SỞ BAN ĐẦU 🎯'}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="ai-metrics-ribbon">
            <div className="ribbon-metric">
              <span className="metric-label">
                {isEn ? 'Total Volume' : 'Tổng Volume'}
              </span>
              <strong className="metric-val">
                {summary.totalVolumeKg.toLocaleString()} kg
              </strong>
            </div>

            <div className="ribbon-metric">
              <span className="metric-label">
                {isEn ? 'Sets & Reps' : 'Tổng Hiệp & Rep'}
              </span>
              <strong className="metric-val">
                {summary.totalSets} sets • {summary.totalReps} reps
              </strong>
            </div>

            <div className="ribbon-metric">
              <span className="metric-label">
                {isEn ? 'Average RIR' : 'RIR Trung bình'}
              </span>
              <strong className="metric-val">
                {summary.avgRir} <span className="metric-sub">(Dự trữ)</span>
              </strong>
            </div>

            {summary.comparedDateKey &&
              typeof summary.volumeChangePct === 'number' && (
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
              {isEn
                ? summary.aiFeedbackEn || summary.aiFeedback
                : summary.aiFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
