"use client";

import { dispatchMockCenterRefresh } from "@/lib/mock-center/events";
import type { DailyPlan, TaskStatus } from "@/types/planner";

const RETRY_DELAY_MS = 600;

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 1,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store", ...init });
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export async function fetchTodayPlan(): Promise<DailyPlan> {
  const res = await fetchWithRetry("/api/planner/today");
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Failed to load plan");
  }
  return res.json();
}

export async function updatePlannerTask(
  taskId: string,
  status: TaskStatus,
): Promise<DailyPlan> {
  const res = await fetchWithRetry("/api/planner/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Failed to update task");
  }
  const plan = (await res.json()) as DailyPlan;
  if (status === "Completed") {
    dispatchMockCenterRefresh();
  }
  return plan;
}
