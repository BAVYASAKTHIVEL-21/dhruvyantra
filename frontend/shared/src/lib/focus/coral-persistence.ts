import {
  appendFocusCompletion,
  isDhruvyantraStoreReady,
  readFocusActiveSession,
  readFocusCompletions,
  writeFocusActiveSession,
} from "@/lib/coral/dhruvyantra-store";
import { isCoralEnabled } from "@/lib/coral/config";
import type { CompletedFocusSession, PersistedFocusSession } from "@/types/focus";

export async function shouldUseFocusCoral(): Promise<boolean> {
  return isCoralEnabled() && (await isDhruvyantraStoreReady());
}

export async function loadActiveFocusSessionFromCoral(
  userId: string,
): Promise<PersistedFocusSession | null> {
  const raw = await readFocusActiveSession(userId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedFocusSession;
  } catch {
    return null;
  }
}

export async function saveActiveFocusSessionToCoral(
  userId: string,
  session: PersistedFocusSession | null,
): Promise<void> {
  await writeFocusActiveSession(
    userId,
    session ? JSON.stringify(session) : null,
  );
}

export async function loadFocusCompletionsFromCoral(
  userId: string,
): Promise<CompletedFocusSession[]> {
  const rows = await readFocusCompletions(userId);
  const sessions: CompletedFocusSession[] = [];
  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id : "";
    const date = typeof row.date === "string" ? row.date : "";
    const completedAt =
      typeof row.completed_at === "string"
        ? row.completed_at
        : typeof row.completedAt === "string"
          ? row.completedAt
          : "";
    if (!id || !date || !completedAt) continue;
    sessions.push({
      id,
      date,
      completedAt,
      mode: (row.mode as CompletedFocusSession["mode"]) ?? "focus",
      topic: typeof row.topic === "string" ? row.topic : "",
      subject: typeof row.subject === "string" ? row.subject : "",
      elapsedSeconds: Number(row.elapsed_seconds ?? row.elapsedSeconds ?? 0),
    });
  }
  return sessions.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function appendFocusCompletionToCoral(
  userId: string,
  session: CompletedFocusSession,
): Promise<void> {
  await appendFocusCompletion(userId, {
    id: session.id,
    date: session.date,
    completed_at: session.completedAt,
    mode: session.mode,
    topic: session.topic,
    subject: session.subject,
    elapsed_seconds: session.elapsedSeconds,
  });
}
