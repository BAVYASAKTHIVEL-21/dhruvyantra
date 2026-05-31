import type { MissionControlAnalytics } from "@/types/mission-control";

export async function fetchMissionAnalytics(): Promise<MissionControlAnalytics> {
  const res = await fetch("/api/mission-control/analytics", { cache: "no-store" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load mission analytics");
  }
  return res.json();
}
