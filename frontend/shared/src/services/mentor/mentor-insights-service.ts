import type { MentorInsightsSnapshot } from "@/lib/mentor/insights";
import { emptyMentorInsights } from "@/lib/mentor/insights";

export async function fetchMentorInsights(): Promise<MentorInsightsSnapshot> {
  const res = await fetch("/api/mentor/insights", { cache: "no-store" });
  if (res.status === 401) return emptyMentorInsights();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load mentor insights");
  }
  return res.json();
}
