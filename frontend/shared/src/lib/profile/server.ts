import { cookies } from "next/headers";
import { AUTH_COOKIE, PROFILE_COOKIE, encodeProfile } from "./cookies";
import { saveProfileToNotion } from "./notion";
import { resolveProfileForUser } from "./resolve";
import type { UserProfile } from "./types";
import { getNotionDatabaseConfig } from "@/lib/notion/client";

const PROFILE_CACHE_TTL_MS = 60_000;
const profileCache = new Map<string, { loadedAt: number; profile: UserProfile }>();

export function clearProfileCache(userId?: string): void {
  if (userId) profileCache.delete(userId);
  else profileCache.clear();
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE)?.value ?? null;
}

export async function getProfile(): Promise<UserProfile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.loadedAt < PROFILE_CACHE_TTL_MS) {
    return cached.profile;
  }

  const profile = await resolveProfileForUser(userId);
  profileCache.set(userId, { loadedAt: Date.now(), profile });
  return profile;
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveProfileToNotion(updated);
  } catch (e) {
    console.error("[profile] Notion save failed:", e);
    if (getNotionDatabaseConfig("NOTION_PROFILES_DATABASE_ID")) {
      throw e instanceof Error ? e : new Error("Failed to save profile to Notion");
    }
  }

  profileCache.set(updated.userId, { loadedAt: Date.now(), profile: updated });

  const jar = await cookies();
  jar.set(PROFILE_COOKIE, encodeProfile(updated), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return updated;
}

export { resolveProfileForUser, mergeUserProfiles } from "./resolve";

export async function isOnboardingComplete(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.onboardingCompleted === true;
}
