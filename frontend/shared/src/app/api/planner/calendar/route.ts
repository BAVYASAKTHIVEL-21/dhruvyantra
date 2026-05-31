import { NextResponse } from "next/server";
import {
  getGoogleCalendarSetupHint,
  isGoogleCalendarConfigured,
} from "@/lib/integrations/google-calendar";
import { syncPlannerTasksForProfile } from "@/lib/planner/calendar-sync";
import { getDailyPlanForSession } from "@/lib/planner/server";
import { getProfile, getSessionUserId } from "@/lib/profile/server";

export async function GET() {
  return NextResponse.json({
    configured: isGoogleCalendarConfigured(),
    hint: getGoogleCalendarSetupHint() || null,
  });
}

export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: "Calendar not configured", hint: getGoogleCalendarSetupHint() },
        { status: 503 },
      );
    }

    const profile = await getProfile();
    const plan = await getDailyPlanForSession();
    if (!profile || !plan) {
      return NextResponse.json({ error: "No planner data" }, { status: 400 });
    }

    const results = await syncPlannerTasksForProfile(profile, plan.tasks);
    const synced = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);

    return NextResponse.json({
      ok: failed.length === 0,
      synced,
      total: plan.tasks.length,
      errors: failed.map((r) => r.error).filter(Boolean),
    });
  } catch (e) {
    console.error("[api/planner/calendar]", e);
    return NextResponse.json({ error: "Failed to sync calendar" }, { status: 500 });
  }
}
