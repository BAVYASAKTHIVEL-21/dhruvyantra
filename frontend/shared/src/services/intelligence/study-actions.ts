import type { ExamType } from "@/config/exam-config";
import {
  buildFocusHref,
  buildMockSessionHref,
  buildResourceHrefFromMockRecommendation,
  buildResourcesHref,
} from "@/lib/mission-control/navigation";
import type { ProfileMe } from "@/lib/profile/me-types";
import type {
  MockResourceRecommendation,
  MockSubmissionRecord,
} from "@/types/mock-results";
import type { StudyAction, StudyActionType } from "@/types/intelligence";
import type { StudyTask } from "@/types/planner";
import type { WeaknessEngineResult } from "@/types/weakness";

function action(
  partial: Omit<StudyAction, "payload"> & { payload?: StudyAction["payload"] },
): StudyAction {
  const { payload, ...rest } = partial;
  return {
    ...rest,
    payload: payload ?? {},
  };
}

export function scheduleRecoverySessionAction(params: {
  topic: string;
  subject: string;
  durationMin: number;
  date: string;
  taskId?: string;
  examType: ExamType | null;
}): StudyAction {
  const title =
    params.examType === "JEE"
      ? `${params.topic} PYQ Recovery Session`
      : `${params.topic} Recovery Session`;

  return action({
    id: `recovery-${params.taskId ?? params.topic}`,
    type: "schedule_recovery_session",
    priority: "high",
    title,
    reason: `Mock weak area: ${params.topic} (${params.subject}).`,
    href: "/dashboard",
    source: "mock",
    payload: {
      topic: params.topic,
      subject: params.subject,
      durationMin: params.durationMin,
      date: params.date,
      taskId: params.taskId ?? null,
    },
  });
}

export function recommendResourceAction(params: {
  resourceId: string;
  title: string;
  topic: string;
  subject: string;
  examType: ExamType | null;
  type: string;
}): StudyAction {
  const href = buildResourceHrefFromMockRecommendation({
    title: params.title,
    topic: params.topic,
    subject: params.subject,
    type: params.type,
    examType: params.examType,
  });

  return action({
    id: `resource-${params.resourceId}`,
    type: "recommend_resource",
    priority: "medium",
    title: params.title,
    reason: `Recovery material for ${params.topic}.`,
    href,
    source: "mock",
    payload: {
      resourceId: params.resourceId,
      topic: params.topic,
      subject: params.subject,
      type: params.type,
    },
  });
}

export function startFocusSessionAction(params: {
  topic: string;
  subject: string;
  durationMin: number;
  productiveTime?: string;
}): StudyAction {
  const href = buildFocusHref({
    topic: params.topic,
    subject: params.subject,
    duration: params.durationMin,
    productiveTime: params.productiveTime,
  });

  return action({
    id: `focus-${params.topic}`,
    type: "start_focus_session",
    priority: "high",
    title: `Focus: ${params.topic}`,
    reason: `Low mastery on ${params.topic} — block distractions for ${params.durationMin} min.`,
    href,
    source: "weakness",
    payload: {
      topic: params.topic,
      subject: params.subject,
      durationMin: params.durationMin,
    },
  });
}

export function actionsFromMockSubmission(
  profile: ProfileMe,
  record: MockSubmissionRecord,
  recoveryTasks: Pick<StudyTask, "id" | "title" | "topic" | "subject" | "date" | "duration">[],
): StudyAction[] {
  const actions: StudyAction[] = [];

  for (const task of recoveryTasks.slice(0, 3)) {
    actions.push(
      scheduleRecoverySessionAction({
        topic: task.topic,
        subject: task.subject,
        durationMin: task.duration,
        date: task.date,
        taskId: task.id,
        examType: profile.examType,
      }),
    );
  }

  for (const rec of record.resourceRecommendations.slice(0, 3)) {
    actions.push(
      recommendResourceAction({
        resourceId: rec.resourceId,
        title: rec.title,
        topic: rec.topic,
        subject: rec.subject,
        examType: profile.examType,
        type: rec.type,
      }),
    );
  }

  const weak = record.analysis.weakTopics[0];
  if (weak) {
    actions.push(
      startFocusSessionAction({
        topic: weak.topic,
        subject: weak.subject,
        durationMin: profile.examType === "JEE" ? 45 : 35,
        productiveTime: profile.productiveTime ?? undefined,
      }),
    );
  }

  return dedupeActions(actions);
}

export function actionsFromWeakness(
  profile: ProfileMe,
  weakness: WeaknessEngineResult,
): StudyAction[] {
  const actions: StudyAction[] = [];
  const top = weakness.topics.slice(0, 2);

  for (const row of top) {
    if (row.masteryScore >= 55) continue;

    actions.push(
      startFocusSessionAction({
        topic: row.topic,
        subject: row.subject,
        durationMin: row.masteryScore < 40 ? 50 : 40,
        productiveTime: profile.productiveTime ?? undefined,
      }),
    );

    actions.push(
      action({
        id: `resources-${row.topic}`,
        type: "recommend_resource",
        priority: "medium",
        title: `Resources: ${row.topic}`,
        reason: `Mastery ${row.masteryScore}/100 on ${row.topic}.`,
        href: buildResourcesHref({
          topic: row.topic,
          subject: row.subject,
          exam: profile.examType ?? undefined,
        }),
        source: "weakness",
        payload: {
          topic: row.topic,
          subject: row.subject,
          masteryScore: row.masteryScore,
        },
      }),
    );
  }

  if (profile.examType && top[0]) {
    actions.push(
      action({
        id: `mock-chapter-${top[0].topic}`,
        type: "schedule_mock",
        priority: "low",
        title: `Chapter mock — ${top[0].topic}`,
        reason: "Validate recovery after practice.",
        href: buildMockSessionHref({
          mockType: "chapter",
          title: `Chapter Test — ${top[0].topic}`,
          duration: 60,
          questions: 15,
        }),
        source: "planner",
        payload: {
          mockType: "chapter",
          topic: top[0].topic,
          subject: top[0].subject,
        },
      }),
    );
  }

  return dedupeActions(actions);
}

export function mergeStudyActions(...groups: StudyAction[][]): StudyAction[] {
  return dedupeActions(groups.flat());
}

function dedupeActions(actions: StudyAction[]): StudyAction[] {
  const seen = new Set<string>();
  const out: StudyAction[] = [];
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const sorted = [...actions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  for (const a of sorted) {
    const key = `${a.type}:${a.payload.topic ?? a.payload.resourceId ?? a.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }

  return out.slice(0, 12);
}

/** Map study actions to Coral action type strings (mission control + MCP). */
export function studyActionToCoralType(type: StudyActionType): StudyActionType {
  return type;
}
