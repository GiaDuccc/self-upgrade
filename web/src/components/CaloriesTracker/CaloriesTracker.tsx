import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Sun,
  Sunset,
  Moon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  CaloriesSummary,
  FoodItem,
  MealSession,
  FoodState,
  CookingMethod,
} from '~/interface/discipline.interface';
import { useLanguage } from '~/utils/i18n';
import { UserProfile } from '~/interface/user.interface';
import { calculateMacroRecommendations } from '~/utils/constants';

interface CaloriesTrackerProps {
  dateKey: string;
  initialMeals?: FoodItem[];
  initialSummary?: CaloriesSummary;
  onSaveCalories: (meals: FoodItem[]) => Promise<void>;
  isSaving?: boolean;
  userProfile?: UserProfile;
}

const DEFAULT_TIMES: Record<MealSession, string> = {
  morning: '07:30',
  afternoon: '12:30',
  evening: '19:00',
};

const COOKING_METHOD_LABELS: Record<CookingMethod, string> = {
  hap: 'Hấp',
  luoc: 'Luộc',
  xao: 'Xào',
  chien: 'Chiên',
  nuong: 'Nướng',
};

const COOKING_METHOD_LABELS_EN: Record<CookingMethod, string> = {
  hap: 'Steamed',
  luoc: 'Boiled',
  xao: 'Stir-fried',
  chien: 'Fried',
  nuong: 'Grilled',
};

const SESSION_METADATA: Record<
  MealSession,
  {
    label: string;
    labelEn: string;
    icon: React.ReactNode;
    timeRange: string;
    desc: string;
  }
> = {
  morning: {
    label: 'Buổi Sáng',
    labelEn: 'Morning',
    icon: <Sun size={17} />,
    timeRange: '06:00 – 11:30',
    desc: 'Khởi đầu ngày mới với năng lượng sạch & protein',
  },
  afternoon: {
    label: 'Buổi Chiều',
    labelEn: 'Afternoon',
    icon: <Sunset size={17} />,
    timeRange: '11:30 – 17:30',
    desc: 'Bữa chính nạp đạm, tinh bột chậm & rau củ',
  },
  evening: {
    label: 'Buổi Tối',
    labelEn: 'Evening',
    icon: <Moon size={17} />,
    timeRange: '17:30 – 21:00',
    desc: 'Bữa tối nhẹ nhàng, ưu tiên chất xơ & dễ tiêu',
  },
};

export const CaloriesTracker: React.FC<CaloriesTrackerProps> = ({
  dateKey,
  initialMeals = [],
  initialSummary,
  onSaveCalories,
  isSaving = false,
  userProfile,
}) => {
  const { isEn } = useLanguage();
  const macroTargets = userProfile ? calculateMacroRecommendations(userProfile) : null;
  const [meals, setMeals] = useState<FoodItem[]>(() => initialMeals);
  const [activeSessionAdd, setActiveSessionAdd] = useState<MealSession | null>(
    null
  );
  const [foodNameInput, setFoodNameInput] = useState('');
  const [foodWeightInput, setFoodWeightInput] = useState('');
  const [foodStateInput, setFoodStateInput] = useState<FoodState>('cooked');
  const [cookingMethodInput, setCookingMethodInput] = useState<CookingMethod | undefined>(undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const lastDateKeyRef = useRef(dateKey);
  const lastInitialMealsJsonRef = useRef(JSON.stringify(initialMeals || []));

  useEffect(() => {
    const currentJson = JSON.stringify(initialMeals || []);
    if (lastDateKeyRef.current !== dateKey) {
      lastDateKeyRef.current = dateKey;
      lastInitialMealsJsonRef.current = currentJson;
      setMeals(initialMeals || []);
      setHasUnsavedChanges(false);
      return;
    }

    if (currentJson !== lastInitialMealsJsonRef.current) {
      lastInitialMealsJsonRef.current = currentJson;
      setMeals(initialMeals || []);
      setHasUnsavedChanges(false);
    }
  }, [dateKey, initialMeals]);

  const handleOpenAddForm = (session: MealSession) => {
    setActiveSessionAdd(session);
    setFoodNameInput('');
    setFoodWeightInput('');
    setFoodStateInput('cooked');
    setCookingMethodInput(undefined);
  };

  const handleCloseAddForm = () => {
    setActiveSessionAdd(null);
    setFoodNameInput('');
    setFoodWeightInput('');
    setFoodStateInput('cooked');
    setCookingMethodInput(undefined);
  };

  const handleAddFoodItem = (session: MealSession) => {
    const trimmedName = foodNameInput.trim();
    const trimmedWeight = foodWeightInput.trim();

    if (!trimmedName) return;

    const newItem: FoodItem = {
      id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      weight: trimmedWeight || '1 phần',
      mealSession: session,
      foodState: foodStateInput,
      cookingMethod: foodStateInput === 'cooked' && cookingMethodInput ? cookingMethodInput : undefined,
      time: DEFAULT_TIMES[session],
    };

    setMeals((prev) => [...prev, newItem]);
    setHasUnsavedChanges(true);
    handleCloseAddForm();
  };

  const handleDeleteFoodItem = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleResetMeals = () => {
    if (meals.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ món ăn trong ngày này không?')) {
      setMeals([]);
      setHasUnsavedChanges(true);
    }
  };

  const handleSave = async () => {
    let itemsToSave = [...meals];

    // Tự động gom món ăn người dùng đang nhập dở trong form nếu chưa kịp nhấn "Thêm vào buổi"
    if (activeSessionAdd && foodNameInput.trim()) {
      const pendingItem: FoodItem = {
        id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: foodNameInput.trim(),
        weight: foodWeightInput.trim() || '1 phần',
        mealSession: activeSessionAdd,
        foodState: foodStateInput,
        cookingMethod: foodStateInput === 'cooked' && cookingMethodInput ? cookingMethodInput : undefined,
        time: DEFAULT_TIMES[activeSessionAdd],
      };

      itemsToSave = [...itemsToSave, pendingItem];
      setMeals(itemsToSave);
      handleCloseAddForm();
    }

    if (itemsToSave.length === 0) {
      if (initialMeals && initialMeals.length > 0) {
        await onSaveCalories([]);
        setHasUnsavedChanges(false);
        return;
      }
      toast.warning('Vui lòng thêm ít nhất một món ăn trước khi lưu và phân tích AI!');
      return;
    }

    try {
      await onSaveCalories(itemsToSave);
      setHasUnsavedChanges(false);
    } catch {
      // Error handled by parent
    }
  };

  const getMealsBySession = (session: MealSession) => {
    return meals.filter((m) => m.mealSession === session);
  };

  const renderFoodBadge = (item: FoodItem) => {
    if (item.foodState === 'raw') {
      return (
        <span className="food-prep-badge badge-raw">
          {isEn ? 'Raw' : 'Sống'}
        </span>
      );
    }
    if (item.foodState === 'cooked') {
      const method = item.cookingMethod;
      if (method) {
        const label = isEn
          ? COOKING_METHOD_LABELS_EN[method] || 'Cooked'
          : COOKING_METHOD_LABELS[method] || 'Chín';
        return (
          <span className={`food-prep-badge badge-method-${method}`}>
            {label}
          </span>
        );
      }
      return (
        <span className="food-prep-badge badge-cooked">
          {isEn ? 'Cooked' : 'Chín'}
        </span>
      );
    }
    if (item.time) {
      return <span className="food-prep-badge badge-time">{item.time}</span>;
    }
    return (
      <span className="food-prep-badge badge-cooked">
        {isEn ? 'Cooked' : 'Chín'}
      </span>
    );
  };

  // Chỉ cho phép lưu và phân tích AI khi có thay đổi thực đơn (hoặc đang nhập dở, hoặc chưa từng phân tích)
  const hasPendingInput = Boolean(activeSessionAdd && foodNameInput.trim());
  const areMealsModified =
    hasUnsavedChanges ||
    JSON.stringify(meals) !== JSON.stringify(initialMeals || []);
  const needsInitialAnalysis = meals.length > 0 && !initialSummary;

  const hasMenuChanged = areMealsModified || hasPendingInput || needsInitialAnalysis;
  const canSaveAndAnalyze = !isSaving && hasMenuChanged;

  return (
    <div className="calories-tracker-container">
      {/* Khung hợp nhất: Các bữa ăn & Phân tích AI */}
      <div className="calories-unified-card">
        {/* 3 Khoảng thời gian: Sáng, Chiều, Tối */}
        <div className="meal-sessions-grid">
          {(['morning', 'afternoon', 'evening'] as MealSession[]).map((session) => {
            const meta = SESSION_METADATA[session];
            const sessionLabel = isEn ? meta.labelEn : meta.label;
            const sessionMeals = getMealsBySession(session);
            const isAdding = activeSessionAdd === session;

            return (
            <div key={session} className={`meal-session-card session-${session}`}>
              <div className="meal-session-card-header">
                <div className="session-title-group">
                  <div className="session-icon-box">{meta.icon}</div>
                  <div>
                    <h4 className="session-title">{sessionLabel}</h4>
                    <span className="session-time-pill">
                      <Clock size={11} />
                      {meta.timeRange}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-minimal btn-sm btn-add-food"
                  onClick={() => handleOpenAddForm(session)}
                  title={
                    isEn
                      ? `Add food item for ${sessionLabel}`
                      : `Thêm món ăn cho ${meta.label}`
                  }
                >
                  <Plus size={13} />
                  <span>{isEn ? 'Add Food' : 'Thêm món'}</span>
                </button>
              </div>

              {/* Danh sách các món đã thêm trong buổi */}
              <div className="food-items-list">
                {sessionMeals.length === 0 && !isAdding && (
                  <div className="food-empty-box">
                    <span>
                      {isEn
                        ? `No food items logged for ${sessionLabel.toLowerCase()}`
                        : `Chưa có món ăn nào cho ${meta.label.toLowerCase()}`}
                    </span>
                  </div>
                )}

                {sessionMeals.map((item) => (
                  <div key={item.id} className="food-item-row">
                    <div className="food-item-left">
                      {renderFoodBadge(item)}
                      <div className="food-info">
                        <div className="food-header-line">
                          <strong className="food-name">{item.name}</strong>
                          <span className="food-weight">({item.weight})</span>
                        </div>
                        {typeof item.calories === 'number' && (
                          <div className="food-item-macros">
                            <span className="food-macro-tag cal" title={isEn ? 'Calories' : 'Calo'}>
                              🔥 {item.calories} kcal
                            </span>
                            <span className="food-macro-tag pro" title={isEn ? 'Protein' : 'Chất đạm'}>
                              P: {item.protein ?? 0}g
                            </span>
                            <span className="food-macro-tag carb" title={isEn ? 'Carbs' : 'Tinh bột'}>
                              C: {item.carb ?? 0}g
                            </span>
                            <span className="food-macro-tag fat" title={isEn ? 'Fat' : 'Chất béo'}>
                              F: {item.fat ?? 0}g
                            </span>
                            <span className="food-macro-tag fiber" title={isEn ? 'Fiber' : 'Chất xơ'}>
                              {isEn ? 'Fib' : 'Xơ'}: {item.fiber ?? 0}g
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-food-delete"
                      onClick={() => handleDeleteFoodItem(item.id)}
                      title={isEn ? 'Delete this item' : 'Xóa món này'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {/* Form thêm món nhanh */}
                {isAdding && (
                  <div className="food-add-inline-form">
                    <div className="inline-form-inputs">
                      <div className="inline-form-row">
                        <div className="inline-input-group flex-2">
                          <label className="inline-label">
                            {isEn ? 'Food name:' : 'Tên món ăn:'}
                          </label>
                          <input
                            type="text"
                            className="form-input inline-input"
                            placeholder={
                              isEn
                                ? 'e.g., White rice, Chicken breast, Eggs...'
                                : 'VD: Cơm trắng, Ức gà, Trứng...'
                            }
                            value={foodNameInput}
                            onChange={(e) => setFoodNameInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddFoodItem(session);
                              if (e.key === 'Escape') handleCloseAddForm();
                            }}
                          />
                        </div>

                        <div className="inline-input-group flex-1">
                          <label className="inline-label">
                            {isEn ? 'Portion:' : 'Định lượng:'}
                          </label>
                          <input
                            type="text"
                            className="form-input inline-input"
                            placeholder={
                              isEn
                                ? 'e.g., 150g, 1 bowl, 2 eggs...'
                                : 'VD: 150g, 1 bát, 2 quả...'
                            }
                            value={foodWeightInput}
                            onChange={(e) => setFoodWeightInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddFoodItem(session);
                              if (e.key === 'Escape') handleCloseAddForm();
                            }}
                          />
                        </div>
                      </div>

                      {/* Trạng thái: Sống vs Chín */}
                      <div className="inline-prep-group">
                        <div className="inline-prep-field">
                          <label className="inline-label">
                            {isEn ? 'State:' : 'Trạng thái:'}
                          </label>
                          <div className="state-toggle-group">
                            <button
                              type="button"
                              className={`btn-state-pill ${foodStateInput === 'cooked' ? 'active' : ''}`}
                              onClick={() => setFoodStateInput('cooked')}
                            >
                              🍳 {isEn ? 'Cooked' : 'Chín'}
                            </button>
                            <button
                              type="button"
                              className={`btn-state-pill ${foodStateInput === 'raw' ? 'active' : ''}`}
                              onClick={() => setFoodStateInput('raw')}
                            >
                              🥩 {isEn ? 'Raw' : 'Sống'}
                            </button>
                          </div>
                        </div>

                        {/* Nếu chọn Chín: Hiện thêm 5 phương pháp chế biến */}
                        {foodStateInput === 'cooked' && (
                          <div className="inline-prep-field">
                            <label className="inline-label">
                              {isEn ? 'Cooking method:' : 'Cách chế biến:'}
                            </label>
                            <div className="method-toggle-group">
                              {(
                                [
                                  { key: 'luoc', label: isEn ? 'Boiled' : 'Luộc' },
                                  { key: 'hap', label: isEn ? 'Steamed' : 'Hấp' },
                                  { key: 'xao', label: isEn ? 'Stir-fried' : 'Xào' },
                                  { key: 'chien', label: isEn ? 'Fried' : 'Chiên' },
                                  { key: 'nuong', label: isEn ? 'Grilled' : 'Nướng' },
                                ] as const
                              ).map((m) => (
                                <button
                                  key={m.key}
                                  type="button"
                                  className={`btn-method-pill ${cookingMethodInput === m.key ? 'active' : ''}`}
                                  onClick={() =>
                                    setCookingMethodInput((prev) => (prev === m.key ? undefined : m.key))
                                  }
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="inline-form-actions">
                      <button
                        type="button"
                        className="btn-minimal btn-sm btn-confirm-add"
                        onClick={() => handleAddFoodItem(session)}
                        disabled={!foodNameInput.trim()}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isEn ? 'Add to Meal' : 'Thêm vào buổi'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn-minimal btn-sm"
                        onClick={handleCloseAddForm}
                      >
                        {isEn ? 'Cancel' : 'Hủy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Đường kẻ phân cách giữa Bữa ăn và AI */}
        <div className="calories-section-divider" />

        {/* AI DINH DƯỠNG NHỎ (MINI NUTRITIONIST AI COACH) */}
        <div className="nutrition-ai-section">
          <div className="nutrition-ai-header">
            <div className="nutrition-ai-header-left">
              <div className="nutrition-ai-badge">
                <Sparkles size={15} />
                <span>
                  {isEn
                    ? 'MINI NUTRITIONIST AI'
                    : 'AI DINH DƯỠNG'}
                </span>
              </div>
              {initialSummary?.updatedAt && (
                <span className="nutrition-ai-updated">
                  {isEn ? 'Last analyzed:' : 'Phân tích lần cuối:'}{' '}
                  {new Date(initialSummary.updatedAt).toLocaleTimeString(
                    isEn ? 'en-US' : 'vi-VN',
                    { hour: '2-digit', minute: '2-digit', hour12: false }
                  )}
                </span>
              )}
            </div>

            <div className="nutrition-ai-header-right">
              {hasMenuChanged && !isSaving && (
                <span
                  className="unsaved-badge"
                  title={
                    isEn
                      ? 'You have unsaved and unanalyzed meal items'
                      : 'Bạn có món ăn mới chưa được lưu và phân tích'
                  }
                >
                  <AlertCircle size={13} />
                  <span>{isEn ? 'Unsaved changes' : 'Chưa lưu thay đổi'}</span>
                </span>
              )}

              {meals.length > 0 && (
                <button
                  type="button"
                  className="btn-minimal btn-sm btn-calories-reset"
                  onClick={handleResetMeals}
                  disabled={isSaving}
                  title={
                    isEn
                      ? 'Clear all food items for this day'
                      : 'Xóa trắng danh sách món ăn trong ngày'
                  }
                >
                  <RotateCcw size={13} />
                  <span>{isEn ? 'Reset' : 'Đặt lại'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn-minimal btn-save-calories"
                onClick={handleSave}
                disabled={!canSaveAndAnalyze}
                title={
                  isSaving
                    ? isEn
                      ? 'AI is analyzing meals...'
                      : 'AI đang phân tích thực đơn...'
                    : canSaveAndAnalyze
                    ? isEn
                      ? 'Save meals and run Nutrition AI to calculate 5 metrics'
                      : 'Lưu thực đơn và chạy AI Dinh dưỡng để tổng hợp 5 chỉ số'
                    : isEn
                    ? 'No new meal changes to analyze'
                    : 'Thực đơn chưa có thay đổi mới để phân tích'
                }
              >
                <Sparkles size={15} className={isSaving ? 'spin-anim' : ''} />
                <span>
                  {isSaving
                    ? isEn
                      ? 'AI Analyzing...'
                      : 'AI đang phân tích...'
                    : isEn
                    ? 'Save & AI Analyze'
                    : 'Lưu & Phân tích AI'}
                </span>
              </button>
            </div>
          </div>

        {/* 5 Thẻ chỉ số dinh dưỡng: Calories, Protein, Carb, Fat, Chất xơ */}
        <div className="nutrition-macros-grid">
          <div className="macro-card macro-calories">
            <span className="macro-card-label">
              {isEn ? 'TOTAL CALORIES' : 'TỔNG CALORIES'}
            </span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.totalCalories : 0}</strong>
              {macroTargets ? (
                <span className="macro-target-val">
                  / {macroTargets.targetCalories.toLocaleString()}{' '}
                  <span className="macro-unit">kcal</span>
                </span>
              ) : (
                <span className="macro-unit">kcal</span>
              )}
            </div>
            <span className="macro-desc">
              {macroTargets ? (isEn ? `Target: ~${macroTargets.targetCalories} kcal` : `Mục tiêu: ~${macroTargets.targetCalories} kcal`) : (isEn ? 'Energy intake' : 'Năng lượng nạp')}
            </span>
          </div>

          <div className="macro-card macro-protein">
            <span className="macro-card-label">
              {isEn ? 'PROTEIN' : 'PROTEIN (ĐẠM)'}
            </span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.protein : 0}</strong>
              {macroTargets ? (
                <span className="macro-target-val">
                  / {macroTargets.targetProtein}{' '}
                  <span className="macro-unit">g</span>
                </span>
              ) : (
                <span className="macro-unit">g</span>
              )}
            </div>
            <span className="macro-desc">
              {macroTargets ? (isEn ? `Target: ~${macroTargets.targetProtein}g` : `Mục tiêu: ~${macroTargets.targetProtein}g đạm`) : (isEn ? 'Muscle growth' : 'Phát triển cơ bắp')}
            </span>
          </div>

          <div className="macro-card macro-carb">
            <span className="macro-card-label">
              {isEn ? 'CARBS' : 'CARB (TINH BỘT)'}
            </span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.carb : 0}</strong>
              {macroTargets ? (
                <span className="macro-target-val">
                  / {macroTargets.targetCarb}{' '}
                  <span className="macro-unit">g</span>
                </span>
              ) : (
                <span className="macro-unit">g</span>
              )}
            </div>
            <span className="macro-desc">
              {macroTargets ? (isEn ? `Target: ~${macroTargets.targetCarb}g` : `Mục tiêu: ~${macroTargets.targetCarb}g tinh bột`) : (isEn ? 'Active fuel' : 'Nhiên liệu hoạt động')}
            </span>
          </div>

          <div className="macro-card macro-fat">
            <span className="macro-card-label">
              {isEn ? 'FATS' : 'FAT (CHẤT BÉO)'}
            </span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.fat : 0}</strong>
              {macroTargets ? (
                <span className="macro-target-val">
                  / {macroTargets.targetFat}{' '}
                  <span className="macro-unit">g</span>
                </span>
              ) : (
                <span className="macro-unit">g</span>
              )}
            </div>
            <span className="macro-desc">
              {macroTargets ? (isEn ? `Target: ~${macroTargets.targetFat}g` : `Mục tiêu: ~${macroTargets.targetFat}g chất béo`) : (isEn ? 'Hormones & cells' : 'Hormone & tế bào')}
            </span>
          </div>

          <div className="macro-card macro-fiber">
            <span className="macro-card-label">
              {isEn ? 'FIBER' : 'CHẤT XƠ (FIBER)'}
            </span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.fiber : 0}</strong>
              {macroTargets ? (
                <span className="macro-target-val">
                  / {macroTargets.targetFiber}{' '}
                  <span className="macro-unit">g</span>
                </span>
              ) : (
                <span className="macro-unit">g</span>
              )}
            </div>
            <span className="macro-desc">
              {macroTargets ? (isEn ? `Target: ~${macroTargets.targetFiber}g` : `Mục tiêu: ~${macroTargets.targetFiber}g chất xơ`) : (isEn ? 'Healthy digestion' : 'Hệ tiêu hóa khỏe')}
            </span>
          </div>
        </div>

        {/* Hộp nhận xét của AI dựa theo bảng calories mới nhất */}
        <div className="nutrition-ai-feedback-box">
          <div className="feedback-content-row">
            <div className="feedback-ai-icon">
              <Sparkles size={16} />
            </div>
            <div className="feedback-ai-text">
              <span className="feedback-label">
                {isEn ? 'AI NUTRITIONIST ASSESSMENT:' : 'ĐÁNH GIÁ CHUYÊN MÔN CỦA AI:'}
              </span>
              <p className="feedback-paragraph">
                {initialSummary?.aiFeedback ? (
                  isEn && initialSummary.aiFeedbackEn
                    ? initialSummary.aiFeedbackEn
                    : initialSummary.aiFeedback
                ) : (
                  <span className="feedback-placeholder">
                    {isEn ? (
                      <>
                        No assessment yet. After logging your meals for the day,
                        click <strong>“Save & AI Analyze”</strong> to let AI
                        calculate 5 macros and provide personalized advice!
                      </>
                    ) : (
                      <>
                        Chưa có nhận xét. Sau khi nhập các món ăn trong ngày, bạn
                        hãy nhấn nút <strong>“Lưu & Phân tích AI”</strong> để AI
                        tổng hợp 5 chỉ số và đưa ra lời khuyên cá nhân hóa!
                      </>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

