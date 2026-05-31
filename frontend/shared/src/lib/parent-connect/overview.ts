import { getExamSubjects } from "@/config/exam-config";
import type { ExamType } from "@/config/exam-config";
import { isTelegramConfigured } from "@/lib/integrations/telegram";
import { productiveHoursLabel } from "@/lib/mentor/insights";
import { getMentorInsightsForSession } from "@/lib/mentor/server-insights";
import { getMissionControlAnalyticsForSession } from "@/lib/mission-control/server";
import { getSessionUserId } from "@/lib/profile/server";
import type {
  MissionAlert,
  SpacedRevisionEntry,
  UpcomingMockSession,
  WeakTopicMastery,
} from "@/types/mission-control";
import type {
  ParentAlertItem,
  ParentConnectOverview,
  ParentPerformanceMetric,
  ParentSubjectPerformance,
  ParentUpcomingEvent,
  ParentWeeklyReport,
} from "@/types/parent-connect";
import {
  formatCountdownSubtitle,
  getExamCountdown,
} from "@/lib/exam-schedule";
import { buildParentConnectContext, todayTasks } from "./context";

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "#8B5CF6",
  Chemistry: "#38BDF8",
  Mathematics: "#22C55E",
  Biology: "#EC4899",
};

function formatStudyHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function subjectLevel(score: number): ParentSubjectPerformance["level"] {
  if (score >= 75) return "strong";
  if (score >= 55) return "average";
  return "weak";
}

function buildSubjects(
  examType: ExamType | null,
  weakSubjects: string[],
  weakTopics: WeakTopicMastery[],
): ParentSubjectPerformance[] {
  const subjects = examType ? [...getExamSubjects(examType)] : weakSubjects;
  if (subjects.length === 0) {
    return weakTopics.slice(0, 5).map((row) => ({
      subject: row.name,
      score: row.masteryPercent,
      trend: row.completedTasks > 0 ? `+${row.completedTasks} done` : "Needs focus",
      level: subjectLevel(row.masteryPercent),
      color: SUBJECT_COLORS[row.subject] ?? "#8B5CF6",
    }));
  }

  return subjects.map((subject) => {
    const rows = weakTopics.filter((w) => w.subject === subject);
    const score =
      rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + r.masteryPercent, 0) / rows.length)
        : 50;
    const completed = rows.reduce((sum, r) => sum + r.completedTasks, 0);
    return {
      subject,
      score,
      trend: completed > 0 ? `${completed} tasks this week` : "Schedule practice",
      level: subjectLevel(score),
      color: SUBJECT_COLORS[subject] ?? "#8B5CF6",
    };
  });
}

function mapAlert(alert: MissionAlert): ParentAlertItem {
  let type: ParentAlertItem["type"] = "info";
  if (
    alert.id.includes("missed") ||
    alert.id.includes("neglect") ||
    alert.id === "streak-risk"
  ) {
    type = "warning";
  } else if (alert.id === "daily-complete" || alert.title.toLowerCase().includes("streak")) {
    type = "success";
  }

  return {
    id: alert.id,
    title: alert.message ? `${alert.title} — ${alert.message}` : alert.title,
    time: alert.important ? "Important" : "Update",
    type,
  };
}

function buildUpcoming(
  mock: UpcomingMockSession,
  revisions: SpacedRevisionEntry[],
  pendingToday: { id: string; title: string }[],
): ParentUpcomingEvent[] {
  const events: ParentUpcomingEvent[] = [];

  if (mock.title) {
    events.push({
      id: "upcoming-mock",
      title: mock.title,
      when: mock.scheduledLabel,
      icon: "test",
    });
  }

  for (const rev of revisions.slice(0, 2)) {
    events.push({
      id: `rev-${rev.topic}`,
      title: `${rev.topic} revision`,
      when: rev.when,
      icon: "revision",
    });
  }

  for (const task of pendingToday.slice(0, Math.max(0, 3 - events.length))) {
    events.push({
      id: task.id,
      title: task.title,
      when: "Today",
      icon: "doubt",
    });
  }

  return events.slice(0, 4);
}

function buildWeeklyReport(
  weekLabel: string,
  studyHours: number,
  changeLabel: string,
  progressPercent: number,
  streakDays: number,
  weakTopicNames: string[],
  bestHours: string,
  productiveTime: string | null,
): ParentWeeklyReport {
  const weak = weakTopicNames.slice(0, 3);
  return {
    week: weekLabel,
    focusHours: formatStudyHours(studyHours),
    weakTopics: weak.length > 0 ? weak : ["No weak topics flagged yet"],
    summary: `${progressPercent}% weekly task completion (${changeLabel}). ${streakDays}-day study streak.`,
    aiRecommendation: `Peak focus window: ${bestHours}. ${productiveTime ? `Student prefers ${productiveTime.toLowerCase()} sessions.` : "Encourage a consistent daily block."}`,
  };
}

function buildMetrics(
  progressPercent: number,
  studyHours: number,
  changeLabel: string,
  accuracyPercent: number,
  streakDays: number,
  mockAccuracy: number | null,
): ParentPerformanceMetric[] {
  const mockValue = mockAccuracy != null ? `${mockAccuracy}%` : "—";
  const mockTrend =
    mockAccuracy != null
      ? mockAccuracy >= 70
        ? "Solid performance"
        : "Recovery plan active"
      : "No mock yet";

  return [
    {
      id: "progress",
      label: "Overall Progress",
      value: `${progressPercent}%`,
      sub: "This week",
      trend: changeLabel,
      positive: !changeLabel.startsWith("-"),
      progressPercent,
    },
    {
      id: "hours",
      label: "Study Hours",
      value: formatStudyHours(studyHours),
      sub: "This week",
      trend: changeLabel,
      positive: studyHours > 0,
    },
    {
      id: "mock",
      label: "Mock Test Score",
      value: mockValue,
      sub: "Latest mock",
      trend: mockTrend,
      positive: mockAccuracy == null || mockAccuracy >= 60,
    },
    {
      id: "accuracy",
      label: "Accuracy",
      value: `${accuracyPercent}%`,
      sub: "Task completion",
      trend: changeLabel,
      positive: accuracyPercent >= 50,
    },
    {
      id: "streak",
      label: "Consistency",
      value: `${streakDays} Day${streakDays === 1 ? "" : "s"}`,
      sub: "Current streak",
      trend: streakDays >= 7 ? "Keep it up!" : "Build momentum",
      positive: streakDays > 0,
    },
  ];
}

export async function getParentConnectOverviewForSession(): Promise<ParentConnectOverview | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const [analytics, ctx, insights] = await Promise.all([
    getMissionControlAnalyticsForSession(),
    buildParentConnectContext(userId),
    getMentorInsightsForSession(),
  ]);

  if (!analytics || !ctx) return null;

  const { profile, streak, latestMock } = ctx;
  const { weekly, weakTopics, alerts, upcomingMock, revisions } = analytics;
  const mockAccuracy = latestMock?.analysis.overallAccuracy ?? null;
  const bestHours = insights?.bestHours ?? productiveHoursLabel(profile.productiveTime);
  const weekLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weakTopicNames =
    weakTopics.length > 0
      ? weakTopics.map((w) => w.name)
      : profile.weakTopics.length > 0
        ? profile.weakTopics
        : profile.weakSubjects;

  const pendingToday = todayTasks(ctx)
    .filter((t) => t.status !== "Completed")
    .map((t) => ({ id: t.id, title: t.title }));

  const aiInsight = insights
    ? `${profile.name} is performing best between ${insights.bestHours}. ${insights.motivation.action}`
    : `${profile.name} is preparing for ${profile.targetRank ?? "their target exam"}. Best focus window: ${bestHours}.`;

  const examCountdown = getExamCountdown(profile.targetYear, profile.examType, ctx.today);

  return {
    student: {
      name: profile.name,
      role: profile.role,
      targetExam: profile.targetRank ?? "Set target exam",
      daysRemaining: examCountdown?.days ?? null,
      nextExamLabel: examCountdown
        ? formatCountdownSubtitle(examCountdown.milestone)
        : null,
    },
    metrics: buildMetrics(
      weekly.progressPercent,
      weekly.studyHours,
      weekly.changeLabel,
      weekly.accuracyPercent,
      streak.current,
      mockAccuracy,
    ),
    subjects: buildSubjects(profile.examType, profile.weakSubjects, weakTopics),
    alerts: alerts.slice(0, 5).map(mapAlert),
    aiInsight,
    upcoming: buildUpcoming(upcomingMock, revisions, pendingToday),
    weeklyReport: buildWeeklyReport(
      weekLabel,
      weekly.studyHours,
      weekly.changeLabel,
      weekly.progressPercent,
      streak.current,
      weakTopicNames,
      bestHours,
      profile.productiveTime,
    ),
    telegramConfigured: isTelegramConfigured(),
  };
}
