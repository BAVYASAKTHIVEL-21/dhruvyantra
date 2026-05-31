import { addDays, isoDate } from "@/lib/mission-control/dates";
import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { studentIdCandidates } from "@/lib/planner/today-helpers";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import type { UserProfile } from "@/lib/profile/types";
import {
  applyEvolvedWeakTopics,
  computeWeaknessEngine,
} from "./compute-scores";
import { loadMockPerformancesForProfile } from "./mock-integration";
import { WEAKNESS_DEFAULT_WINDOW_DAYS } from "./constants";

/** Merge evolved weak-topic ranking into a profile before planner generation. */
export async function enrichProfileForPlanner(profile: UserProfile): Promise<UserProfile> {
  const today = isoDate();
  const start = addDays(today, -(WEAKNESS_DEFAULT_WINDOW_DAYS - 1));

  const [tasks, focusSessions, mockPerformances] = await Promise.all([
    getTasksForDateRange(profile.userId, start, today, {
      alternateStudentIds: studentIdCandidates(profile),
    }),
    getFocusSessionHistory(profile.userId),
    loadMockPerformancesForProfile(profile),
  ]);

  const result = computeWeaknessEngine({
    profile,
    tasks,
    focusSessions,
    mockPerformances,
    today,
  });

  return applyEvolvedWeakTopics(profile, result);
}
