export type ExamType = "JEE" | "NEET";

export type ExamSubject = "Physics" | "Chemistry" | "Mathematics" | "Biology";

export const EXAM_CONFIG = {
  JEE: {
    label: "JEE",
    subjects: ["Physics", "Chemistry", "Mathematics"] as const,
    focusAreas: ["Problem Solving", "Advanced PYQs", "Timed Practice"] as const,
    resourcePriorities: ["PYQs", "DPPs", "Books"] as const,
    resourceTags: ["advanced", "mock", "numerical"] as const,
    plannerKinds: ["pyqs", "dpp", "timed", "mock"] as const,
    mentorStyle: "conceptual depth, derivations, and advanced problem-solving",
  },
  NEET: {
    label: "NEET",
    subjects: ["Physics", "Chemistry", "Biology"] as const,
    focusAreas: ["NCERT Revision", "Diagram Practice", "Rapid Revision"] as const,
    resourcePriorities: ["Notes", "Books", "Videos"] as const,
    resourceTags: ["ncert", "revision", "flashcard", "diagram"] as const,
    plannerKinds: ["revision", "memorization", "notes", "diagram"] as const,
    mentorStyle: "memory techniques, NCERT line focus, and rapid revision",
  },
} as const;

export function getExamSubjects(exam: ExamType): readonly string[] {
  return EXAM_CONFIG[exam].subjects;
}

export function isSubjectValidForExam(exam: ExamType, subject: string): boolean {
  return (EXAM_CONFIG[exam].subjects as readonly string[]).includes(subject);
}

export function filterSubjectsForExam(exam: ExamType | null, subjects: string[]): string[] {
  if (!exam) return [];
  const allowed = new Set<string>(EXAM_CONFIG[exam].subjects);
  return subjects.filter((s) => allowed.has(s));
}

export function defaultSubjectsForExam(exam: ExamType | null): string[] {
  if (exam === "NEET") return [...EXAM_CONFIG.NEET.subjects];
  if (exam === "JEE") return [...EXAM_CONFIG.JEE.subjects];
  return [];
}

export function formatExamSubjects(exam: ExamType): string {
  return EXAM_CONFIG[exam].subjects.join(" · ");
}
