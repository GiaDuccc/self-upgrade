import { DayRecord, TaskConfig, UserProfile } from '~/types';
import {
  calculateDayStats,
  formatDateKey,
  getTasksForDate,
} from '~/utils/statsCalculator';

export interface AgentMemorySnapshot {
  streakDays: number;
  activeDaysCount: number;
  avg7DayScore: number;
  yesterdayScore: number | null;
  momentum: 'RISING' | 'FALLING' | 'STEADY' | 'NEW_JOURNEY';
  bestHabitTitle: string | null;
  mostMissedHabitTitle: string | null;
  recentNotesCount: number;
}

const userEpisodicHistoryMap = new Map<string, string[]>();
const MAX_EPISODIC_MEMORY = 10;

function getPastDateKey(baseDateKey: string, daysAgo: number): string {
  const [y, m, d] = baseDateKey.split('-').map(Number);
  const dt = new Date(y || 2026, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() - daysAgo);
  return formatDateKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/**
 * Memory Engine: Phân tích chuỗi dữ liệu lịch sử 7 ngày gần nhất trong MongoDB
 * để giúp Agent "nhớ" thói quen, phong độ và điểm mạnh/yếu của người dùng.
 */
export function buildUserMemorySnapshot(
  targetDateKey: string,
  records: Record<string, DayRecord>,
  taskConfig: TaskConfig,
  userProfile: UserProfile,
  todayScore: number
): AgentMemorySnapshot {
  let streakDays = 0;
  let streakBroken = false;
  let activeDaysCount = 0;
  let scoreSum = 0;
  let yesterdayScore: number | null = null;
  let recentNotesCount = 0;

  const habitSuccessCount = new Map<string, { title: string; done: number; total: number }>();

  for (let i = 1; i <= 7; i++) {
    const pastKey = getPastDateKey(targetDateKey, i);
    const rec = records[pastKey];
    const tasksList = getTasksForDate(pastKey, taskConfig);

    if (rec && rec.tasks && Object.keys(rec.tasks).length > 0) {
      const stats = calculateDayStats(rec, tasksList, userProfile);
      const hasAnyDone = stats.counts.PERFECT + stats.counts.GOOD + stats.counts.BAD > 0;

      if (i === 1 && hasAnyDone) {
        yesterdayScore = stats.percentage;
      }

      if (hasAnyDone) {
        activeDaysCount++;
        scoreSum += stats.percentage;

        if (!streakBroken && stats.percentage >= 40) {
          streakDays++;
        } else {
          streakBroken = true;
        }
      } else {
        streakBroken = true;
      }

      if (rec.note && rec.note.trim().length > 0) {
        recentNotesCount++;
      }

      tasksList.forEach((t) => {
        const entry = habitSuccessCount.get(t.id) || { title: t.title, done: 0, total: 0 };
        entry.total += 1;
        const lvl = rec.tasks?.[t.id];
        if (lvl === 'PERFECT' || lvl === 'GOOD') {
          entry.done += 1;
        }
        habitSuccessCount.set(t.id, entry);
      });
    } else {
      streakBroken = true;
    }
  }

  if (todayScore >= 40) {
    streakDays += 1;
  }

  const avg7DayScore =
    activeDaysCount > 0 ? Math.round(scoreSum / activeDaysCount) : 0;

  let momentum: AgentMemorySnapshot['momentum'] = 'NEW_JOURNEY';
  if (activeDaysCount > 0) {
    if (todayScore >= avg7DayScore + 12) {
      momentum = 'RISING';
    } else if (todayScore + 15 < avg7DayScore) {
      momentum = 'FALLING';
    } else {
      momentum = 'STEADY';
    }
  }

  let bestHabitTitle: string | null = null;
  let bestRate = -1;
  let mostMissedHabitTitle: string | null = null;
  let worstRate = 2;

  habitSuccessCount.forEach((val) => {
    if (val.total >= 2) {
      const rate = val.done / val.total;
      if (rate > bestRate && val.done > 0) {
        bestRate = rate;
        bestHabitTitle = val.title;
      }
      if (rate < worstRate && val.done < val.total) {
        worstRate = rate;
        mostMissedHabitTitle = val.title;
      }
    }
  });

  return {
    streakDays,
    activeDaysCount,
    avg7DayScore,
    yesterdayScore,
    momentum,
    bestHabitTitle,
    mostMissedHabitTitle,
    recentNotesCount,
  };
}

export function getEpisodicHistory(userId: string): string[] {
  return userEpisodicHistoryMap.get(userId) || [];
}

export function recordEpisodicMemory(userId: string, messageVi: string): void {
  const prev = userEpisodicHistoryMap.get(userId) || [];
  const updated = [messageVi, ...prev].slice(0, MAX_EPISODIC_MEMORY);
  userEpisodicHistoryMap.set(userId, updated);
}

