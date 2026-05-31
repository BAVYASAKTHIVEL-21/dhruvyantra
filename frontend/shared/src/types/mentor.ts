import type { ExamType } from "@/config/exam-config";

export type MentorMode = "study" | "concept" | "strategy" | "motivation";

export type MentorChatRole = "user" | "assistant";

export type MentorChatTurn = {
  role: MentorChatRole;
  content: string;
};

export type MentorPlannerTaskSnapshot = {
  title: string;
  subject: string;
  topic: string;
  status: string;
  duration: number;
  date: string;
};

export type MentorFocusSessionSnapshot = {
  topic: string;
  subject: string;
  minutes: number;
  date: string;
};

export type MentorWeakTopicSnapshot = {
  topic: string;
  subject: string;
  masteryScore: number;
  completedTasks: number;
  missedTasks: number;
  focusSessions: number;
};

export type MentorSubjectMissCount = {
  subject: string;
  missedCount: number;
};

export type MentorTopicTrendSnapshot = {
  topic: string;
  subject: string;
  weekCompleted: number;
  weekMissed: number;
  weekFocusMinutes: number;
  prevWeekFocusMinutes: number;
};

export type MentorIntelligenceContext = {
  studentName: string;
  examType: ExamType | null;
  targetYear: number | null;
  weakSubjects: string[];
  weakTopics: string[];
  dailyStudyHours: number;
  productiveTime: string | null;
  planner: {
    todayTotal: number;
    todayCompleted: number;
    todayPendingTitles: string[];
    todayPending: MentorPlannerTaskSnapshot[];
    weekCompletionRate: number;
    missedBySubject: MentorSubjectMissCount[];
    recentMissed: MentorPlannerTaskSnapshot[];
    recentCompleted: MentorPlannerTaskSnapshot[];
  };
  focus: {
    streakCurrent: number;
    streakLongest: number;
    studiedToday: boolean;
    weeklySessions: number;
    weeklyMinutes: number;
    prevWeekMinutes: number;
    recentSessions: MentorFocusSessionSnapshot[];
  };
  weakness: {
    topWeakTopics: MentorWeakTopicSnapshot[];
    topicTrends: MentorTopicTrendSnapshot[];
  };
  latestMock: {
    title: string;
    overallAccuracy: number;
    weakTopics: { topic: string; subject: string; accuracy: number }[];
    strongTopics: { topic: string; subject: string; accuracy: number }[];
    submittedAt: string | null;
  } | null;
};

export type MentorPlannerRecommendation = {
  taskTitle: string;
  subject: string;
  topic: string;
  reason: string;
  priority: "high" | "medium";
};

export type MentorFocusRecommendation = {
  subject: string;
  topic: string;
  durationMinutes: number;
  reason: string;
  suggestedWindow: string;
};

export type MentorIntelligenceBriefing = {
  primarySignal: string;
  studyAdvice: string[];
  recoverySuggestions: string[];
  plannerRecommendations: MentorPlannerRecommendation[];
  focusRecommendations: MentorFocusRecommendation[];
  anchorFacts: string[];
};

export type MentorChatRequest = {
  intent?: "chat" | "welcome";
  message?: string;
  history?: MentorChatTurn[];
  mode?: MentorMode;
  stream?: boolean;
};

export type MentorChatResponse = {
  reply: string;
  mode: MentorMode;
  model: string | null;
};
