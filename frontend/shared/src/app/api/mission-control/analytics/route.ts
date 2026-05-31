import { NextResponse } from "next/server";
import { getMissionControlAnalyticsForSession } from "@/lib/mission-control/server";

export async function GET() {
  try {
    const analytics = await getMissionControlAnalyticsForSession();
    if (!analytics) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(analytics);
  } catch (e) {
    console.error("[api/mission-control/analytics]", e);
    return NextResponse.json({ error: "Failed to load mission analytics" }, { status: 500 });
  }
}
