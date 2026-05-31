import type { WeaknessTopicsApiResponse } from "@/types/weakness";

export async function fetchWeaknessTopics(): Promise<WeaknessTopicsApiResponse> {
  const res = await fetch("/api/weakness/topics", { cache: "no-store" });
  if (res.status === 401) {
    return {
      topics: [],
      weakTopicNames: [],
      computedAt: new Date().toISOString(),
      windowDays: 90,
      examType: null,
    };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load weakness topics");
  }
  return res.json();
}
