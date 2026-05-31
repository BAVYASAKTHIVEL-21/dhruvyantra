import type { PersistedFocusSession } from "@/types/focus";

export const FOCUS_LOCAL_STORAGE_KEY = "dhruv_focus_active_session";

export function loadLocalFocusSession(): PersistedFocusSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FOCUS_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedFocusSession;
  } catch {
    return null;
  }
}

export function saveLocalFocusSession(session: PersistedFocusSession | null): void {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem(FOCUS_LOCAL_STORAGE_KEY);
    return;
  }
  localStorage.setItem(FOCUS_LOCAL_STORAGE_KEY, JSON.stringify(session));
}

export function clearLocalFocusSession(): void {
  saveLocalFocusSession(null);
}

export async function fetchFocusSessionFromApi(): Promise<PersistedFocusSession | null> {
  const res = await fetch("/api/focus/session", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load focus session");
  }
  const data = (await res.json()) as { session: PersistedFocusSession | null };
  return data.session;
}

export async function syncFocusSessionToApi(
  session: PersistedFocusSession | null,
): Promise<PersistedFocusSession | null> {
  if (!session) {
    const res = await fetch("/api/focus/session", { method: "DELETE" });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error("Failed to clear focus session");
    return null;
  }

  const res = await fetch("/api/focus/session", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
  });
  if (res.status === 401) return session;
  if (!res.ok) throw new Error("Failed to sync focus session");
  const data = (await res.json()) as { session: PersistedFocusSession | null };
  return data.session;
}

export function pickNewerSession(
  local: PersistedFocusSession | null,
  remote: PersistedFocusSession | null,
): PersistedFocusSession | null {
  if (!local) return remote;
  if (!remote) return local;
  return new Date(remote.updatedAt).getTime() >= new Date(local.updatedAt).getTime()
    ? remote
    : local;
}

/** Subtract elapsed wall time when session was running before refresh. */
export function applyRunningElapsed(session: PersistedFocusSession): PersistedFocusSession {
  if (session.status !== "running") return session;

  const elapsed = Math.floor(
    (Date.now() - new Date(session.updatedAt).getTime()) / 1000,
  );
  if (elapsed <= 0) return session;

  const secondsRemaining = Math.max(0, session.secondsRemaining - elapsed);
  const elapsedSeconds = session.elapsedSeconds + Math.min(elapsed, session.secondsRemaining);

  return {
    ...session,
    secondsRemaining,
    elapsedSeconds,
    updatedAt: new Date().toISOString(),
    status: secondsRemaining === 0 ? "paused" : session.status,
  };
}

export function sessionsMatchTopic(
  session: PersistedFocusSession,
  topic: string,
  subject: string,
): boolean {
  return session.topic === topic && session.subject === subject;
}
