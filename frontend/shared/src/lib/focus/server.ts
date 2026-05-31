import { cookies } from "next/headers";
import {
  loadActiveFocusSessionFromCoral,
  saveActiveFocusSessionToCoral,
  shouldUseFocusCoral,
} from "./coral-persistence";
import {
  decodeFocusStore,
  encodeFocusStore,
  FOCUS_SESSION_COOKIE,
  type FocusCookieStore,
} from "./cookies";
import type { PersistedFocusSession } from "@/types/focus";

async function readStore(userId: string): Promise<PersistedFocusSession | null> {
  const jar = await cookies();
  const raw = jar.get(FOCUS_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const store = decodeFocusStore(raw);
  if (!store || store.userId !== userId) return null;
  return store.session;
}

async function writeStore(userId: string, session: PersistedFocusSession | null): Promise<void> {
  const jar = await cookies();
  const payload: FocusCookieStore = { userId, session };
  jar.set(FOCUS_SESSION_COOKIE, encodeFocusStore(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getActiveFocusSession(
  userId: string,
): Promise<PersistedFocusSession | null> {
  if (await shouldUseFocusCoral()) {
    return loadActiveFocusSessionFromCoral(userId);
  }
  return readStore(userId);
}

export async function saveActiveFocusSession(
  userId: string,
  session: PersistedFocusSession,
): Promise<PersistedFocusSession> {
  if (await shouldUseFocusCoral()) {
    await saveActiveFocusSessionToCoral(userId, session);
    return session;
  }
  await writeStore(userId, session);
  return session;
}

export async function clearActiveFocusSession(userId: string): Promise<void> {
  if (await shouldUseFocusCoral()) {
    await saveActiveFocusSessionToCoral(userId, null);
    return;
  }
  await writeStore(userId, null);
}
