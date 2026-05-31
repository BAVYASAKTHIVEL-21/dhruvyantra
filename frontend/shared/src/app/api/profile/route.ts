import { NextResponse } from "next/server";
import { getProfile, getSessionUserId, saveProfile } from "@/lib/profile/server";
import type { UserProfile } from "@/lib/profile/types";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getProfile();
  const body = await request.json().catch(() => ({}));

  const merged: UserProfile = {
    userId,
    email: typeof body.email === "string" ? body.email : existing?.email,
    examType: body.examType ?? existing?.examType ?? null,
    targetYear: body.targetYear ?? existing?.targetYear ?? null,
    weakSubjects: Array.isArray(body.weakSubjects)
      ? body.weakSubjects
      : (existing?.weakSubjects ?? []),
    weakTopics: Array.isArray(body.weakTopics)
      ? body.weakTopics
      : (existing?.weakTopics ?? []),
    dailyStudyHours:
      typeof body.dailyStudyHours === "number"
        ? body.dailyStudyHours
        : (existing?.dailyStudyHours ?? 6),
    productiveTime: body.productiveTime ?? existing?.productiveTime ?? null,
    parentContact: body.parentContact !== undefined
      ? body.parentContact
      : (existing?.parentContact ?? null),
    onboardingCompleted:
      typeof body.onboardingCompleted === "boolean"
        ? body.onboardingCompleted
        : (existing?.onboardingCompleted ?? false),
  };

  const saved = await saveProfile(merged);

  if (merged.onboardingCompleted && !existing?.onboardingCompleted) {
    const { triggerPlanAfterOnboarding } = await import("@/lib/planner/server");
    await triggerPlanAfterOnboarding(saved);
  }

  return NextResponse.json(saved);
}
