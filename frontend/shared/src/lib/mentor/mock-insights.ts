import { detectMentorSignals } from "@/lib/mentor/intelligence/signals";
import { buildMentorIntelligenceContext } from "@/lib/mentor/context";
import { buildMockAnalysisSummary } from "@/services/mock-center/recovery-planner";
import type { UserProfile } from "@/lib/profile/types";
import type { MockSubmissionRecord } from "@/types/mock-results";

export type MentorMockInsight = {
  summary: string;
  signals: { id: string; message: string; severity: string }[];
};

/** Mentor-facing insight derived from the latest mock submission. */
export async function buildMentorInsightsFromMock(
  profile: UserProfile,
): Promise<MentorMockInsight | null> {
  const ctx = await buildMentorIntelligenceContext(profile);
  if (!ctx.latestMock) return null;

  const signals = detectMentorSignals(ctx)
    .filter((s) => s.id.startsWith("mock-") || s.topic === ctx.latestMock?.weakTopics[0]?.topic)
    .slice(0, 4);

  const summary = `Latest mock **${ctx.latestMock.title}**: **${ctx.latestMock.overallAccuracy}%** overall.`;

  return {
    summary,
    signals: signals.map((s) => ({
      id: s.id,
      message: s.message,
      severity: s.severity,
    })),
  };
}

export function buildMentorInsightFromRecord(
  record: MockSubmissionRecord,
  profile: UserProfile,
): MentorMockInsight {
  const overall = record.analysis.overallAccuracy;
  const weakCount = record.analysis.weakTopics.length;
  const strongCount = record.analysis.strongTopics.length;

  const mockSignals = record.analysis.weakTopics.slice(0, 3).map((weak, i) => {
    const msg =
      profile.examType === "JEE"
        ? `Mock gap: **${weak.topic}** (${weak.subject}) at **${weak.accuracy}%** — schedule PYQ recovery.`
        : `Mock gap: **${weak.topic}** at **${weak.accuracy}%** — NCERT + diagram pass today.`;
    return {
      id: `mock-${weak.topic}-${i}`,
      message: msg,
      severity: weak.accuracy <= 45 ? "critical" : "warning",
    };
  });

  if (overall >= 75 && strongCount > 0) {
    mockSignals.unshift({
      id: "mock-strength",
      message: `Strong mock run (**${overall}%**). Maintain with a timed chapter test on ${record.analysis.strongTopics[0]?.topic ?? "weak areas"}.`,
      severity: "info",
    });
  } else if (weakCount >= 3) {
    mockSignals.push({
      id: "mock-multi-weak",
      message: `${weakCount} weak topics flagged — prioritize recovery sessions before the next full mock.`,
      severity: "critical",
    });
  }

  const summary =
    buildMockAnalysisSummary(record.analysis, profile.examType) +
    (weakCount > 0
      ? ` Recovery planner queued for ${Math.min(weakCount, 3)} topic(s).`
      : "");

  return {
    summary,
    signals: mockSignals.slice(0, 5),
  };
}
