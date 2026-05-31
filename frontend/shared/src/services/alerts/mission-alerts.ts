import type { ProfileMe } from "@/lib/profile/me-types";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import {
  buildFocusHref,
  buildMockCenterHref,
  buildResourcesHref,
} from "@/lib/mission-control/navigation";
import {
  focusBlockAction,
  revisionSessionAction,
  scheduleMockAction,
  sendAlertAction,
} from "@/lib/mission-control/coral-actions";
import type { StudyTask } from "@/types/planner";
import type { MissionAlert, SpacedRevisionEntry, StreakSnapshot } from "@/types/mission-control";

function topicMatches(task: StudyTask, topic: string): boolean {
  return `${task.title} ${task.topic}`.toLowerCase().includes(topic.toLowerCase());
}

export function buildMissionAlerts(
  profile: ProfileMe,
  tasks: StudyTask[],
  streak: StreakSnapshot,
  revisions: SpacedRevisionEntry[],
  today: string = isoDate(),
): MissionAlert[] {
  const alerts: MissionAlert[] = [];
  const yesterday = addDays(today, -1);

  const pendingToday = tasks.filter((t) => t.date === today && t.status !== "Completed");
  const missedYesterday = tasks.filter(
    (t) => t.date === yesterday && t.status !== "Completed",
  );

  if (missedYesterday.length > 0) {
    alerts.push({
      id: "missed-planner",
      title: "Missed planner tasks",
      message: `${missedYesterday.length} task(s) from yesterday are still incomplete.`,
      category: "study",
      important: true,
      href: "/dashboard",
      coralAction: sendAlertAction("missed-planner", "in_app"),
    });
  }

  const dueRevision = revisions.find((r) => r.daysUntil <= 1);
  if (dueRevision) {
    alerts.push({
      id: `revision-${dueRevision.topic}`,
      title: "Revision due",
      message: `${dueRevision.topic} revision is scheduled ${dueRevision.when.toLowerCase()}.`,
      category: "study",
      important: true,
      href: buildResourcesHref({ topic: dueRevision.topic }),
      coralAction: revisionSessionAction(dueRevision.topic, dueRevision.when),
    });
  }

  const mockPending = tasks.find(
    (t) =>
      t.date >= today &&
      t.status !== "Completed" &&
      (t.subject === "Full Length Test" || t.title.toLowerCase().includes("mock")),
  );
  if (mockPending) {
    alerts.push({
      id: "upcoming-mock",
      title: "Upcoming mock test",
      message: `${mockPending.title} is on your planner.`,
      category: "tests",
      important: true,
      href: buildMockCenterHref(profile.examType),
      coralAction: scheduleMockAction(profile.examType ?? "Exam", mockPending.date),
    });
  }

  const hour = new Date().getHours();
  if (!streak.studiedToday && hour >= 18 && pendingToday.length > 0) {
    alerts.push({
      id: "streak-risk",
      title: "Streak at risk",
      message: "Complete at least one task today to keep your study streak alive.",
      category: "important",
      important: true,
      href: buildFocusHref({
        topic: profile.weakTopics[0],
        duration: 45,
        productiveTime: profile.productiveTime ?? undefined,
      }),
      coralAction: focusBlockAction(
        profile.weakTopics[0] ?? "Focus",
        45,
        profile.productiveTime ?? "Evening",
      ),
    });
  }

  for (const topic of profile.weakTopics.slice(0, 3)) {
    const recent = tasks.filter(
      (t) => topicMatches(t, topic) && t.date >= addDays(today, -3),
    );
    if (recent.length === 0) {
      alerts.push({
        id: `neglect-${topic}`,
        title: "Weak topic needs attention",
        message: `No recent activity for ${topic}. Schedule a practice block.`,
        category: "mentor",
        important: false,
        href: buildResourcesHref({ topic, subject: profile.weakSubjects[0] }),
        coralAction: revisionSessionAction(topic, "today"),
      });
    }
  }

  if (pendingToday.length === 0 && tasks.some((t) => t.date === today)) {
    alerts.push({
      id: "daily-complete",
      title: "Daily goal achieved",
      message: "You completed all planner tasks for today.",
      category: "study",
      important: false,
    });
  }

  return alerts.slice(0, 8);
}

export function alertBadgeCount(alerts: MissionAlert[]): number {
  return alerts.filter((a) => a.important).length;
}
