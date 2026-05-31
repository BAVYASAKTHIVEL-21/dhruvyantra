import { getMockSubmissions, getMockTopicPerformances } from "@/lib/mock-center/store";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import { toProfileMe } from "@/lib/profile/me-types";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { ensureTodayPlan } from "@/lib/planner/server";
import {
  buildIntelligenceSnapshot,
  intelligenceTaskWindow,
} from "@/services/intelligence/build-snapshot";
import type { IntelligenceSnapshot } from "@/types/intelligence";

export async function getIntelligenceSnapshotForSession(): Promise<IntelligenceSnapshot | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const today = isoDate();
  const { start, end } = intelligenceTaskWindow(today);

  await ensureTodayPlan(profile);

  const [tasks, focusSessions, mockPerformances, submissions] = await Promise.all([
    getTasksForDateRange(userId, start, end),
    getFocusSessionHistory(userId),
    getMockTopicPerformances(userId),
    getMockSubmissions(userId),
  ]);

  return buildIntelligenceSnapshot({
    profile: toProfileMe(profile),
    tasks,
    focusSessions,
    mockPerformances,
    submissions,
    today,
  });
}
