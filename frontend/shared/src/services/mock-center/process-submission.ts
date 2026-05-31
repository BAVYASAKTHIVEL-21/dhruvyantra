import { createStudyTask, isNotionPlannerConfigured } from "@/lib/planner/notion";
import { mergeTasksIntoCookieStore } from "@/lib/mission-control/task-history";
import { saveMockSubmission } from "@/lib/mock-center/store";
import type { UserProfile } from "@/lib/profile/types";
import type {
  MockSubmissionPayload,
  MockSubmissionRecord,
  MockSubmissionResponse,
} from "@/types/mock-results";
import type { StudyTask } from "@/types/planner";
import { dispatchParentNotification } from "@/lib/parent-connect/dispatch";
import { notifyMockPerformance } from "@/lib/parent-connect/notifications";
import { isTelegramConfigured } from "@/lib/integrations/telegram";
import {
  dispatchCalendarSync,
  syncPlannerTasksForProfile,
} from "@/lib/planner/calendar-sync";
import { isGoogleCalendarConfigured } from "@/lib/integrations/google-calendar";
import { actionsFromMockSubmission } from "@/services/intelligence/study-actions";
import { toProfileMe } from "@/lib/profile/me-types";
import { analyzeMockSubmission } from "./analyze-mock";
import { buildRecoveryPlannerTasks } from "./recovery-planner";
import {
  recommendRecoveryResources,
  resourceIdsFromRecommendations,
} from "./recovery-resources";
import { buildSeededMockSubmission } from "./seed-submission";
import { wireMockCenterIntegrations } from "./wire-integrations";

function submissionId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function persistRecoveryTasks(
  userId: string,
  tasks: StudyTask[],
): Promise<StudyTask[]> {
  if (tasks.length === 0) return [];

  const saved: StudyTask[] = [];
  if (isNotionPlannerConfigured()) {
    for (const task of tasks) {
      try {
        saved.push(await createStudyTask(task));
      } catch (e) {
        console.warn("[mock-center] Notion recovery task failed:", e);
        saved.push(task);
      }
    }
  } else {
    saved.push(...tasks);
  }

  await mergeTasksIntoCookieStore(userId, saved);
  return saved;
}

export async function processMockSubmission(
  profile: UserProfile,
  payload: MockSubmissionPayload,
): Promise<MockSubmissionResponse> {
  const resolved: MockSubmissionPayload =
    payload.useSeeded || payload.questions.length === 0
      ? buildSeededMockSubmission(profile, payload.mockType, {
          title: payload.title,
          plannerTaskId: payload.plannerTaskId,
          mockId: payload.mockId,
        })
      : payload;

  const analysis = analyzeMockSubmission(resolved);
  const resourceRecommendations = await recommendRecoveryResources(
    analysis,
    profile.examType,
  );
  const recoveryTasks = buildRecoveryPlannerTasks(
    profile,
    analysis,
    resourceRecommendations,
  );

  const savedTasks = await persistRecoveryTasks(profile.userId, recoveryTasks);

  const record: MockSubmissionRecord = {
    id: resolved.mockId ?? submissionId(),
    title: resolved.title,
    mockType: resolved.mockType,
    examType: resolved.examType,
    submittedAt: analysis.submittedAt,
    plannerTaskId: resolved.plannerTaskId,
    durationMinutes: resolved.durationMinutes,
    analysis,
    resourceRecommendations,
    recoveryTaskIds: savedTasks.map((t) => t.id),
  };

  await saveMockSubmission(profile.userId, record);

  const { integrations } = await wireMockCenterIntegrations(profile, record);

  const studyActions = actionsFromMockSubmission(toProfileMe(profile), record, savedTasks);

  if (isTelegramConfigured()) {
    dispatchParentNotification(() =>
      notifyMockPerformance(profile.userId, record, profile),
    );
  }

  if (isGoogleCalendarConfigured() && savedTasks.length > 0) {
    dispatchCalendarSync(() => syncPlannerTasksForProfile(profile, savedTasks));
  }

  return {
    submission: record,
    recoveryTasks: savedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      topic: t.topic,
      date: t.date,
    })),
    integrations,
    studyActions,
  };
}

/** Auto-process when a planner mock task is marked complete (seeded answers). */
export async function processMockFromPlannerTask(
  profile: UserProfile,
  task: StudyTask,
): Promise<MockSubmissionResponse | null> {
  const mockType =
    task.subject === "Full Length Test" || task.title.toLowerCase().includes("full")
      ? "full"
      : task.title.toLowerCase().includes("pyq") || task.title.toLowerCase().includes("speed")
        ? "pyq"
        : "chapter";

  return processMockSubmission(profile, {
    mockType,
    title: task.title,
    examType: profile.examType ?? "JEE",
    questions: [],
    plannerTaskId: task.id,
    useSeeded: true,
    durationMinutes: task.duration,
  });
}

export { resourceIdsFromRecommendations };
