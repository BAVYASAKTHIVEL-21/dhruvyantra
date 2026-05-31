import type { MockAnalysisResult, MockSubmissionPayload, MockTopicPerformance } from "@/types/mock-results";
import { MOCK_ANALYSIS_THRESHOLDS } from "./seed-submission";

function groupTopicPerformance(
  questions: MockSubmissionPayload["questions"],
): MockTopicPerformance[] {
  const map = new Map<string, MockTopicPerformance>();

  for (const q of questions) {
    const key = `${q.subject}::${q.topic}`;
    const row =
      map.get(key) ??
      ({
        topic: q.topic,
        subject: q.subject,
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        accuracy: 0,
      } satisfies MockTopicPerformance);

    row.total += 1;
    if (q.outcome === "correct") row.correct += 1;
    else if (q.outcome === "incorrect") row.incorrect += 1;
    else row.skipped += 1;

    map.set(key, row);
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      accuracy: row.total === 0 ? 0 : Math.round((row.correct / row.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy || a.topic.localeCompare(b.topic));
}

function isWeakTopic(row: MockTopicPerformance): boolean {
  const incorrectRatio = row.total === 0 ? 0 : row.incorrect / row.total;
  return (
    row.accuracy <= MOCK_ANALYSIS_THRESHOLDS.weakAccuracyMax ||
    row.skipped >= 2 ||
    incorrectRatio >= MOCK_ANALYSIS_THRESHOLDS.weakIncorrectRatio
  );
}

function isStrongTopic(row: MockTopicPerformance): boolean {
  return row.accuracy >= MOCK_ANALYSIS_THRESHOLDS.strongAccuracyMin && row.skipped === 0;
}

export function analyzeMockSubmission(payload: MockSubmissionPayload): MockAnalysisResult {
  const topicAccuracy = groupTopicPerformance(payload.questions);
  const totalQuestions = payload.questions.length;
  const totalCorrect = payload.questions.filter((q) => q.outcome === "correct").length;
  const totalIncorrect = payload.questions.filter((q) => q.outcome === "incorrect").length;
  const totalSkipped = payload.questions.filter((q) => q.outcome === "skipped").length;

  return {
    topicAccuracy,
    weakTopics: topicAccuracy.filter(isWeakTopic),
    strongTopics: topicAccuracy.filter(isStrongTopic).sort((a, b) => b.accuracy - a.accuracy),
    overallAccuracy:
      totalQuestions === 0 ? 0 : Math.round((totalCorrect / totalQuestions) * 100),
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    totalSkipped,
    submittedAt: new Date().toISOString(),
  };
}
