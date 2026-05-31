/** Marker stored in Notion for accounts created via Google OAuth (no password login). */
export const OAUTH_GOOGLE_MARKER = "oauth:google";

export function isOAuthGoogleAccount(passwordHash: string): boolean {
  return passwordHash === OAUTH_GOOGLE_MARKER;
}
