import { addDays, isoDate } from "@/lib/mission-control/dates";
import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { computeWeaknessEngine } from "@/services/weakness-engine/compute-scores";
import { loadMockPerformancesForProfile } from "@/services/weakness-engine/mock-integration";
import { WEAKNESS_DEFAULT_WINDOW_DAYS } from "@/services/weakness-engine/constants";
import type { WeaknessEngineResult } from "@/types/weakness";
import type { UserProfile } from "@/lib/profile/types";

export async function buildWeaknessEngineForProfile(
  profile: UserProfile,
  windowDays: number = WEAKNESS_DEFAULT_WINDOW_DAYS,
): Promise<WeaknessEngineResult> {
  const today = isoDate();
  const start = addDays(today, -(windowDays - 1));

  const [tasks, focusSessions, mockPerformances] = await Promise.all([
    getTasksForDateRange(profile.userId, start, today),
    getFocusSessionHistory(profile.userId),
    loadMockPerformancesForProfile(profile, windowDays),
  ]);

  return computeWeaknessEngine({
    profile,
    tasks,
    focusSessions,
    mockPerformances,
    today,
    windowDays,
  });
}

export async function getWeaknessEngineForSession(): Promise<WeaknessEngineResult | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const profile = await getProfile();
  if (!profile) return null;

  return buildWeaknessEngineForProfile(profile);
}
