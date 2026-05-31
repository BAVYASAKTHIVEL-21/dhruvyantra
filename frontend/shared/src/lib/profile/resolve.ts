import { cookies } from "next/headers";
import { PROFILE_COOKIE, decodeProfile } from "./cookies";
import { fetchProfileFromNotion } from "./notion";
import { DEFAULT_PROFILE, type UserProfile } from "./types";

function profileTimestamp(profile: UserProfile): number {
  if (!profile.updatedAt) return 0;
  const parsed = Date.parse(profile.updatedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Notion is the source of truth for `onboardingCompleted`.
 * Cookie draft data is kept only for in-progress onboarding fields.
 */
export function mergeUserProfiles(
  notion: UserProfile | null,
  cookie: UserProfile | null,
  userId: string,
  email?: string,
): UserProfile {
  const empty = (): UserProfile => ({
    ...DEFAULT_PROFILE,
    userId,
    email,
    onboardingCompleted: false,
  });

  if (!notion) {
    if (!cookie) return empty();
    return {
      ...cookie,
      userId,
      email: cookie.email ?? email,
      onboardingCompleted: false,
    };
  }

  if (!cookie) {
    return { ...notion, userId, email: notion.email ?? email };
  }

  const notionTime = profileTimestamp(notion);
  const cookieTime = profileTimestamp(cookie);
  const useCookieDraft =
    !cookie.onboardingCompleted && cookieTime > notionTime;

  return {
    ...notion,
    ...(useCookieDraft ? cookie : {}),
    userId,
    email: notion.email ?? cookie.email ?? email,
    onboardingCompleted: notion.onboardingCompleted,
  };
}

async function readCookieProfile(userId: string): Promise<UserProfile | null> {
  const jar = await cookies();
  const raw = jar.get(PROFILE_COOKIE)?.value;
  if (!raw) return null;
  const parsed = decodeProfile(raw);
  return parsed?.userId === userId ? parsed : null;
}

/** Load profile from Notion + cookie and merge into one canonical record. */
export async function resolveProfileForUser(
  userId: string,
  email?: string,
): Promise<UserProfile> {
  let notion: UserProfile | null = null;
  try {
    notion = await fetchProfileFromNotion(userId);
  } catch (e) {
    console.warn("[profile] Notion read failed, using cookie if available:", e);
  }

  const cookie = await readCookieProfile(userId);
  return mergeUserProfiles(notion, cookie, userId, email);
}
