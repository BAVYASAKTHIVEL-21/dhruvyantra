import { NextResponse } from "next/server";
import { authenticateUser } from "@backend/auth";
import { setSessionCookies } from "@/lib/auth/session-response";
import { AUTH_COOKIE, PROFILE_COOKIE } from "@/lib/profile/cookies";
import { clearProfileCache, resolveProfileForUser } from "@/lib/profile/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const auth = await authenticateUser(email, password);
  if (!auth.ok) {
    const status =
      auth.error.code === "VALIDATION"
        ? 400
        : auth.error.code === "INVALID_CREDENTIALS"
          ? 401
          : auth.error.code === "NOT_CONFIGURED" || auth.error.code === "NOTION_ACCESS"
            ? 503
            : 500;
    return NextResponse.json(
      { error: auth.error.message, errors: auth.error.errors, code: auth.error.code },
      { status },
    );
  }

  const { userId, email: normalizedEmail } = auth.user;
  clearProfileCache(userId);
  const profile = await resolveProfileForUser(userId, normalizedEmail);
  const redirect = profile.onboardingCompleted ? "/dashboard" : "/onboarding";

  const response = NextResponse.json({ redirect, userId });
  setSessionCookies(response, userId, normalizedEmail, profile);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  const clear = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(AUTH_COOKIE, "", clear);
  response.cookies.set(PROFILE_COOKIE, "", clear);
  return response;
}
