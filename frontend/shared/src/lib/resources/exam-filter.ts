import type { ExamType } from "@/config/exam-config";
import { getExamSubjects } from "@/config/exam-config";
import type { Resource, ResourceSubject } from "@/types/resource";

export function examResourceSubjects(examType: ExamType | null): ResourceSubject[] {
  if (examType === "JEE") return ["Physics", "Chemistry", "Mathematics"];
  if (examType === "NEET") return ["Physics", "Chemistry", "Biology"];
  return ["Physics", "Chemistry", "Mathematics", "Biology", "Others"];
}

export function isSubjectAllowedForExam(
  examType: ExamType | null,
  subject: ResourceSubject,
): boolean {
  if (!examType) return true;
  return examResourceSubjects(examType).includes(subject);
}

/** Keep only resources whose subject matches the user's exam syllabus. */
export function filterResourcesForExam(
  resources: Resource[],
  examType: ExamType | null,
): Resource[] {
  if (!examType) return resources;
  const allowed = new Set(examResourceSubjects(examType));
  return resources.filter((r) => allowed.has(r.subject));
}

export function countBySubjectForExam(
  resources: Resource[],
  examType: ExamType | null,
): Partial<Record<ResourceSubject, number>> {
  const counts: Partial<Record<ResourceSubject, number>> = {};
  for (const resource of filterResourcesForExam(resources, examType)) {
    counts[resource.subject] = (counts[resource.subject] ?? 0) + 1;
  }
  return counts;
}

export function orderedSubjectsWithCounts(
  counts: Partial<Record<ResourceSubject, number>>,
  examType: ExamType | null,
): ResourceSubject[] {
  const order: ResourceSubject[] = examType
    ? (getExamSubjects(examType) as ResourceSubject[])
    : (Object.keys(counts) as ResourceSubject[]);

  return order.filter((subject) => (counts[subject] ?? 0) > 0);
}
