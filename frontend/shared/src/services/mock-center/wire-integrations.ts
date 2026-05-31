import { buildMentorInsightFromRecord } from "@/lib/mentor/mock-insights";
import { toProfileMe } from "@/lib/profile/me-types";
import { saveProfile } from "@/lib/profile/server";
import type { UserProfile } from "@/lib/profile/types";
import { buildWeaknessEngineForProfile } from "@/lib/weakness/server";
import { actionsFromMockSubmission } from "@/services/intelligence/study-actions";
import type {
  MockCenterIntegrations,
  MockSubmissionRecord,
} from "@/types/mock-results";

const MAX_WEAK_TOPICS = 8;

/** Merge mock weak topics into profile for planner + weakness engine. */
export function mergeWeakTopicsFromMock(
  profile: UserProfile,
  record: MockSubmissionRecord,
): string[] {
  const fromMock = record.analysis.weakTopics.map((w) => w.topic);
  const merged = [...fromMock, ...profile.weakTopics];
  return [...new Set(merged)].filter(Boolean).slice(0, MAX_WEAK_TOPICS);
}

/**
 * Connect mock results to weakness engine, profile weak topics, and mentor insights.
 * Called after submission is persisted.
 */
export async function wireMockCenterIntegrations(
  profile: UserProfile,
  record: MockSubmissionRecord,
): Promise<{ profile: UserProfile; integrations: MockCenterIntegrations }> {
  const updatedWeakTopics = mergeWeakTopicsFromMock(profile, record);
  const updatedProfile = await saveProfile({
    ...profile,
    weakTopics: updatedWeakTopics,
  });

  const weakness = await buildWeaknessEngineForProfile(updatedProfile);
  const mentor = buildMentorInsightFromRecord(record, updatedProfile);
  const studyActions = actionsFromMockSubmission(toProfileMe(updatedProfile), record, []);

  return {
    profile: updatedProfile,
    integrations: {
      mentorInsight: mentor.summary,
      mentorSignals: mentor.signals,
      weaknessTopTopics: weakness.topics.slice(0, 5).map((t) => ({
        topic: t.topic,
        subject: t.subject,
        masteryScore: t.masteryScore,
      })),
      updatedWeakTopics,
      studyActions,
    },
  };
}

/** Coral MCP placeholder — Mock Agent → planner, weakness, mentor, mission control. */
export async function wireMockCenterViaAgent(
  profile: UserProfile,
  record: MockSubmissionRecord,
): Promise<{ profile: UserProfile; integrations: MockCenterIntegrations }> {
  return wireMockCenterIntegrations(profile, record);
}
