import { NextResponse } from "next/server";
import { getMockSubmissions, getMockTopicPerformances } from "@/lib/mock-center/store";
import { getSessionUserId } from "@/lib/profile/server";
import { buildMockCenterAnalytics } from "@/services/intelligence/mock-analytics";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [submissions, performances] = await Promise.all([
      getMockSubmissions(userId),
      getMockTopicPerformances(userId),
    ]);

    const analytics = buildMockCenterAnalytics(submissions, performances);
    return NextResponse.json(analytics);
  } catch (e) {
    console.error("[api/mock-center/analytics]", e);
    return NextResponse.json(
      { error: "Failed to load mock analytics" },
      { status: 500 },
    );
  }
}
