import type { CompletedFocusSession } from "@/types/focus";

export const FOCUS_HISTORY_COOKIE = "dhruv_focus_history";

export type FocusHistoryStore = {
  userId: string;
  sessions: CompletedFocusSession[];
};

export function encodeFocusHistoryStore(store: FocusHistoryStore): string {
  return Buffer.from(JSON.stringify(store)).toString("base64url");
}

export function decodeFocusHistoryStore(value: string): FocusHistoryStore | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as FocusHistoryStore;
  } catch {
    return null;
  }
}
