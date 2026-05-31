import { EXAM_CONFIG, formatExamSubjects, type ExamType } from "@/config/exam-config";
import type { MockSubmissionRecord } from "@/types/mock-results";
import type { ProfileMe } from "@/lib/profile/me-types";
import { addDays, daysBetween, isoDate } from "@/lib/mission-control/dates";
import {
  buildMockSessionHref,
  buildResourceHrefFromMockRecommendation,
  buildResourcesHref,
  weakTopicResourcesHref,
} from "@/lib/mission-control/navigation";
import { recoveryResourcesFromSubmission } from "@/lib/resources/mock-recovery";
import { filterMockTasks, resolveMockTypeFromTask } from "@/lib/mock-center/tasks";
import { buildMockCenterAnalytics } from "@/services/intelligence/mock-analytics";
import { actionsFromMockSubmission } from "@/services/intelligence/study-actions";
import { buildUpcomingMockSession } from "@/services/mock-center/upcoming-mock";
import type {
  MockAttemptRow,
  MockCenterOverview,
  MockRecoveryResourceRow,
  MockStatRow,
  MockTypeCard,
} from "@/types/mock-center";
import type { StudyTask } from "@/types/planner";

function formatRelativeTaskDate(date: string, today: string = isoDate()): string {
  const diff = daysBetween(date, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return "1 week ago";
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return date;
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function examMockMeta(exam: ExamType | null): {
  duration: string;
  questions: number;
  subjects: string;
} {
  if (exam === "NEET") {
    return { duration: "3 hours 20 min", questions: 200, subjects: formatExamSubjects("NEET") };
  }
  if (exam === "JEE") {
    return { duration: "3 hours", questions: 90, subjects: formatExamSubjects("JEE") };
  }
  return { duration: "3 hours", questions: 90, subjects: "Complete onboarding" };
}

export function buildMockTypes(profile: ProfileMe): MockTypeCard[] {
  const exam = profile.examType;
  const label = exam ?? "Exam";
  const weakTopic = profile.weakTopics[0] ?? "your weak chapter";
  const weakSubject = profile.weakSubjects[0] ?? EXAM_CONFIG.JEE.subjects[0];
  const fullDuration = exam === "NEET" ? 200 : 180;
  const fullQuestions = exam === "NEET" ? 40 : 30;

  return [
    {
      id: "full",
      title: exam ? `Full ${exam} Syllabus Mock` : "Full Syllabus Mock",
      description: exam
        ? `Planner-scheduled ${label}-pattern test covering ${formatExamSubjects(exam)}.`
        : "Complete onboarding to unlock full-length mocks.",
      meta: exam === "NEET" ? "200 Q · 3h 20m · PCB" : "90 Q · 3h · PCM",
      href: buildMockSessionHref({
        mockType: "full",
        title: exam ? `Full ${exam} Syllabus Mock` : "Full Syllabus Mock",
        duration: fullDuration,
        questions: fullQuestions,
      }),
      prepHref: buildResourcesHref({
        exam: exam ?? undefined,
        type: exam === "NEET" ? "Notes" : "PYQs",
        topic: weakTopic !== "your weak chapter" ? weakTopic : undefined,
        subject: weakSubject,
      }),
    },
    {
      id: "chapter",
      title: weakTopic !== "your weak chapter" ? `Chapter Test — ${weakTopic}` : "Chapter-wise Test",
      description:
        exam === "NEET"
          ? `Timed NCERT-style drill on ${weakTopic} from your weak-topic list.`
          : `Focused PYQ set on ${weakTopic} — your priority weak area.`,
      meta: `30 Q · 1h · ${weakSubject}`,
      href: buildMockSessionHref({
        mockType: "chapter",
        title: weakTopic !== "your weak chapter" ? `Chapter Test — ${weakTopic}` : "Chapter-wise Test",
        duration: 60,
        questions: 15,
      }),
      prepHref: weakTopicResourcesHref(weakTopic, weakSubject, exam),
    },
    {
      id: "pyq",
      title: exam === "NEET" ? "NCERT Speed Drill" : "PYQ Speed Drill",
      description:
        exam === "NEET"
          ? "Rapid recall blocks aligned to your biology & chemistry weak spots."
          : "Previous-year numericals with exam-style time pressure.",
      meta: exam === "NEET" ? "45 Q · 90 min · PCB" : "45 Q · 90 min · Mixed",
      href: buildMockSessionHref({
        mockType: "pyq",
        title: exam === "NEET" ? "NCERT Speed Drill" : "PYQ Speed Drill",
        duration: 90,
        questions: 20,
      }),
      prepHref: buildResourcesHref({
        exam: exam ?? undefined,
        type: exam === "NEET" ? "Notes" : "PYQs",
        topic: profile.weakTopics[0],
        subject: weakSubject,
        q: exam === "NEET" ? "NCERT" : "timed",
      }),
    },
  ];
}

function findSubmissionForTask(
  task: StudyTask,
  submissions: MockSubmissionRecord[],
): MockSubmissionRecord | undefined {
  return (
    submissions.find((s) => s.plannerTaskId === task.id) ??
    submissions.find((s) => s.title === task.title && s.submittedAt.slice(0, 10) === task.date)
  );
}

function resourcesHrefForSubmission(
  submission: MockSubmissionRecord | undefined,
  fallbackTopic: string,
  fallbackSubject: string,
  exam: ExamType | null,
): string {
  const firstRec = submission?.resourceRecommendations[0];
  if (firstRec) {
    return buildResourceHrefFromMockRecommendation({ ...firstRec, examType: exam });
  }
  return weakTopicResourcesHref(fallbackTopic, fallbackSubject, exam);
}

function buildRecentAttempts(
  profile: ProfileMe,
  mockTasks: StudyTask[],
  submissions: MockSubmissionRecord[],
  meta: { questions: number },
): MockAttemptRow[] {
  const exam = profile.examType;
  const sorted = [...mockTasks].sort((a, b) => b.date.localeCompare(a.date));

  return sorted.slice(0, 8).map((task) => {
    const submission = findSubmissionForTask(task, submissions);
    const topic = task.topic || profile.weakTopics[0] || "Revision";
    const resourcesHref = resourcesHrefForSubmission(submission, topic, task.subject, exam);

    return {
      id: task.id,
      title: task.title,
      dateLabel: formatRelativeTaskDate(task.date),
      subject: task.subject,
      topic,
      durationLabel: `${task.duration}m`,
      status: task.status,
      href:
        task.status === "Completed"
          ? resourcesHref
          : buildMockSessionHref({
              mockType: resolveMockTypeFromTask(task),
              plannerTaskId: task.id,
              title: task.title,
              duration: task.duration,
              questions: meta.questions,
            }),
      resourcesHref: task.status === "Completed" ? resourcesHref : undefined,
    };
  });
}

function buildRecoveryResources(submissions: MockSubmissionRecord[]): MockRecoveryResourceRow[] {
  return recoveryResourcesFromSubmission(submissions[0] ?? null);
}

function buildStats(mockTasks: StudyTask[], submissions: MockSubmissionRecord[]): MockStatRow[] {
  const completed = mockTasks.filter((t) => t.status === "Completed");
  const pending = mockTasks.filter((t) => t.status !== "Completed");
  const submissionCount = submissions.length;
  const practiceMinutes =
    completed.reduce((sum, t) => sum + t.duration, 0) +
    submissions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const latestAccuracy = submissions[0]?.analysis.overallAccuracy;

  return [
    { label: "Mocks Taken", value: String(completed.length + submissionCount) },
    {
      label: "Latest Accuracy",
      value: latestAccuracy === undefined ? "—" : `${latestAccuracy}%`,
    },
    { label: "Practice Hours", value: formatHours(practiceMinutes) },
    { label: "Scheduled", value: String(pending.length) },
  ];
}

export function buildMockCenterOverview(
  profile: ProfileMe,
  tasks: StudyTask[],
  submissions: MockSubmissionRecord[] = [],
  today: string = isoDate(),
): MockCenterOverview {
  const exam = profile.examType;
  const mockTasks = filterMockTasks(tasks);
  const upcomingSession = buildUpcomingMockSession(profile, tasks, today);
  const meta = examMockMeta(exam);

  const pendingMock = mockTasks
    .filter((t) => t.status !== "Completed" && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const durationMin = pendingMock?.duration ?? (exam === "NEET" ? 200 : 180);
  const weakTopic = profile.weakTopics[0];
  const weakSubject = profile.weakSubjects[0];

  const headline = exam
    ? `${exam} mocks driven by your planner · weak focus on ${weakTopic ?? weakSubject ?? "syllabus gaps"}`
    : "Complete onboarding to personalize your mock center";

  const analytics = buildMockCenterAnalytics(submissions);
  const latest = submissions[0];
  const studyActions = latest ? actionsFromMockSubmission(profile, latest, []) : [];

  return {
    examType: exam,
    headline,
    analytics,
    studyActions,
    upcoming: {
      title: upcomingSession.title,
      schedule: upcomingSession.scheduledLabel,
      duration: pendingMock ? `${pendingMock.duration} min planned` : meta.duration,
      questions: meta.questions,
      subjects: meta.subjects,
      href: upcomingSession.href,
      startHref: buildMockSessionHref({
        mockType: pendingMock ? resolveMockTypeFromTask(pendingMock) : "full",
        plannerTaskId: pendingMock?.id,
        title: pendingMock?.title ?? upcomingSession.title,
        duration: durationMin,
        questions: meta.questions,
      }),
    },
    stats: buildStats(mockTasks, submissions),
    mockTypes: buildMockTypes(profile),
    recentAttempts: buildRecentAttempts(profile, mockTasks, submissions, meta),
    recoveryResources: buildRecoveryResources(submissions),
  };
}
