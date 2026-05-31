import type { ExamType } from "@/config/exam-config";
import type { StudyAction } from "@/types/intelligence";

export type MockAnswerOutcome = "correct" | "incorrect" | "skipped";

export type MockType = "full" | "chapter" | "pyq";

export type MockQuestionResult = {
  questionId: string;
  topic: string;
  subject: string;
  outcome: MockAnswerOutcome;
};

export type MockSubmissionPayload = {
  mockId?: string;
  plannerTaskId?: string;
  mockType: MockType;
  title: string;
  examType: ExamType;
  questions: MockQuestionResult[];
  durationMinutes?: number;
  useSeeded?: boolean;
};

export type MockTopicPerformance = {
  topic: string;
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
};

export type MockAnalysisResult = {
  weakTopics: MockTopicPerformance[];
  strongTopics: MockTopicPerformance[];
  topicAccuracy: MockTopicPerformance[];
  overallAccuracy: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  submittedAt: string;
};

export type MockCenterIntegrations = {
  mentorInsight: string;
  mentorSignals: { id: string; message: string; severity: string }[];
  weaknessTopTopics: { topic: string; subject: string; masteryScore: number }[];
  updatedWeakTopics: string[];
  studyActions?: StudyAction[];
};

export type MockSubmissionResponse = {
  submission: MockSubmissionRecord;
  recoveryTasks: { id: string; title: string; subject: string; topic: string; date: string }[];
  integrations: MockCenterIntegrations;
  studyActions: StudyAction[];
};

export type MockResourceRecommendation = {
  resourceId: string;
  title: string;
  type: string;
  subject: string;
  topic: string;
  reason: string;
};

export type MockSubmissionRecord = {
  id: string;
  title: string;
  mockType: MockType;
  examType: ExamType;
  submittedAt: string;
  plannerTaskId?: string;
  durationMinutes?: number;
  analysis: MockAnalysisResult;
  resourceRecommendations: MockResourceRecommendation[];
  recoveryTaskIds: string[];
};

