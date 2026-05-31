"use client";

import type { UserProfile } from "./types";

export type AuthErrorPayload = {
  error: string;
  errors?: { email?: string; password?: string };
  code?: string;
};

export async function establishSession(
  email: string,
  password: string,
): Promise<{ redirect: string }> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as AuthErrorPayload;
    throw Object.assign(new Error(data.error ?? "Failed to sign in"), { payload: data });
  }
  return res.json();
}

export async function registerAccount(
  email: string,
  password: string,
): Promise<{ redirect: string }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as AuthErrorPayload;
    throw Object.assign(new Error(data.error ?? "Failed to create account"), { payload: data });
  }
  return res.json();
}

export async function destroySession(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  if (typeof window !== "undefined") {
    localStorage.removeItem("dhruv_user_profile");
  }
}

export async function fetchClientProfile(): Promise<UserProfile | null> {
  const res = await fetch("/api/profile", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function saveClientProfile(
  profile: Partial<UserProfile> & { onboardingCompleted?: boolean },
): Promise<UserProfile> {
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to save profile");
  return res.json();
}

/** Local cache for agents / offline demo (synced after save) */
const LOCAL_KEY = "dhruv_user_profile";

export function cacheProfileLocally(profile: UserProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  }
}

export function getCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}
