import { EXAM_CONFIG, type ExamType } from "@/config/exam-config";
import { getTopicsForSubject } from "@/config/syllabus";
import type { UserProfile } from "@/lib/profile/types";
import type { MockType } from "@/types/mock-results";

export type MockSessionQuestion = {
  questionId: string;
  topic: string;
  subject: string;
  stem: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
};

export function questionCountForType(mockType: MockType, exam: ExamType): number {
  if (mockType === "full") return exam === "NEET" ? 40 : 30;
  if (mockType === "pyq") return 20;
  return 15;
}

export function pickTopicsForMock(
  profile: UserProfile,
  count: number,
): { topic: string; subject: string }[] {
  const exam = profile.examType;
  if (!exam) {
    return [{ topic: "General", subject: "Physics" }];
  }

  const rows: { topic: string; subject: string }[] = [];
  const subjects = profile.weakSubjects.length
    ? profile.weakSubjects.filter((s) => EXAM_CONFIG[exam].subjects.includes(s as never))
    : [...EXAM_CONFIG[exam].subjects];

  for (const subject of subjects) {
    const syllabus = [...getTopicsForSubject(exam, subject)];
    const weakMatches = profile.weakTopics.filter((t) => syllabus.includes(t));
    for (const topic of weakMatches.slice(0, 2)) {
      rows.push({ topic, subject });
    }
    for (const topic of syllabus.slice(0, 2)) {
      if (!rows.some((r) => r.topic === topic)) rows.push({ topic, subject });
    }
  }

  if (rows.length === 0) {
    const subject = subjects[0];
    rows.push({ topic: profile.weakTopics[0] ?? `${subject} fundamentals`, subject });
  }

  return rows.slice(0, count);
}

function optionLabels(exam: ExamType, subject: string, topic: string): string[] {
  if (exam === "JEE") {
    if (subject === "Physics") {
      return [
        `Apply conservation laws in ${topic}`,
        `Use kinematics only (incorrect shortcut)`,
        `Ignore friction in ${topic} setup`,
        `Unit conversion error path`,
      ];
    }
    if (subject === "Chemistry") {
      return [
        `Correct mechanism for ${topic}`,
        `Wrong reagent in ${topic} step`,
        `Mixes up isomers in ${topic}`,
        `Violates stoichiometry in ${topic}`,
      ];
    }
    return [
      `Correct ${topic} algebraic setup`,
      `Sign error in ${topic} expansion`,
      `Wrong formula applied in ${topic}`,
      `Arithmetic slip in ${topic}`,
    ];
  }

  if (subject === "Biology") {
    return [
      `NCERT-accurate ${topic} statement`,
      `Diagram label error in ${topic}`,
      `Confuses ${topic} with adjacent chapter`,
      `Outdated exception for ${topic}`,
    ];
  }

  return [
    `NCERT line-true ${topic} concept`,
    `Common trap in ${topic} recall`,
    `Partially true but incomplete ${topic} fact`,
    `Misapplied ${topic} definition`,
  ];
}

function buildStem(exam: ExamType, subject: string, topic: string, index: number): string {
  if (exam === "JEE") {
    if (subject === "Physics") {
      return `Q${index}. (${subject}) ${topic}: A JEE-style numerical tests your concept application. Which approach gives the correct solution path?`;
    }
    if (subject === "Mathematics") {
      return `Q${index}. (${subject}) ${topic}: Solve the multi-step problem. Which method setup is correct?`;
    }
    return `Q${index}. (${subject}) ${topic}: Identify the correct reasoning for this Advanced-level item.`;
  }

  if (subject === "Biology") {
    return `Q${index}. (${subject}) ${topic}: NCERT diagram / statement based question — pick the best answer.`;
  }

  return `Q${index}. (${subject}) ${topic}: NCERT-based concept check — select the correct option.`;
}

export function buildMockSessionQuestions(
  profile: UserProfile,
  mockType: MockType,
): MockSessionQuestion[] {
  const exam = profile.examType ?? "JEE";
  const count = questionCountForType(mockType, exam);
  const topicPool = pickTopicsForMock(profile, mockType === "full" ? 6 : 4);

  return Array.from({ length: count }, (_, i) => {
    const row = topicPool[i % topicPool.length];
    const labels = optionLabels(exam, row.subject, row.topic);
    const correctOptionId = "a";

    return {
      questionId: `mock-${mockType}-${i + 1}`,
      topic: row.topic,
      subject: row.subject,
      stem: buildStem(exam, row.subject, row.topic, i + 1),
      options: labels.map((label, idx) => ({
        id: String.fromCharCode(97 + idx),
        label,
      })),
      correctOptionId,
    };
  });
}

export function outcomesFromAnswers(
  questions: MockSessionQuestion[],
  answers: Record<string, string | null | undefined>,
): { questionId: string; topic: string; subject: string; outcome: "correct" | "incorrect" | "skipped" }[] {
  return questions.map((q) => {
    const selected = answers[q.questionId];
    if (!selected) {
      return { questionId: q.questionId, topic: q.topic, subject: q.subject, outcome: "skipped" as const };
    }
    return {
      questionId: q.questionId,
      topic: q.topic,
      subject: q.subject,
      outcome: selected === q.correctOptionId ? ("correct" as const) : ("incorrect" as const),
    };
  });
}
