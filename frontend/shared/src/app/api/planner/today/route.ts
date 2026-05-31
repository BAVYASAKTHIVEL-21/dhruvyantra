import { NextResponse } from "next/server";
import { getDailyPlanForSession } from "@/lib/planner/server";

export async function GET() {
  try {
    const plan = await getDailyPlanForSession();
    if (!plan) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(plan);
  } catch (e) {
    console.error("[api/planner/today]", e);
    return NextResponse.json({ error: "Failed to load today's plan" }, { status: 500 });
  }
}
