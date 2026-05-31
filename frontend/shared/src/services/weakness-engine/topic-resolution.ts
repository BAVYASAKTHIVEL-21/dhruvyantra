import { EXAM_CONFIG } from "@/config/exam-config";
import type { ExamType } from "@/config/exam-config";
import { getTopicsForSubject } from "@/config/syllabus";
import type { UserProfile } from "@/lib/profile/types";

export type TrackedTopicMeta = {
  topic: string;
  subject: string;
  fromOnboarding: boolean;
};

function syllabusTopicsForProfile(profile: Pick<UserProfile, "examType" | "weakSubjects">): string[] {
  if (!profile.examType) return [];
  const subjects =
    profile.weakSubjects.length > 0
      ? profile.weakSubjects
      : [...EXAM_CONFIG[profile.examType].subjects];
  return subjects.flatMap((s) => [...getTopicsForSubject(profile.examType!, s)]);
}

export function buildTopicCandidatePool(
  profile: Pick<UserProfile, "examType" | "weakSubjects" | "weakTopics">,
): string[] {
  const pool = new Set<string>(profile.weakTopics);
  for (const topic of syllabusTopicsForProfile(profile)) {
    pool.add(topic);
  }
  return [...pool];
}

export function findSubjectForTopic(
  profile: Pick<UserProfile, "examType" | "weakSubjects">,
  topic: string,
): string {
  if (!profile.examType) return profile.weakSubjects[0] ?? "General";
  for (const subject of profile.weakSubjects) {
    if (getTopicsForSubject(profile.examType, subject).includes(topic)) return subject;
  }
  for (const subject of EXAM_CONFIG[profile.examType].subjects) {
    if (getTopicsForSubject(profile.examType, subject).includes(topic)) return subject;
  }
  return profile.weakSubjects[0] ?? EXAM_CONFIG[profile.examType].subjects[0] ?? "General";
}

/** Map free-text (task title, focus topic) to a canonical syllabus topic when possible. */
export function resolveCanonicalTopic(
  exam: ExamType | null,
  subject: string,
  text: string,
  candidates: string[],
): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const pool = new Set(candidates);
  if (exam) {
    for (const subj of [subject, ...EXAM_CONFIG[exam].subjects]) {
      for (const topic of getTopicsForSubject(exam, subj)) {
        pool.add(topic);
      }
    }
  }

  if (pool.has(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  let best: string | null = null;
  let bestLen = 0;

  for (const topic of pool) {
    const topicLower = topic.toLowerCase();
    if (lower.includes(topicLower) || topicLower.includes(lower)) {
      if (topic.length > bestLen) {
        best = topic;
        bestLen = topic.length;
      }
    }
  }

  return best;
}

export function buildTrackedTopics(
  profile: Pick<UserProfile, "examType" | "weakSubjects" | "weakTopics">,
): Map<string, TrackedTopicMeta> {
  const tracked = new Map<string, TrackedTopicMeta>();
  const onboarding = new Set(profile.weakTopics);

  for (const topic of profile.weakTopics) {
    tracked.set(topic, {
      topic,
      subject: findSubjectForTopic(profile, topic),
      fromOnboarding: true,
    });
  }

  if (profile.examType) {
    const subjects =
      profile.weakSubjects.length > 0
        ? profile.weakSubjects
        : [...EXAM_CONFIG[profile.examType].subjects];
    for (const subject of subjects) {
      for (const topic of getTopicsForSubject(profile.examType, subject)) {
        if (tracked.has(topic)) continue;
        tracked.set(topic, {
          topic,
          subject,
          fromOnboarding: onboarding.has(topic),
        });
      }
    }
  }

  return tracked;
}

export function registerDiscoveredTopic(
  tracked: Map<string, TrackedTopicMeta>,
  profile: Pick<UserProfile, "examType" | "weakSubjects" | "weakTopics">,
  topic: string,
  subject: string,
): void {
  if (tracked.has(topic)) return;
  tracked.set(topic, {
    topic,
    subject: subject || findSubjectForTopic(profile, topic),
    fromOnboarding: profile.weakTopics.includes(topic),
  });
}

export function topicMatchesText(topic: string, text: string): boolean {
  const hay = text.toLowerCase();
  const needle = topic.toLowerCase();
  return hay.includes(needle) || needle.includes(hay);
}
