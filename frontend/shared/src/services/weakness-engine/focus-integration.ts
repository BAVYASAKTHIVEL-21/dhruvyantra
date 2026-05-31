import type { CompletedFocusSession } from "@/types/focus";
import { resolveCanonicalTopic, buildTopicCandidatePool } from "./topic-resolution";
import type { UserProfile } from "@/lib/profile/types";

export type FocusWeaknessRecord = {
  topic: string | null;
  subject: string;
  counted: boolean;
  reason?: string;
};

/**
 * Deep Focus integration — validates completed sessions against syllabus topics.
 * Mastery is derived on read from focus history; this hook documents the event boundary.
 */
export function recordFocusSessionForWeakness(
  profile: Pick<UserProfile, "examType" | "weakSubjects" | "weakTopics">,
  session: CompletedFocusSession,
): FocusWeaknessRecord {
  const candidates = buildTopicCandidatePool(profile);
  const topic = resolveCanonicalTopic(
    profile.examType,
    session.subject,
    session.topic,
    candidates,
  );

  if (!session.topic?.trim()) {
    return { topic: null, subject: session.subject, counted: false, reason: "missing-topic" };
  }

  if (session.elapsedSeconds < 600) {
    return {
      topic,
      subject: session.subject,
      counted: false,
      reason: "duration-below-threshold",
    };
  }

  return { topic, subject: session.subject, counted: true };
}
