import { runPlannerAgent } from "@/agents/planner-agent";
import {
  fetchStudyTasksForDateViaCoral,
  fetchStudyTasksForRangeViaCoral,
} from "@/lib/coral/notion-reads";
import { invalidateNotionPagesCache } from "@/lib/coral/pages-cache";
import { isNotionWritesCoralReady } from "@/lib/coral/readiness";
import { insertNotionPageViaCoral, patchNotionPageViaCoral } from "@/lib/coral/writes";
import { getNotionDatabaseId } from "@/lib/coral/notion-config";
import { TASK_SUBJECTS, taskFromPage } from "@/lib/notion/mappers";
import type { UserProfile } from "@/lib/profile/types";
import { getAllResources } from "@/lib/resources/notion";
import type { DailyPlan, StudyTask, TaskStatus } from "@/types/planner";
import { profileForPlannerGeneration, todayPlanDate } from "./today-helpers";

/**
 * Notion Study Plans — Coral SQL only (reads + writes).
 */

export function isNotionPlannerConfigured(): boolean {
  return getNotionDatabaseId("studyPlans") !== null;
}

function taskToProperties(task: StudyTask) {
  return {
    Task: { title: [{ text: { content: task.title } }] },
    "Student ID": { rich_text: [{ text: { content: task.studentId } }] },
    Subject: { select: { name: TASK_SUBJECTS.includes(task.subject as (typeof TASK_SUBJECTS)[number]) ? task.subject : "General" } },
    Topic: { rich_text: [{ text: { content: task.topic } }] },
    Priority: { select: { name: task.priority } },
    Date: { date: { start: task.date } },
    Duration: { number: task.duration },
    Status: { select: { name: task.status } },
    "AI Generated": { checkbox: task.aiGenerated },
    "Recommended Resource IDs": {
      rich_text: [{ text: { content: JSON.stringify(task.recommendedResourceIds) } }],
    },
    Schedule: {
      rich_text: [{ text: { content: task.scheduledTime ?? "" } }],
    },
  };
}

export function todayIso(): string {
  return todayPlanDate();
}

export function buildDailyPlan(tasks: StudyTask[], date: string): DailyPlan {
  const dayTasks = tasks.filter((t) => t.date === date);
  const completedTasks = dayTasks.filter((t) => t.status === "Completed");
  const pendingTasks = dayTasks.filter((t) => t.status !== "Completed");
  const totalTasks = dayTasks.length;
  const completedCount = completedTasks.length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  return {
    date,
    tasks: dayTasks,
    pendingTasks,
    completedTasks,
    progressPercent,
    totalTasks,
    completedCount,
  };
}

async function queryTasksForDate(
  studentIds: string[],
  date: string,
): Promise<StudyTask[]> {
  return fetchStudyTasksForDateViaCoral(studentIds, date);
}

export async function queryTasksForDateRange(
  studentIds: string | string[],
  startDate: string,
  endDate: string,
): Promise<StudyTask[]> {
  return fetchStudyTasksForRangeViaCoral(studentIds, startDate, endDate);
}

export async function createStudyTask(task: StudyTask): Promise<StudyTask> {
  if (!isNotionPlannerConfigured()) return task;

  const page = await insertNotionPageViaCoral("studyPlans", taskToProperties(task));
  invalidateNotionPagesCache("studyPlans");

  return { ...task, id: page.id, createdAt: page.created_time };
}

export async function getTasksInDateRange(
  studentIds: string | string[],
  startDate: string,
  endDate: string,
): Promise<StudyTask[]> {
  return queryTasksForDateRange(studentIds, startDate, endDate);
}

export async function getTodayPlan(
  studentId: string,
  date = todayPlanDate(),
  alternateStudentIds?: string[],
): Promise<StudyTask[]> {
  const ids = alternateStudentIds?.length
    ? [...new Set([studentId, ...alternateStudentIds])]
    : [studentId];
  return queryTasksForDate(ids, date);
}

export async function getPendingTasks(
  studentId: string,
  date = todayPlanDate(),
  alternateStudentIds?: string[],
): Promise<StudyTask[]> {
  const tasks = await getTodayPlan(studentId, date, alternateStudentIds);
  return tasks.filter((t) => t.status !== "Completed");
}

export async function getCompletedTasks(
  studentId: string,
  date = todayPlanDate(),
  alternateStudentIds?: string[],
): Promise<StudyTask[]> {
  const tasks = await getTodayPlan(studentId, date, alternateStudentIds);
  return tasks.filter((t) => t.status === "Completed");
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<void> {
  if (!isNotionPlannerConfigured()) return;

  await patchNotionPageViaCoral(taskId, {
    Status: { select: { name: status } },
  });
  invalidateNotionPagesCache("studyPlans");
}

export async function generateDailyPlan(
  profile: UserProfile,
  date = todayPlanDate(),
  alternateStudentIds?: string[],
): Promise<StudyTask[]> {
  const ready = profileForPlannerGeneration(profile);
  const ids = alternateStudentIds?.length
    ? [...new Set([ready.userId, ...alternateStudentIds])]
    : [ready.userId];

  const existing = await getTodayPlan(ready.userId, date, ids);
  if (existing.length > 0) {
    return existing;
  }

  const resources = await getAllResources();
  const drafts = runPlannerAgent({ profile: ready, resources, date });

  if (drafts.length === 0) {
    console.warn("[planner] Planner agent returned 0 tasks — check examType on profile");
    return [];
  }

  if (!isNotionPlannerConfigured()) {
    return drafts.map((t, i) => ({ ...t, id: `local-${date}-${i}` }));
  }

  if (!(await isNotionWritesCoralReady())) {
    console.warn(
      "[planner] notion_writes not registered — using local task ids. Run: npm run setup:coral-notion",
    );
    return drafts.map((t, i) => ({ ...t, id: `local-${date}-${i}` }));
  }

  const saved: StudyTask[] = [];
  for (const draft of drafts) {
    try {
      saved.push(await createStudyTask({ ...draft, studentId: ready.userId }));
    } catch (e) {
      console.warn("[planner] createStudyTask failed:", e);
    }
  }
  invalidateNotionPagesCache("studyPlans");
  return saved.length > 0 ? saved : drafts.map((t, i) => ({ ...t, id: `local-${date}-${i}` }));
}

export async function syncPlanViaCoral(studentId: string): Promise<void> {
  void studentId;
}

export { taskFromPage };
