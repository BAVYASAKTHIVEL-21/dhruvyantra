import type {
  CompletedFocusSession,
  FocusAnalyticsSnapshot,
  FocusDailyBar,
  FocusStatRow,
  PersistedFocusSession,
} from "@/types/focus";
import { addDays, dayLabel, isoDate } from "@/lib/mission-control/dates";
import { currentWeekDates } from "@/lib/focus/streak";

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

function formatBarLabel(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function sessionsInRange(
  sessions: CompletedFocusSession[],
  start: string,
  end: string,
): CompletedFocusSession[] {
  return sessions.filter((s) => s.date >= start && s.date <= end);
}

function totalSeconds(sessions: CompletedFocusSession[]): number {
  return sessions.reduce((sum, s) => sum + s.elapsedSeconds, 0);
}

function trendLabel(current: number, previous: number, unit: string): { text: string; positive: boolean } {
  const delta = current - previous;
  if (delta === 0) return { text: "Same as last week", positive: true };
  const sign = delta > 0 ? "+" : "";
  return { text: `${sign}${delta}${unit}`, positive: delta >= 0 };
}

function percentTrend(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) {
    return current > 0 ? { text: "New this week", positive: true } : { text: "—", positive: true };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? "+" : "";
  return { text: `${sign}${pct}%`, positive: pct >= 0 };
}

function focusScoreLabel(score: number): string {
  if (score >= 80) return "Great focus!";
  if (score >= 60) return "Solid progress";
  if (score >= 40) return "Building habit";
  if (score > 0) return "Keep going";
  return "Start a session today";
}

function computeFocusScore(
  weekSessions: CompletedFocusSession[],
  weekDates: string[],
  weeklyMinutes: number,
): number {
  const activeDays = new Set(weekSessions.map((s) => s.date)).size;
  const sessionCount = weekSessions.length;
  const consistency = activeDays / weekDates.length;
  const timeScore = Math.min(weeklyMinutes / 420, 1); // 7h/week target
  const sessionScore = Math.min(sessionCount / 7, 1);
  const avgMin =
    sessionCount > 0 ? totalSeconds(weekSessions) / sessionCount / 60 : 0;
  const depthScore = Math.min(avgMin / 45, 1);

  return Math.min(
    100,
    Math.round(consistency * 35 + timeScore * 35 + sessionScore * 15 + depthScore * 15),
  );
}

function activeSessionBonus(
  active: PersistedFocusSession | null | undefined,
  today: string,
): number {
  if (!active) return 0;
  const started = isoDate(new Date(active.startedAt));
  if (started !== today && active.updatedAt.slice(0, 10) !== today) return 0;
  return active.elapsedSeconds;
}

export function computeFocusAnalytics(
  sessions: CompletedFocusSession[],
  activeSession?: PersistedFocusSession | null,
  today: string = isoDate(),
): FocusAnalyticsSnapshot {
  const weekDates = currentWeekDates(today);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const prevWeekStart = addDays(weekStart, -7);
  const prevWeekEnd = addDays(weekEnd, -7);

  const thisWeek = sessionsInRange(sessions, weekStart, weekEnd);
  const lastWeek = sessionsInRange(sessions, prevWeekStart, prevWeekEnd);

  const thisWeekSeconds = totalSeconds(thisWeek) + activeSessionBonus(activeSession, today);
  const lastWeekSeconds = totalSeconds(lastWeek);
  const thisWeekMinutes = Math.round(thisWeekSeconds / 60);
  const lastWeekMinutes = Math.round(lastWeekSeconds / 60);

  const sessionTrend = trendLabel(thisWeek.length, lastWeek.length, "");
  const timeTrend = percentTrend(thisWeekMinutes, lastWeekMinutes);

  const avgSeconds =
    thisWeek.length > 0 ? Math.round(totalSeconds(thisWeek) / thisWeek.length) : 0;
  const lastAvgSeconds =
    lastWeek.length > 0 ? Math.round(totalSeconds(lastWeek) / lastWeek.length) : 0;
  const avgTrend = percentTrend(avgSeconds, lastAvgSeconds);

  const focusScore = computeFocusScore(thisWeek, weekDates, thisWeekMinutes);

  const minutesByDate = new Map<string, number>();
  for (const date of weekDates) minutesByDate.set(date, 0);
  for (const s of thisWeek) {
    minutesByDate.set(s.date, (minutesByDate.get(s.date) ?? 0) + Math.round(s.elapsedSeconds / 60));
  }
  if (activeSession) {
    const bonus = activeSessionBonus(activeSession, today);
    if (bonus > 0) {
      minutesByDate.set(today, (minutesByDate.get(today) ?? 0) + Math.round(bonus / 60));
    }
  }

  const weeklyBars: FocusDailyBar[] = weekDates.map((date) => {
    const minutes = minutesByDate.get(date) ?? 0;
    return {
      date,
      day: dayLabel(date),
      minutes,
      label: minutes > 0 ? formatBarLabel(minutes) : "—",
      isToday: date === today,
    };
  });

  const stats: FocusStatRow[] = [
    {
      label: "Focus Time",
      value: formatDuration(thisWeekSeconds),
      trend: timeTrend.text,
      trendPositive: timeTrend.positive,
    },
    {
      label: "Sessions",
      value: String(thisWeek.length),
      trend: sessionTrend.text,
      trendPositive: sessionTrend.positive,
    },
    {
      label: "Avg Session",
      value: avgSeconds > 0 ? formatDuration(avgSeconds) : "—",
      trend: avgTrend.text,
      trendPositive: avgTrend.positive,
    },
    {
      label: "Focus Score",
      value: `${focusScore}/100`,
      sub: focusScoreLabel(focusScore),
    },
  ];

  return {
    stats,
    weeklyTotalLabel: formatDuration(thisWeekSeconds),
    weeklyBars,
    focusScore,
    focusScoreLabel: focusScoreLabel(focusScore),
  };
}

export function emptyFocusAnalytics(today: string = isoDate()): FocusAnalyticsSnapshot {
  return computeFocusAnalytics([], null, today);
}
