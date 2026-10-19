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
  UtensilsCrossed,
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

interface CaloriesTrackerProps {
  dateKey: string;
  initialMeals?: FoodItem[];
  initialSummary?: CaloriesSummary;
  onSaveCalories: (meals: FoodItem[]) => Promise<void>;
  isSaving?: boolean;
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

const SESSION_METADATA: Record<
  MealSession,
  { label: string; icon: React.ReactNode; timeRange: string; desc: string }
> = {
  morning: {
    label: 'Buổi Sáng',
    icon: <Sun size={17} />,
    timeRange: '06:00 – 11:30',
    desc: 'Khởi đầu ngày mới với năng lượng sạch & protein',
  },
  afternoon: {
    label: 'Buổi Chiều',
    icon: <Sunset size={17} />,
    timeRange: '11:30 – 17:30',
    desc: 'Bữa chính nạp đạm, tinh bột chậm & rau củ',
  },
  evening: {
    label: 'Buổi Tối',
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
}) => {
  const [meals, setMeals] = useState<FoodItem[]>(() => initialMeals);
  const [activeSessionAdd, setActiveSessionAdd] = useState<MealSession | null>(
    null
  );
  const [foodNameInput, setFoodNameInput] = useState('');
  const [foodWeightInput, setFoodWeightInput] = useState('');
  const [foodStateInput, setFoodStateInput] = useState<FoodState>('cooked');
  const [cookingMethodInput, setCookingMethodInput] = useState<CookingMethod>('luoc');
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
    setCookingMethodInput('luoc');
  };

  const handleCloseAddForm = () => {
    setActiveSessionAdd(null);
    setFoodNameInput('');
    setFoodWeightInput('');
    setFoodStateInput('cooked');
    setCookingMethodInput('luoc');
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
      cookingMethod: foodStateInput === 'cooked' ? cookingMethodInput : undefined,
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
        cookingMethod: foodStateInput === 'cooked' ? cookingMethodInput : undefined,
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
      return <span className="food-prep-badge badge-raw">Sống</span>;
    }
    if (item.foodState === 'cooked') {
      const method = item.cookingMethod;
      const label = method ? COOKING_METHOD_LABELS[method] || 'Chín' : 'Chín';
      return <span className={`food-prep-badge badge-method-${method || 'cooked'}`}>{label}</span>;
    }
    if (item.time) {
      return <span className="food-prep-badge badge-time">{item.time}</span>;
    }
    return <span className="food-prep-badge badge-cooked">Chín</span>;
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
      {/* Thanh tiêu đề & hướng dẫn */}
      <div className="calories-header-bar">
        <div>
          <div className="calories-header-tag">
            <UtensilsCrossed size={15} />
            <span>NHẬT KÝ DINH DƯỠNG & BỮA ĂN HẰNG NGÀY</span>
          </div>
          <h3 className="calories-heading">
            Theo dõi Calories & Dinh dưỡng — {dateKey}
          </h3>
          <p className="calories-subtext">
            Khung giờ ghi nhận từ <strong>06:00 sáng đến 21:00 tối</strong>. Nhập các món ăn cùng định lượng (gram / khẩu phần), chọn trạng thái Sống hoặc Chín kèm cách chế biến, sau đó nhấn Lưu để AI tự động tính toán 5 chỉ số và nhận xét chuyên sâu.
          </p>
        </div>

        <div className="calories-actions-row">
          {hasMenuChanged && !isSaving && (
            <span className="unsaved-badge" title="Bạn có món ăn mới chưa được lưu và phân tích">
              <AlertCircle size={13} />
              <span>Chưa lưu thay đổi</span>
            </span>
          )}

          {meals.length > 0 && (
            <button
              type="button"
              className="btn-minimal btn-sm btn-calories-reset"
              onClick={handleResetMeals}
              disabled={isSaving}
              title="Xóa trắng danh sách món ăn trong ngày"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            className="btn-minimal btn-save-calories"
            onClick={handleSave}
            disabled={!canSaveAndAnalyze}
            title={
              isSaving
                ? 'AI đang phân tích thực đơn...'
                : canSaveAndAnalyze
                ? 'Lưu thực đơn và chạy AI Dinh dưỡng để tổng hợp 5 chỉ số'
                : 'Thực đơn chưa có thay đổi mới để phân tích'
            }
          >
            <Sparkles size={15} className={isSaving ? 'spin-anim' : ''} />
            <span>{isSaving ? 'AI đang phân tích...' : 'Lưu & Phân tích AI'}</span>
          </button>
        </div>
      </div>

      {/* 3 Khoảng thời gian: Sáng, Chiều, Tối */}
      <div className="meal-sessions-grid">
        {(['morning', 'afternoon', 'evening'] as MealSession[]).map((session) => {
          const meta = SESSION_METADATA[session];
          const sessionMeals = getMealsBySession(session);
          const isAdding = activeSessionAdd === session;

          return (
            <div key={session} className={`meal-session-card session-${session}`}>
              <div className="meal-session-card-header">
                <div className="session-title-group">
                  <div className="session-icon-box">{meta.icon}</div>
                  <div>
                    <h4 className="session-title">{meta.label}</h4>
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
                  title={`Thêm món ăn cho ${meta.label}`}
                >
                  <Plus size={13} />
                  <span>Thêm món</span>
                </button>
              </div>

              {/* Danh sách các món đã thêm trong buổi */}
              <div className="food-items-list">
                {sessionMeals.length === 0 && !isAdding && (
                  <div className="food-empty-box">
                    <span>Chưa có món ăn nào cho {meta.label.toLowerCase()}</span>
                  </div>
                )}

                {sessionMeals.map((item) => (
                  <div key={item.id} className="food-item-row">
                    <div className="food-item-left">
                      {renderFoodBadge(item)}
                      <div className="food-info">
                        <strong className="food-name">{item.name}</strong>
                        <span className="food-weight">{item.weight}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-food-delete"
                      onClick={() => handleDeleteFoodItem(item.id)}
                      title="Xóa món này"
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
                          <label className="inline-label">Tên món ăn:</label>
                          <input
                            type="text"
                            className="form-input inline-input"
                            placeholder="VD: Cơm trắng, Ức gà, Trứng..."
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
                          <label className="inline-label">Định lượng:</label>
                          <input
                            type="text"
                            className="form-input inline-input"
                            placeholder="VD: 150g, 1 bát, 2 quả..."
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
                          <label className="inline-label">Trạng thái:</label>
                          <div className="state-toggle-group">
                            <button
                              type="button"
                              className={`btn-state-pill ${foodStateInput === 'cooked' ? 'active' : ''}`}
                              onClick={() => setFoodStateInput('cooked')}
                            >
                              🍳 Chín
                            </button>
                            <button
                              type="button"
                              className={`btn-state-pill ${foodStateInput === 'raw' ? 'active' : ''}`}
                              onClick={() => setFoodStateInput('raw')}
                            >
                              🥩 Sống
                            </button>
                          </div>
                        </div>

                        {/* Nếu chọn Chín: Hiện thêm 5 phương pháp chế biến */}
                        {foodStateInput === 'cooked' && (
                          <div className="inline-prep-field">
                            <label className="inline-label">Cách chế biến:</label>
                            <div className="method-toggle-group">
                              {(
                                [
                                  { key: 'luoc', label: 'Luộc' },
                                  { key: 'hap', label: 'Hấp' },
                                  { key: 'xao', label: 'Xào' },
                                  { key: 'chien', label: 'Chiên' },
                                  { key: 'nuong', label: 'Nướng' },
                                ] as const
                              ).map((m) => (
                                <button
                                  key={m.key}
                                  type="button"
                                  className={`btn-method-pill ${cookingMethodInput === m.key ? 'active' : ''}`}
                                  onClick={() => setCookingMethodInput(m.key)}
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
                        <span>Thêm vào buổi</span>
                      </button>
                      <button
                        type="button"
                        className="btn-minimal btn-sm"
                        onClick={handleCloseAddForm}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI DINH DƯỠNG NHỎ (MINI NUTRITIONIST AI COACH) */}
      <div className="nutrition-ai-widget">
        <div className="nutrition-ai-header">
          <div className="nutrition-ai-badge">
            <Sparkles size={15} />
            <span>AI DINH DƯỠNG (MINI NUTRITIONIST AI)</span>
          </div>
          {initialSummary?.updatedAt && (
            <span className="nutrition-ai-updated">
              Phân tích lần cuối: {new Date(initialSummary.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* 5 Thẻ chỉ số dinh dưỡng: Calories, Protein, Carb, Fat, Chất xơ */}
        <div className="nutrition-macros-grid">
          <div className="macro-card macro-calories">
            <span className="macro-card-label">TỔNG CALORIES</span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.totalCalories : 0}</strong>
              <span className="macro-unit">kcal</span>
            </div>
            <span className="macro-desc">Năng lượng nạp</span>
          </div>

          <div className="macro-card macro-protein">
            <span className="macro-card-label">PROTEIN (ĐẠM)</span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.protein : 0}</strong>
              <span className="macro-unit">g</span>
            </div>
            <span className="macro-desc">Phát triển cơ bắp</span>
          </div>

          <div className="macro-card macro-carb">
            <span className="macro-card-label">CARB (TINH BỘT)</span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.carb : 0}</strong>
              <span className="macro-unit">g</span>
            </div>
            <span className="macro-desc">Nhiên liệu hoạt động</span>
          </div>

          <div className="macro-card macro-fat">
            <span className="macro-card-label">FAT (CHẤT BÉO)</span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.fat : 0}</strong>
              <span className="macro-unit">g</span>
            </div>
            <span className="macro-desc">Hormone & tế bào</span>
          </div>

          <div className="macro-card macro-fiber">
            <span className="macro-card-label">CHẤT XƠ (FIBER)</span>
            <div className="macro-card-value">
              <strong>{initialSummary ? initialSummary.fiber : 0}</strong>
              <span className="macro-unit">g</span>
            </div>
            <span className="macro-desc">Hệ tiêu hóa khỏe</span>
          </div>
        </div>

        {/* Hộp nhận xét của AI dựa theo bảng calories mới nhất */}
        <div className="nutrition-ai-feedback-box">
          <div className="feedback-content-row">
            <div className="feedback-ai-icon">
              <Sparkles size={16} />
            </div>
            <div className="feedback-ai-text">
              <span className="feedback-label">ĐÁNH GIÁ CHUYÊN MÔN CỦA AI:</span>
              <p className="feedback-paragraph">
                {initialSummary?.aiFeedback ? (
                  initialSummary.aiFeedback
                ) : (
                  <span className="feedback-placeholder">
                    Chưa có nhận xét. Sau khi nhập các món ăn trong ngày, bạn hãy nhấn nút <strong>“Lưu & Phân tích AI”</strong> ở phía trên để AI tổng hợp 5 chỉ số và đưa ra lời khuyên cá nhân hóa!
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

