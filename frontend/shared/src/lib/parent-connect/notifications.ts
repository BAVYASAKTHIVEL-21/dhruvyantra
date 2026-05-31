import {
  getTelegramSetupHint,
  isTelegramConfigured,
  sendParentUpdateViaAgent,
  type TelegramSendResult,
} from "@/lib/integrations/telegram";
import type { UserProfile } from "@/lib/profile/types";
import { displayNameFromProfile } from "@/lib/profile/me-types";
import type { MockSubmissionRecord } from "@/types/mock-results";
import type { StudyTask } from "@/types/planner";
import type { StreakSnapshot } from "@/types/mission-control";
import {
  buildParentConnectContext,
  dailyBars,
  missedYesterdayTasks,
  todayTasks,
  weeklySnapshot,
  type ParentConnectContext,
} from "./context";

export type ParentNotificationKind =
  | "daily_summary"
  | "mock_performance"
  | "missed_tasks"
  | "streak";

const STREAK_MILESTONES = new Set([3, 7, 14, 21, 30, 60, 90]);

function studentName(profile: Pick<UserProfile, "email" | "userId">): string {
  return displayNameFromProfile(profile);
}

function examLabel(profile: UserProfile): string {
  if (profile.examType && profile.targetYear) {
    return `${profile.examType} ${profile.targetYear}`;
  }
  return profile.examType ?? "Exam prep";
}

export function formatDailyStudySummary(ctx: ParentConnectContext): string {
  const { profile, streak, today } = ctx;
  const todayList = todayTasks(ctx);
  const done = todayList.filter((t) => t.status === "Completed");
  const pending = todayList.filter((t) => t.status !== "Completed");
  const weekly = weeklySnapshot(ctx);
  const bars = dailyBars(ctx);
  const todayBar = bars.find((b) => b.date === today);

  const lines = [
    `📚 Daily study summary — ${studentName(profile)}`,
    `Target: ${examLabel(profile)}`,
    "",
    `Today: ${done.length}/${todayList.length} tasks completed`,
  ];

  if (todayBar && todayBar.studyMinutes > 0) {
    const h = Math.floor(todayBar.studyMinutes / 60);
    const m = todayBar.studyMinutes % 60;
    lines.push(`Study time today: ${h > 0 ? `${h}h ` : ""}${m}m`);
  }

  lines.push(
    `This week: ${weekly.studyHours}h · ${weekly.progressPercent}% tasks done (${weekly.changeLabel})`,
    `Streak: ${streak.current} day${streak.current === 1 ? "" : "s"} 🔥`,
  );

  if (pending.length > 0) {
    lines.push("", "Still pending today:");
    for (const t of pending.slice(0, 4)) {
      lines.push(`• ${t.title} (${t.subject})`);
    }
    if (pending.length > 4) lines.push(`• +${pending.length - 4} more`);
  }

  return lines.join("\n");
}

export function formatMockPerformance(
  record: MockSubmissionRecord,
  profile: UserProfile,
): string {
  const { analysis, title, mockType } = record;
  const weak = analysis.weakTopics.slice(0, 3).map((t) => t.topic);
  const strong = analysis.strongTopics.slice(0, 2).map((t) => t.topic);

  const lines = [
    `📝 Mock test — ${studentName(profile)}`,
    `${title} (${mockType})`,
    `Score: ${analysis.overallAccuracy}% overall`,
  ];

  if (strong.length > 0) lines.push(`Strong: ${strong.join(", ")}`);
  if (weak.length > 0) {
    lines.push(`Needs work: ${weak.join(", ")}`);
    if (analysis.weakTopics.length > 3) {
      lines.push(`+${analysis.weakTopics.length - 3} more weak topics`);
    }
  }

  lines.push("", "Recovery tasks were added to today's planner.");
  return lines.join("\n");
}

export function formatMissedTaskAlert(
  missed: StudyTask[],
  profile: UserProfile,
): string | null {
  if (missed.length === 0) return null;

  const lines = [
    `⚠️ Missed tasks — ${studentName(profile)}`,
    `${missed.length} task(s) from yesterday are still incomplete:`,
    "",
  ];

  for (const t of missed.slice(0, 6)) {
    lines.push(`• ${t.title} (${t.subject})`);
  }
  if (missed.length > 6) lines.push(`• +${missed.length - 6} more`);

  return lines.join("\n");
}

export function formatStreakUpdate(
  streak: StreakSnapshot,
  profile: UserProfile,
  options?: { milestone?: boolean },
): string {
  const headline = options?.milestone
    ? `🎉 Streak milestone — ${studentName(profile)}`
    : `🔥 Streak update — ${studentName(profile)}`;

  const status = streak.studiedToday
    ? "Studied today — streak active."
    : "No completed tasks yet today.";

  return [
    headline,
    `Current streak: ${streak.current} day${streak.current === 1 ? "" : "s"}`,
    `Longest: ${streak.longest} days`,
    status,
    streak.missedDays > 0
      ? `Missed ${streak.missedDays} of the last 7 days — encourage a catch-up block.`
      : "Great consistency this week!",
  ].join("\n");
}

export function isStreakMilestone(days: number): boolean {
  return STREAK_MILESTONES.has(days);
}

async function deliver(text: string): Promise<TelegramSendResult> {
  if (!isTelegramConfigured()) {
    return { ok: false, error: getTelegramSetupHint() || "Telegram not configured" };
  }
  return sendParentUpdateViaAgent(text);
}

export async function notifyDailyStudySummary(
  userId: string,
): Promise<TelegramSendResult> {
  const ctx = await buildParentConnectContext(userId);
  if (!ctx) return { ok: false, error: "No profile" };
  return deliver(formatDailyStudySummary(ctx));
}

export async function notifyMockPerformance(
  userId: string,
  record: MockSubmissionRecord,
  profile?: UserProfile,
): Promise<TelegramSendResult> {
  const resolved = profile ?? (await buildParentConnectContext(userId))?.profile;
  if (!resolved) return { ok: false, error: "No profile" };
  return deliver(formatMockPerformance(record, resolved));
}

export async function notifyMissedTaskAlerts(
  userId: string,
): Promise<TelegramSendResult> {
  const ctx = await buildParentConnectContext(userId);
  if (!ctx) return { ok: false, error: "No profile" };
  const text = formatMissedTaskAlert(missedYesterdayTasks(ctx), ctx.profile);
  if (!text) return { ok: true };
  return deliver(text);
}

export async function notifyStreakUpdate(
  userId: string,
  options?: { onlyMilestone?: boolean },
): Promise<TelegramSendResult> {
  const ctx = await buildParentConnectContext(userId);
  if (!ctx) return { ok: false, error: "No profile" };

  const milestone = isStreakMilestone(ctx.streak.current);
  if (options?.onlyMilestone && !milestone) return { ok: true };

  return deliver(
    formatStreakUpdate(ctx.streak, ctx.profile, { milestone }),
  );
}

export async function notifyParentByKind(
  userId: string,
  kind: ParentNotificationKind,
): Promise<TelegramSendResult> {
  switch (kind) {
    case "daily_summary":
      return notifyDailyStudySummary(userId);
    case "missed_tasks":
      return notifyMissedTaskAlerts(userId);
    case "streak":
      return notifyStreakUpdate(userId);
    case "mock_performance": {
      const ctx = await buildParentConnectContext(userId);
      if (!ctx?.latestMock) {
        return { ok: false, error: "No mock submission yet" };
      }
      return notifyMockPerformance(userId, ctx.latestMock, ctx.profile);
    }
    default:
      return { ok: false, error: "Unknown notification kind" };
  }
}
