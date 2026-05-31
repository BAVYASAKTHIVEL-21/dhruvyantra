import type { UserProfile } from "./types";

/** Enriched profile returned by GET /api/profile/me */
export type ProfileMe = UserProfile & {
  name: string;
  targetRank: string | null;
  role: string;
};

export function displayNameFromProfile(profile: Pick<UserProfile, "email" | "userId">): string {
  const raw = profile.email?.split("@")[0] ?? profile.userId.split("@")[0] ?? profile.userId;
  const cleaned = raw.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Student";
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function targetRankFromProfile(profile: Pick<UserProfile, "targetYear" | "examType">): string | null {
  if (!profile.examType || !profile.targetYear) return null;
  return `${profile.examType} ${profile.targetYear}`;
}

export function roleFromProfile(profile: Pick<UserProfile, "examType">): string {
  if (profile.examType === "JEE") return "JEE Aspirant";
  if (profile.examType === "NEET") return "NEET Aspirant";
  return "Aspirant";
}

export function toProfileMe(profile: UserProfile): ProfileMe {
  return {
    ...profile,
    name: displayNameFromProfile(profile),
    targetRank: targetRankFromProfile(profile),
    role: roleFromProfile(profile),
  };
}
