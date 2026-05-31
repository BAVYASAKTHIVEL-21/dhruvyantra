import type { FocusAnalyticsSnapshot } from "@/types/focus";
import { computeFocusAnalytics, emptyFocusAnalytics } from "@/lib/focus/analytics";
import { loadLocalFocusHistory } from "@/services/focus/focus-history-service";
import { loadLocalFocusSession } from "@/services/focus/focus-session-service";

export async function fetchFocusAnalytics(): Promise<FocusAnalyticsSnapshot> {
  const localHistory = loadLocalFocusHistory();
  const localActive = loadLocalFocusSession();

  const res = await fetch("/api/focus/analytics", { cache: "no-store" });
  if (res.status === 401) {
    return computeFocusAnalytics(localHistory, localActive);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load focus analytics");
  }
  return res.json();
}

export function computeLocalFocusAnalytics(): FocusAnalyticsSnapshot {
  try {
    return computeFocusAnalytics(loadLocalFocusHistory(), loadLocalFocusSession());
  } catch {
    return emptyFocusAnalytics();
  }
}
