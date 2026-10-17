import React, { useEffect, useState } from 'react';
import {
  PERSONALIZATION_OPTIONS,
  DEFAULT_USER_PROFILE,
} from '../config/settings';
import {
  X,
  UserCheck,
  HeartPulse,
  Brain,
  Smile,
  Target,
  Check,
  RotateCcw,
} from 'lucide-react';

export function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
}) {
  const [formData, setFormData] = useState({
    ...DEFAULT_USER_PROFILE,
    ...(userProfile || {}),
  });

  // Khóa scroll trang nền khi modal đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_USER_PROFILE });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  // Tính nhanh BMI & lượng nước gợi ý nếu đã nhập cân nặng/chiều cao
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

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
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
                Cá nhân hóa — Thể chất, Tinh thần & Cảm xúc
              </h3>
              <p className="modal-subtitle">
                Thiết lập trạng thái để hệ thống tự động điều chỉnh chấm điểm & đưa ra lời khuyên/chê sát nhất
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* 1. THÔNG TIN CƠ BẢN & CHỈ SỐ CƠ THỂ */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <UserCheck size={15} />
              <span>1. THÔNG TIN CÁ NHÂN & CHỈ SỐ SINH HỌC</span>
            </div>

            <div className="profile-inputs-grid-4">
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">
                  TÊN / BIỆT DANH
                </label>
                <input
                  id="prof-name"
                  type="text"
                  className="form-input"
                  placeholder="VD: Minh, Chiến thần..."
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-weight">
                  CÂN NẶNG (KG)
                </label>
                <input
                  id="prof-weight"
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="VD: 68"
                  value={formData.weightKg}
                  onChange={(e) => handleChange('weightKg', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-height">
                  CHIỀU CAO (CM)
                </label>
                <input
                  id="prof-height"
                  type="number"
                  className="form-input"
                  placeholder="VD: 172"
                  value={formData.heightCm}
                  onChange={(e) => handleChange('heightCm', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-sleep">
                  GIỜ NGỦ MỤC TIÊU
                </label>
                <input
                  id="prof-sleep"
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="VD: 7"
                  value={formData.sleepTargetHours}
                  onChange={(e) =>
                    handleChange('sleepTargetHours', e.target.value)
                  }
                />
              </div>
            </div>

            {(bmiValue || waterRecommend) && (
              <div className="bio-preview-banner">
                <span>Chỉ số tự động:</span>
                {bmiValue && <strong>BMI {bmiValue}</strong>}
                {waterRecommend && (
                  <span>• Khuyến nghị uống tối thiểu: <strong>{waterRecommend} lít nước/ngày</strong></span>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginTop: '6px' }}>
              <label className="form-label" htmlFor="prof-motto">
                CHÂM NGÔN KỶ LUẬT / MỤC TIÊU LỚN NHẤT CỦA MÀY
              </label>
              <input
                id="prof-motto"
                type="text"
                className="form-input"
                placeholder="VD: Kỷ luật là tự do — Không đánh đổi tương lai lấy sự thoải mái ngắn hạn!"
                value={formData.personalMotto}
                onChange={(e) => handleChange('personalMotto', e.target.value)}
              />
            </div>
          </div>

          {/* 2. TRẠNG THÁI THỂ CHẤT */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <HeartPulse size={15} />
              <span>2. TRẠNG THÁI THỂ CHẤT HIỆN TẠI</span>
            </div>
            <div className="scope-cards-grid">
              {PERSONALIZATION_OPTIONS.physicalStates.map((item) => {
                const isSelected = formData.physicalState === item.id;
                return (
                  <label
                    key={item.id}
                    className={`scope-option-card scope-tier-${item.tier} ${
                      isSelected ? `scope-option-selected scope-selected-${item.tier}` : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="physicalState"
                      checked={isSelected}
                      onChange={() => handleChange('physicalState', item.id)}
                      className="scope-radio"
                    />
                    <div className="scope-card-content">
                      <div className="scope-card-header">
                        <span className="scope-radio-indicator">
                          {isSelected && <span className="scope-radio-dot" />}
                        </span>
                        <strong className="scope-title">{item.label}</strong>
                        <span className={`tier-badge tier-badge-${item.tier}`}>
                          {item.tierLabel}
                        </span>
                      </div>
                      <p className="scope-desc">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. TRẠNG THÁI TINH THẦN */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <Brain size={15} />
              <span>3. TRẠNG THÁI TINH THẦN & ĐỘ TẬP TRUNG</span>
            </div>
            <div className="scope-cards-grid">
              {PERSONALIZATION_OPTIONS.mentalStates.map((item) => {
                const isSelected = formData.mentalState === item.id;
                return (
                  <label
                    key={item.id}
                    className={`scope-option-card scope-tier-${item.tier} ${
                      isSelected ? `scope-option-selected scope-selected-${item.tier}` : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="mentalState"
                      checked={isSelected}
                      onChange={() => handleChange('mentalState', item.id)}
                      className="scope-radio"
                    />
                    <div className="scope-card-content">
                      <div className="scope-card-header">
                        <span className="scope-radio-indicator">
                          {isSelected && <span className="scope-radio-dot" />}
                        </span>
                        <strong className="scope-title">{item.label}</strong>
                        <span className={`tier-badge tier-badge-${item.tier}`}>
                          {item.tierLabel}
                        </span>
                      </div>
                      <p className="scope-desc">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. TRẠNG THÁI CẢM XÚC */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <Smile size={15} />
              <span>4. TRẠNG THÁI CẢM XÚC</span>
            </div>
            <div className="scope-cards-grid">
              {PERSONALIZATION_OPTIONS.emotionalStates.map((item) => {
                const isSelected = formData.emotionalState === item.id;
                return (
                  <label
                    key={item.id}
                    className={`scope-option-card scope-tier-${item.tier} ${
                      isSelected ? `scope-option-selected scope-selected-${item.tier}` : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="emotionalState"
                      checked={isSelected}
                      onChange={() => handleChange('emotionalState', item.id)}
                      className="scope-radio"
                    />
                    <div className="scope-card-content">
                      <div className="scope-card-header">
                        <span className="scope-radio-indicator">
                          {isSelected && <span className="scope-radio-dot" />}
                        </span>
                        <strong className="scope-title">{item.label}</strong>
                        <span className={`tier-badge tier-badge-${item.tier}`}>
                          {item.tierLabel}
                        </span>
                      </div>
                      <p className="scope-desc">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 5. TRỌNG TÂM ƯU TIÊN (CẢI THIỆN CHẤM ĐIỂM) & PHONG CÁCH NHẬN XÉT */}
          <div className="profile-section-block">
            <div className="profile-section-title">
              <Target size={15} />
              <span>5. MỤC TIÊU TRỌNG TÂM (TRỌNG SỐ ĐIỂM ×1.25) & PHONG CÁCH HUẤN LUYỆN</span>
            </div>

            <div className="scope-cards-grid">
              {PERSONALIZATION_OPTIONS.focusGoals.map((item) => {
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
              <label className="form-label">PHONG CÁCH LỜI KHUYÊN / LỜI CHÊ</label>
              <div className="category-pills-wrap">
                {PERSONALIZATION_OPTIONS.coachingStyles.map((st) => {
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

          <div className="modal-footer">
            <button
              type="button"
              className="btn-minimal"
              onClick={handleReset}
            >
              <RotateCcw size={14} />
              <span>Đặt lại mặc định</span>
            </button>

            <div className="modal-footer-right">
              <button
                type="button"
                className="btn-minimal"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-minimal btn-save-task"
              >
                <Check size={15} />
                <span>Lưu cá nhân hóa</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

