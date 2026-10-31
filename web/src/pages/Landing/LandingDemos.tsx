import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  X,
  RefreshCw,
  Sparkles,
  LayoutDashboard,
  CheckSquare,
  Brain,
  Bot,
  Droplets,
  Flame,
  Dumbbell,
  Zap,
  Navigation,
  Settings,
  HeartPulse,
  Smile,
  Check,
  Clock,
} from 'lucide-react';
import { MonthlyBarChart, DistributionDonutChart } from '~/components/Charts/Charts';
import { WaterTracker } from '~/components/WaterTracker/WaterTracker';
import { CaloriesTracker } from '~/components/CaloriesTracker/CaloriesTracker';
import { WorkoutTracker } from '~/components/WorkoutTracker/WorkoutTracker';
import { getLocalizedPersonalization } from '~/utils/i18n';
import type {
  MonthStats,
  MonthDayItem,
  WaterData,
  FoodItem,
  CaloriesSummary,
  WorkoutData,
} from '~/interface/discipline.interface';

/* ============================================================
 * DỮ LIỆU MẪU (mô phỏng đúng shape dữ liệu thật của hệ thống)
 * ============================================================ */

const DEMO_YEAR = 2026;
const DEMO_MONTH = 10;
const DEMO_TOTAL_DAYS = 30;
const TASKS_PER_DAY = 8;

function rankTitleForPct(p: number): string {
  if (p >= 85) return 'Hoàn hảo';
  if (p >= 70) return 'Tốt';
  if (p >= 50) return 'Khá';
  if (p >= 30) return 'Trung bình';
  if (p > 0) return 'Yếu';
  return 'Chưa đánh giá';
}

function makeDayItem(day: number, pct: number): MonthDayItem {
  const rawPoints = Math.round((pct / 100) * TASKS_PER_DAY * 10);
  const maxPoints = TASKS_PER_DAY * 10;
  const title = rankTitleForPct(pct);
  return {
    day,
    dateKey: `${DEMO_YEAR}-${String(DEMO_MONTH).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    weekday: '',
    rawPoints,
    maxPoints,
    basePercentage: pct,
    stateBonusPct: 0,
    percentage: pct,
    checkedCount: pct > 0 ? TASKS_PER_DAY : 0,
    totalTasks: TASKS_PER_DAY,
    counts: { PERFECT: 0, GOOD: 0, BAD: 0, NONE: 0 },
    rank: { code: title, title, description: '' },
    note: '',
    tasksList: [],
    tasksMap: {},
    taskHours: {},
  };
}

function buildMockMonthStats(): MonthStats {
  const daysList: MonthDayItem[] = [];
  for (let d = 1; d <= DEMO_TOTAL_DAYS; d += 1) {
    let pct = 0;
    if (d % 7 !== 0) {
      pct = Math.min(100, 52 + ((d * 37) % 48));
      if (d % 11 === 0) pct = 100;
    }
    daysList.push(makeDayItem(d, pct));
  }

  const activeDays = daysList.filter((x) => x.percentage > 0);
  const activeDaysCount = activeDays.length;
  const sumPoints = daysList.reduce((s, x) => s + x.rawPoints, 0);
  const maxMonthPoints = DEMO_TOTAL_DAYS * TASKS_PER_DAY * 10;
  const avgActivePercentage = activeDaysCount
    ? Math.round(activeDays.reduce((s, x) => s + x.percentage, 0) / activeDaysCount)
    : 0;
  const overallMonthPercentage = Math.round((sumPoints / maxMonthPoints) * 100);
  const perfectDaysCount = daysList.filter((x) => x.percentage >= 85).length;
  const bestDay = daysList.reduce<MonthDayItem | null>(
    (best, x) => (best === null || x.percentage > best.percentage ? x : best),
    null
  );
  const monthRankTitle = rankTitleForPct(avgActivePercentage);

  return {
    year: DEMO_YEAR,
    month: DEMO_MONTH,
    totalDays: DEMO_TOTAL_DAYS,
    daysList,
    sumPoints,
    maxMonthPoints,
    activeDaysCount,
    avgActivePercentage,
    overallMonthPercentage,
    perfectDaysCount,
    goodOrAboveDaysCount: daysList.filter((x) => x.percentage >= 70).length,
    monthCounts: { PERFECT: 0, GOOD: 0, BAD: 0, NONE: 0 },
    bestDay,
    monthRank: { code: monthRankTitle, title: monthRankTitle, description: '' },
  };
}

const WATER_MOCK: WaterData = {
  targetMl: 2900,
  currentMl: 1500,
  logs: [
    { id: 'w1', amount: 250, time: '06:10' },
    { id: 'w2', amount: 500, time: '09:30' },
    { id: 'w3', amount: 500, time: '12:15' },
    { id: 'w4', amount: 250, time: '15:40' },
  ],
};

const CALORIES_MEALS_MOCK: FoodItem[] = [
  {
    id: 'm1',
    name: 'Cơm trắng',
    weight: '150g',
    mealSession: 'morning',
    foodState: 'cooked',
    cookingMethod: 'hap',
    time: '07:30',
    calories: 195,
    protein: 4,
    carb: 43,
    fat: 0,
    fiber: 1,
  },
  {
    id: 'm2',
    name: 'Ức gà áp chảo',
    weight: '120g',
    mealSession: 'afternoon',
    foodState: 'cooked',
    cookingMethod: 'xao',
    time: '12:30',
    calories: 198,
    protein: 37,
    carb: 0,
    fat: 4,
    fiber: 0,
  },
  {
    id: 'm3',
    name: 'Rau luộc thập cẩm',
    weight: '200g',
    mealSession: 'evening',
    foodState: 'cooked',
    cookingMethod: 'luoc',
    time: '19:00',
    calories: 70,
    protein: 4,
    carb: 12,
    fat: 0,
    fiber: 6,
  },
];

const CALORIES_SUMMARY_MOCK: CaloriesSummary = {
  totalCalories: 463,
  protein: 45,
  carb: 55,
  fat: 4,
  fiber: 7,
  aiFeedback:
    'Bữa ăn hôm nay giàu protein và chất xơ, lượng carb ở mức hợp lý. Cân nhắc bổ sung chất béo tốt (bơ, các loại hạt) vào bữa tối để cân bằng nhóm dinh dưỡng.',
  aiFeedbackEn:
    'Today’s meals are rich in protein and fiber with a reasonable carb level. Consider adding healthy fats (avocado, nuts) at dinner to balance your macros.',
};

const WORKOUT_MOCK: WorkoutData = {
  targetMuscles: ['nguc', 'vai'],
  exercises: [
    {
      id: 'e1',
      name: 'Barbell Bench Press',
      category: 'nguc',
      sets: [
        { setNumber: 1, weightKg: 60, reps: 10, rir: 2 },
        { setNumber: 2, weightKg: 70, reps: 8, rir: 1 },
        { setNumber: 3, weightKg: 75, reps: 6, rir: 1 },
      ],
    },
    {
      id: 'e2',
      name: 'Overhead Press (OHP)',
      category: 'vai',
      sets: [
        { setNumber: 1, weightKg: 40, reps: 8, rir: 2 },
        { setNumber: 2, weightKg: 45, reps: 6, rir: 1 },
      ],
    },
  ],
  summary: {
    totalVolumeKg: 2200,
    totalSets: 5,
    totalReps: 38,
    avgRir: 1.4,
    progressiveOverloadStatus: 'OVERLOAD_ACHIEVED',
    aiFeedback:
      'Khối lượng tập (2.200 kg) tăng so với buổi trước. Đẩy ngực đạt ngưỡng RIR 1 ở các hiệp nặng — kích thích tăng cơ tối ưu. Giữ nguyên mức tạ hiện tại ở tuần tới.',
    aiFeedbackEn:
      'Total volume (2,200 kg) increased versus last session. Bench press hits RIR 1 on heavy sets — optimal hypertrophy stimulus. Keep the current load next week.',
  },
};

/* ============================================================
 * 1. DEMO TỔNG QUAN THÁNG (dùng biểu đồ thật của Dashboard)
 * ============================================================ */

const OverviewDemo: React.FC = () => {
  const monthStats = useMemo(buildMockMonthStats, []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    monthStats.daysList[monthStats.daysList.length - 1].dateKey
  );
  const selectedDayItem =
    monthStats.daysList.find((d) => d.dateKey === selectedDateKey) ||
    monthStats.daysList[monthStats.daysList.length - 1];

  return (
    <div className="lp-demo-overview">
      <div className="section-header-bar">
        <div>
          <h2 className="section-heading">
            TỔNG QUAN THỐNG KÊ THÁNG {DEMO_MONTH}/{DEMO_YEAR}
          </h2>
        </div>
        <div className="month-rank-pill">
          <span>Đánh giá tháng:</span>
          <strong>{monthStats.monthRank.title}</strong>
        </div>
      </div>

      <div className="stats-cards-grid stats-cards-grid-split">
        <div className="stat-card stat-card-highlight">
          <span className="stat-label">ĐIỂM TRUNG BÌNH (NGÀY ĐÃ TÍCH)</span>
          <div className="stat-value-row">
            <span className="stat-big-number">{monthStats.avgActivePercentage}%</span>
            <span className="stat-tag">{monthStats.monthRank.title}</span>
          </div>
          <span className="stat-footnote">
            Tính trên {monthStats.activeDaysCount} ngày có hoạt động trong tháng
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">TỔNG ĐIỂM TÍCH LŨY THÁNG</span>
          <div className="stat-value-row">
            <span className="stat-big-number">{monthStats.sumPoints.toLocaleString('vi-VN')}</span>
            <span className="stat-unit">/ {monthStats.maxMonthPoints.toLocaleString('vi-VN')}đ</span>
          </div>
          <span className="stat-footnote">
            Đạt {monthStats.overallMonthPercentage}% tổng điểm tối đa toàn tháng
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">SỐ NGÀY DUY TRÌ CHECK-IN</span>
          <div className="stat-value-row">
            <span className="stat-big-number">{monthStats.activeDaysCount}</span>
            <span className="stat-unit">/ {monthStats.totalDays} ngày</span>
          </div>
          <span className="stat-footnote">
            {monthStats.perfectDaysCount} ngày đạt mức Hoàn Hảo (&gt;85%)
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">NGÀY PHONG ĐỘ CAO NHẤT</span>
          <div className="stat-value-row">
            <span className="stat-big-number">
              {monthStats.bestDay ? `${monthStats.bestDay.percentage}%` : '—'}
            </span>
            {monthStats.bestDay && (
              <span className="stat-tag">Ngày {monthStats.bestDay.day}/{DEMO_MONTH}</span>
            )}
          </div>
          <span className="stat-footnote">
            {monthStats.bestDay
              ? `${monthStats.bestDay.rawPoints}/${monthStats.bestDay.maxPoints} điểm (${monthStats.bestDay.rank.title})`
              : 'Chưa có dữ liệu ghi nhận trong tháng'}
          </span>
        </div>
      </div>

      <div className="charts-split-stack">
        <MonthlyBarChart
          daysList={monthStats.daysList}
          selectedDateKey={selectedDateKey}
          onSelectDay={setSelectedDateKey}
        />
        <DistributionDonutChart
          selectedDayStats={selectedDayItem}
          selectedDayLabel={`Ngày ${selectedDayItem.day}/${DEMO_MONTH}`}
          monthStats={monthStats}
        />
      </div>
    </div>
  );
};

/* ============================================================
 * 2. DEMO TÍCH VIỆC & CHẤM ĐIỂM (mô phỏng To-do List của DayDetail)
 * ============================================================ */

interface DemoTasks {
  id: string;
  title: string;
  category: string;
  time: string;
  target?: string;
  boost?: boolean;
}

const CHECKIN_TASKS: DemoTasks[] = [
  { id: 'wake_5am', title: 'Dậy lúc 5:00 sáng', category: 'Kỷ luật', time: '05:00 – 05:30', target: 'Khởi đầu ngày sớm', boost: true },
  { id: 'learn_english', title: 'Học tiếng Anh', category: 'Học tập', time: '07:00 – 08:00', boost: true },
  { id: 'work', title: 'Làm việc chính', category: 'Sự nghiệp', time: '08:00 – 11:30', boost: true },
  { id: 'learn_code', title: 'Học lập trình', category: 'Kỹ năng', time: '09:00 – 11:00', boost: true },
  { id: 'gym', title: 'Tập Gym', category: 'Sức khỏe', time: '17:00 – 18:30' },
  { id: 'sleep_before_11pm', title: 'Ngủ trước 23:00', category: 'Giấc ngủ', time: '22:30 – 23:00' },
];

const CheckInDemo: React.FC = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    wake_5am: true,
    learn_english: true,
    work: false,
    learn_code: true,
    gym: true,
    sleep_before_11pm: false,
  });

  const total = CHECKIN_TASKS.length;
  const doneCount = CHECKIN_TASKS.filter((t) => checked[t.id]).length;
  const rawPoints = doneCount * 10;
  const maxPoints = total * 10;
  const pct = Math.round((rawPoints / maxPoints) * 100);
  const rank = rankTitleForPct(pct);

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="lp-demo-overview">
      <div className="day-page-topbar">
        <div className="day-date-switcher">
          <div className="day-date-display">
            <span>30 / 10</span>
          </div>
        </div>
        <div className="day-tag-row">
          <span className="day-badge-mono">2026-10-30</span>
          <span className="day-weekday-pill">Thứ Sáu</span>
          <span className="today-indicator-pill">Hôm nay</span>
        </div>
      </div>

      <div className="day-score-summary-card">
        <div className="day-score-main">
          <div className="day-score-left">
            <span className="day-score-label">ĐIỂM ĐẠT ĐƯỢC</span>
            <div className="day-score-big-row">
              <div className="day-score-big">{pct}%</div>
            </div>
            <span className="day-score-raw">
              {rawPoints} / {maxPoints} điểm • {doneCount}/{total} việc
            </span>
          </div>
          <div className="day-rank-box">
            <span className="day-rank-label">MỨC ĐẠT</span>
            <span className="day-rank-value">{rank}</span>
          </div>
        </div>
        <div className="progress-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="progress-bar-fill"
            style={{
              opacity: pct > 0 ? 1 : 0,
              clipPath: `inset(0 ${Math.max(0, 100 - pct)}% 0 0 round 999px)`,
              WebkitClipPath: `inset(0 ${Math.max(0, 100 - pct)}% 0 0 round 999px)`,
            }}
          />
        </div>
      </div>

      <div className="tasks-list-grid">
        {CHECKIN_TASKS.map((task) => {
          const isChecked = !!checked[task.id];
          return (
            <div
              key={task.id}
              className={`task-card-item ${isChecked ? 'task-card-checked' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => toggle(task.id)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggle(task.id);
                }
              }}
            >
              <div className="task-card-header">
                <div className="task-card-badges">
                  <span className="task-badge-cat">{task.category}</span>
                  {task.boost && <span className="task-badge-boost">★ ×1.25</span>}
                  <span className="task-badge-time">
                    <Clock size={11} />
                    <span>{task.time}</span>
                  </span>
                </div>
                <div className="task-card-actions">
                  <button
                    type="button"
                    className={`timetable-checkbox ${isChecked ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(task.id);
                    }}
                    aria-label={isChecked ? `Bỏ tích việc: ${task.title}` : `Tích hoàn thành: ${task.title}`}
                    title={isChecked ? 'Bỏ tích' : 'Tích hoàn thành'}
                  >
                    {isChecked && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div className="task-card-body">
                <h4 className="task-card-title">{task.title}</h4>
                {task.target && <p className="task-card-target">{task.target}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================
 * 3. DEMO TRẠNG THÁI CÁ NHÂN (mô phỏng DailyStateModal)
 * ============================================================ */

const StatesDemo: React.FC = () => {
  const options = getLocalizedPersonalization('vi');
  const [physical, setPhysical] = useState('NORMAL');
  const [mental, setMental] = useState('STEADY');
  const [emotional, setEmotional] = useState('CALM');

  const groups: Array<{
    icon: React.ReactNode;
    title: string;
    options: typeof options.physicalStates;
    value: string;
    name: string;
    onChange: (id: string) => void;
  }> = [
    {
      icon: <HeartPulse size={15} />,
      title: '1. THỂ CHẤT HÔM NAY',
      options: options.physicalStates,
      value: physical,
      name: 'demoPhysicalState',
      onChange: setPhysical,
    },
    {
      icon: <Brain size={15} />,
      title: '2. TINH THẦN & ĐỘ TẬP TRUNG HÔM NAY',
      options: options.mentalStates,
      value: mental,
      name: 'demoMentalState',
      onChange: setMental,
    },
    {
      icon: <Smile size={15} />,
      title: '3. CẢM XÚC & TÂM TRẠNG HÔM NAY',
      options: options.emotionalStates,
      value: emotional,
      name: 'demoEmotionalState',
      onChange: setEmotional,
    },
  ];

  return (
    <div className="lp-demo-overview">
      {groups.map((g) => (
        <div className="profile-section-block" key={g.name}>
          <div className="profile-section-title">
            {g.icon}
            <span>{g.title}</span>
          </div>
          <div className="scope-cards-grid">
            {g.options.map((item) => {
              const isSelected = g.value === item.id;
              return (
                <label
                  key={item.id}
                  className={`scope-option-card scope-tier-${item.tier} ${
                    isSelected ? `scope-option-selected scope-selected-${item.tier}` : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={g.name}
                    checked={isSelected}
                    onChange={() => g.onChange(item.id)}
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
      ))}
    </div>
  );
};

/* ============================================================
 * 4. DEMO AI COACH (mô phỏng bong bóng AiCoachWidget)
 * ============================================================ */

const AI_COACH_MESSAGES = [
  'Kỷ luật thép! Bạn đã hoàn thành xuất sắc hầu hết mục tiêu hôm nay. Tiếp tục giữ vững nhịp độ này nhé! 🔥',
  'Phong độ tốt! Duy trì nhịp độ này để tiến tới mức Hoàn Hảo. Việc học tiếng Anh đang rất đều đặn.',
  'Mình thấy bạn đang hơi mệt về thể chất — hãy ưu tiên nghỉ ngơi, điểm vượt khó hôm nay sẽ được cộng thêm.',
  'Tuyệt vời! Buổi tập Gym hôm nay tăng tải thành công. Nhớ nạp đủ nước và ngủ trước 23:00 để phục hồi.',
];

const AiCoachDemo: React.FC = () => {
  const [idx, setIdx] = useState(0);

  return (
    <div className="lp-ai-demo">
      <div className="ai-floating-bubble is-open">
        <div className="ai-speech-bubble-header">
          <div className="ai-speech-badge">
            <Sparkles size={13} />
            <span>AI COACH</span>
          </div>
          <div className="ai-bubble-actions">
            <button
              type="button"
              className="btn-ai-reload"
              onClick={() => setIdx((idx + 1) % AI_COACH_MESSAGES.length)}
              title="Nhận một câu nhận xét khác từ AI"
            >
              <RefreshCw size={11} />
              <span>Đổi câu</span>
            </button>
            <button type="button" className="btn-ai-close" aria-label="Thu gọn bong bóng AI" title="Thu gọn bong bóng">
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="ai-speech-bubble-body" aria-live="polite">
          <p className="ai-bubble-message">{AI_COACH_MESSAGES[idx]}</p>
        </div>
      </div>

      <div className="lp-ai-demo-side">
        <button type="button" className="ai-floating-avatar-btn is-active" aria-label="AI Coach Avatar">
          <img src="/logo.png" alt="Self Upgrade Logo" className="ai-floating-avatar-img" />
        </button>
        <p className="lp-ai-demo-caption">
          Trong ứng dụng, AI Coach nổi góc dưới bên phải và tự động bật lời nhắc mỗi khi bạn tích việc, lưu ghi chú hay đổi trạng thái.
        </p>
      </div>
    </div>
  );
};

/* ============================================================
 * 8. DEMO PHÍM TẮT (mô phỏng KeyboardShortcutsModal)
 * ============================================================ */

const ShortcutsDemo: React.FC = () => {
  const groups = [
    {
      icon: <Navigation size={13} className="shortcuts-group-icon" />,
      tag: 'ĐIỀU HƯỚNG',
      count: '4',
      rows: [
        { label: 'Về ngày Hôm nay', keys: ['T'] },
        { label: 'Về Tổng quan tháng', keys: ['M'] },
        { label: 'Ngày trước / Tháng trước', keys: ['←', 'hoặc', '['] },
        { label: 'Ngày sau / Tháng sau', keys: ['→', 'hoặc', ']'] },
      ],
    },
    {
      icon: <Settings size={13} className="shortcuts-group-icon" />,
      tag: 'HỆ THỐNG & CỬA SỔ',
      count: '4',
      rows: [
        { label: 'Hồ sơ & Trạng thái thể chất', keys: ['P'] },
        { label: 'Cài đặt hệ thống', keys: ['S'] },
        { label: 'Xem bảng phím tắt này', keys: ['?'] },
        { label: 'Đóng cửa sổ modal', keys: ['Esc'] },
      ],
    },
    {
      icon: <CheckSquare size={13} className="shortcuts-group-icon" />,
      tag: 'THAO TÁC NGÀY & KỶ LUẬT',
      count: '5',
      rows: [
        { label: 'Thêm đầu việc mới', keys: ['A'] },
        { label: 'Chuyển sang To-do List', keys: ['1'] },
        { label: 'Chuyển sang Calories & Dinh dưỡng', keys: ['2'] },
        { label: 'Chuyển sang Tập luyện (Gym)', keys: ['3'] },
        { label: 'Tích nhanh 1 ly nước (+250 ml)', keys: ['W'] },
        { label: 'Trừ bớt nước (-250 ml)', keys: ['Shift', '+', 'W'] },
      ],
    },
  ];

  return (
    <div className="shortcuts-two-columns">
      {groups.map((g) => (
        <div className="shortcuts-col" key={g.tag}>
          <div className="shortcuts-group-card">
            <div className="shortcuts-group-header">
              <div className="shortcuts-group-title-row">
                {g.icon}
                <span className="shortcuts-group-tag">{g.tag}</span>
              </div>
              <span className="shortcuts-group-count">{g.count}</span>
            </div>
            <div className="shortcuts-list">
              {g.rows.map((row) => (
                <div className="shortcut-row" key={row.label}>
                  <span className="shortcut-label">{row.label}</span>
                  <div className="shortcut-keys">
                    {row.keys.map((k, i) =>
                      k === 'hoặc' || k === '+' ? (
                        <span className="kbd-sep" key={`${k}-${i}`}>{k}</span>
                      ) : (
                        <kbd className="shortcut-kbd" key={`${k}-${i}`}>{k}</kbd>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================
 * 5-7. DEMO DÙNG COMPONENT THẬT (Water / Calories / Workout)
 * ============================================================ */

const WaterDemo: React.FC = () => (
  <WaterTracker
    dateKey={`${DEMO_YEAR}-${String(DEMO_MONTH).padStart(2, '0')}-30`}
    initialWaterData={WATER_MOCK}
    userWeightKg="72"
    onSaveWater={() => {}}
  />
);

const CaloriesDemo: React.FC = () => (
  <CaloriesTracker
    dateKey={`${DEMO_YEAR}-${String(DEMO_MONTH).padStart(2, '0')}-30`}
    initialMeals={CALORIES_MEALS_MOCK}
    initialSummary={CALORIES_SUMMARY_MOCK}
    onSaveCalories={async () => {}}
  />
);

const WorkoutDemo: React.FC = () => (
  <WorkoutTracker
    dateKey={`${DEMO_YEAR}-${String(DEMO_MONTH).padStart(2, '0')}-30`}
    initialWorkoutData={WORKOUT_MOCK}
    onSaveWorkout={async () => {}}
  />
);

/* ============================================================
 * REGISTRY + MODAL
 * ============================================================ */

interface DemoDef {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  Component: React.FC;
}

export const DEMO_DEFS: Record<string, DemoDef> = {
  overview: {
    key: 'overview',
    title: 'Tổng quan tháng & thứ hạng',
    subtitle: 'Bản demo tương tác — mô phỏng đúng giao diện Tổng quan thật',
    icon: LayoutDashboard,
    Component: OverviewDemo,
  },
  checkin: {
    key: 'checkin',
    title: 'Tích việc & chấm điểm',
    subtitle: 'Bản demo tương tác — nhấn vào ô vuông để tích việc và xem điểm thay đổi',
    icon: CheckSquare,
    Component: CheckInDemo,
  },
  states: {
    key: 'states',
    title: 'Trạng thái cá nhân',
    subtitle: 'Bản demo tương tác — chọn Thể chất, Tinh thần & Cảm xúc như trong app',
    icon: Brain,
    Component: StatesDemo,
  },
  aicoach: {
    key: 'aicoach',
    title: 'AI Coach (Gemini)',
    subtitle: 'Bản demo tương tác — bấm "Đổi câu" để xem lời nhắc từ AI Coach',
    icon: Bot,
    Component: AiCoachDemo,
  },
  water: {
    key: 'water',
    title: 'Theo dõi nước uống',
    subtitle: 'Bản demo tương tác — dùng đúng Bộ theo dõi nước thật, bấm +250ml để nạp nước',
    icon: Droplets,
    Component: WaterDemo,
  },
  calories: {
    key: 'calories',
    title: 'Calories & dinh dưỡng',
    subtitle: 'Bản demo tương tác — dùng đúng trình ghi món ăn & phân tích AI thật',
    icon: Flame,
    Component: CaloriesDemo,
  },
  workout: {
    key: 'workout',
    title: 'Tập luyện (Gym)',
    subtitle: 'Bản demo tương tác — dùng đúng trình ghi buổi tập thật, thử tăng/giảm mức tạ',
    icon: Dumbbell,
    Component: WorkoutDemo,
  },
  shortcuts: {
    key: 'shortcuts',
    title: 'Tùy chỉnh & phím tắt',
    subtitle: 'Bản demo — bộ phím tắt điều khiển toàn hệ thống',
    icon: Zap,
    Component: ShortcutsDemo,
  },
};

export interface LandingDemoModalProps {
  demoKey: string | null;
  onClose: () => void;
}

export const LandingDemoModal: React.FC<LandingDemoModalProps> = ({ demoKey, onClose }) => {
  useEffect(() => {
    if (!demoKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [demoKey, onClose]);

  if (!demoKey) return null;
  const demo = DEMO_DEFS[demoKey];
  if (!demo) return null;

  const Icon = demo.icon;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="landing-demo-title"
    >
      <div
        className="modal-container modal-container-wide lp-demo-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" aria-hidden="true">
              <Icon size={18} />
            </div>
            <div>
              <h3 id="landing-demo-title" className="modal-title">
                {demo.title}
              </h3>
              <p className="modal-subtitle">{demo.subtitle}</p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body lp-demo-body">
          <demo.Component />
        </div>
      </div>
    </div>
  );
};
