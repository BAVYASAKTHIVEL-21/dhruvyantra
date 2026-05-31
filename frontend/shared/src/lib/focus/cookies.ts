import type { PersistedFocusSession } from "@/types/focus";

export const FOCUS_SESSION_COOKIE = "dhruv_focus_session";

export type FocusCookieStore = {
  userId: string;
  session: PersistedFocusSession | null;
};

export function encodeFocusStore(store: FocusCookieStore): string {
  return Buffer.from(JSON.stringify(store)).toString("base64url");
}

export function decodeFocusStore(value: string): FocusCookieStore | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as FocusCookieStore;
  } catch {
    return null;
  }
}
