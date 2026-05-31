import { cookies } from "next/headers";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import {
  appendFocusCompletionToCoral,
  loadFocusCompletionsFromCoral,
  shouldUseFocusCoral,
} from "./coral-persistence";
import {
  decodeFocusHistoryStore,
  encodeFocusHistoryStore,
  FOCUS_HISTORY_COOKIE,
  type FocusHistoryStore,
} from "./history-cookies";
import type { CompletedFocusSession } from "@/types/focus";

const HISTORY_DAYS = 90;

function pruneSessions(sessions: CompletedFocusSession[]): CompletedFocusSession[] {
  const cutoff = addDays(isoDate(), -(HISTORY_DAYS - 1));
  return sessions
    .filter((s) => s.date >= cutoff)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

async function readHistory(userId: string): Promise<CompletedFocusSession[]> {
  const jar = await cookies();
  const raw = jar.get(FOCUS_HISTORY_COOKIE)?.value;
  if (!raw) return [];
  const store = decodeFocusHistoryStore(raw);
  if (!store || store.userId !== userId) return [];
  return pruneSessions(store.sessions);
}

async function writeHistory(userId: string, sessions: CompletedFocusSession[]): Promise<void> {
  const jar = await cookies();
  const payload: FocusHistoryStore = { userId, sessions: pruneSessions(sessions) };
  jar.set(FOCUS_HISTORY_COOKIE, encodeFocusHistoryStore(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * HISTORY_DAYS,
  });
}

export async function getFocusSessionHistory(userId: string): Promise<CompletedFocusSession[]> {
  if (await shouldUseFocusCoral()) {
    const sessions = await loadFocusCompletionsFromCoral(userId);
    return pruneSessions(sessions);
  }
  return readHistory(userId);
}

export async function appendFocusSessionCompletion(
  userId: string,
  session: CompletedFocusSession,
): Promise<CompletedFocusSession[]> {
  if (await shouldUseFocusCoral()) {
    const existing = await loadFocusCompletionsFromCoral(userId);
    if (existing.some((s) => s.id === session.id)) {
      return pruneSessions(existing);
    }
    await appendFocusCompletionToCoral(userId, session);
    return pruneSessions([session, ...existing]);
  }

  const existing = await readHistory(userId);
  if (existing.some((s) => s.id === session.id)) {
    return existing;
  }
  const next = pruneSessions([session, ...existing]);
  await writeHistory(userId, next);
  return next;
}
