import { NextResponse } from "next/server";
import { getParentConnectOverviewForSession } from "@/lib/parent-connect/overview";

export async function GET() {
  try {
    const overview = await getParentConnectOverviewForSession();
    if (!overview) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(overview);
  } catch (e) {
    console.error("[api/parent-connect/overview]", e);
    return NextResponse.json({ error: "Failed to load parent overview" }, { status: 500 });
  }
}
