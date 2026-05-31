import { addDays, isoDate, lastNDays } from "@/lib/mission-control/dates";
import { computeFocusAnalytics } from "@/lib/focus/analytics";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import { getActiveFocusSession } from "@/lib/focus/server";
import { currentWeekDates, computeFocusStreak } from "@/lib/focus/streak";
import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { buildMentorIntelligenceContext } from "@/lib/mentor/context";
import { buildMentorInsights } from "@/lib/mentor/insights";
import type { MentorInsightsSnapshot } from "@/lib/mentor/insights";

export async function getMentorInsightsForSession(): Promise<MentorInsightsSnapshot | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const today = isoDate();
  const weekDates = currentWeekDates(today);
  const weekStart = weekDates[0];
  const taskStart = lastNDays(7, today)[0];

  const [context, sessions, activeSession, tasks] = await Promise.all([
    buildMentorIntelligenceContext(profile),
    getFocusSessionHistory(userId),
    getActiveFocusSession(userId),
    getTasksForDateRange(userId, taskStart, today),
  ]);

  const focusAnalytics = computeFocusAnalytics(sessions, activeSession, today);
  const focusStreak = computeFocusStreak(sessions, today);
  const todayTasks = tasks.filter((t) => t.date === today);

  return buildMentorInsights({
    context,
    focusAnalytics,
    focusStreak,
    todayTasks,
    weekTasks: tasks,
    weekDates,
    today,
    weekStart,
  });
}
