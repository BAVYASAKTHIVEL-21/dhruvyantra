import type { ExamType } from "@/config/exam-config";

/** Per-topic mastery on a 0–100 scale (higher = stronger). */
export type TopicMasteryScore = {
  topic: string;
  subject: string;
  masteryScore: number;
  completedTasks: number;
  missedTasks: number;
  pendingTasks: number;
  focusSessions: number;
  focusMinutes: number;
  fromOnboarding: boolean;
};

export type WeaknessEngineResult = {
  topics: TopicMasteryScore[];
  /** Lowest mastery first — use for planner/resources prioritization. */
  weakTopicNames: string[];
  computedAt: string;
  windowDays: number;
  examType: ExamType | null;
};

export type WeaknessTopicsApiResponse = WeaknessEngineResult;
