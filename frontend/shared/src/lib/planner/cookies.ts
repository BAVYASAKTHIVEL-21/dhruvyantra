import type { StudyTask } from "@/types/planner";

export const PLANNER_COOKIE = "dhruv_planner";

export type PlannerCookieStore = {
  userId: string;
  tasks: StudyTask[];
};

export function encodePlannerStore(store: PlannerCookieStore): string {
  return Buffer.from(JSON.stringify(store)).toString("base64url");
}

export function decodePlannerStore(value: string): PlannerCookieStore | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as PlannerCookieStore;
  } catch {
    return null;
  }
}
