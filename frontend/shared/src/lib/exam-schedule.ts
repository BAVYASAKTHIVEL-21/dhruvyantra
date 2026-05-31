import {
  milestonesForExam,
  type ExamDateStatus,
  type OfficialExamMilestone,
} from "@/config/exam-official-dates";
import type { ExamType } from "@/config/exam-config";
import { daysBetween, isoDate } from "@/lib/mission-control/dates";

export type ExamMilestone = {
  date: string;
  endDate: string;
  label: string;
  status: ExamDateStatus;
  source: string;
};

export type ExamCountdown = {
  days: number;
  milestone: ExamMilestone;
};

function toMilestone(row: OfficialExamMilestone): ExamMilestone {
  return {
    date: row.startDate,
    endDate: row.endDate,
    label: row.label,
    status: row.status,
    source: row.source,
  };
}

export function examMilestonesForYear(
  examType: ExamType,
  cycleYear: number,
): ExamMilestone[] {
  return milestonesForExam(examType, cycleYear).map(toMilestone);
}

/** Next official/expected exam on or after today for the target cycle (+ next cycle if none left). */
export function nextExamMilestone(
  examType: ExamType,
  targetYear: number,
  today: string = isoDate(),
): ExamMilestone | null {
  const years = [targetYear, targetYear + 1];
  const candidates = years.flatMap((y) => examMilestonesForYear(examType, y));

  const upcoming = candidates
    .filter((m) => m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return upcoming[0] ?? null;
}

export function daysUntilTargetExam(
  targetYear: number | null,
  examType: ExamType | null,
  today: string = isoDate(),
): number | null {
  const countdown = getExamCountdown(targetYear, examType, today);
  return countdown?.days ?? null;
}

export function getExamCountdown(
  targetYear: number | null,
  examType: ExamType | null,
  today: string = isoDate(),
): ExamCountdown | null {
  if (!targetYear || !examType) return null;

  const milestone = nextExamMilestone(examType, targetYear, today);
  if (!milestone) return null;

  return {
    days: Math.max(0, daysBetween(today, milestone.date)),
    milestone,
  };
}

export function formatDaysRemaining(days: number): string {
  if (days === 1) return "1 Day";
  return `${days} Days`;
}

/** e.g. "17 May 2026 · JEE Advanced 2026" */
export function formatExamMilestoneDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCountdownSubtitle(milestone: ExamMilestone): string {
  const when = formatExamMilestoneDate(milestone.date);
  if (milestone.endDate !== milestone.date) {
    const end = formatExamMilestoneDate(milestone.endDate);
    return `${when} – ${end} · ${milestone.label}`;
  }
  return `${when} · ${milestone.label}`;
}
