import { NextResponse } from "next/server";
import { getWeaknessEngineForSession } from "@/lib/weakness/server";

export async function GET() {
  try {
    const result = await getWeaknessEngineForSession();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/weakness/topics]", e);
    return NextResponse.json({ error: "Failed to load weakness topics" }, { status: 500 });
  }
}
