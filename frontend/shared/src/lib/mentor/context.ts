import { addDays, isoDate } from "@/lib/mission-control/dates";
import { toProfileMe } from "@/lib/profile/me-types";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import { computeFocusStreak } from "@/lib/focus/streak";
import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { buildWeaknessEngineForProfile } from "@/lib/weakness/server";
import { getLatestMockSubmission } from "@/lib/mock-center/store";
import type { UserProfile } from "@/lib/profile/types";
import type {
  MentorIntelligenceContext,
  MentorSubjectMissCount,
  MentorTopicTrendSnapshot,
} from "@/types/mentor";
import type { StudyTask } from "@/types/planner";
import type { CompletedFocusSession } from "@/types/focus";

const MENTOR_CONTEXT_TTL_MS = 45_000;
const mentorContextByUser = new Map<
  string,
  { loadedAt: number; context: MentorIntelligenceContext }
>();

function mapTask(task: StudyTask) {
  return {
    title: task.title,
    subject: task.subject,
    topic: task.topic,
    status: task.status,
    duration: task.duration,
    date: task.date,
  };
}

function weekCompletionRate(tasks: StudyTask[], start: string, end: string): number {
  const week = tasks.filter((t) => t.date >= start && t.date <= end);
  if (week.length === 0) return 0;
  return Math.round((week.filter((t) => t.status === "Completed").length / week.length) * 100);
}

function missedBySubject(tasks: StudyTask[], start: string, end: string): MentorSubjectMissCount[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.date >= start && task.date <= end && task.status !== "Completed") {
      counts.set(task.subject, (counts.get(task.subject) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([subject, missedCount]) => ({ subject, missedCount }))
    .sort((a, b) => b.missedCount - a.missedCount);
}

function focusMinutesInRange(sessions: CompletedFocusSession[], start: string, end: string): number {
  return Math.round(
    sessions
      .filter((s) => s.date >= start && s.date <= end)
      .reduce((sum, s) => sum + s.elapsedSeconds, 0) / 60,
  );
}

function buildTopicTrends(
  tasks: StudyTask[],
  focusSessions: CompletedFocusSession[],
  weakTopics: { topic: string; subject: string }[],
  weekStart: string,
  prevWeekStart: string,
  prevWeekEnd: string,
  today: string,
): MentorTopicTrendSnapshot[] {
  return weakTopics.slice(0, 5).map(({ topic, subject }) => {
    const weekTasks = tasks.filter(
      (t) => t.date >= weekStart && t.date <= today && (t.topic === topic || t.title.includes(topic)),
    );
    const weekFocus = focusSessions.filter(
      (s) => s.date >= weekStart && s.date <= today && (s.topic === topic || s.subject === subject),
    );
    const prevWeekFocus = focusSessions.filter(
      (s) =>
        s.date >= prevWeekStart &&
        s.date <= prevWeekEnd &&
        (s.topic === topic || s.subject === subject),
    );

    return {
      topic,
      subject,
      weekCompleted: weekTasks.filter((t) => t.status === "Completed").length,
      weekMissed: weekTasks.filter((t) => t.status !== "Completed").length,
      weekFocusMinutes: Math.round(weekFocus.reduce((sum, s) => sum + s.elapsedSeconds, 0) / 60),
      prevWeekFocusMinutes: Math.round(
        prevWeekFocus.reduce((sum, s) => sum + s.elapsedSeconds, 0) / 60,
      ),
    };
  });
}

export async function buildMentorIntelligenceContext(
  profile: UserProfile,
): Promise<MentorIntelligenceContext> {
  const today = isoDate();
  const start = addDays(today, -13);
  const weekStart = addDays(today, -6);
  const prevWeekStart = addDays(today, -13);
  const prevWeekEnd = addDays(today, -7);
  const userId = profile.userId;

  const [tasks, focusSessions, weakness, latestMockRecord] = await Promise.all([
    getTasksForDateRange(userId, start, today),
    getFocusSessionHistory(userId),
    buildWeaknessEngineForProfile(profile),
    getLatestMockSubmission(userId),
  ]);

  const todayTasks = tasks.filter((t) => t.date === today);
  const completedToday = todayTasks.filter((t) => t.status === "Completed");
  const pendingToday = todayTasks.filter((t) => t.status !== "Completed");

  const recentMissed = tasks
    .filter((t) => t.date < today && t.status !== "Completed")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(mapTask);

  const recentCompleted = tasks
    .filter((t) => t.status === "Completed")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(mapTask);

  const focusStreak = computeFocusStreak(focusSessions, today);
  const recentFocus = focusSessions.slice(0, 6).map((s) => ({
    topic: s.topic,
    subject: s.subject,
    minutes: Math.round(s.elapsedSeconds / 60),
    date: s.date,
  }));

  const weakTopicRows = weakness.topics.slice(0, 5).map((t) => ({
    topic: t.topic,
    subject: t.subject,
  }));

  const me = toProfileMe(profile);

  return {
    studentName: me.name,
    examType: profile.examType,
    targetYear: profile.targetYear,
    weakSubjects: profile.weakSubjects,
    weakTopics: weakness.weakTopicNames.length
      ? weakness.weakTopicNames
      : profile.weakTopics,
    dailyStudyHours: profile.dailyStudyHours,
    productiveTime: profile.productiveTime,
    planner: {
      todayTotal: todayTasks.length,
      todayCompleted: completedToday.length,
      todayPendingTitles: pendingToday.slice(0, 6).map((t) => t.title),
      todayPending: pendingToday.slice(0, 6).map(mapTask),
      weekCompletionRate: weekCompletionRate(tasks, weekStart, today),
      missedBySubject: missedBySubject(tasks, weekStart, today),
      recentMissed,
      recentCompleted,
    },
    focus: {
      streakCurrent: focusStreak.current,
      streakLongest: focusStreak.longest,
      studiedToday: focusStreak.studiedToday,
      weeklySessions: focusStreak.weeklyCompletedCount,
      weeklyMinutes: focusMinutesInRange(focusSessions, weekStart, today),
      prevWeekMinutes: focusMinutesInRange(focusSessions, prevWeekStart, prevWeekEnd),
      recentSessions: recentFocus,
    },
    weakness: {
      topWeakTopics: weakness.topics.slice(0, 5).map((t) => ({
        topic: t.topic,
        subject: t.subject,
        masteryScore: t.masteryScore,
        completedTasks: t.completedTasks,
        missedTasks: t.missedTasks,
        focusSessions: t.focusSessions,
      })),
      topicTrends: buildTopicTrends(
        tasks,
        focusSessions,
        weakTopicRows,
        weekStart,
        prevWeekStart,
        prevWeekEnd,
        today,
      ),
    },
    latestMock: latestMockRecord
      ? {
          title: latestMockRecord.title,
          overallAccuracy: latestMockRecord.analysis.overallAccuracy,
          weakTopics: latestMockRecord.analysis.weakTopics.map((t) => ({
            topic: t.topic,
            subject: t.subject,
            accuracy: t.accuracy,
          })),
          strongTopics: latestMockRecord.analysis.strongTopics.map((t) => ({
            topic: t.topic,
            subject: t.subject,
            accuracy: t.accuracy,
          })),
          submittedAt: latestMockRecord.submittedAt,
        }
      : null,
  };
}

export async function getMentorIntelligenceContextForSession(): Promise<MentorIntelligenceContext | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const profile = await getProfile();
  if (!profile) return null;

  return buildMentorIntelligenceContext(profile);
}
