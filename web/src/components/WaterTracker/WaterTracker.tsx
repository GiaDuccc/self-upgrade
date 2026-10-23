import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Droplet, Plus, Minus, RotateCcw, Check, Edit2, History, ChevronDown, ChevronUp } from 'lucide-react';
import { WaterData, WaterLog } from '~/interface/discipline.interface';
import { useLanguage } from '~/utils/i18n';

interface WaterTrackerProps {
  dateKey: string;
  initialWaterData?: WaterData;
  userWeightKg?: string;
  onSaveWater: (data: WaterData) => Promise<void> | void;
  isSaving?: boolean;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  dateKey,
  initialWaterData,
  userWeightKg,
  onSaveWater,
  isSaving = false,
}) => {
  const { isEn } = useLanguage();

  // Tính mục tiêu chuẩn theo cân nặng (40ml cho mỗi kg) hoặc mặc định 2000ml
  const defaultTarget = useMemo(() => {
    const w = parseFloat(userWeightKg || '');
    if (w && w >= 25 && w <= 250) {
      return Math.round((w * 40) / 50) * 50; // làm tròn đến 50ml gần nhất
    }
    return 2000;
  }, [userWeightKg]);

  const [waterData, setWaterData] = useState<WaterData>(() => ({
    targetMl: initialWaterData?.targetMl || defaultTarget,
    currentMl: initialWaterData?.currentMl || 0,
    logs: initialWaterData?.logs || [],
  }));

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(waterData.targetMl));
  const [showLogs, setShowLogs] = useState(false);
  const [customMlInput, setCustomMlInput] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Đồng bộ khi dateKey hoặc initialWaterData thay đổi
  useEffect(() => {
    setWaterData({
      targetMl: initialWaterData?.targetMl || defaultTarget,
      currentMl: initialWaterData?.currentMl || 0,
      logs: initialWaterData?.logs || [],
    });
    setTargetInput(String(initialWaterData?.targetMl || defaultTarget));
    setIsEditingTarget(false);
    setIsCustomOpen(false);
  }, [dateKey, initialWaterData, defaultTarget]);

  const targetMl = waterData.targetMl || defaultTarget;
  const currentMl = waterData.currentMl || 0;
  const percentage = Math.min(100, Math.round((currentMl / targetMl) * 100));
  const remainingMl = Math.max(0, targetMl - currentMl);
  const isGoalReached = currentMl >= targetMl && targetMl > 0;

  const handleUpdate = useCallback(
    (newData: WaterData) => {
      setWaterData(newData);
      onSaveWater(newData);
    },
    [onSaveWater]
  );

  const handleQuickAdd = (amount: number) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: WaterLog = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount,
      time: timeStr,
    };
    const nextMl = Math.max(0, currentMl + amount);
    const nextLogs = [newLog, ...(waterData.logs || [])].slice(0, 30);
    handleUpdate({
      ...waterData,
      currentMl: nextMl,
      logs: nextLogs,
    });
  };

  const handleQuickSubtract = (amount: number) => {
    if (currentMl <= 0) return;
    const nextMl = Math.max(0, currentMl - amount);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: WaterLog = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount: -Math.min(currentMl, amount),
      time: timeStr,
    };
    const nextLogs = [newLog, ...(waterData.logs || [])].slice(0, 30);
    handleUpdate({
      ...waterData,
      currentMl: nextMl,
      logs: nextLogs,
    });
  };

  const handleRemoveLog = (logId: string) => {
    const found = (waterData.logs || []).find((l) => l.id === logId);
    if (!found) return;
    const nextMl = Math.max(0, currentMl - found.amount);
    const nextLogs = (waterData.logs || []).filter((l) => l.id !== logId);
    handleUpdate({
      ...waterData,
      currentMl: nextMl,
      logs: nextLogs,
    });
  };

  const handleResetWater = () => {
    if (currentMl === 0) return;
    if (
      window.confirm(
        isEn
          ? 'Reset today\'s water intake to 0 ml?'
          : 'Đặt lại lượng nước hôm nay về 0 ml?'
      )
    ) {
      handleUpdate({
        ...waterData,
        currentMl: 0,
        logs: [],
      });
    }
  };

  const handleSaveCustomTarget = () => {
    const val = parseInt(targetInput, 10);
    if (!val || val < 500 || val > 10000) return;
    handleUpdate({
      ...waterData,
      targetMl: val,
    });
    setIsEditingTarget(false);
  };

  const handleAddCustomAmount = () => {
    const val = parseInt(customMlInput, 10);
    if (!val || val <= 0 || val > 3000) return;
    handleQuickAdd(val);
    setCustomMlInput('');
    setIsCustomOpen(false);
  };

  return (
    <div className="water-tracker-card">
      {/* HEADER CỦA BỘ THEO DÕI NƯỚC */}
      <div className="water-card-header">
        <div className="water-card-title-group">
          <div className="water-icon-circle">
            <Droplet size={17} className="water-droplet-icon" />
          </div>
          <div>
            <div className="water-card-title">
              {isEn ? 'Quick Water Tracker' : 'Bộ theo dõi Nước uống (1 chạm)'}
            </div>
            <div className="water-card-sub">
              {isEditingTarget ? (
                <div className="water-target-edit-row">
                  <span>{isEn ? 'Target:' : 'Mục tiêu:'}</span>
                  <input
                    type="number"
                    step={100}
                    min={500}
                    max={10000}
                    className="water-target-input"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCustomTarget();
                      if (e.key === 'Escape') setIsEditingTarget(false);
                    }}
                    autoFocus
                  />
                  <span>ml</span>
                  <button
                    type="button"
                    className="water-btn-icon-tiny"
                    onClick={handleSaveCustomTarget}
                    title={isEn ? 'Save Target' : 'Lưu mục tiêu'}
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <span className="water-target-label">
                  {isEn ? 'Target:' : 'Mục tiêu:'} <strong>{targetMl.toLocaleString()} ml</strong>
                  <button
                    type="button"
                    className="water-btn-edit-target"
                    onClick={() => {
                      setTargetInput(String(targetMl));
                      setIsEditingTarget(true);
                    }}
                    title={isEn ? 'Edit Daily Water Target' : 'Chỉnh sửa mục tiêu nước ngày'}
                  >
                    <Edit2 size={11} />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="water-header-right">
          <span className={`water-pct-badge ${isGoalReached ? 'goal-reached' : ''}`}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* CHỈ SỐ NƯỚC HIỆN TẠI & TIẾN ĐỘ */}
      <div className="water-stats-row">
        <div className="water-current-display">
          <span className="water-current-big">{currentMl.toLocaleString()}</span>
          <span className="water-current-unit"> / {targetMl.toLocaleString()} ml</span>
        </div>
        <div className="water-status-text">
          {isGoalReached ? (
            <span className="water-status-success">
              {isEn ? '💧 Hydration target reached!' : '💧 Đã đủ nước hôm nay!'}
            </span>
          ) : (
            <span className="water-status-remaining">
              {isEn
                ? `${remainingMl.toLocaleString()} ml remaining`
                : `Còn thiếu ${remainingMl.toLocaleString()} ml`}
            </span>
          )}
        </div>
      </div>

      {/* THANH TIẾN ĐỘ NƯỚC UỐNG */}
      <div className="water-progress-track">
        <div
          className={`water-progress-fill ${isGoalReached ? 'pulse' : ''}`}
          style={{ width: `${Math.min(100, (currentMl / targetMl) * 100)}%` }}
        />
      </div>

      {/* CÁC NÚT BẤM 1 CHẠM (+250ML, +500ML, +100ML, -250ML) */}
      <div className="water-quick-buttons">
        <button
          type="button"
          className="water-quick-btn water-btn-primary"
          onClick={() => handleQuickAdd(250)}
          title={isEn ? 'Drink 1 cup of water (+250 ml)' : 'Nạp 1 ly nước (+250 ml)'}
          disabled={isSaving}
        >
          <Plus size={14} />
          <span>+250 ml</span>
          <span className="water-quick-sub">{isEn ? 'Cup' : '1 Ly'}</span>
        </button>

        <button
          type="button"
          className="water-quick-btn water-btn-secondary"
          onClick={() => handleQuickAdd(500)}
          title={isEn ? 'Drink 1 bottle of water (+500 ml)' : 'Nạp 1 chai nước (+500 ml)'}
          disabled={isSaving}
        >
          <Plus size={14} />
          <span>+500 ml</span>
          <span className="water-quick-sub">{isEn ? 'Bottle' : '1 Chai'}</span>
        </button>

        <button
          type="button"
          className="water-quick-btn water-btn-tertiary"
          onClick={() => handleQuickAdd(100)}
          title={isEn ? 'Small sip (+100 ml)' : 'Ngụm nhỏ (+100 ml)'}
          disabled={isSaving}
        >
          <Plus size={13} />
          <span>+100 ml</span>
          <span className="water-quick-sub">{isEn ? 'Sip' : 'Ngụm'}</span>
        </button>

        <button
          type="button"
          className="water-quick-btn water-btn-undo"
          onClick={() => handleQuickSubtract(250)}
          title={isEn ? 'Undo / Subtract 250 ml' : 'Hoàn tác / Trừ bớt 250 ml'}
          disabled={isSaving || currentMl <= 0}
        >
          <Minus size={13} />
          <span>-250 ml</span>
          <span className="water-quick-sub">{isEn ? 'Undo' : 'Trừ'}</span>
        </button>
      </div>

      {/* HÀNG TIỆN ÍCH DƯỚI: NHẬP SỐ TÙY Ý, XEM LỊCH SỬ, ĐẶT LẠI */}
      <div className="water-card-footer">
        <div className="water-footer-left">
          <button
            type="button"
            className="water-btn-link"
            onClick={() => setIsCustomOpen(!isCustomOpen)}
          >
            {isEn ? '+ Custom' : '+ Tùy chỉnh'}
          </button>

          {(waterData.logs || []).length > 0 && (
            <button
              type="button"
              className="water-btn-link"
              onClick={() => setShowLogs(!showLogs)}
            >
              <History size={12} />
              <span>{isEn ? 'History' : 'Lịch sử'} ({waterData.logs.length})</span>
              {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        <div className="water-footer-right">
          {currentMl > 0 && (
            <button
              type="button"
              className="water-btn-reset"
              onClick={handleResetWater}
              title={isEn ? 'Reset today\'s water' : 'Đặt lại lượng nước'}
              disabled={isSaving}
            >
              <RotateCcw size={12} />
              <span>{isEn ? 'Reset' : 'Đặt lại'}</span>
            </button>
          )}
        </div>
      </div>

      {/* FORM NHẬP LƯỢNG NƯỚC TÙY Ý */}
      {isCustomOpen && (
        <div className="water-custom-form">
          <input
            type="number"
            min={10}
            max={3000}
            step={50}
            placeholder={isEn ? 'Enter ml (e.g. 330)...' : 'Nhập ml (vd: 330)...'}
            className="water-custom-input"
            value={customMlInput}
            onChange={(e) => setCustomMlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustomAmount();
              if (e.key === 'Escape') setIsCustomOpen(false);
            }}
            autoFocus
          />
          <button
            type="button"
            className="btn-minimal btn-sm water-btn-custom-add"
            onClick={handleAddCustomAmount}
          >
            <Plus size={13} />
            <span>{isEn ? 'Add' : 'Thêm'}</span>
          </button>
        </div>
      )}

      {/* DANH SÁCH LỊCH SỬ CÁC LẦN UỐNG NƯỚC HÔM NAY */}
      {showLogs && (waterData.logs || []).length > 0 && (
        <div className="water-logs-list">
          <div className="water-logs-title">
            {isEn ? "Today's Hydration Logs:" : 'Lịch sử uống nước hôm nay:'}
          </div>
          <div className="water-logs-items">
            {waterData.logs.map((log) => (
              <div key={log.id} className="water-log-chip">
                <span className="water-log-time">{log.time}</span>
                <span className={`water-log-amount ${log.amount < 0 ? 'negative' : ''}`}>
                  {log.amount > 0 ? `+${log.amount}` : log.amount} ml
                </span>
                <button
                  type="button"
                  className="water-log-del"
                  onClick={() => handleRemoveLog(log.id)}
                  title={isEn ? 'Delete this entry' : 'Xóa lần ghi này'}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

