import { NextResponse } from "next/server";
import { toProfileMe } from "@/lib/profile/me-types";
import { getProfile, getSessionUserId } from "@/lib/profile/server";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(toProfileMe(profile));
  } catch (e) {
    console.error("[api/profile/me]", e);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}
