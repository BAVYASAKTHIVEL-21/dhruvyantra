import type { ExamType } from "@/config/exam-config";
import {
  createCalendarEvent,
  createCalendarEventViaAgent,
  calendarTimeZone,
  isGoogleCalendarConfigured,
  minutesToDateTime,
  type CalendarEventInput,
  type CalendarEventResult,
  type CalendarTaskCategory,
} from "@/lib/integrations/google-calendar";
import { isMockTask } from "@/lib/mock-center/tasks";
import type { ProductiveTime, UserProfile } from "@/lib/profile/types";
import type { PersistedFocusSession } from "@/types/focus";
import type { StudyTask } from "@/types/planner";

export type PlannerCalendarContext = {
  examType: ExamType | null;
  productiveTime: ProductiveTime | null;
};

function defaultStartMinutes(productiveTime: ProductiveTime | null): number {
  if (productiveTime === "Morning") return 6 * 60;
  if (productiveTime === "Night") return 21 * 60;
  return 17 * 60;
}

export function categorizePlannerTask(task: StudyTask): CalendarTaskCategory {
  if (isMockTask(task)) return "mock";
  if (task.id.startsWith("recovery-")) return "recovery";
  if (/revision|revise|spaced/i.test(`${task.title} ${task.topic}`)) return "revision";
  return "planner";
}

function categoryEmoji(category: CalendarTaskCategory): string {
  switch (category) {
    case "mock":
      return "📝";
    case "recovery":
      return "🔄";
    case "revision":
      return "📖";
    case "focus":
      return "🎯";
    default:
      return "📚";
  }
}

function examLabel(examType: ExamType | null): string {
  return examType ?? "Study";
}

function mockDurationMinutes(task: StudyTask, examType: ExamType | null): number {
  if (task.duration > 0) return task.duration;
  if (task.subject === "Full Length Test") {
    return examType === "NEET" ? 180 : 180;
  }
  return examType === "NEET" ? 45 : 60;
}

export function plannerTaskTimeWindow(
  task: StudyTask,
  ctx: PlannerCalendarContext,
  slotIndex = 0,
): { startDateTime: string; endDateTime: string } {
  const category = categorizePlannerTask(task);
  const duration =
    category === "mock" ? mockDurationMinutes(task, ctx.examType) : Math.max(task.duration, 25);
  const startMinutes = defaultStartMinutes(ctx.productiveTime) + slotIndex * (duration + 15);
  const endMinutes = startMinutes + duration;

  return {
    startDateTime: minutesToDateTime(task.date, startMinutes),
    endDateTime: minutesToDateTime(task.date, endMinutes),
  };
}

function buildTaskDescription(
  task: StudyTask,
  ctx: PlannerCalendarContext,
  category: CalendarTaskCategory,
): string {
  const lines = [
    `Subject: ${task.subject}`,
    `Topic: ${task.topic}`,
    `Priority: ${task.priority}`,
    `Status: ${task.status}`,
    `Exam: ${examLabel(ctx.examType)}`,
  ];

  if (category === "mock") {
    lines.push("Mock test block — complete in Mock Center.");
  } else if (category === "recovery") {
    lines.push("Recovery task from mock analysis.");
  } else if (category === "revision") {
    lines.push("Spaced revision session.");
  }

  if (ctx.examType === "NEET" && task.subject === "Biology") {
    lines.push("NEET: prioritize NCERT diagrams and terminology.");
  }
  if (ctx.examType === "JEE" && task.subject === "Mathematics") {
    lines.push("JEE: timed problem practice recommended.");
  }

  return lines.join("\n");
}

export function plannerTaskToCalendarInput(
  task: StudyTask,
  ctx: PlannerCalendarContext,
  slotIndex = 0,
): CalendarEventInput {
  const category = categorizePlannerTask(task);
  const { startDateTime, endDateTime } = plannerTaskTimeWindow(task, ctx, slotIndex);
  const prefix = task.status === "Completed" ? "✅ " : "";

  return {
    summary: `${prefix}${categoryEmoji(category)} [${examLabel(ctx.examType)}] ${task.title}`,
    description: buildTaskDescription(task, ctx, category),
    startDateTime,
    endDateTime,
    timeZone: calendarTimeZone(),
    taskId: task.id,
    category,
  };
}

/** Sync a single planner task to Google Calendar (upsert by task id). */
export async function syncPlannerTask(
  task: StudyTask,
  ctx: PlannerCalendarContext,
  slotIndex = 0,
): Promise<CalendarEventResult> {
  if (!isGoogleCalendarConfigured()) {
    return { ok: false, error: "Calendar not configured" };
  }
  if (task.status === "Completed") {
    return { ok: true };
  }
  return createCalendarEvent(plannerTaskToCalendarInput(task, ctx, slotIndex));
}

const MAX_CALENDAR_SYNC_TASKS = 8;

/** Sync multiple planner tasks (daily plan, recovery batch). */
export async function syncPlannerTasks(
  tasks: StudyTask[],
  ctx: PlannerCalendarContext,
): Promise<CalendarEventResult[]> {
  const pending = tasks.filter((t) => t.status !== "Completed").slice(0, MAX_CALENDAR_SYNC_TASKS);
  const results: CalendarEventResult[] = [];

  for (let i = 0; i < pending.length; i += 1) {
    results.push(await syncPlannerTask(pending[i], ctx, i));
  }

  return results;
}

export type FocusSessionScheduleInput = {
  session: PersistedFocusSession;
  ctx: PlannerCalendarContext;
  when?: string;
};

/** Schedule a Deep Focus session on Google Calendar. */
export async function scheduleFocusSession(
  input: FocusSessionScheduleInput,
): Promise<CalendarEventResult> {
  if (!isGoogleCalendarConfigured()) {
    return { ok: false, error: "Calendar not configured" };
  }

  const { session, ctx } = input;
  const date = input.when ?? new Date().toISOString().slice(0, 10);
  const durationMinutes = Math.max(Math.round(session.workSeconds / 60), 25);
  const startMinutes = defaultStartMinutes(ctx.productiveTime);
  const endMinutes = startMinutes + durationMinutes;

  return createCalendarEvent({
    summary: `🎯 [${examLabel(ctx.examType)}] Deep Focus — ${session.topic}`,
    description: [
      `Subject: ${session.subject}`,
      `Mode: ${session.mode}`,
      `Target: ${session.target}`,
      `Exam: ${examLabel(ctx.examType)}`,
      "Deep Focus session from Dhruvyantra.",
    ].join("\n"),
    startDateTime: minutesToDateTime(date, startMinutes),
    endDateTime: minutesToDateTime(date, endMinutes),
    timeZone: calendarTimeZone(),
    taskId: `focus-${session.id}`,
    category: "focus",
  });
}

export function profileToCalendarContext(profile: UserProfile): PlannerCalendarContext {
  return {
    examType: profile.examType,
    productiveTime: profile.productiveTime,
  };
}

export async function syncPlannerTasksForProfile(
  profile: UserProfile,
  tasks: StudyTask[],
): Promise<CalendarEventResult[]> {
  return syncPlannerTasks(tasks, profileToCalendarContext(profile));
}

export async function scheduleFocusSessionForProfile(
  profile: UserProfile,
  session: PersistedFocusSession,
): Promise<CalendarEventResult> {
  return scheduleFocusSession({
    session,
    ctx: profileToCalendarContext(profile),
  });
}

/** Fire-and-forget calendar sync (never blocks API responses). */
export function dispatchCalendarSync(
  work: () => Promise<unknown>,
  label = "planner-calendar",
): void {
  void work().catch((e) => {
    console.warn(`[${label}] Google Calendar sync failed:`, e);
  });
}

/** Coral MCP placeholders. */
export async function syncPlannerTaskViaAgent(
  task: StudyTask,
  ctx: PlannerCalendarContext,
  slotIndex = 0,
): Promise<CalendarEventResult> {
  if (task.status === "Completed") return { ok: true };
  return createCalendarEventViaAgent(plannerTaskToCalendarInput(task, ctx, slotIndex));
}

export async function scheduleFocusSessionViaAgent(
  input: FocusSessionScheduleInput,
): Promise<CalendarEventResult> {
  const { session, ctx } = input;
  const date = input.when ?? new Date().toISOString().slice(0, 10);
  const durationMinutes = Math.max(Math.round(session.workSeconds / 60), 25);
  const startMinutes = defaultStartMinutes(ctx.productiveTime);
  const endMinutes = startMinutes + durationMinutes;

  return createCalendarEventViaAgent({
    summary: `🎯 [${examLabel(ctx.examType)}] Deep Focus — ${session.topic}`,
    description: `Deep Focus — ${session.subject}`,
    startDateTime: minutesToDateTime(date, startMinutes),
    endDateTime: minutesToDateTime(date, endMinutes),
    timeZone: calendarTimeZone(),
    taskId: `focus-${session.id}`,
    category: "focus",
  });
}
