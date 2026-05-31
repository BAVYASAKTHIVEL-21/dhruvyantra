import type { Resource } from "./resource";

export type TaskStatus = "Pending" | "In Progress" | "Completed";

export type TaskPriority = "High" | "Medium" | "Low";

export type StudyTask = {
  id: string;
  studentId: string;
  title: string;
  subject: string;
  topic: string;
  priority: TaskPriority;
  date: string;
  duration: number;
  status: TaskStatus;
  aiGenerated: boolean;
  recommendedResourceIds: string[];
  recommendedResources?: Resource[];
  scheduledTime?: string;
  createdAt?: string;
};

export type DailyPlan = {
  date: string;
  tasks: StudyTask[];
  pendingTasks: StudyTask[];
  completedTasks: StudyTask[];
  progressPercent: number;
  totalTasks: number;
  completedCount: number;
};

export type PlannerUpdatePayload = {
  taskId: string;
  status: TaskStatus;
};
