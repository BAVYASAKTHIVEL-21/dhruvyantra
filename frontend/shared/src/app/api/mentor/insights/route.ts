import { NextResponse } from "next/server";
import { getMentorInsightsForSession } from "@/lib/mentor/server-insights";
import { emptyMentorInsights } from "@/lib/mentor/insights";

export async function GET() {
  try {
    const insights = await getMentorInsightsForSession();
    if (!insights) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(insights);
  } catch (e) {
    console.error("[api/mentor/insights]", e);
    return NextResponse.json(
      { error: "Failed to load mentor insights" },
      { status: 500 },
    );
  }
}
