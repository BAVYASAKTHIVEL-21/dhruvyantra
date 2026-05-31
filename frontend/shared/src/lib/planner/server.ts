import { cookies } from "next/headers";
import { isCoralEnabled } from "@/lib/coral/config";
import { getAllResources } from "@/lib/resources/notion";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import type { UserProfile } from "@/lib/profile/types";
import type { Resource } from "@/types/resource";
import type { DailyPlan, StudyTask, TaskStatus } from "@/types/planner";
import { decodePlannerStore, encodePlannerStore, PLANNER_COOKIE } from "./cookies";
import {
  dispatchCalendarSync,
  syncPlannerTasksForProfile,
} from "./calendar-sync";
import { isGoogleCalendarConfigured } from "@/lib/integrations/google-calendar";
import { enrichProfileForPlanner } from "@/services/weakness-engine/planner-integration";
import { getMockSubmissions } from "@/lib/mock-center/store";
import { isMockTask } from "@/lib/mock-center/tasks";
import { processMockFromPlannerTask } from "@/services/mock-center/process-submission";
import {
  buildDailyPlan,
  generateDailyPlan as generateAndPersistPlan,
  getTodayPlan,
  isNotionPlannerConfigured,
  todayIso,
  updateTaskStatus as updateNotionTaskStatus,
} from "./notion";
import {
  filterTasksForDate,
  generateLocalDailyTasks,
  mergeTasksById,
  prepareTasksForToday,
  profileForPlannerGeneration,
  readPlannerCookieTasks,
  studentIdCandidates,
  todayPlanDate,
} from "./today-helpers";

/** Daily plans, task updates, and mock-recovery hook on mock task completion. */

async function readCookieTasks(userId: string): Promise<StudyTask[]> {
  return readPlannerCookieTasks(userId);
}

async function writeCookieTasks(userId: string, tasks: StudyTask[]): Promise<void> {
  const jar = await cookies();
  jar.set(PLANNER_COOKIE, encodePlannerStore({ userId, tasks }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getTasksForToday(
  profile: UserProfile,
  date: string,
  cookieUserId: string,
): Promise<StudyTask[]> {
  const ids = studentIdCandidates(profile);
  let notionTasks: StudyTask[] = [];

  if (isCoralEnabled() && isNotionPlannerConfigured()) {
    try {
      notionTasks = await getTodayPlan(profile.userId, date, ids);
    } catch (e) {
      console.warn("[planner] Notion read failed:", e);
    }
  }

  const cookieTasks = filterTasksForDate(await readCookieTasks(cookieUserId), date);
  return prepareTasksForToday(mergeTasksById(notionTasks, cookieTasks), date);
}

async function saveTasks(cookieUserId: string, tasks: StudyTask[], date: string): Promise<void> {
  const existing = await readCookieTasks(cookieUserId);
  const otherDays = existing.filter((t) => t.date !== date);
  await writeCookieTasks(cookieUserId, [...otherDays, ...tasks]);
}

function normalizeResourceIds(task: StudyTask): string[] {
  const raw = task.recommendedResourceIds;
  if (Array.isArray(raw)) return raw.filter((id): id is string => typeof id === "string");
  return [];
}

function attachResources(tasks: StudyTask[], resources: Resource[]): StudyTask[] {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeResources = Array.isArray(resources) ? resources : [];
  const byId = new Map(safeResources.map((r) => [r.id, r]));
  return safeTasks.map((task) => {
    const recommendedResourceIds = normalizeResourceIds(task);
    return {
      ...task,
      recommendedResourceIds,
      recommendedResources: recommendedResourceIds
        .map((id) => byId.get(id))
        .filter(Boolean) as Resource[],
    };
  });
}

async function persistGeneratedPlan(
  profile: UserProfile,
  date: string,
  resources: Resource[],
  cookieUserId: string,
): Promise<StudyTask[]> {
  const ready = profileForPlannerGeneration(profile);

  if (isNotionPlannerConfigured() && isCoralEnabled()) {
    try {
      const saved = await generateAndPersistPlan(ready, date, idsFromProfile(ready));
      if (saved.length > 0) return saved;
    } catch (e) {
      console.warn("[planner] Notion plan generation failed:", e);
    }
  }

  const local = generateLocalDailyTasks(ready, resources, date);
  await saveTasks(cookieUserId, local, date);
  return local;
}

function idsFromProfile(profile: UserProfile): string[] {
  return studentIdCandidates(profile);
}

const ensureTodayPlanInFlight = new Map<string, Promise<StudyTask[]>>();

async function ensureTodayPlanInner(profile: UserProfile, cookieUserId: string): Promise<StudyTask[]> {
  const date = todayPlanDate();
  const existing = await getTasksForToday(profile, date, cookieUserId);
  if (existing.length > 0) return existing;

  let plannerProfile: UserProfile;
  try {
    plannerProfile = await enrichProfileForPlanner(profile);
  } catch (e) {
    console.warn("[planner] enrichProfileForPlanner failed:", e);
    plannerProfile = profileForPlannerGeneration(profile);
  }

  const resources = await getAllResources().catch(() => [] as Resource[]);
  const generated = await persistGeneratedPlan(plannerProfile, date, resources, cookieUserId);

  if (generated.length > 0 && isGoogleCalendarConfigured()) {
    dispatchCalendarSync(() => syncPlannerTasksForProfile(profile, generated));
  }

  return generated;
}

/** Ensure today's plan exists — generate only if empty (coalesced per user/day). */
export async function ensureTodayPlan(
  profile: UserProfile,
  options?: { cookieUserId?: string },
): Promise<StudyTask[]> {
  const cookieUserId = options?.cookieUserId?.trim() || profile.userId;
  const key = `${cookieUserId}:${todayPlanDate()}`;
  const pending = ensureTodayPlanInFlight.get(key);
  if (pending) return pending;

  const promise = ensureTodayPlanInner(profile, cookieUserId).finally(() => {
    ensureTodayPlanInFlight.delete(key);
  });
  ensureTodayPlanInFlight.set(key, promise);
  return promise;
}

export async function getDailyPlanForSession(): Promise<DailyPlan | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const date = todayPlanDate();
  let tasks = await getTasksForToday(profile, date, userId);

  if (tasks.length === 0) {
    try {
      tasks = await ensureTodayPlan(profile, { cookieUserId: userId });
    } catch (e) {
      console.warn("[planner] ensureTodayPlan failed:", e);
      const resources = await getAllResources().catch(() => [] as Resource[]);
      tasks = generateLocalDailyTasks(profileForPlannerGeneration(profile), resources, date);
      await saveTasks(userId, tasks, date);
    }
  }

  if (tasks.length === 0) {
    const resources = await getAllResources().catch(() => [] as Resource[]);
    tasks = generateLocalDailyTasks(profileForPlannerGeneration(profile), resources, date);
    await saveTasks(userId, tasks, date);
  }

  // Seed cookie cache even when tasks come from Notion, so updates can be fast
  // without re-reading Notion on every toggle.
  if (tasks.length > 0) {
    try {
      await saveTasks(userId, tasks, date);
    } catch (e) {
      console.warn("[planner] Failed to seed cookie cache:", e);
    }
  }

  const resources = await getAllResources().catch(() => [] as Resource[]);
  const enriched = attachResources(tasks, resources);
  return buildDailyPlan(enriched, date);
}

export async function updateTaskStatusForSession(
  taskId: string,
  status: TaskStatus,
): Promise<DailyPlan | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const date = todayPlanDate();

  if (isNotionPlannerConfigured() && !taskId.startsWith("local-") && !taskId.startsWith("draft-")) {
    try {
      await updateNotionTaskStatus(taskId, status);
    } catch (e) {
      console.warn("[planner] Notion status update failed:", e);
    }
  }

  // Fast path: use cookie-stored tasks and avoid re-reading Notion
  // (`notion.data_source_pages`) on every status toggle.
  let tasks = filterTasksForDate(await readCookieTasks(userId), date);
  if (tasks.length === 0) {
    // Fallback for the first update after a cold start (cookie not seeded yet).
    tasks = await getTasksForToday(profile, date, userId);
  }
  if (tasks.length === 0) return buildDailyPlan([], date);

  const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
  if (updated.length > 0) {
    await saveTasks(userId, updated, date);
  }

  if (status === "Completed") {
    const completedTask = updated.find((t) => t.id === taskId);
    if (completedTask && isMockTask(completedTask)) {
      try {
        const submissions = await getMockSubmissions(userId);
        const alreadyProcessed = submissions.some(
          (s) => s.plannerTaskId === completedTask.id,
        );
        if (!alreadyProcessed) {
          await processMockFromPlannerTask(profile, completedTask);
        }
      } catch (e) {
        console.warn("[planner] Mock recovery pipeline failed:", e);
      }
    }
  }

  const resources = await getAllResources().catch(() => [] as Resource[]);
  return buildDailyPlan(attachResources(updated, resources), date);
}

export async function triggerPlanAfterOnboarding(profile: UserProfile): Promise<void> {
  try {
    await ensureTodayPlan(profile);
  } catch (e) {
    console.warn("[planner] Auto-generate after onboarding failed:", e);
  }
}

// Re-export for callers using UTC helper name
export { todayIso };
