import { NextResponse } from "next/server";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import { computeFocusStreak } from "@/lib/focus/streak";
import { getSessionUserId } from "@/lib/profile/server";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await getFocusSessionHistory(userId);
    const streak = computeFocusStreak(sessions);
    return NextResponse.json(streak);
  } catch (e) {
    console.error("[api/focus/streak GET]", e);
    return NextResponse.json({ error: "Failed to load focus streak" }, { status: 500 });
  }
}
