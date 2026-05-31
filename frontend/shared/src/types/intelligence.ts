import type { ExamType } from "@/config/exam-config";
import type { WeakTopicMastery, StreakSnapshot } from "@/types/mission-control";
import type { TopicMasteryScore } from "@/types/weakness";
import type { MockTopicPerformance } from "@/types/mock-results";

/** Structured study actions for in-app routing and future orchestration. */
export type StudyActionType =
  | "schedule_recovery_session"
  | "recommend_resource"
  | "start_focus_session"
  | "schedule_mock"
  | "create_revision_session"
  | "complete_planner_task";

export type StudyAction = {
  id: string;
  type: StudyActionType;
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  /** In-app navigation when the client executes locally. */
  href?: string;
  payload: Record<string, string | number | boolean | null>;
  source: "mock" | "weakness" | "planner" | "focus" | "mentor";
};

export type MockAccuracyPoint = {
  date: string;
  label: string;
  accuracy: number;
  title: string;
};

export type MockSubjectSummary = {
  subject: string;
  attempts: number;
  avgAccuracy: number;
  weakTopicCount: number;
};

export type MockCenterAnalytics = {
  submissionsCount: number;
  avgAccuracy: number | null;
  latestAccuracy: number | null;
  accuracyTrend: MockAccuracyPoint[];
  subjectBreakdown: MockSubjectSummary[];
  topicHeatmap: MockTopicPerformance[];
  weakTopicsFromMocks: MockTopicPerformance[];
};

export type IntelligenceSnapshot = {
  computedAt: string;
  examType: ExamType | null;
  streak: StreakSnapshot;
  topicMastery: TopicMasteryScore[];
  weakTopics: WeakTopicMastery[];
  mockAnalytics: MockCenterAnalytics;
  studyActions: StudyAction[];
};
