import { getTopicsForSubject } from "@/config/syllabus";
import type { ProfileMe } from "@/lib/profile/me-types";
import { dayLabel, lastNDays } from "@/lib/mission-control/dates";
import { todayPlanDate } from "@/lib/planner/planner-dates";
import { alertBadgeCount, buildMissionAlerts } from "@/services/alerts/mission-alerts";
import { buildUpcomingMockSession } from "@/services/mock-center/upcoming-mock";
import {
  applyEvolvedWeakTopics,
  computeWeaknessEngine,
  toWeakTopicMasteryRows,
} from "@/services/weakness-engine/compute-scores";
import { WEAKNESS_SCORING } from "@/services/weakness-engine/constants";
import {
  buildSpacedRevisionSchedule,
  findSubjectForTopic,
} from "@/services/revision/spaced-revision";
import { actionsFromWeakness, mockAccuracyPercent } from "@/services/intelligence";
import {
  computeUnifiedStreak,
  unifiedStreakBarHeights,
} from "@/services/intelligence/unified-streak";
import type { CompletedFocusSession } from "@/types/focus";
import type { MockSubmissionRecord, MockTopicPerformance } from "@/types/mock-results";
import type { StudyTask } from "@/types/planner";
import type { StudyAction } from "@/types/intelligence";
import type {
  DailyStudyBar,
  MissionControlAnalytics,
  WeakTopicMastery,
  WeeklyProgressSnapshot,
} from "@/types/mission-control";
import { coralAction, focusBlockAction, scheduleMockAction } from "@/lib/mission-control/coral-actions";
import { studyActionToCoralType } from "@/services/intelligence/study-actions";
import type { CoralAction, CoralActionType } from "@/types/mission-control";

function topicMatches(task: StudyTask, topic: string): boolean {
  return `${task.title} ${task.topic}`.toLowerCase().includes(topic.toLowerCase());
}

function weakTopicNames(profile: ProfileMe): string[] {
  if (profile.weakTopics.length > 0) return profile.weakTopics.slice(0, 4);
  return profile.weakSubjects.flatMap((s) =>
    profile.examType ? [...getTopicsForSubject(profile.examType, s)].slice(0, 1) : [],
  );
}

export function computeWeakTopicMastery(
  profile: ProfileMe,
  tasks: StudyTask[],
  focusSessions: CompletedFocusSession[] = [],
  mockPerformances: MockTopicPerformance[] = [],
): WeakTopicMastery[] {
  const result = computeWeaknessEngine({ profile, tasks, focusSessions, mockPerformances });
  const rows = toWeakTopicMasteryRows(result);
  if (rows.length > 0) return rows;

  const today = todayPlanDate();
  const start = lastNDays(14, today)[0];
  const windowTasks = tasks.filter((t) => t.date >= start && t.date <= today);
  const fallbackNames = weakTopicNames(profile);

  return fallbackNames.map((name) => {
    const related = windowTasks.filter((t) => topicMatches(t, name));
    const completed = related.filter((t) => t.status === "Completed").length;
    const total = related.length;
    const baseline = profile.weakTopics.includes(name)
      ? WEAKNESS_SCORING.onboardingWeakBaseline
      : WEAKNESS_SCORING.discoveredBaseline;
    return {
      name,
      subject: findSubjectForTopic(profile, name),
      masteryPercent:
        total === 0 ? baseline : Math.round((completed / total) * 100),
      completedTasks: completed,
      totalTasks: total,
    };
  });
}

export function computeWeeklyProgress(
  profile: ProfileMe,
  tasks: StudyTask[],
  focusSessions: CompletedFocusSession[] = [],
  days = 7,
  mockSubmissions: MockSubmissionRecord[] = [],
): WeeklyProgressSnapshot {
  const today = todayPlanDate();
  const range = lastNDays(days, today);
  const start = range[0];
  // Exclude auto-generated recovery tasks from progress math so taking a mock
  // doesn't instantly inflate totals and distort completion percentage.
  const isRecovery = (t: StudyTask) =>
    Boolean(t.aiGenerated) && typeof t.id === "string" && t.id.startsWith("recovery-");

  const weekTasks = tasks
    .filter((t) => t.date >= start && t.date <= today)
    .filter((t) => !isRecovery(t));

  const completed = weekTasks.filter((t) => t.status === "Completed");
  const total = weekTasks.length;
  const progressPercent = total === 0 ? 0 : Math.round((completed.length / total) * 100);

  // Prefer real "studied time" from focus sessions when available.
  // Planner task duration is an estimate and can be skewed by auto-added tasks.
  const focusMinutes = focusSessions
    .filter((s) => s.date >= start && s.date <= today)
    .reduce((sum, s) => sum + Math.round((s.elapsedSeconds ?? 0) / 60), 0);

  const studyMinutes =
    focusMinutes > 0 ? focusMinutes : completed.reduce((sum, t) => sum + t.duration, 0);
  const studyHours = Math.round((studyMinutes / 60) * 10) / 10;
  const mockAccuracy = mockAccuracyPercent(mockSubmissions, days);
  const accuracyPercent = mockAccuracy ?? progressPercent;

  const prevStart = lastNDays(days * 2, today)[0];
  const prevEnd = lastNDays(days + 1, today)[0];
  const prevTasks = tasks.filter((t) => t.date >= prevStart && t.date < prevEnd);
  const prevCompleted = prevTasks.filter((t) => t.status === "Completed").length;
  const prevTotal = prevTasks.length;
  const prevPct = prevTotal === 0 ? 0 : Math.round((prevCompleted / prevTotal) * 100);
  const delta = progressPercent - prevPct;
  const changeLabel = delta >= 0 ? `+${delta}%` : `${delta}%`;

  return {
    completedTasks: completed.length,
    totalTasks: total,
    progressPercent,
    studyHours,
    accuracyPercent,
    tasksCompletedLabel:
      profile.examType === "JEE" ? "Tasks Completed" : "Topics Revised",
    changeLabel,
  };
}

export function computeDailyBars(tasks: StudyTask[], days = 7): DailyStudyBar[] {
  const today = todayPlanDate();
  return lastNDays(days, today).map((date) => {
    const dayTasks = tasks.filter((t) => t.date === date);
    const completed = dayTasks.filter((t) => t.status === "Completed");
    return {
      day: dayLabel(date),
      date,
      tasksCompleted: completed.length,
      tasksTotal: dayTasks.length,
      studyMinutes: completed.reduce((s, t) => s + t.duration, 0),
    };
  });
}

function studyActionsToCoral(actions: StudyAction[]): CoralAction[] {
  return actions.slice(0, 6).map((a) =>
    coralAction(studyActionToCoralType(a.type) as CoralActionType, {
      ...a.payload,
      actionId: a.id,
      title: a.title,
    }),
  );
}

export function buildMissionControlAnalytics(
  profile: ProfileMe,
  tasks: StudyTask[],
  focusSessions: CompletedFocusSession[] = [],
  mockPerformances: MockTopicPerformance[] = [],
  mockSubmissions: MockSubmissionRecord[] = [],
): MissionControlAnalytics {
  const today = todayPlanDate();
  const weakness = computeWeaknessEngine({ profile, tasks, focusSessions, mockPerformances });
  const enrichedProfile = applyEvolvedWeakTopics(profile, weakness);

  const weekly = computeWeeklyProgress(enrichedProfile, tasks, focusSessions, 7, mockSubmissions);
  const dailyBars = computeDailyBars(tasks);
  const streak = computeUnifiedStreak(tasks, focusSessions, today);
  const weakTopics = toWeakTopicMasteryRows(weakness);
  const upcomingMock = buildUpcomingMockSession(enrichedProfile, tasks, today);
  const revisions = buildSpacedRevisionSchedule(enrichedProfile, tasks, today);
  const alerts = buildMissionAlerts(enrichedProfile, tasks, streak, revisions, today);

  const studyActions = actionsFromWeakness(enrichedProfile, weakness);
  const primaryTopic =
    weakness.weakTopicNames[0] ??
    enrichedProfile.weakTopics[0] ??
    enrichedProfile.weakSubjects[0] ??
    "Focus";

  const coralFromStudy: CoralAction[] = [
    scheduleMockAction(enrichedProfile.examType ?? "Exam", upcomingMock.scheduledLabel),
    focusBlockAction(primaryTopic, 45, enrichedProfile.productiveTime ?? "Evening"),
    ...studyActionsToCoral(studyActions),
  ];

  return {
    weekly,
    dailyBars,
    streak,
    weakTopics,
    upcomingMock,
    revisions,
    alerts,
    alertCount: alertBadgeCount(alerts),
    coralActions: coralFromStudy,
    studyActions,
    streakBars: unifiedStreakBarHeights(tasks, focusSessions, 8),
  };
}

export function weeklyStatRows(
  weekly: WeeklyProgressSnapshot,
  profile: ProfileMe,
): { label: string; value: string; change: string }[] {
  return [
    {
      label: "Study Hours",
      value: `${weekly.studyHours} hrs`,
      change: weekly.changeLabel,
    },
    {
      label: profile.examType === "JEE" ? "Tasks Completed" : "Topics Revised",
      value: String(weekly.completedTasks),
      change: weekly.changeLabel,
    },
    {
      label: "Accuracy",
      value: `${weekly.accuracyPercent}%`,
      change: weekly.changeLabel,
    },
  ];
}
