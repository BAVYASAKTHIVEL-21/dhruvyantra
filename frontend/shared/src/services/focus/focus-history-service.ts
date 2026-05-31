import type { CompletedFocusSession, FocusStreakSnapshot } from "@/types/focus";
import { computeFocusStreak } from "@/lib/focus/streak";
import { isoDate } from "@/lib/mission-control/dates";

export const FOCUS_HISTORY_LOCAL_KEY = "dhruv_focus_history";

export function loadLocalFocusHistory(): CompletedFocusSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOCUS_HISTORY_LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompletedFocusSession[];
  } catch {
    return [];
  }
}

export function saveLocalFocusHistory(sessions: CompletedFocusSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOCUS_HISTORY_LOCAL_KEY, JSON.stringify(sessions));
}

export function appendLocalFocusCompletion(session: CompletedFocusSession): CompletedFocusSession[] {
  const existing = loadLocalFocusHistory();
  if (existing.some((s) => s.id === session.id)) return existing;
  const next = [session, ...existing];
  saveLocalFocusHistory(next);
  return next;
}

export function mergeFocusHistory(
  local: CompletedFocusSession[],
  remote: CompletedFocusSession[],
): CompletedFocusSession[] {
  const byId = new Map<string, CompletedFocusSession>();
  for (const s of remote) byId.set(s.id, s);
  for (const s of local) byId.set(s.id, s);
  return [...byId.values()].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function fetchFocusStreak(): Promise<FocusStreakSnapshot> {
  const res = await fetch("/api/focus/streak", { cache: "no-store" });
  if (res.status === 401) {
    return computeFocusStreak(loadLocalFocusHistory());
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load focus streak");
  }
  return res.json();
}

export async function recordFocusCompletion(
  session: Omit<CompletedFocusSession, "date"> & { date?: string },
): Promise<FocusStreakSnapshot> {
  const entry: CompletedFocusSession = {
    ...session,
    date: session.date ?? isoDate(new Date(session.completedAt)),
  };

  appendLocalFocusCompletion(entry);

  const res = await fetch("/api/focus/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (res.status === 401) {
    return computeFocusStreak(loadLocalFocusHistory());
  }

  if (!res.ok) {
    return computeFocusStreak(loadLocalFocusHistory());
  }

  const data = (await res.json()) as { streak: FocusStreakSnapshot };
  return data.streak;
}

/** Notify listeners that streak data may have changed. */
export const FOCUS_STREAK_REFRESH_EVENT = "dhruv:focus-streak-refresh";

export function notifyFocusStreakRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FOCUS_STREAK_REFRESH_EVENT));
}
