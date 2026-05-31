import { isoDate } from "@/lib/mission-control/dates";
import type { UserProfile } from "@/lib/profile/types";
import type { CompletedFocusSession } from "@/types/focus";
import type { StudyTask } from "@/types/planner";
import type { TopicMasteryScore, WeaknessEngineResult } from "@/types/weakness";
import type { MockTopicPerformance } from "@/types/mock-results";
import type { WeakTopicMastery } from "@/types/mission-control";
import {
  WEAKNESS_ANALYTICS_LIMIT,
  WEAKNESS_DEFAULT_WINDOW_DAYS,
  WEAKNESS_MIN_FOCUS_SECONDS,
  WEAKNESS_SCORING,
  WEAKNESS_TOP_TOPIC_LIMIT,
} from "./constants";
import {
  buildTopicCandidatePool,
  buildTrackedTopics,
  registerDiscoveredTopic,
  resolveCanonicalTopic,
  topicMatchesText,
  type TrackedTopicMeta,
} from "./topic-resolution";

export type WeaknessEngineInput = {
  profile: Pick<UserProfile, "examType" | "weakSubjects" | "weakTopics" | "userId">;
  tasks: StudyTask[];
  focusSessions: CompletedFocusSession[];
  mockPerformances?: MockTopicPerformance[];
  today?: string;
  windowDays?: number;
};

type TopicCounters = {
  completedTasks: number;
  missedTasks: number;
  pendingTasks: number;
  focusSessions: number;
  focusMinutes: number;
  mockCorrect: number;
  mockIncorrect: number;
  mockSkipped: number;
};

function clampScore(score: number): number {
  return Math.max(WEAKNESS_SCORING.minScore, Math.min(WEAKNESS_SCORING.maxScore, Math.round(score)));
}

function baselineForTopic(meta: TrackedTopicMeta, profile: WeaknessEngineInput["profile"]): number {
  if (meta.fromOnboarding || profile.weakTopics.includes(meta.topic)) {
    return WEAKNESS_SCORING.onboardingWeakBaseline;
  }
  if (profile.weakSubjects.includes(meta.subject)) {
    return WEAKNESS_SCORING.onboardingSubjectBaseline;
  }
  return WEAKNESS_SCORING.discoveredBaseline;
}

function isMissedTask(task: StudyTask, today: string): boolean {
  return task.date < today && task.status !== "Completed";
}

function isCompletedTask(task: StudyTask): boolean {
  return task.status === "Completed";
}

function isPendingFutureTask(task: StudyTask, today: string): boolean {
  return task.date >= today && task.status !== "Completed";
}

function resolveTaskTopic(
  task: StudyTask,
  profile: WeaknessEngineInput["profile"],
  candidates: string[],
): string | null {
  return (
    resolveCanonicalTopic(profile.examType, task.subject, task.topic, candidates) ??
    resolveCanonicalTopic(profile.examType, task.subject, task.title, candidates)
  );
}

function resolveFocusTopic(
  session: CompletedFocusSession,
  profile: WeaknessEngineInput["profile"],
  candidates: string[],
): string | null {
  return resolveCanonicalTopic(profile.examType, session.subject, session.topic, candidates);
}

function accumulateSignals(
  input: WeaknessEngineInput,
  tracked: Map<string, TrackedTopicMeta>,
  counters: Map<string, TopicCounters>,
): void {
  const { profile, tasks, focusSessions } = input;
  const today = input.today ?? isoDate();
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (input.windowDays ?? WEAKNESS_DEFAULT_WINDOW_DAYS) + 1);
  const startIso = windowStart.toISOString().slice(0, 10);
  const candidates = buildTopicCandidatePool(profile);

  const bump = (topic: string, subject: string, patch: Partial<TopicCounters>): void => {
    registerDiscoveredTopic(tracked, profile, topic, subject);
    const existing = counters.get(topic) ?? {
      completedTasks: 0,
      missedTasks: 0,
      pendingTasks: 0,
      focusSessions: 0,
      focusMinutes: 0,
      mockCorrect: 0,
      mockIncorrect: 0,
      mockSkipped: 0,
    };
    counters.set(topic, {
      completedTasks: existing.completedTasks + (patch.completedTasks ?? 0),
      missedTasks: existing.missedTasks + (patch.missedTasks ?? 0),
      pendingTasks: existing.pendingTasks + (patch.pendingTasks ?? 0),
      focusSessions: existing.focusSessions + (patch.focusSessions ?? 0),
      focusMinutes: existing.focusMinutes + (patch.focusMinutes ?? 0),
      mockCorrect: existing.mockCorrect + (patch.mockCorrect ?? 0),
      mockIncorrect: existing.mockIncorrect + (patch.mockIncorrect ?? 0),
      mockSkipped: existing.mockSkipped + (patch.mockSkipped ?? 0),
    });
  };

  for (const task of tasks) {
    if (task.date < startIso || task.date > today) continue;

    const topic = resolveTaskTopic(task, profile, candidates);
    if (!topic) continue;

    if (isCompletedTask(task)) {
      bump(topic, task.subject, { completedTasks: 1 });
    } else if (isMissedTask(task, today)) {
      bump(topic, task.subject, { missedTasks: 1 });
    } else if (isPendingFutureTask(task, today)) {
      bump(topic, task.subject, { pendingTasks: 1 });
    }
  }

  for (const session of focusSessions) {
    if (session.date < startIso || session.date > today) continue;
    if (session.elapsedSeconds < WEAKNESS_MIN_FOCUS_SECONDS) continue;

    const topic = resolveFocusTopic(session, profile, candidates);
    if (!topic) continue;

    bump(topic, session.subject, {
      focusSessions: 1,
      focusMinutes: Math.round(session.elapsedSeconds / 60),
    });
  }

  for (const mock of input.mockPerformances ?? []) {
    const topic =
      resolveCanonicalTopic(profile.examType, mock.subject, mock.topic, candidates) ?? mock.topic;
    bump(topic, mock.subject, {
      mockCorrect: mock.correct,
      mockIncorrect: mock.incorrect,
      mockSkipped: mock.skipped,
    });
  }
}

function scoreTopic(
  meta: TrackedTopicMeta,
  counters: TopicCounters,
  profile: WeaknessEngineInput["profile"],
): TopicMasteryScore {
  let score = baselineForTopic(meta, profile);
  score += counters.completedTasks * WEAKNESS_SCORING.completedTaskGain;
  score -= counters.missedTasks * WEAKNESS_SCORING.missedTaskLoss;
  score += counters.focusSessions * WEAKNESS_SCORING.focusSessionGain;
  score += Math.min(
    WEAKNESS_SCORING.maxFocusGainPerSession * counters.focusSessions,
    counters.focusMinutes / WEAKNESS_SCORING.focusMinuteScale,
  );
  score += counters.mockCorrect * WEAKNESS_SCORING.mockCorrectGain;
  score -= counters.mockIncorrect * WEAKNESS_SCORING.mockIncorrectLoss;
  score -= counters.mockSkipped * WEAKNESS_SCORING.mockSkippedLoss;

  const mockTotal = counters.mockCorrect + counters.mockIncorrect + counters.mockSkipped;
  if (mockTotal > 0) {
    const mockAccuracy = Math.round((counters.mockCorrect / mockTotal) * 100);
    if (mockAccuracy < WEAKNESS_SCORING.mockLowAccuracyThreshold) {
      score -= WEAKNESS_SCORING.mockLowAccuracyPenalty;
    }
  }

  return {
    topic: meta.topic,
    subject: meta.subject,
    masteryScore: clampScore(score),
    completedTasks: counters.completedTasks,
    missedTasks: counters.missedTasks,
    pendingTasks: counters.pendingTasks,
    focusSessions: counters.focusSessions,
    focusMinutes: counters.focusMinutes,
    fromOnboarding: meta.fromOnboarding || profile.weakTopics.includes(meta.topic),
  };
}

function isRelevantTopic(row: TopicMasteryScore, counters?: TopicCounters): boolean {
  const hasMock =
    counters &&
    (counters.mockCorrect > 0 || counters.mockIncorrect > 0 || counters.mockSkipped > 0);
  return (
    row.fromOnboarding ||
    row.completedTasks > 0 ||
    row.missedTasks > 0 ||
    row.pendingTasks > 0 ||
    row.focusSessions > 0 ||
    Boolean(hasMock)
  );
}

export function computeWeaknessEngine(input: WeaknessEngineInput): WeaknessEngineResult {
  const tracked = buildTrackedTopics(input.profile);
  const counters = new Map<string, TopicCounters>();
  accumulateSignals(input, tracked, counters);

  const emptyCounters: TopicCounters = {
    completedTasks: 0,
    missedTasks: 0,
    pendingTasks: 0,
    focusSessions: 0,
    focusMinutes: 0,
    mockCorrect: 0,
    mockIncorrect: 0,
    mockSkipped: 0,
  };

  const topics: TopicMasteryScore[] = [...tracked.values()]
    .map((meta) => {
      const topicCounters = counters.get(meta.topic) ?? emptyCounters;
      return scoreTopic(meta, topicCounters, input.profile);
    })
    .filter((row) => isRelevantTopic(row, counters.get(row.topic)))
    .sort((a, b) => a.masteryScore - b.masteryScore || a.topic.localeCompare(b.topic));

  const weakTopicNames = topics.slice(0, WEAKNESS_TOP_TOPIC_LIMIT).map((t) => t.topic);

  if (weakTopicNames.length === 0 && input.profile.weakTopics.length > 0) {
    weakTopicNames.push(...input.profile.weakTopics.slice(0, WEAKNESS_TOP_TOPIC_LIMIT));
  }

  return {
    topics,
    weakTopicNames,
    computedAt: new Date().toISOString(),
    windowDays: input.windowDays ?? WEAKNESS_DEFAULT_WINDOW_DAYS,
    examType: input.profile.examType,
  };
}

export function toWeakTopicMasteryRows(result: WeaknessEngineResult): WeakTopicMastery[] {
  return result.topics.slice(0, WEAKNESS_ANALYTICS_LIMIT).map((row) => ({
    name: row.topic,
    subject: row.subject,
    masteryPercent: row.masteryScore,
    completedTasks: row.completedTasks,
    totalTasks: row.completedTasks + row.missedTasks + row.pendingTasks,
  }));
}

export function applyEvolvedWeakTopics<T extends Pick<UserProfile, "weakTopics">>(
  profile: T,
  result: WeaknessEngineResult,
): T {
  if (result.weakTopicNames.length === 0) return profile;
  return { ...profile, weakTopics: result.weakTopicNames };
}

/** Score boost when ranking resources — lower mastery = higher weakness weight. */
export function weaknessPriorityScore(masteryScore: number): number {
  return WEAKNESS_SCORING.maxScore - masteryScore;
}

export function topicWeaknessRank(
  result: WeaknessEngineResult,
  topicText: string,
): number | null {
  const idx = result.weakTopicNames.findIndex((name) => topicMatchesText(name, topicText));
  return idx >= 0 ? idx : null;
}
