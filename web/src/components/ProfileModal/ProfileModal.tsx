import React, { useEffect, useState } from 'react';
import {
  X,
  UserCheck,
  Target,
  Dumbbell,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
} from 'lucide-react';
import { UserProfile } from '~/interface/user.interface';
import { DEFAULT_USER_PROFILE, calculateMacroRecommendations } from '~/utils/constants';
import { getLocalizedPersonalization, useLanguage } from '~/utils/i18n';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  isFirstTimeSetup?: boolean;
  onSaveProfile: (newProfile: UserProfile) => Promise<void> | void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  isFirstTimeSetup = false,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...DEFAULT_USER_PROFILE,
    ...(userProfile || {}),
  });
  const [isSaving, setIsSaving] = useState(false);
  const { language, isEn } = useLanguage();
  const localizedOptions = getLocalizedPersonalization(language);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...DEFAULT_USER_PROFILE,
        ...(userProfile || {}),
      });
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_USER_PROFILE });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveProfile(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const weight = parseFloat(formData.weightKg);
  const height = parseFloat(formData.heightCm);
  const waterRecommend =
    weight > 25 && weight < 250
      ? Math.round(weight * 0.04 * 10) / 10
      : null;
  const bmiValue =
    weight > 25 && height > 100
      ? Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10
      : null;

  const macroRec = calculateMacroRecommendations(formData);

  return (
    <div
      className="modal-backdrop"
      onClick={isFirstTimeSetup ? undefined : onClose}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-container modal-container-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="modal-title">
                {isFirstTimeSetup
                  ? isEn
                    ? 'Welcome! First-Time Personalization Setup'
                    : 'Chào mừng! Thiết lập Hồ sơ Cá nhân hóa lần đầu'
                  : isEn
                  ? 'Personalization — Physical, Mental & Emotional States'
                  : 'Cá nhân hóa — Thể chất, Tinh thần & Cảm xúc'}
              </h3>
              <p className="modal-subtitle">
                {isFirstTimeSetup
                  ? isEn
                    ? 'Update your profile & current states after signing in to start your discipline journey'
                    : 'Hãy cập nhật thông tin & trạng thái của bạn sau khi đăng nhập để bắt đầu hành trình kỷ luật'
                  : isEn
                  ? 'Configure your states so the system automatically adjusts scoring & provides tailored coaching'
                  : 'Thiết lập trạng thái để hệ thống tự động điều chỉnh chấm điểm & đưa ra lời khuyên/chê sát nhất'}
              </p>
            </div>
          </div>

          {!isFirstTimeSetup && (
            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              aria-label={isEn ? 'Close modal' : 'Đóng modal'}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form-wrap">
          <div className="modal-body profile-modal-body">
            {/* 1. THÔNG TIN CƠ BẢN & CHỈ SỐ CƠ THỂ */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <UserCheck size={15} />
              <span>
                {isEn
                  ? '1. PERSONAL INFO & BIOLOGICAL METRICS'
                  : '1. THÔNG TIN CÁ NHÂN & CHỈ SỐ SINH HỌC'}
              </span>
            </div>

            <div className="profile-inputs-grid-6">
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">
                  {isEn ? 'NAME / NICKNAME' : 'TÊN / BIỆT DANH'}
                </label>
                <input
                  id="prof-name"
                  type="text"
                  className="form-input"
                  placeholder={isEn ? 'e.g., Alex, Minh...' : 'VD: Minh, Duy...'}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-gender">
                  {isEn ? 'GENDER' : 'GIỚI TÍNH'}
                </label>
                <select
                  id="prof-gender"
                  className="form-input"
                  value={formData.gender || 'male'}
                  onChange={(e) => handleChange('gender', e.target.value as 'male' | 'female')}
                >
                  <option value="male">{isEn ? 'Male' : 'Nam'}</option>
                  <option value="female">{isEn ? 'Female' : 'Nữ'}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-age">
                  {isEn ? 'AGE' : 'TUỔI'}
                </label>
                <input
                  id="prof-age"
                  type="number"
                  className="form-input"
                  placeholder="e.g., 22"
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-weight">
                  {isEn ? 'WEIGHT (KG)' : 'CÂN NẶNG (KG)'}
                </label>
                <input
                  id="prof-weight"
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="e.g., 68"
                  value={formData.weightKg}
                  onChange={(e) => handleChange('weightKg', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-height">
                  {isEn ? 'HEIGHT (CM)' : 'CHIỀU CAO (CM)'}
                </label>
                <input
                  id="prof-height"
                  type="number"
                  className="form-input"
                  placeholder="e.g., 172"
                  value={formData.heightCm}
                  onChange={(e) => handleChange('heightCm', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-sleep">
                  {isEn ? 'TARGET SLEEP (HRS)' : 'GIỜ NGỦ MỤC TIÊU'}
                </label>
                <input
                  id="prof-sleep"
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="e.g., 7"
                  value={formData.sleepTargetHours}
                  onChange={(e) =>
                    handleChange('sleepTargetHours', e.target.value)
                  }
                />
              </div>
            </div>

            {(bmiValue || waterRecommend) && (
              <div className="bio-preview-banner">
                <span>{isEn ? 'Auto metrics:' : 'Chỉ số tự động:'}</span>
                {bmiValue && <strong>BMI {bmiValue}</strong>}
                {waterRecommend && (
                  <span>
                    •{' '}
                    {isEn
                      ? 'Recommended minimum water intake:'
                      : 'Khuyến nghị uống tối thiểu:'}{' '}
                    <strong>
                      {waterRecommend} {isEn ? 'L/day' : 'lít nước/ngày'}
                    </strong>
                  </span>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginTop: '6px' }}>
              <label className="form-label" htmlFor="prof-motto">
                {isEn
                  ? 'DISCIPLINE MOTTO / PRIMARY GOAL'
                  : 'CHÂM NGÔN KỶ LUẬT / MỤC TIÊU LỚN NHẤT'}
              </label>
              <input
                id="prof-motto"
                type="text"
                className="form-input"
                placeholder={
                  isEn
                    ? 'e.g., Discipline equals freedom — Never trade your future for short-term comfort!'
                    : 'VD: Kỷ luật là tự do — Không đánh đổi tương lai lấy sự thoải mái ngắn hạn!'
                }
                value={formData.personalMotto}
                onChange={(e) => handleChange('personalMotto', e.target.value)}
              />
            </div>
          </div>

          {/* 2. TRỌNG TÂM ƯU TIÊN & PHONG CÁCH NHẬN XÉT */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <Target size={15} />
              <span>
                {isEn
                  ? '2. PRIMARY FOCUS GOAL (×1.25 SCORE BOOST) & COACHING STYLE'
                  : '2. MỤC TIÊU TRỌNG TÂM (TRỌNG SỐ ĐIỂM ×1.25) & PHONG CÁCH HUẤN LUYỆN'}
              </span>
            </div>

            <div className="scope-cards-grid">
              {localizedOptions.focusGoals.map((item) => {
                const isSelected = formData.focusGoal === item.id;
                return (
                  <label
                    key={item.id}
                    className={`scope-option-card ${
                      isSelected ? 'scope-option-selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="focusGoal"
                      checked={isSelected}
                      onChange={() => handleChange('focusGoal', item.id)}
                      className="scope-radio"
                    />
                    <div className="scope-card-content">
                      <div className="scope-card-header">
                        <span className="scope-radio-indicator">
                          {isSelected && <span className="scope-radio-dot" />}
                        </span>
                        <strong className="scope-title">{item.label}</strong>
                      </div>
                      <p className="scope-desc">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">
                {isEn ? 'AI COACHING FEEDBACK STYLE' : 'PHONG CÁCH LỜI KHUYÊN / LỜI CHÊ'}
              </label>
              <div className="category-pills-wrap">
                {localizedOptions.coachingStyles.map((st) => {
                  const isSelected = formData.coachingStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      className={`category-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => handleChange('coachingStyle', st.id)}
                      title={st.desc}
                    >
                      <span className="pill-check-box">
                        {isSelected ? <Check size={12} /> : null}
                      </span>
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. MỤC TIÊU TẬP LUYỆN GYM (WORKOUT GOAL & LEVEL) */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <Dumbbell size={15} />
              <span>
                {isEn
                  ? '3. GYM & WORKOUT GOALS (AI COACH CALIBRATION)'
                  : '3. MỤC TIÊU TẬP LUYỆN GYM & TRÌNH ĐỘ (ĐỊNH HƯỚNG AI COACH)'}
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">
                {isEn ? 'PRIMARY WORKOUT GOAL' : 'MỤC TIÊU TẬP LUYỆN CHÍNH'}
              </label>
              <div className="scope-cards-grid">
                {(localizedOptions.workoutGoals || []).map((item) => {
                  const isSelected = (formData.workoutGoal || 'HYPERTROPHY') === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`scope-option-card ${
                        isSelected ? 'scope-option-selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="workoutGoal"
                        checked={isSelected}
                        onChange={() => handleChange('workoutGoal', item.id)}
                        className="scope-radio"
                      />
                      <div className="scope-card-content">
                        <div className="scope-card-header">
                          <span className="scope-radio-indicator">
                            {isSelected && <span className="scope-radio-dot" />}
                          </span>
                          <strong className="scope-title">{isEn ? item.labelEn || item.label : item.label}</strong>
                        </div>
                        {item.desc && <p className="scope-desc">{item.desc}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">
                {isEn ? 'TRAINING EXPERIENCE LEVEL' : 'TRÌNH ĐỘ & KINH NGHIỆM TẬP'}
              </label>
              <div className="category-pills-wrap">
                {(localizedOptions.workoutLevels || []).map((lvl) => {
                  const isSelected = (formData.workoutLevel || 'INTERMEDIATE') === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      className={`category-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => handleChange('workoutLevel', lvl.id)}
                    >
                      <span className="pill-check-box">
                        {isSelected ? <Check size={12} /> : null}
                      </span>
                      <span>{isEn ? lvl.labelEn || lvl.label : lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. MỤC TIÊU DINH DƯỠNG (MACRO) ĐỀ XUẤT CHO BẠN */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <Sparkles size={15} />
              <span>
                {isEn
                  ? '4. RECOMMENDED NUTRITION & MACRO TARGETS (AI NUTRITIONIST)'
                  : '4. MỤC TIÊU DINH DƯỠNG (MACRO) ĐỀ XUẤT (AI DINH DƯỠNG)'}
              </span>
            </div>

            <div className="macro-recommend-card">
              <div className="macro-recommend-card-top">
                <div>
                  <h4 className="macro-recommend-title">
                    <Flame size={15} />
                    <span>
                      {isEn
                        ? `Daily Target: ~${macroRec.targetCalories.toLocaleString()} kcal (${macroRec.goalLabelEn})`
                        : `Mục tiêu ngày: ~${macroRec.targetCalories.toLocaleString()} kcal (${macroRec.goalLabel})`}
                    </span>
                  </h4>
                  <p className="macro-recommend-desc">
                    {isEn
                      ? `Calibrated for ${formData.gender === 'female' ? 'Female' : 'Male'}, ${formData.weightKg || '68'}kg, ${formData.heightCm || '170'}cm, age ${formData.age || '22'} (Mifflin-St Jeor: BMR ~${macroRec.bmr} kcal | TDEE ~${macroRec.tdee} kcal)`
                      : `Tính chuẩn khoa học cho ${formData.gender === 'female' ? 'Nữ' : 'Nam'}, ${formData.weightKg || '68'}kg, ${formData.heightCm || '170'}cm, ${formData.age || '22'} tuổi (Mifflin-St Jeor: BMR ~${macroRec.bmr} kcal | TDEE ~${macroRec.tdee} kcal)`}
                  </p>
                </div>

                <div className="macro-mode-switch">
                  <button
                    type="button"
                    className={`macro-mode-btn ${formData.macroMode !== 'custom' ? 'active' : ''}`}
                    onClick={() => handleChange('macroMode', 'auto')}
                  >
                    {isEn ? 'Auto Recommended' : 'Tự động đề xuất'}
                  </button>
                  <button
                    type="button"
                    className={`macro-mode-btn ${formData.macroMode === 'custom' ? 'active' : ''}`}
                    onClick={() => handleChange('macroMode', 'custom')}
                  >
                    {isEn ? 'Custom Input' : 'Tự chỉnh thủ công'}
                  </button>
                </div>
              </div>

              <div className="macro-targets-grid">
                <div className="macro-target-badge target-calories">
                  <span className="target-label">{isEn ? 'CALORIES' : 'CALO MỤC TIÊU'}</span>
                  {formData.macroMode === 'custom' ? (
                    <div className="target-custom-wrap">
                      <input
                        type="number"
                        className="target-custom-input"
                        placeholder={String(macroRec.targetCalories)}
                        value={formData.targetCalories || ''}
                        onChange={(e) => handleChange('targetCalories', e.target.value)}
                      />
                      <span className="target-unit">kcal</span>
                    </div>
                  ) : (
                    <strong className="target-value">
                      {macroRec.targetCalories.toLocaleString()}{' '}
                      <span className="target-unit">kcal</span>
                    </strong>
                  )}
                  <span className="target-note">
                    {macroRec.targetCalories > macroRec.tdee
                      ? `+${macroRec.targetCalories - macroRec.tdee} kcal surplus`
                      : macroRec.targetCalories < macroRec.tdee
                      ? `${macroRec.targetCalories - macroRec.tdee} kcal deficit`
                      : 'Maintenance'}
                  </span>
                </div>

                <div className="macro-target-badge target-protein">
                  <span className="target-label">{isEn ? 'PROTEIN' : 'PROTEIN (ĐẠM)'}</span>
                  {formData.macroMode === 'custom' ? (
                    <div className="target-custom-wrap">
                      <input
                        type="number"
                        className="target-custom-input"
                        placeholder={String(macroRec.targetProtein)}
                        value={formData.targetProtein || ''}
                        onChange={(e) => handleChange('targetProtein', e.target.value)}
                      />
                      <span className="target-unit">g</span>
                    </div>
                  ) : (
                    <strong className="target-value">
                      {macroRec.targetProtein}{' '}
                      <span className="target-unit">g</span>
                    </strong>
                  )}
                  <span className="target-note">
                    ~{(Math.round((macroRec.targetProtein / (parseFloat(formData.weightKg || '68') || 68)) * 10) / 10)}g / kg
                  </span>
                </div>

                <div className="macro-target-badge target-carb">
                  <span className="target-label">{isEn ? 'CARBS' : 'CARB (TINH BỘT)'}</span>
                  {formData.macroMode === 'custom' ? (
                    <div className="target-custom-wrap">
                      <input
                        type="number"
                        className="target-custom-input"
                        placeholder={String(macroRec.targetCarb)}
                        value={formData.targetCarb || ''}
                        onChange={(e) => handleChange('targetCarb', e.target.value)}
                      />
                      <span className="target-unit">g</span>
                    </div>
                  ) : (
                    <strong className="target-value">
                      {macroRec.targetCarb}{' '}
                      <span className="target-unit">g</span>
                    </strong>
                  )}
                  <span className="target-note">{isEn ? 'Energy fuel' : 'Năng lượng sạch'}</span>
                </div>

                <div className="macro-target-badge target-fat">
                  <span className="target-label">{isEn ? 'FAT' : 'CHẤT BÉO (FAT)'}</span>
                  {formData.macroMode === 'custom' ? (
                    <div className="target-custom-wrap">
                      <input
                        type="number"
                        className="target-custom-input"
                        placeholder={String(macroRec.targetFat)}
                        value={formData.targetFat || ''}
                        onChange={(e) => handleChange('targetFat', e.target.value)}
                      />
                      <span className="target-unit">g</span>
                    </div>
                  ) : (
                    <strong className="target-value">
                      {macroRec.targetFat}{' '}
                      <span className="target-unit">g</span>
                    </strong>
                  )}
                  <span className="target-note">{isEn ? 'Hormones & cells' : 'Hormone & khớp'}</span>
                </div>

                <div className="macro-target-badge target-fiber">
                  <span className="target-label">{isEn ? 'FIBER' : 'CHẤT XƠ'}</span>
                  {formData.macroMode === 'custom' ? (
                    <div className="target-custom-wrap">
                      <input
                        type="number"
                        className="target-custom-input"
                        placeholder={String(macroRec.targetFiber)}
                        value={formData.targetFiber || ''}
                        onChange={(e) => handleChange('targetFiber', e.target.value)}
                      />
                      <span className="target-unit">g</span>
                    </div>
                  ) : (
                    <strong className="target-value">
                      {macroRec.targetFiber}{' '}
                      <span className="target-unit">g</span>
                    </strong>
                  )}
                  <span className="target-note">{isEn ? 'Digestive health' : 'Tiêu hóa khỏe'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div className="modal-footer profile-modal-footer">
            <button
              type="button"
              className="btn-minimal"
              onClick={handleReset}
            >
              <RotateCcw size={14} />
              <span>{isEn ? 'Reset to Default' : 'Đặt lại mặc định'}</span>
            </button>

            <div className="modal-footer-right">
              {!isFirstTimeSetup && (
                <button
                  type="button"
                  className="btn-minimal"
                  onClick={onClose}
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
              )}
              <button
                type="submit"
                className="btn-minimal btn-save-task"
                disabled={isSaving}
              >
                <Check size={15} />
                <span>
                  {isSaving
                    ? isEn
                      ? 'Saving...'
                      : 'Đang lưu...'
                    : isEn
                    ? 'Save Personalization'
                    : 'Lưu cá nhân hóa'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

