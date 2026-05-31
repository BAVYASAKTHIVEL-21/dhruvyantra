import { NextResponse } from "next/server";
import { getIntelligenceSnapshotForSession } from "@/lib/intelligence/server";

export async function GET() {
  try {
    const snapshot = await getIntelligenceSnapshotForSession();
    if (!snapshot) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("[api/intelligence/snapshot]", e);
    return NextResponse.json(
      { error: "Failed to load intelligence snapshot" },
      { status: 500 },
    );
  }
}
