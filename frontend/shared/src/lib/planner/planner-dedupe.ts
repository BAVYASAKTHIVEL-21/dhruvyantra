import type { StudyTask } from "@/types/planner";

function normalizeTask(task: StudyTask): StudyTask {
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

/** Max tasks shown for one calendar day (planner agent generates ~6–8). */
export const MAX_TODAY_PLANNER_TASKS = 10;

export function taskDisplaySignature(task: StudyTask): string {
  return [
    task.date,
    task.title.trim().toLowerCase(),
    task.subject,
    (task.topic ?? "").trim().toLowerCase(),
    task.scheduledTime ?? "",
  ].join("|");
}

function isEphemeralTaskId(id: string): boolean {
  return id.startsWith("local-") || id.startsWith("draft-");
}

function preferTask(a: StudyTask, b: StudyTask): StudyTask {
  const aNotion = !isEphemeralTaskId(a.id);
  const bNotion = !isEphemeralTaskId(b.id);
  if (aNotion && !bNotion) return a;
  if (bNotion && !aNotion) return b;
  if (a.status === "Completed" && b.status !== "Completed") return a;
  if (b.status === "Completed" && a.status !== "Completed") return b;
  const aTime = a.createdAt ?? "";
  const bTime = b.createdAt ?? "";
  if (aTime && bTime && aTime < bTime) return a;
  return b;
}

/** Collapse duplicate Notion rows / cookie copies (same title, date, slot). */
export function dedupeStudyTasks(tasks: StudyTask[]): StudyTask[] {
  const bySig = new Map<string, StudyTask>();
  for (const task of tasks) {
    if (!task?.id) continue;
    const sig = taskDisplaySignature(task);
    const prev = bySig.get(sig);
    bySig.set(sig, normalizeTask(prev ? preferTask(prev, task) : task));
  }
  return [...bySig.values()];
}

export function limitTodayTasks(tasks: StudyTask[], date: string, limit = MAX_TODAY_PLANNER_TASKS): StudyTask[] {
  const day = tasks.filter((t) => t.date === date);
  const other = tasks.filter((t) => t.date !== date);
  const sorted = day.sort((a, b) => {
    const ta = a.scheduledTime ?? "";
    const tb = b.scheduledTime ?? "";
    if (ta !== tb) return ta.localeCompare(tb);
    return a.title.localeCompare(b.title);
  });
  return [...other, ...sorted.slice(0, limit)];
}

export function prepareTasksForToday(tasks: StudyTask[], date: string): StudyTask[] {
  return limitTodayTasks(dedupeStudyTasks(tasks), date);
}
