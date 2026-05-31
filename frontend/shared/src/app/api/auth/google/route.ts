import { NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  buildGoogleAuthUrl,
  createOAuthState,
  getAppOrigin,
  isGoogleOAuthConfigured,
} from "@/lib/auth/google";
import { authErrorRedirect } from "@/lib/auth/session-response";

export async function GET(request: Request) {
  const origin = getAppOrigin(request);

  if (!isGoogleOAuthConfigured()) {
    return authErrorRedirect(origin, "google_not_configured");
  }

  const state = createOAuthState();
  const response = NextResponse.redirect(buildGoogleAuthUrl(origin, state));
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
