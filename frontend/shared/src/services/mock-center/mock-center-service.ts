import { dispatchMockCenterRefresh } from "@/lib/mock-center/events";
import type { MockCenterOverview } from "@/types/mock-center";
import { emptyMockOverview } from "@/types/mock-center";
import type { MockSessionQuestion } from "@/services/mock-center/mock-questions";
import type { MockSubmissionResponse, MockType } from "@/types/mock-results";

export async function fetchMockCenterOverview(): Promise<MockCenterOverview> {
  const res = await fetch("/api/mock-center/overview", { cache: "no-store" });
  if (res.status === 401) {
    return emptyMockOverview();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load mock center");
  }
  return res.json();
}

export async function submitMockCenter(
  payload: Record<string, unknown> = {},
): Promise<MockSubmissionResponse> {
  const res = await fetch("/api/mock-center/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ useSeeded: true, ...payload }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to submit mock");
  }
  const data = (await res.json()) as MockSubmissionResponse;
  dispatchMockCenterRefresh();
  return data;
}

export async function fetchMockSessionQuestions(mockType: MockType) {
  const res = await fetch(`/api/mock-center/questions?type=${mockType}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load mock questions");
  }
  return res.json() as Promise<{
    questions: MockSessionQuestion[];
    mockType: MockType;
    examType: string;
  }>;
}

export async function fetchLatestMockSubmission() {
  const res = await fetch("/api/mock-center/submit", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load mock result");
  }
  const data = await res.json();
  return data.submission ?? null;
}
