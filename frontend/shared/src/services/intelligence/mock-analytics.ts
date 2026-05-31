import { dayLabel, isoDate } from "@/lib/mission-control/dates";
import type { MockSubmissionRecord, MockTopicPerformance } from "@/types/mock-results";
import type { MockCenterAnalytics } from "@/types/intelligence";

function aggregateSubjects(submissions: MockSubmissionRecord[]): MockCenterAnalytics["subjectBreakdown"] {
  const bySubject = new Map<
    string,
    { attempts: number; accuracySum: number; weakCount: number }
  >();

  for (const sub of submissions) {
    for (const row of sub.analysis.topicAccuracy) {
      const existing = bySubject.get(row.subject) ?? {
        attempts: 0,
        accuracySum: 0,
        weakCount: 0,
      };
      existing.attempts += 1;
      existing.accuracySum += row.accuracy;
      if (sub.analysis.weakTopics.some((w) => w.topic === row.topic && w.subject === row.subject)) {
        existing.weakCount += 1;
      }
      bySubject.set(row.subject, existing);
    }
  }

  return [...bySubject.entries()]
    .map(([subject, v]) => ({
      subject,
      attempts: v.attempts,
      avgAccuracy: v.attempts === 0 ? 0 : Math.round(v.accuracySum / v.attempts),
      weakTopicCount: v.weakCount,
    }))
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy);
}

export function buildMockCenterAnalytics(
  submissions: MockSubmissionRecord[],
  aggregatedPerformances: MockTopicPerformance[] = [],
): MockCenterAnalytics {
  const sorted = [...submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const accuracies = sorted.map((s) => s.analysis.overallAccuracy).filter((n) => n > 0);

  const accuracyTrend = sorted.slice(0, 8).reverse().map((s) => {
    const date = s.submittedAt.slice(0, 10);
    return {
      date,
      label: dayLabel(date),
      accuracy: s.analysis.overallAccuracy,
      title: s.title,
    };
  });

  const topicHeatmap =
    aggregatedPerformances.length > 0
      ? aggregatedPerformances.slice(0, 12)
      : sorted[0]?.analysis.topicAccuracy.slice(0, 12) ?? [];

  const weakFromLatest = sorted[0]?.analysis.weakTopics ?? [];
  const weakTopicsFromMocks =
    weakFromLatest.length > 0
      ? weakFromLatest
      : topicHeatmap.filter((t) => t.accuracy < 55).slice(0, 6);

  return {
    submissionsCount: sorted.length,
    avgAccuracy:
      accuracies.length === 0
        ? null
        : Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
    latestAccuracy: sorted[0]?.analysis.overallAccuracy ?? null,
    accuracyTrend,
    subjectBreakdown: aggregateSubjects(sorted),
    topicHeatmap,
    weakTopicsFromMocks,
  };
}

/** Rolling mock accuracy for mission-control weekly stats. */
export function mockAccuracyPercent(
  submissions: MockSubmissionRecord[],
  windowDays = 14,
): number | null {
  const today = isoDate();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - windowDays + 1);
  const start = cutoff.toISOString().slice(0, 10);

  const recent = submissions.filter((s) => s.submittedAt.slice(0, 10) >= start);
  if (recent.length === 0) return null;

  const sum = recent.reduce((acc, s) => acc + s.analysis.overallAccuracy, 0);
  return Math.round(sum / recent.length);
}
