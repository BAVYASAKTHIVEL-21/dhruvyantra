import { cookies } from "next/headers";
import type { ExamType } from "@/config/exam-config";
import { defaultSubjectsForExam } from "@/config/exam-config";
import { runPlannerAgent } from "@/agents/planner-agent";
import { decodePlannerStore, PLANNER_COOKIE } from "@/lib/planner/cookies";
import type { Resource } from "@/types/resource";
import type { UserProfile } from "@/lib/profile/types";
import type { StudyTask } from "@/types/planner";

export { todayPlanDate } from "./planner-dates";

export function studentIdCandidates(profile: UserProfile): string[] {
  const ids = new Set<string>();
  if (profile.userId?.trim()) ids.add(profile.userId.trim());
  if (profile.email?.trim()) {
    ids.add(profile.email.trim());
    ids.add(profile.email.trim().toLowerCase());
  }
  return [...ids];
}

/** Infer exam when profile cookie/Notion row is incomplete but UI shows NEET/JEE context. */
export function resolvePlannerExamType(profile: UserProfile): ExamType | null {
  if (profile.examType === "JEE" || profile.examType === "NEET") return profile.examType;
  const subjects = profile.weakSubjects.map((s) => s.toLowerCase());
  if (subjects.includes("biology")) return "NEET";
  if (subjects.includes("mathematics")) return "JEE";
  if (profile.weakTopics.some((t) => /plant|physiology|botany/i.test(t))) return "NEET";
  return "NEET";
}

export function profileForPlannerGeneration(profile: UserProfile): UserProfile {
  const examType = resolvePlannerExamType(profile);
  const weakSubjects =
    profile.weakSubjects.length > 0
      ? profile.weakSubjects
      : [...defaultSubjectsForExam(examType)];
  return {
    ...profile,
    examType,
    weakSubjects,
    dailyStudyHours: profile.dailyStudyHours > 0 ? profile.dailyStudyHours : 6,
    productiveTime: profile.productiveTime ?? "Evening",
  };
}

export async function readPlannerCookieTasks(userId: string): Promise<StudyTask[]> {
  const jar = await cookies();
  const raw = jar.get(PLANNER_COOKIE)?.value;
  if (!raw) return [];
  const store = decodePlannerStore(raw);
  if (!store || store.userId !== userId) return [];
  return store.tasks;
}

/** Ensure planner tasks from cookies/Notion always have required array fields. */
export function normalizeStudyTask(task: StudyTask): StudyTask {
  const ids = task.recommendedResourceIds;
  const recommendedResourceIds = Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string")
    : [];
  return {
    ...task,
    recommendedResourceIds,
    duration: typeof task.duration === "number" && task.duration > 0 ? task.duration : 30,
    status: task.status ?? "Pending",
    aiGenerated: Boolean(task.aiGenerated),
  };
}

export {
  dedupeStudyTasks,
  limitTodayTasks,
  prepareTasksForToday,
  MAX_TODAY_PLANNER_TASKS,
} from "./planner-dedupe";

export function mergeTasksById(...lists: StudyTask[][]): StudyTask[] {
  const byId = new Map<string, StudyTask>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const task of list) {
      if (!task?.id) continue;
      byId.set(task.id, normalizeStudyTask(task));
    }
  }
  return [...byId.values()];
}

/** In-memory daily plan when Notion/Coral writes fail or return no rows. */
export function generateLocalDailyTasks(
  profile: UserProfile,
  resources: Resource[],
  date: string,
): StudyTask[] {
  const ready = profileForPlannerGeneration(profile);
  const drafts = runPlannerAgent({ profile: ready, resources, date });
  return drafts.map((t, i) => ({
    ...t,
    id: t.id.startsWith("local-") ? t.id : `local-${date}-${i}`,
    studentId: ready.userId,
    date,
  }));
}

export function filterTasksForDate(tasks: StudyTask[], date: string): StudyTask[] {
  return tasks.filter((t) => t.date === date);
}
