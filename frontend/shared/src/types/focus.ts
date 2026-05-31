export type FocusMode = "focus" | "pomodoro" | "flow";

export type FocusSessionStatus = "running" | "paused" | "completed";

/** Active timer state persisted across refresh (localStorage + API cookie). */
export type PersistedFocusSession = {
  id: string;
  mode: FocusMode;
  status: FocusSessionStatus;
  cycle: number;
  isBreak: boolean;
  secondsRemaining: number;
  phaseTotalSeconds: number;
  workSeconds: number;
  topic: string;
  subject: string;
  target: string;
  estimated: string;
  startTime: string;
  elapsedSeconds: number;
  startedAt: string;
  updatedAt: string;
};

export type FocusSessionPayload = {
  session: PersistedFocusSession | null;
};

/** Completed focus block stored in history for streaks and analytics. */
export type CompletedFocusSession = {
  id: string;
  date: string;
  completedAt: string;
  mode: FocusMode;
  topic: string;
  subject: string;
  elapsedSeconds: number;
};

export type FocusWeekDay = {
  date: string;
  day: string;
  short: string;
  completed: boolean;
  isToday: boolean;
};

export type FocusStreakSnapshot = {
  current: number;
  longest: number;
  studiedToday: boolean;
  weeklyCompletedCount: number;
  weekDays: FocusWeekDay[];
};

export type FocusDailyBar = {
  date: string;
  day: string;
  minutes: number;
  label: string;
  isToday: boolean;
};

export type FocusStatRow = {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  sub?: string;
};

export type FocusAnalyticsSnapshot = {
  stats: FocusStatRow[];
  weeklyTotalLabel: string;
  weeklyBars: FocusDailyBar[];
  focusScore: number;
  focusScoreLabel: string;
};
