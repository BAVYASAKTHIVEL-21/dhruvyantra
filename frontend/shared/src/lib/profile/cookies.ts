import type { UserProfile } from "./types";

export const AUTH_COOKIE = "dhruv_auth";
export const PROFILE_COOKIE = "dhruv_profile";

export function encodeProfile(profile: UserProfile): string {
  return Buffer.from(JSON.stringify(profile)).toString("base64url");
}

export function decodeProfile(value: string): UserProfile | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as UserProfile;
  } catch {
    return null;
  }
}
