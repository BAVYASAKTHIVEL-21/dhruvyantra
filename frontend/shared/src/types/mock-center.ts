import type { ExamType } from "@/config/exam-config";
import type { ProfileMe } from "@/lib/profile/me-types";
import type { MockCenterAnalytics } from "@/types/intelligence";
import type { StudyAction } from "@/types/intelligence";

export type MockAttemptRow = {
  id: string;
  title: string;
  dateLabel: string;
  subject: string;
  topic: string;
  durationLabel: string;
  status: "Completed" | "Pending" | "In Progress";
  href: string;
  /** Filtered library link for recovery materials after a completed mock */
  resourcesHref?: string;
};

export type MockRecoveryResourceRow = {
  resourceId: string;
  title: string;
  type: string;
  subject: string;
  topic: string;
  reason: string;
  href: string;
};

export type MockStatRow = {
  label: string;
  value: string;
};

export type MockTypeCard = {
  id: "full" | "chapter" | "pyq";
  title: string;
  description: string;
  meta: string;
  href: string;
  /** Prep materials in the resource library before starting the mock */
  prepHref?: string;
};

export type MockCenterOverview = {
  examType: ExamType | null;
  headline: string;
  upcoming: {
    title: string;
    schedule: string;
    duration: string;
    questions: number;
    subjects: string;
    href: string;
    startHref: string;
  };
  stats: MockStatRow[];
  mockTypes: MockTypeCard[];
  recentAttempts: MockAttemptRow[];
  /** Recovery materials from the most recent mock submission */
  recoveryResources: MockRecoveryResourceRow[];
  /** Aggregated mock performance (optional; UI may ignore until wired). */
  analytics?: MockCenterAnalytics;
  /** Post-mock executable actions for Coral / deep links. */
  studyActions?: StudyAction[];
};

export type MockCenterStatIcon = "mocks" | "completion" | "hours" | "scheduled";

export type MockCenterOverviewWithMeta = MockCenterOverview & {
  profileName: string;
  weakTopic: string | null;
  weakSubject: string | null;
};

export function emptyMockOverview(profile?: Pick<ProfileMe, "examType" | "name">): MockCenterOverview {
  return {
    examType: profile?.examType ?? null,
    headline: profile?.examType
      ? `${profile.examType}-pattern mocks from your study planner`
      : "Complete onboarding to unlock exam-pattern mocks",
    upcoming: {
      title: "Full Syllabus Mock",
      schedule: "Scheduling from planner…",
      duration: "3 hours",
      questions: 90,
      subjects: "—",
      href: "/dashboard/mock-center",
      startHref: "/dashboard/mock-center/session",
    },
    stats: [
      { label: "Mocks Taken", value: "0" },
      { label: "Completion", value: "—" },
      { label: "Practice Hours", value: "0h" },
      { label: "Scheduled", value: "0" },
    ],
    mockTypes: [],
    recentAttempts: [],
    recoveryResources: [],
  };
}
