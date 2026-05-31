import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateGoogleUser } from "@backend/auth";
import {
  GOOGLE_STATE_COOKIE,
  exchangeGoogleCode,
  getAppOrigin,
  isGoogleOAuthConfigured,
} from "@/lib/auth/google";
import { authErrorRedirect, createSessionRedirect } from "@/lib/auth/session-response";

export async function GET(request: Request) {
  const origin = getAppOrigin(request);
  const url = new URL(request.url);

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const code = oauthError === "access_denied" ? "google_denied" : "google_failed";
    return clearStateCookie(authErrorRedirect(origin, code));
  }

  if (!isGoogleOAuthConfigured()) {
    return clearStateCookie(authErrorRedirect(origin, "google_not_configured"));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const savedState = jar.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return clearStateCookie(authErrorRedirect(origin, "google_state_mismatch"));
  }

  try {
    const { email } = await exchangeGoogleCode(code, origin);
    const auth = await authenticateGoogleUser(email);

    if (!auth.ok) {
      const errCode =
        auth.error.code === "NOT_CONFIGURED"
          ? "notion_not_configured"
          : auth.error.code === "NOTION_ACCESS"
            ? "notion_not_accessible"
            : "google_failed";
      return clearStateCookie(authErrorRedirect(origin, errCode));
    }

    const response = await createSessionRedirect(auth.user.userId, auth.user.email, origin);
    return clearStateCookie(response);
  } catch (e) {
    console.error("[auth/google/callback]", e);
    return clearStateCookie(authErrorRedirect(origin, "google_failed"));
  }
}

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(GOOGLE_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
