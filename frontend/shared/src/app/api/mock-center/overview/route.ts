import { NextResponse } from "next/server";
import { getTasksForDateRange, mergeTasksIntoCookieStore } from "@/lib/mission-control/task-history";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import { toProfileMe } from "@/lib/profile/me-types";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { getMockSubmissions } from "@/lib/mock-center/store";
import { buildMockCenterOverview } from "@/services/mock-center/mock-overview";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const today = isoDate();
    const start = addDays(today, -89);

    const [tasks, submissions] = await Promise.all([
      getTasksForDateRange(userId, start, today),
      getMockSubmissions(userId),
    ]);
    await mergeTasksIntoCookieStore(userId, tasks);

    const overview = buildMockCenterOverview(toProfileMe(profile), tasks, submissions, today);
    return NextResponse.json(overview);
  } catch (e) {
    console.error("[api/mock-center/overview]", e);
    return NextResponse.json({ error: "Failed to load mock center" }, { status: 500 });
  }
}
