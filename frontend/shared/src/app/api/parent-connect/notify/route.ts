import { NextResponse } from "next/server";
import {
  getTelegramSetupHint,
  isTelegramConfigured,
} from "@/lib/integrations/telegram";
import {
  notifyParentByKind,
  notifyStreakUpdate,
  type ParentNotificationKind,
} from "@/lib/parent-connect/notifications";
import { getSessionUserId } from "@/lib/profile/server";

const KINDS: ParentNotificationKind[] = [
  "daily_summary",
  "mock_performance",
  "missed_tasks",
  "streak",
];

function parseKind(value: unknown): ParentNotificationKind | null {
  if (typeof value !== "string") return null;
  return KINDS.includes(value as ParentNotificationKind)
    ? (value as ParentNotificationKind)
    : null;
}

export async function GET() {
  return NextResponse.json({
    configured: isTelegramConfigured(),
    hint: getTelegramSetupHint() || null,
    kinds: KINDS,
  });
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { error: "Telegram not configured", hint: getTelegramSetupHint() },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const kind = parseKind(body.kind ?? body.type);

    if (!kind) {
      return NextResponse.json(
        { error: "Invalid kind", kinds: KINDS },
        { status: 400 },
      );
    }

    const onlyMilestone = body.onlyMilestone === true;
    let result;

    if (kind === "streak") {
      result = await notifyStreakUpdate(userId, { onlyMilestone });
    } else {
      result = await notifyParentByKind(userId, kind);
    }

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, kind });
  } catch (e) {
    console.error("[api/parent-connect/notify]", e);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
