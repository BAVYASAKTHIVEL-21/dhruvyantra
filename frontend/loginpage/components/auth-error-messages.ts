export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local.",
  google_denied: "Google sign-in was cancelled.",
  google_state_mismatch: "Sign-in expired. Please try again.",
  google_failed: "Google sign-in failed. Please try again.",
  notion_not_configured:
    "User database is not configured. Set NOTION_API_KEY and NOTION_USERS_DATABASE_ID in .env.local.",
  NOTION_ACCESS:
    "Notion users database not found. In Notion, open your Users database → ⋯ → Connections → add DhruvYantra.",
  notion_not_accessible:
    "Notion users database not found. In Notion, open your Users database → ⋯ → Connections → add DhruvYantra.",
  NOT_CONFIGURED:
    "User database is not configured. Set NOTION_API_KEY and NOTION_USERS_DATABASE_ID in .env.local.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_EXISTS: "An account with this email already exists. Sign in instead.",
  SERVER:
    "Sign-in failed on the server. Restart the dev server and check your .env.local.",
};

export function messageForAuthError(code: string | null): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.";
}
