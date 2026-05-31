import { NextResponse } from "next/server";
import { computeFocusAnalytics } from "@/lib/focus/analytics";
import { getFocusSessionHistory } from "@/lib/focus/history-server";
import { getActiveFocusSession } from "@/lib/focus/server";
import { getSessionUserId } from "@/lib/profile/server";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [sessions, activeSession] = await Promise.all([
      getFocusSessionHistory(userId),
      getActiveFocusSession(userId),
    ]);

    const analytics = computeFocusAnalytics(sessions, activeSession);
    return NextResponse.json(analytics);
  } catch (e) {
    console.error("[api/focus/analytics GET]", e);
    return NextResponse.json({ error: "Failed to load focus analytics" }, { status: 500 });
  }
}
