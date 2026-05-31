import type { StudyTask } from "@/types/planner";
import type { MockType } from "@/types/mock-results";

export function isMockTask(task: StudyTask): boolean {
  const hay = `${task.title} ${task.subject} ${task.topic}`.toLowerCase();
  return (
    task.subject === "Full Length Test" ||
    hay.includes("mock") ||
    hay.includes("full syllabus") ||
    hay.includes("full length")
  );
}

export function filterMockTasks(tasks: StudyTask[]): StudyTask[] {
  return tasks.filter(isMockTask);
}

export function resolveMockTypeFromTask(task: StudyTask): MockType {
  const hay = `${task.title} ${task.topic}`.toLowerCase();
  if (task.subject === "Full Length Test" || hay.includes("full syllabus") || hay.includes("full mock")) {
    return "full";
  }
  if (hay.includes("pyq") || hay.includes("speed drill")) return "pyq";
  return "chapter";
}
