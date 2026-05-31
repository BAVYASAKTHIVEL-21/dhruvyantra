import { NextResponse } from "next/server";
import { getLatestMockSubmission } from "@/lib/mock-center/store";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { processMockSubmission } from "@/services/mock-center/process-submission";
import type { MockSubmissionPayload, MockType } from "@/types/mock-results";

function parseMockType(value: unknown): MockType {
  if (value === "full" || value === "chapter" || value === "pyq") return value;
  return "chapter";
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile();
    if (!profile?.examType) {
      return NextResponse.json({ error: "Complete onboarding before submitting mocks" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const payload: MockSubmissionPayload = {
      mockId: typeof body.mockId === "string" ? body.mockId : undefined,
      plannerTaskId: typeof body.plannerTaskId === "string" ? body.plannerTaskId : undefined,
      mockType: parseMockType(body.mockType),
      title: typeof body.title === "string" ? body.title : `${profile.examType} Mock`,
      examType: profile.examType,
      questions: Array.isArray(body.questions) ? body.questions : [],
      durationMinutes: typeof body.durationMinutes === "number" ? body.durationMinutes : undefined,
      useSeeded: body.useSeeded !== false && (!Array.isArray(body.questions) || body.questions.length === 0),
    };

    const result = await processMockSubmission(profile, payload);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/mock-center/submit]", e);
    return NextResponse.json({ error: "Failed to process mock submission" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const latest = await getLatestMockSubmission(userId);
    if (!latest) {
      return NextResponse.json({ submission: null });
    }
    return NextResponse.json({
      submission: latest,
      recoveryTasks: latest.recoveryTaskIds.map((id) => ({ id })),
    });
  } catch (e) {
    console.error("[api/mock-center/submit GET]", e);
    return NextResponse.json({ error: "Failed to load latest mock" }, { status: 500 });
  }
}
