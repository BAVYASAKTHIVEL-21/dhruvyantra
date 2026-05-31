import { NextResponse } from "next/server";
import { registerUser } from "@backend/auth";
import { AUTH_COOKIE, PROFILE_COOKIE, encodeProfile } from "@/lib/profile/cookies";
import { DEFAULT_PROFILE } from "@/lib/profile/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = await registerUser(email, password);
  if (!result.ok) {
    const status =
      result.error.code === "VALIDATION"
        ? 400
        : result.error.code === "USER_EXISTS"
          ? 409
          : result.error.code === "NOT_CONFIGURED" || result.error.code === "NOTION_ACCESS"
            ? 503
            : 500;
    return NextResponse.json(
      { error: result.error.message, errors: result.error.errors, code: result.error.code },
      { status },
    );
  }

  const { userId, email: normalizedEmail } = result.user;
  const draft = {
    ...DEFAULT_PROFILE,
    userId,
    email: normalizedEmail,
    onboardingCompleted: false,
  };

  const response = NextResponse.json({ userId, redirect: "/onboarding" });
  response.cookies.set(AUTH_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(PROFILE_COOKIE, encodeProfile({ ...draft, email: normalizedEmail }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
