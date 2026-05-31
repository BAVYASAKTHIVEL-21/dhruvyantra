import { cookies } from "next/headers";
import { isCoralEnabled } from "@/lib/coral/config";
import {
  decodePlannerStore,
  encodePlannerStore,
  PLANNER_COOKIE,
  type PlannerCookieStore,
} from "@/lib/planner/cookies";
import {
  isNotionPlannerConfigured,
  queryTasksForDateRange,
} from "@/lib/planner/notion";
import { dedupeStudyTasks, mergeTasksById, readPlannerCookieTasks } from "@/lib/planner/today-helpers";
import type { StudyTask } from "@/types/planner";

export async function getTasksForDateRange(
  userId: string,
  startDate: string,
  endDate: string,
  options?: { alternateStudentIds?: string[] },
): Promise<StudyTask[]> {
  const inRange = (t: StudyTask) => t.date >= startDate && t.date <= endDate;
  const studentIds = options?.alternateStudentIds?.length
    ? [...new Set([userId, ...options.alternateStudentIds])]
    : [userId];

  let notionTasks: StudyTask[] = [];
  if (isCoralEnabled() && isNotionPlannerConfigured()) {
    try {
      notionTasks = await queryTasksForDateRange(studentIds, startDate, endDate);
    } catch (e) {
      console.warn("[mission-control] Notion task range read failed:", e);
    }
  }

  const cookieTasks = (await readPlannerCookieTasks(userId)).filter(inRange);
  return dedupeStudyTasks(
    mergeTasksById(notionTasks, cookieTasks).filter(inRange),
  ).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAllStoredTasks(userId: string): Promise<StudyTask[]> {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - 89);
  const startIso = start.toISOString().slice(0, 10);
  return getTasksForDateRange(userId, startIso, end);
}

export async function mergeTasksIntoCookieStore(
  userId: string,
  tasks: StudyTask[],
): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(PLANNER_COOKIE)?.value;
  const existing = raw ? decodePlannerStore(raw) : null;
  const store: PlannerCookieStore = {
    userId,
    tasks: existing?.userId === userId ? existing.tasks : [],
  };
  const byId = new Map(store.tasks.map((t) => [t.id, t]));
  for (const t of tasks) byId.set(t.id, t);
  store.tasks = [...byId.values()];
  jar.set(PLANNER_COOKIE, encodePlannerStore(store), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}
