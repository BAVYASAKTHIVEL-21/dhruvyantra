import { EXAM_CONFIG } from "@/config/exam-config";
import { getTopicsForSubject } from "@/config/syllabus";
import type { ProfileMe } from "@/lib/profile/me-types";
import { addDays, daysBetween, isoDate } from "@/lib/mission-control/dates";
import type { StudyTask } from "@/types/planner";
import type { SpacedRevisionEntry } from "@/types/mission-control";

const INTERVALS = [1, 3, 7, 14] as const;

function topicMatches(task: StudyTask, topic: string): boolean {
  const hay = `${task.title} ${task.topic}`.toLowerCase();
  return hay.includes(topic.toLowerCase());
}

function lastCompletedForTopic(tasks: StudyTask[], topic: string): string | null {
  const completed = tasks
    .filter((t) => t.status === "Completed" && topicMatches(t, topic))
    .sort((a, b) => b.date.localeCompare(a.date));
  return completed[0]?.date ?? null;
}

function pendingCountForTopic(tasks: StudyTask[], topic: string): number {
  return tasks.filter((t) => t.status !== "Completed" && topicMatches(t, topic)).length;
}

function whenLabel(daysUntil: number): string {
  if (daysUntil <= 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `+${daysUntil} Days`;
}

function priorityFor(
  daysUntil: number,
  pending: number,
): { priority: string; tone: SpacedRevisionEntry["tone"] } {
  if (pending >= 2 || daysUntil <= 1) {
    return { priority: "High Priority", tone: "purple" };
  }
  if (daysUntil <= 3) return { priority: "Medium", tone: "blue" };
  return { priority: "Low", tone: "muted" };
}

export function buildSpacedRevisionSchedule(
  profile: ProfileMe,
  tasks: StudyTask[],
  today: string = isoDate(),
): SpacedRevisionEntry[] {
  const topics =
    profile.weakTopics.length > 0
      ? profile.weakTopics
      : profile.weakSubjects.flatMap((s) =>
          profile.examType ? [...getTopicsForSubject(profile.examType, s)].slice(0, 1) : [],
        );

  return topics.slice(0, 4).map((topic, i) => {
    const lastDone = lastCompletedForTopic(tasks, topic);
    const pending = pendingCountForTopic(tasks, topic);

    let daysUntil: number;
    if (!lastDone) {
      daysUntil = INTERVALS[Math.min(i, INTERVALS.length - 1)];
    } else {
      const since = daysBetween(lastDone, today);
      const nextInterval = INTERVALS.find((n) => since < n) ?? INTERVALS[INTERVALS.length - 1];
      daysUntil = Math.max(0, nextInterval - since);
      if (pending > 0) daysUntil = Math.min(daysUntil, 1);
    }

    const { priority, tone } = priorityFor(daysUntil, pending);
    return {
      when: whenLabel(daysUntil),
      topic,
      priority,
      tone,
      daysUntil,
    };
  });
}

export function findSubjectForTopic(profile: ProfileMe, topic: string): string {
  if (!profile.examType) return profile.weakSubjects[0] ?? "General";
  for (const subject of profile.weakSubjects) {
    if (getTopicsForSubject(profile.examType, subject).includes(topic)) return subject;
  }
  return profile.weakSubjects[0] ?? EXAM_CONFIG[profile.examType].subjects[0];
}

export function nextRevisionDate(entry: SpacedRevisionEntry, today: string = isoDate()): string {
  return addDays(today, entry.daysUntil);
}
