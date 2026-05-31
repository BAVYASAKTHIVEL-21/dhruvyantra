import { buildMissionControlAnalytics } from "@/services/analytics/mission-analytics";
import { toProfileMe } from "@/lib/profile/me-types";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { getMockSubmissions, getMockTopicPerformances } from "@/lib/mock-center/store";
import { addDays } from "@/lib/mission-control/dates";
import { todayPlanDate } from "@/lib/planner/planner-dates";
import { studentIdCandidates } from "@/lib/planner/today-helpers";
import type { MissionControlAnalytics } from "@/types/mission-control";

/** Aggregates planner, focus, and mock data for Mission Control. */
export async function getMissionControlAnalyticsForSession(): Promise<MissionControlAnalytics | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const today = todayPlanDate();
  const start = addDays(today, -89);
  const studentIds = studentIdCandidates(profile);

  const [tasks, focusSessions, mockPerformances, mockSubmissions] = await Promise.all([
    getTasksForDateRange(userId, start, today, { alternateStudentIds: studentIds }),
    getFocusSessionHistory(userId),
    getMockTopicPerformances(userId),
    getMockSubmissions(userId),
  ]);

  return buildMissionControlAnalytics(
    toProfileMe(profile),
    tasks,
    focusSessions,
    mockPerformances,
    mockSubmissions,
  );
}
