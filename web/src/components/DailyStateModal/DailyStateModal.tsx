import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  HeartPulse,
  Brain,
  Smile,
  Check,
  RotateCcw,
} from 'lucide-react';
import { getLocalizedPersonalization, useLanguage } from '~/utils/i18n';

export interface DailyStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  initialPhysicalState?: string;
  initialMentalState?: string;
  initialEmotionalState?: string;
  onSaveStates: (states: {
    physicalState: string;
    mentalState: string;
    emotionalState: string;
  }) => Promise<void> | void;
  isSaving?: boolean;
}

export const DailyStateModal: React.FC<DailyStateModalProps> = ({
  isOpen,
  onClose,
  dateKey,
  initialPhysicalState = 'NORMAL',
  initialMentalState = 'STEADY',
  initialEmotionalState = 'CALM',
  onSaveStates,
  isSaving = false,
}) => {
  const { language, isEn } = useLanguage();
  const localizedOptions = getLocalizedPersonalization(language);

  const [, monthStr, dayStr] = (dateKey || '').split('-');

  const [physicalState, setPhysicalState] = useState<string>(initialPhysicalState);
  const [mentalState, setMentalState] = useState<string>(initialMentalState);
  const [emotionalState, setEmotionalState] = useState<string>(initialEmotionalState);

  useEffect(() => {
    if (isOpen) {
      setPhysicalState(initialPhysicalState || 'NORMAL');
      setMentalState(initialMentalState || 'STEADY');
      setEmotionalState(initialEmotionalState || 'CALM');
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
  }, [isOpen, initialPhysicalState, initialMentalState, initialEmotionalState]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveStates({
      physicalState,
      mentalState,
      emotionalState,
    });
    onClose();
  };

  const handleResetToNormal = () => {
    setPhysicalState('NORMAL');
    setMentalState('STEADY');
    setEmotionalState('CALM');
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
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
                {isEn
                  ? `UPDATE DAILY STATES (${dayStr}/${monthStr})`
                  : `CẬP NHẬT TRẠNG THÁI NGÀY ${dayStr}/${monthStr}`}
              </h3>
              <p className="modal-subtitle">
                {isEn
                  ? 'Calibrate your Physical, Mental & Emotional states for today for accurate resilience bonus and AI coaching'
                  : 'Ghi nhận Thể chất, Tinh thần và Cảm xúc của riêng ngày hôm nay để AI tính điểm vượt khó và đưa ra lời khuyên chuẩn xác'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'Đóng'}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 1. TRẠNG THÁI THỂ CHẤT HÔM NAY */}
            <div className="profile-section-block">
              <div className="profile-section-title">
                <HeartPulse size={15} />
                <span>
                  {isEn
                    ? '1. TODAY PHYSICAL STATE'
                    : '1. THỂ CHẤT HÔM NAY'}
                </span>
              </div>
              <div className="scope-cards-grid">
                {localizedOptions.physicalStates.map((item) => {
                  const isSelected = physicalState === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`scope-option-card scope-tier-${item.tier} ${
                        isSelected
                          ? `scope-option-selected scope-selected-${item.tier}`
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="physicalState"
                        checked={isSelected}
                        onChange={() => setPhysicalState(item.id)}
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

            {/* 2. TRẠNG THÁI TINH THẦN HÔM NAY */}
            <div className="profile-section-block">
              <div className="profile-section-title">
                <Brain size={15} />
                <span>
                  {isEn
                    ? '2. TODAY MENTAL STATE & FOCUS'
                    : '2. TINH THẦN & ĐỘ TẬP TRUNG HÔM NAY'}
                </span>
              </div>
              <div className="scope-cards-grid">
                {localizedOptions.mentalStates.map((item) => {
                  const isSelected = mentalState === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`scope-option-card scope-tier-${item.tier} ${
                        isSelected
                          ? `scope-option-selected scope-selected-${item.tier}`
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="mentalState"
                        checked={isSelected}
                        onChange={() => setMentalState(item.id)}
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

            {/* 3. TRẠNG THÁI CẢM XÚC HÔM NAY */}
            <div className="profile-section-block">
              <div className="profile-section-title">
                <Smile size={15} />
                <span>
                  {isEn
                    ? '3. TODAY EMOTIONAL STATE'
                    : '3. CẢM XÚC & TÂM TRẠNG HÔM NAY'}
                </span>
              </div>
              <div className="scope-cards-grid">
                {localizedOptions.emotionalStates.map((item) => {
                  const isSelected = emotionalState === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`scope-option-card scope-tier-${item.tier} ${
                        isSelected
                          ? `scope-option-selected scope-selected-${item.tier}`
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="emotionalState"
                        checked={isSelected}
                        onChange={() => setEmotionalState(item.id)}
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
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-minimal"
              onClick={handleResetToNormal}
            >
              <RotateCcw size={14} />
              <span>{isEn ? 'Reset to Balance' : 'Đặt lại cân bằng'}</span>
            </button>

            <div className="modal-footer-right">
              <button
                type="button"
                className="btn-minimal"
                onClick={onClose}
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
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
                    ? 'Save Day States'
                    : 'Lưu trạng thái ngày'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

