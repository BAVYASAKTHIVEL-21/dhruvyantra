import type { ExamType } from "@/config/exam-config";
import type { UserProfile } from "./types";

export type ProfileMeResponse = UserProfile & {
  name: string;
  role: string;
  targetRank: string | null;
};

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Derive a friendly display name from email or userId */
export function getProfileDisplayName(profile: Pick<UserProfile, "email" | "userId">): string {
  const source = profile.email ?? profile.userId;
  const local = source.split("@")[0] ?? source;
  const segment = local.split(/[._-]/)[0] ?? local;
  return capitalize(segment);
}

export function getProfileRole(examType: ExamType | null): string {
  if (examType === "JEE") return "JEE Aspirant";
  if (examType === "NEET") return "NEET Aspirant";
  return "Aspirant";
}

/** Map target year to an aspirational rank band label */
export function getTargetRankLabel(targetYear: number | null, examType: ExamType | null): string | null {
  if (!targetYear || !examType) return null;
  if (examType === "JEE") return "Under 1000";
  return "Under 5000";
}

export function toProfileMeResponse(profile: UserProfile): ProfileMeResponse {
  return {
    ...profile,
    name: getProfileDisplayName(profile),
    role: getProfileRole(profile.examType),
    targetRank: getTargetRankLabel(profile.targetYear, profile.examType),
  };
}

export function getGreetingName(profile: ProfileMeResponse | null): string {
  return profile?.name ?? "Aspirant";
}
