import { getTopicsForSubject } from "@/config/syllabus";
import type { ExamType } from "@/config/exam-config";
import { EXAM_CONFIG, defaultSubjectsForExam, isSubjectValidForExam } from "@/config/exam-config";
import { todayPlanDate } from "@/lib/planner/planner-dates";
import type { UserProfile } from "@/lib/profile/types";
import type { Resource } from "@/types/resource";
import type { StudyTask, TaskPriority } from "@/types/planner";

/**
 * Planner Agent — exam-aware, syllabus-aware daily task generation (rule-based, no LLM).
 */

export type PlannerAgentInput = {
  profile: UserProfile;
  resources: Resource[];
  date?: string;
};

type TaskKind =
  | "revision"
  | "pyqs"
  | "dpp"
  | "notes"
  | "mock"
  | "timed"
  | "memorization"
  | "diagram";

type TaskBlueprint = {
  title: string;
  subject: string;
  topic: string;
  priority: TaskPriority;
  duration: number;
  kind: TaskKind;
};

const TASK_TEMPLATES: Record<TaskKind, TaskBlueprint[]> = {
  revision: [
    {
      title: "{topic} Revision Cycle",
      subject: "{subject}",
      topic: "{topic}",
      priority: "High",
      duration: 45,
      kind: "revision",
    },
  ],
  pyqs: [
    {
      title: "Advanced PYQs — {topic}",
      subject: "{subject}",
      topic: "{topic}",
      priority: "High",
      duration: 60,
      kind: "pyqs",
    },
  ],
  dpp: [
    {
      title: "{topic} DPP Drill",
      subject: "{subject}",
      topic: "{topic}",
      priority: "Medium",
      duration: 40,
      kind: "dpp",
    },
  ],
  timed: [
    {
      title: "Timed Numericals — {topic}",
      subject: "{subject}",
      topic: "{topic}",
      priority: "High",
      duration: 50,
      kind: "timed",
    },
  ],
  notes: [
    {
      title: "{topic} NCERT Notes Review",
      subject: "{subject}",
      topic: "{topic}",
      priority: "Medium",
      duration: 35,
      kind: "notes",
    },
  ],
  memorization: [
    {
      title: "{topic} Flash Recall",
      subject: "{subject}",
      topic: "{topic}",
      priority: "High",
      duration: 30,
      kind: "memorization",
    },
  ],
  diagram: [
    {
      title: "Diagram Practice — {topic}",
      subject: "{subject}",
      topic: "{topic}",
      priority: "Medium",
      duration: 35,
      kind: "diagram",
    },
  ],
  mock: [
    {
      title: "Full {exam} Timed Mock",
      subject: "Full Length Test",
      topic: "Full Syllabus",
      priority: "High",
      duration: 180,
      kind: "mock",
    },
  ],
};

function todayIso(date?: string): string {
  if (date) return date;
  return todayPlanDate();
}

function resolveSubject(weakSubject: string, exam: ExamType | null): string {
  const allowed = exam ? EXAM_CONFIG[exam].subjects : defaultSubjectsForExam(exam);
  if ((allowed as readonly string[]).includes(weakSubject)) return weakSubject;
  return allowed[0] ?? weakSubject;
}

function pickTopic(profile: UserProfile, subject: string, index: number): string {
  if (profile.examType) {
    const subjectTopics = [...getTopicsForSubject(profile.examType, subject)];
    if (profile.weakTopics.length > 0) {
      const matching = profile.weakTopics.filter((t) => subjectTopics.includes(t));
      if (matching.length > 0) return matching[index % matching.length];
    }
    if (subjectTopics.length > 0) return subjectTopics[index % subjectTopics.length];
  }

  return `${subject} fundamentals`;
}

function fillTemplate(
  blueprint: TaskBlueprint,
  subject: string,
  topic: string,
  exam: ExamType | null,
): TaskBlueprint {
  const replace = (s: string) =>
    s.replace("{subject}", subject).replace("{topic}", topic).replace("{exam}", exam ?? "Exam");
  return {
    ...blueprint,
    title: replace(blueprint.title),
    subject: replace(blueprint.subject),
    topic: replace(blueprint.topic),
  };
}

function taskCountForHours(hours: number): number {
  if (hours >= 8) return 5;
  if (hours >= 6) return 4;
  return 3;
}

function plannerKindsForExam(exam: ExamType): TaskKind[] {
  return [...EXAM_CONFIG[exam].plannerKinds];
}

function matchResources(
  resources: Resource[],
  subject: string,
  topic: string,
  kind: TaskKind,
  exam: ExamType | null,
): string[] {
  const topicLower = topic.toLowerCase();
  const subjectLower = subject.toLowerCase();
  const tagHints = exam ? EXAM_CONFIG[exam].resourceTags : [];

  const scored = resources.map((r) => {
    let score = 0;
    const haystack = [r.title, r.topic, r.subject, ...r.tags].join(" ").toLowerCase();
    if (r.subject.toLowerCase() === subjectLower || subjectLower === "full length test") score += 4;
    if (haystack.includes(topicLower)) score += 8;
    if (kind === "pyqs" && r.type === "PYQs") score += 6;
    if (kind === "dpp" && r.type === "DPPs") score += 6;
    if ((kind === "notes" || kind === "revision" || kind === "memorization") && r.type === "Notes") {
      score += 5;
    }
    if (exam === "JEE" && (r.type === "PYQs" || r.type === "DPPs")) score += 4;
    if (exam === "NEET" && (r.type === "Notes" || r.subject === "Biology")) score += 4;
    for (const tag of tagHints) {
      if (r.tags.some((t) => t.toLowerCase().includes(tag))) score += 3;
    }
    if (r.recommended) score += 2;
    return { id: r.id, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.id);
}

function scheduleTimes(
  tasks: StudyTask[],
  productiveTime: UserProfile["productiveTime"],
): StudyTask[] {
  const morning = ["6:00 AM", "8:30 AM", "10:30 AM", "2:00 PM", "4:30 PM", "7:00 PM"];
  const evening = ["4:00 PM", "5:30 PM", "7:00 PM", "8:30 PM", "9:30 PM", "10:30 PM"];
  const night = ["6:00 PM", "7:30 PM", "8:30 PM", "9:30 PM", "10:30 PM", "11:00 PM"];

  let slots = evening;
  if (productiveTime === "Morning") slots = morning;
  if (productiveTime === "Night") slots = night;

  if (productiveTime === "Night") {
    const rest = tasks.filter((t) => t.priority !== "High");
    const high = tasks.filter((t) => t.priority === "High");
    return [...rest, ...high].map((task, i) => ({
      ...task,
      scheduledTime: slots[i] ?? slots[slots.length - 1],
    }));
  }

  return tasks.map((task, i) => ({
    ...task,
    scheduledTime: slots[i] ?? slots[slots.length - 1],
  }));
}

function buildBlueprints(profile: UserProfile): TaskBlueprint[] {
  const exam = profile.examType;
  if (!exam) return [];

  const weak =
    profile.weakSubjects.length > 0
      ? profile.weakSubjects.filter((s) => isSubjectValidForExam(exam, s))
      : [...EXAM_CONFIG[exam].subjects];

  const count = taskCountForHours(profile.dailyStudyHours);
  const kinds = plannerKindsForExam(exam);
  const blueprints: TaskBlueprint[] = [];

  for (let i = 0; i < count; i++) {
    const ws = weak[i % weak.length];
    const subject = resolveSubject(ws, exam);
    const topic = pickTopic(profile, subject, i);
    const kind = kinds[i % kinds.length];
    const template = TASK_TEMPLATES[kind][0];
    blueprints.push(fillTemplate(template, subject, topic, exam));
  }

  if (profile.dailyStudyHours >= 6) {
    blueprints.push(fillTemplate(TASK_TEMPLATES.mock[0], "Full Length Test", "Full Syllabus", exam));
  }

  return blueprints;
}

/** Rule-based daily plan generation — exam-aware, syllabus-aware, deterministic */
export function runPlannerAgent(input: PlannerAgentInput): StudyTask[] {
  const { profile, resources, date } = input;
  const planDate = todayIso(date);
  const blueprints = buildBlueprints(profile);

  const tasks: StudyTask[] = blueprints.map((bp, i) => {
    const resourceIds = matchResources(
      resources,
      bp.subject,
      bp.topic,
      bp.kind,
      profile.examType,
    );
    return {
      id: `draft-${planDate}-${i}`,
      studentId: profile.userId,
      title: bp.title,
      subject: bp.subject,
      topic: bp.topic,
      priority: bp.priority,
      date: planDate,
      duration: bp.duration,
      status: "Pending",
      aiGenerated: true,
      recommendedResourceIds: resourceIds,
      createdAt: new Date().toISOString(),
    };
  });

  return scheduleTimes(tasks, profile.productiveTime);
}

export function generateDailyPlan(input: PlannerAgentInput): StudyTask[] {
  return runPlannerAgent(input);
}

export async function schedulePlanViaCoral(_tasks: StudyTask[]): Promise<void> {
  // TODO: Coral MCP → Google Calendar API
}
