import type { ExamType } from "../exam-config";
import { JEE_SYLLABUS } from "./jee";
import { NEET_SYLLABUS } from "./neet";

export type SyllabusMap = Record<string, readonly string[]>;

export const SYLLABUS = {
  JEE: JEE_SYLLABUS,
  NEET: NEET_SYLLABUS,
} as const;

export function getSyllabusForExam(exam: ExamType): SyllabusMap {
  return SYLLABUS[exam];
}

export function getTopicsForSubject(exam: ExamType, subject: string): readonly string[] {
  const syllabus = getSyllabusForExam(exam);
  return syllabus[subject] ?? [];
}

export function getAllTopicsForExam(exam: ExamType): string[] {
  const syllabus = getSyllabusForExam(exam);
  return Object.values(syllabus).flatMap((topics) => [...topics]);
}

export function getTopicsForWeakSubjects(exam: ExamType, subjects: string[]): string[] {
  const topics: string[] = [];
  for (const subject of subjects) {
    topics.push(...getTopicsForSubject(exam, subject));
  }
  return topics;
}

export function groupTopicsBySubject(
  exam: ExamType,
  subjects: string[],
): { subject: string; topics: readonly string[] }[] {
  return subjects
    .filter((s) => getTopicsForSubject(exam, s).length > 0)
    .map((subject) => ({ subject, topics: getTopicsForSubject(exam, subject) }));
}

export function filterTopicsForExam(exam: ExamType | null, topics: string[]): string[] {
  if (!exam) return topics;
  const allowed = new Set(getAllTopicsForExam(exam));
  return topics.filter((t) => allowed.has(t));
}

export function isTopicValidForExam(exam: ExamType, subject: string, topic: string): boolean {
  return getTopicsForSubject(exam, subject).includes(topic);
}

export { JEE_SYLLABUS, NEET_SYLLABUS };
