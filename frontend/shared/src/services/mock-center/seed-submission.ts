import { EXAM_CONFIG, type ExamType } from "@/config/exam-config";
import type { UserProfile } from "@/lib/profile/types";
import type { MockQuestionResult, MockSubmissionPayload, MockType } from "@/types/mock-results";
import {
  pickTopicsForMock,
  questionCountForType,
} from "./mock-questions";

const WEAK_ACCURACY_BIAS = 0.35;
const STRONG_ACCURACY_BIAS = 0.75;

function outcomeForTopic(isWeakFocus: boolean, index: number): MockQuestionResult["outcome"] {
  const roll = (index * 17 + (isWeakFocus ? 3 : 11)) % 10;
  if (isWeakFocus) {
    if (roll < 3) return "correct";
    if (roll < 6) return "incorrect";
    return "skipped";
  }
  if (roll < 7) return "correct";
  if (roll < 9) return "incorrect";
  return "skipped";
}

/**
 * Deterministic seeded mock answers derived from profile weak topics.
 * Weak areas get lower accuracy; strong syllabus areas score higher.
 */
export function buildSeededMockSubmission(
  profile: UserProfile,
  mockType: MockType,
  overrides?: Partial<Pick<MockSubmissionPayload, "title" | "plannerTaskId" | "mockId">>,
): MockSubmissionPayload {
  const exam = profile.examType ?? "JEE";
  const topicPool = pickTopicsForMock(profile, mockType === "full" ? 6 : 4);
  const primaryWeak = topicPool[0];
  const count = questionCountForType(mockType, exam);

  const questions: MockQuestionResult[] = [];
  for (let i = 0; i < count; i++) {
    const row = topicPool[i % topicPool.length];
    const isWeakFocus = row.topic === primaryWeak.topic;
    questions.push({
      questionId: `seed-${mockType}-${i + 1}`,
      topic: row.topic,
      subject: row.subject,
      outcome: outcomeForTopic(isWeakFocus, i),
    });
  }

  const title =
    overrides?.title ??
    (mockType === "full"
      ? `Full ${exam} Syllabus Mock`
      : mockType === "pyq"
        ? `${exam === "NEET" ? "NCERT" : "PYQ"} Speed Drill`
        : `Chapter Mock — ${primaryWeak.topic}`);

  return {
    mockId: overrides?.mockId,
    plannerTaskId: overrides?.plannerTaskId,
    mockType,
    title,
    examType: exam,
    questions,
    durationMinutes: mockType === "full" ? (exam === "NEET" ? 200 : 180) : mockType === "pyq" ? 90 : 60,
    useSeeded: true,
  };
}

export const MOCK_ANALYSIS_THRESHOLDS = {
  weakAccuracyMax: 55,
  strongAccuracyMin: 75,
  weakIncorrectRatio: 0.45,
} as const;

/** Rough expected accuracy for seeded weak-focus topics (for tests/docs). */
export function seededWeakTopicAccuracyEstimate(): number {
  return Math.round(WEAK_ACCURACY_BIAS * 100);
}

export function seededStrongTopicAccuracyEstimate(): number {
  return Math.round(STRONG_ACCURACY_BIAS * 100);
}
