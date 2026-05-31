import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import { getLatestMockSubmission } from "@/lib/mock-center/store";
import { toProfileMe, type ProfileMe } from "@/lib/profile/me-types";
import { getProfile } from "@/lib/profile/server";
import { ensureTodayPlan } from "@/lib/planner/server";
import {
  computeDailyBars,
  computeWeeklyProgress,
} from "@/services/analytics/mission-analytics";
import { computeStreak } from "@/services/streaks/streak-service";
import type { MockSubmissionRecord } from "@/types/mock-results";
import type { StudyTask } from "@/types/planner";
import type { StreakSnapshot } from "@/types/mission-control";

export type ParentConnectContext = {
  profile: ProfileMe;
  tasks: StudyTask[];
  streak: StreakSnapshot;
  latestMock: MockSubmissionRecord | null;
  today: string;
};

export async function buildParentConnectContext(
  userId: string,
): Promise<ParentConnectContext | null> {
  const profile = await getProfile();
  if (!profile || profile.userId !== userId) return null;

  const today = isoDate();
  const start = addDays(today, -89);

  await ensureTodayPlan(profile);
  const tasks = await getTasksForDateRange(userId, start, today);
  const me = toProfileMe(profile);
  const streak = computeStreak(tasks, today);
  const latestMock = await getLatestMockSubmission(userId);

  return {
    profile: me,
    tasks,
    streak,
    latestMock,
    today,
  };
}

export function todayTasks(ctx: ParentConnectContext): StudyTask[] {
  return ctx.tasks.filter((t) => t.date === ctx.today);
}

export function missedYesterdayTasks(ctx: ParentConnectContext): StudyTask[] {
  const yesterday = addDays(ctx.today, -1);
  return ctx.tasks.filter((t) => t.date === yesterday && t.status !== "Completed");
}

export function weeklySnapshot(ctx: ParentConnectContext) {
  return computeWeeklyProgress(ctx.profile, ctx.tasks);
}

export function dailyBars(ctx: ParentConnectContext) {
  return computeDailyBars(ctx.tasks);
}
