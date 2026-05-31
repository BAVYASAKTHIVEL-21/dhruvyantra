import { NextResponse } from "next/server";
import {
  clearActiveFocusSession,
  getActiveFocusSession,
  saveActiveFocusSession,
} from "@/lib/focus/server";
import { isGoogleCalendarConfigured } from "@/lib/integrations/google-calendar";
import {
  dispatchCalendarSync,
  scheduleFocusSessionForProfile,
} from "@/lib/planner/calendar-sync";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import type { PersistedFocusSession } from "@/types/focus";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await getActiveFocusSession(userId);
    return NextResponse.json({ session });
  } catch (e) {
    console.error("[api/focus/session GET]", e);
    return NextResponse.json({ error: "Failed to load focus session" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { session?: PersistedFocusSession | null };
    if (!body.session) {
      await clearActiveFocusSession(userId);
      return NextResponse.json({ session: null });
    }

    const session = await saveActiveFocusSession(userId, {
      ...body.session,
      updatedAt: body.session.updatedAt ?? new Date().toISOString(),
    });

    const isNewFocusBlock =
      body.session.status === "running" &&
      body.session.cycle === 1 &&
      !body.session.isBreak &&
      body.session.elapsedSeconds <= 5;

    if (isGoogleCalendarConfigured() && isNewFocusBlock) {
      const profile = await getProfile();
      if (profile) {
        dispatchCalendarSync(() => scheduleFocusSessionForProfile(profile, session));
      }
    }

    return NextResponse.json({ session });
  } catch (e) {
    console.error("[api/focus/session PUT]", e);
    return NextResponse.json({ error: "Failed to save focus session" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await clearActiveFocusSession(userId);
    return NextResponse.json({ session: null });
  } catch (e) {
    console.error("[api/focus/session DELETE]", e);
    return NextResponse.json({ error: "Failed to clear focus session" }, { status: 500 });
  }
}
