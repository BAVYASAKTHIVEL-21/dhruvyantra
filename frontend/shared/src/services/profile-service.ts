import { cacheProfileLocally, getCachedProfile } from "@/lib/profile/client";
import type { ProfileMe } from "@/lib/profile/me-types";
import { toProfileMe } from "@/lib/profile/me-types";
import type { UserProfile } from "@/lib/profile/types";

export async function fetchProfileMe(): Promise<ProfileMe> {
  const res = await fetch("/api/profile/me", { cache: "no-store" });
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load profile");
  }
  const profile = (await res.json()) as ProfileMe;
  cacheProfileLocally(profile);
  return profile;
}

export function getCachedProfileMe(): ProfileMe | null {
  const cached = getCachedProfile();
  return cached ? toProfileMe(cached) : null;
}

export async function updateProfileMe(
  patch: Partial<UserProfile> & { onboardingCompleted?: boolean },
): Promise<ProfileMe> {
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  const saved = (await res.json()) as UserProfile;
  const enriched = toProfileMe(saved);
  cacheProfileLocally(enriched);
  return enriched;
}
