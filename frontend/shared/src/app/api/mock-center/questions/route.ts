import { NextResponse } from "next/server";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { buildMockSessionQuestions } from "@/services/mock-center/mock-questions";
import type { MockType } from "@/types/mock-results";

function parseMockType(value: string | null): MockType {
  if (value === "full" || value === "chapter" || value === "pyq") return value;
  return "full";
}

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile();
    if (!profile?.examType) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const mockType = parseMockType(searchParams.get("type"));
    const questions = buildMockSessionQuestions(profile, mockType);

    return NextResponse.json({ questions, mockType, examType: profile.examType });
  } catch (e) {
    console.error("[api/mock-center/questions]", e);
    return NextResponse.json({ error: "Failed to load mock questions" }, { status: 500 });
  }
}
