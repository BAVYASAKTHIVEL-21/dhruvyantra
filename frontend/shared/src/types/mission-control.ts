import type { ExamType } from "@/config/exam-config";
import type { StudyAction } from "@/types/intelligence";

export type DailyStudyBar = {
  day: string;
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  studyMinutes: number;
};

export type WeakTopicMastery = {
  name: string;
  subject: string;
  masteryPercent: number;
  completedTasks: number;
  totalTasks: number;
};

export type StreakSnapshot = {
  current: number;
  longest: number;
  missedDays: number;
  studiedToday: boolean;
};

export type WeeklyProgressSnapshot = {
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
  studyHours: number;
  accuracyPercent: number;
  tasksCompletedLabel: string;
  changeLabel: string;
};

export type UpcomingMockSession = {
  title: string;
  scheduledLabel: string;
  scheduledAt: string;
  href: string;
  examType: ExamType | null;
};

export type SpacedRevisionEntry = {
  when: string;
  topic: string;
  priority: string;
  tone: "purple" | "blue" | "muted";
  daysUntil: number;
};

export type MissionAlertCategory = "important" | "study" | "tests" | "mentor" | "system";

export type CoralActionType =
  | "schedule_mock"
  | "create_revision_session"
  | "send_alert"
  | "schedule_focus_block"
  | "open_resources"
  | "schedule_recovery_session"
  | "recommend_resource"
  | "start_focus_session";

export type CoralAction = {
  type: CoralActionType;
  payload: Record<string, string | number | boolean | null>;
};

export type MissionAlert = {
  id: string;
  title: string;
  message: string;
  category: MissionAlertCategory;
  important: boolean;
  href?: string;
  coralAction?: CoralAction;
};

export type MissionControlAnalytics = {
  weekly: WeeklyProgressSnapshot;
  dailyBars: DailyStudyBar[];
  streak: StreakSnapshot;
  weakTopics: WeakTopicMastery[];
  upcomingMock: UpcomingMockSession;
  revisions: SpacedRevisionEntry[];
  alerts: MissionAlert[];
  alertCount: number;
  coralActions: CoralAction[];
  /** Executable study actions (Coral-ready payloads). */
  studyActions: StudyAction[];
  streakBars: number[];
};
