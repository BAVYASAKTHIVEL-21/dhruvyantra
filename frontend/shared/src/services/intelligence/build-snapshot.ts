import { addDays, isoDate } from "@/lib/mission-control/dates";
import type { ProfileMe } from "@/lib/profile/me-types";
import { computeWeaknessEngine, toWeakTopicMasteryRows } from "@/services/weakness-engine/compute-scores";
import type { CompletedFocusSession } from "@/types/focus";
import type { MockSubmissionRecord, MockTopicPerformance } from "@/types/mock-results";
import type { StudyTask } from "@/types/planner";
import type { IntelligenceSnapshot } from "@/types/intelligence";
import { buildMockCenterAnalytics } from "./mock-analytics";
import {
  actionsFromMockSubmission,
  actionsFromWeakness,
  mergeStudyActions,
} from "./study-actions";
import { computeUnifiedStreak } from "./unified-streak";

export type IntelligenceInput = {
  profile: ProfileMe;
  tasks: StudyTask[];
  focusSessions: CompletedFocusSession[];
  mockPerformances: MockTopicPerformance[];
  submissions: MockSubmissionRecord[];
  today?: string;
};

export function buildIntelligenceSnapshot(input: IntelligenceInput): IntelligenceSnapshot {
  const today = input.today ?? isoDate();
  const weakness = computeWeaknessEngine({
    profile: input.profile,
    tasks: input.tasks,
    focusSessions: input.focusSessions,
    mockPerformances: input.mockPerformances,
    today,
  });

  const mockAnalytics = buildMockCenterAnalytics(input.submissions, input.mockPerformances);
  const latestSubmission = input.submissions[0] ?? null;

  const recoveryTasks = latestSubmission
    ? input.tasks.filter((t) => latestSubmission.recoveryTaskIds.includes(t.id))
    : [];
  const mockActions = latestSubmission
    ? actionsFromMockSubmission(input.profile, latestSubmission, recoveryTasks)
    : [];

  const studyActions = mergeStudyActions(
    actionsFromWeakness(input.profile, weakness),
    mockActions,
  );

  return {
    computedAt: new Date().toISOString(),
    examType: input.profile.examType,
    streak: computeUnifiedStreak(input.tasks, input.focusSessions, today),
    topicMastery: weakness.topics,
    weakTopics: toWeakTopicMasteryRows(weakness),
    mockAnalytics,
    studyActions,
  };
}

/** Load window for intelligence aggregation (matches mission control). */
export function intelligenceTaskWindow(today: string = isoDate()): { start: string; end: string } {
  return { start: addDays(today, -89), end: today };
}
