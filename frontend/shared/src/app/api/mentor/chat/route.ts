import { NextResponse } from "next/server";
import { isOpenRouterConfigured } from "@/lib/llm/openrouter";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { mentorServiceStatus, runMentorChat, runMentorChatStream } from "@/services/mentor/mentor-service";
import type { MentorChatRequest } from "@/types/mentor";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isOpenRouterConfigured()) {
      return NextResponse.json(
        { error: "Mentor AI is not configured. Set OPENROUTER_API_KEY in .env.local and run npm run setup:openrouter." },
        { status: 503 },
      );
    }

    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as MentorChatRequest;

    if (body.stream) {
      const upstream = await runMentorChatStream(profile, body);
      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text().catch(() => "");
        return NextResponse.json(
          { error: errText || "Mentor stream failed" },
          { status: upstream.status || 502 },
        );
      }
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const result = await runMentorChat(profile, body);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/mentor/chat]", e);
    const message = e instanceof Error ? e.message : "Failed to generate mentor response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(mentorServiceStatus());
}
