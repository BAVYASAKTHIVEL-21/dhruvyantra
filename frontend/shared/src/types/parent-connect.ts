export type ParentPerformanceMetric = {
  id: "progress" | "hours" | "mock" | "accuracy" | "streak";
  label: string;
  value: string;
  sub: string;
  trend: string;
  positive: boolean;
  progressPercent?: number;
};

export type ParentSubjectPerformance = {
  subject: string;
  score: number;
  trend: string;
  level: "strong" | "average" | "weak";
  color: string;
};

export type ParentAlertItem = {
  id: string;
  title: string;
  time: string;
  type: "warning" | "info" | "success";
};

export type ParentUpcomingEvent = {
  id: string;
  title: string;
  when: string;
  icon: "test" | "revision" | "doubt";
};

export type ParentWeeklyReport = {
  week: string;
  focusHours: string;
  weakTopics: string[];
  aiRecommendation: string;
  summary: string;
};

export type ParentConnectOverview = {
  student: {
    name: string;
    role: string;
    targetExam: string;
    daysRemaining: number | null;
    /** Real next exam window label, e.g. "17 May 2026 · JEE Advanced 2026". */
    nextExamLabel: string | null;
  };
  metrics: ParentPerformanceMetric[];
  subjects: ParentSubjectPerformance[];
  alerts: ParentAlertItem[];
  aiInsight: string;
  upcoming: ParentUpcomingEvent[];
  weeklyReport: ParentWeeklyReport;
  telegramConfigured: boolean;
};
