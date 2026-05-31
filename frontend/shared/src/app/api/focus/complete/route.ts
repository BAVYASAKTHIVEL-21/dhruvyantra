import { NextResponse } from "next/server";
import { clearActiveFocusSession } from "@/lib/focus/server";
import { appendFocusSessionCompletion } from "@/lib/focus/history-server";
import { computeFocusStreak } from "@/lib/focus/streak";
import { dispatchParentNotification } from "@/lib/parent-connect/dispatch";
import {
  isStreakMilestone,
  notifyStreakUpdate,
} from "@/lib/parent-connect/notifications";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { computeStreak } from "@/services/streaks/streak-service";
import { getTasksForDateRange } from "@/lib/mission-control/task-history";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import { recordFocusSessionForWeakness } from "@/services/weakness-engine/focus-integration";
import type { CompletedFocusSession } from "@/types/focus";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CompletedFocusSession;
    if (!body?.id || !body?.date || !body?.completedAt) {
      return NextResponse.json({ error: "Invalid completion payload" }, { status: 400 });
    }

    const sessions = await appendFocusSessionCompletion(userId, body);
    await clearActiveFocusSession(userId);

    const profile = await getProfile();
    const weaknessRecord = profile
      ? recordFocusSessionForWeakness(profile, body)
      : { topic: null, subject: body.subject, counted: false };

    const streak = computeFocusStreak(sessions);

    const today = isoDate();
    const plannerStreak = computeStreak(
      await getTasksForDateRange(userId, addDays(today, -89), today),
      today,
    );
    if (isStreakMilestone(plannerStreak.current)) {
      dispatchParentNotification(() =>
        notifyStreakUpdate(userId, { onlyMilestone: true }),
      );
    }

    return NextResponse.json({ session: body, streak, weakness: weaknessRecord });
  } catch (e) {
    console.error("[api/focus/complete POST]", e);
    return NextResponse.json({ error: "Failed to record focus completion" }, { status: 500 });
  }
}
