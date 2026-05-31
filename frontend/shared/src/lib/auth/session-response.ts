import { NextResponse } from "next/server";
import { AUTH_COOKIE, PROFILE_COOKIE, encodeProfile } from "@/lib/profile/cookies";
import { clearProfileCache, resolveProfileForUser } from "@/lib/profile/server";

function setSessionCookies(
  response: NextResponse,
  userId: string,
  email: string,
  profile: Awaited<ReturnType<typeof resolveProfileForUser>>,
): void {
  response.cookies.set(AUTH_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set(
    PROFILE_COOKIE,
    encodeProfile({ ...profile, email: profile.email ?? email }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    },
  );
}

/** Sets auth cookies and redirects after a successful sign-in. */
export async function createSessionRedirect(
  userId: string,
  email: string,
  baseUrl: string,
): Promise<NextResponse> {
  clearProfileCache(userId);
  const profile = await resolveProfileForUser(userId, email);
  const path = profile.onboardingCompleted ? "/dashboard" : "/onboarding";
  const response = NextResponse.redirect(new URL(path, baseUrl));
  setSessionCookies(response, userId, email, profile);
  return response;
}

export function authErrorRedirect(baseUrl: string, code: string): NextResponse {
  const url = new URL("/", baseUrl);
  url.searchParams.set("auth_error", code);
  return NextResponse.redirect(url);
}

export { setSessionCookies };
