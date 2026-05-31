import type { ExamType } from "@/config/exam-config";
import type { ResourceFilter, ResourceSubject } from "@/types/resource";

export type ResourcesDeepLink = {
  type?: ResourceFilter;
  subject?: ResourceSubject | string;
  topic?: string;
  exam?: ExamType;
  q?: string;
};

export type FocusDeepLink = {
  topic?: string;
  subject?: string;
  duration?: number;
  productiveTime?: string;
};

export function buildResourcesHref(params: ResourcesDeepLink = {}): string {
  const qs = new URLSearchParams();
  if (params.exam) qs.set("exam", params.exam);
  if (params.type && params.type !== "All") qs.set("type", params.type);
  if (params.subject) qs.set("subject", params.subject);
  if (params.topic) qs.set("topic", params.topic);
  if (params.q) qs.set("q", params.q);
  const query = qs.toString();
  return query ? `/dashboard/resources?${query}` : "/dashboard/resources";
}

export function buildFocusHref(params: FocusDeepLink = {}): string {
  const qs = new URLSearchParams();
  if (params.topic) qs.set("topic", params.topic);
  if (params.subject) qs.set("subject", params.subject);
  if (params.duration) qs.set("duration", String(params.duration));
  if (params.productiveTime) qs.set("time", params.productiveTime);
  const query = qs.toString();
  return query ? `/dashboard/deep-focus?${query}` : "/dashboard/deep-focus";
}

export function buildMockCenterHref(examType?: ExamType | null): string {
  return examType ? `/dashboard/mock-center?exam=${examType}` : "/dashboard/mock-center";
}

export type MockSessionDeepLink = {
  mockType?: "full" | "chapter" | "pyq";
  plannerTaskId?: string;
  title?: string;
  duration?: number;
  questions?: number;
};

export function buildMockSessionHref(params: MockSessionDeepLink = {}): string {
  const qs = new URLSearchParams();
  if (params.mockType) qs.set("type", params.mockType);
  if (params.plannerTaskId) qs.set("taskId", params.plannerTaskId);
  if (params.title) qs.set("title", params.title);
  if (params.duration) qs.set("duration", String(params.duration));
  if (params.questions) qs.set("questions", String(params.questions));
  const query = qs.toString();
  return query ? `/dashboard/mock-center/session?${query}` : "/dashboard/mock-center/session";
}

export function examFocusResourcesHref(
  moduleId: string,
  profile: {
    examType: ExamType | null;
    weakTopics: string[];
    weakSubjects: string[];
  },
): string {
  const topic = profile.weakTopics[0] ?? "";
  const subject = profile.weakSubjects[0] ?? "";
  const exam = profile.examType ?? undefined;

  const map: Record<string, ResourcesDeepLink> = {
    "advanced-pyqs": { exam, type: "PYQs", topic, subject, q: "advanced" },
    "math-widgets": { exam, type: "DPPs", subject: "Mathematics", topic },
    "problem-solving": { exam, type: "DPPs", subject, topic },
    "timed-modules": { exam, type: "PYQs", subject, topic, q: "timed" },
    "bio-revision": { exam, type: "Notes", subject: "Biology", topic, q: "NCERT" },
    "ncert-tracker": { exam, type: "Notes", q: "NCERT" },
    "diagram-practice": { exam, type: "Notes", subject: "Biology", q: "diagram" },
    "rapid-revision": { exam, type: "Notes", topic, q: "revision" },
  };

  return buildResourcesHref(map[moduleId] ?? { exam, topic, subject });
}

export function weakTopicResourcesHref(
  topic: string,
  subject: string,
  examType: ExamType | null,
): string {
  return buildResourcesHref({
    exam: examType ?? undefined,
    topic,
    subject,
    type: examType === "JEE" ? "PYQs" : "Notes",
  });
}

/** Deep link to a single resource in the library (topic/subject/type filters). */
export function buildResourceHrefForTopic(params: {
  topic: string;
  subject: string;
  examType?: ExamType | null;
  type?: ResourceFilter;
  q?: string;
}): string {
  const exam = params.examType ?? undefined;
  const type =
    params.type ?? (exam === "JEE" ? "PYQs" : exam === "NEET" ? "Notes" : undefined);
  return buildResourcesHref({
    exam,
    topic: params.topic,
    subject: params.subject,
    type,
    q: params.q,
  });
}

/** Library filters for a mock recovery recommendation row. */
export function buildResourceHrefFromMockRecommendation(rec: {
  topic: string;
  subject: string;
  type: string;
  title?: string;
  examType?: ExamType | null;
}): string {
  const type =
    rec.type === "PYQs" || rec.type === "DPPs" || rec.type === "Notes" || rec.type === "Books"
      ? rec.type
      : undefined;
  return buildResourcesHref({
    exam: rec.examType ?? undefined,
    topic: rec.topic,
    subject: rec.subject,
    type: type as ResourceFilter | undefined,
    q: rec.title?.split(" ").slice(0, 2).join(" "),
  });
}
