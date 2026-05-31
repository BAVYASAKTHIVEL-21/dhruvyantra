import type { ExamType } from "@/config/exam-config";

export type ExamDateStatus = "official" | "expected";

/** Single exam window from NTA / IIT / official notifications. */
export type OfficialExamMilestone = {
  examType: ExamType;
  /** Academic cycle year (e.g. JEE 2026 → admission 2026-27). */
  cycleYear: number;
  /** First day of the exam window (ISO). */
  startDate: string;
  /** Last day if multi-day; same as startDate for single-day exams. */
  endDate: string;
  label: string;
  status: ExamDateStatus;
  source: string;
};

/**
 * Official and expected exam dates (India).
 * Update when NTA / jeeadv.ac.in / neet.nta.nic.in publish new notifications.
 */
export const OFFICIAL_EXAM_MILESTONES: OfficialExamMilestone[] = [
  // —— JEE 2026 (NTA + IIT Roorkee) ——
  {
    examType: "JEE",
    cycleYear: 2026,
    startDate: "2026-01-21",
    endDate: "2026-01-29",
    label: "JEE Main 2026 Session 1",
    status: "official",
    source: "jeemain.nta.nic.in",
  },
  {
    examType: "JEE",
    cycleYear: 2026,
    startDate: "2026-04-02",
    endDate: "2026-04-08",
    label: "JEE Main 2026 Session 2",
    status: "official",
    source: "jeemain.nta.nic.in",
  },
  {
    examType: "JEE",
    cycleYear: 2026,
    startDate: "2026-05-17",
    endDate: "2026-05-17",
    label: "JEE Advanced 2026",
    status: "official",
    source: "jeeadv.ac.in",
  },
  // —— NEET 2026 (NTA re-exam after May 3 cancellation) ——
  {
    examType: "NEET",
    cycleYear: 2026,
    startDate: "2026-06-21",
    endDate: "2026-06-21",
    label: "NEET UG 2026",
    status: "official",
    source: "neet.nta.nic.in",
  },
  // —— JEE 2027 (expected until NTA notification — typical two-session pattern) ——
  {
    examType: "JEE",
    cycleYear: 2027,
    startDate: "2027-01-22",
    endDate: "2027-01-29",
    label: "JEE Main 2027 Session 1 (expected)",
    status: "expected",
    source: "NTA pattern — confirm at jeemain.nta.nic.in",
  },
  {
    examType: "JEE",
    cycleYear: 2027,
    startDate: "2027-04-03",
    endDate: "2027-04-09",
    label: "JEE Main 2027 Session 2 (expected)",
    status: "expected",
    source: "NTA pattern — confirm at jeemain.nta.nic.in",
  },
  {
    examType: "JEE",
    cycleYear: 2027,
    startDate: "2027-05-17",
    endDate: "2027-05-17",
    label: "JEE Advanced 2027 (expected)",
    status: "expected",
    source: "Typical May window — confirm at jeeadv.ac.in",
  },
  // —— NEET 2027 (expected — first Sunday of May pattern) ——
  {
    examType: "NEET",
    cycleYear: 2027,
    startDate: "2027-05-02",
    endDate: "2027-05-02",
    label: "NEET UG 2027 (expected)",
    status: "expected",
    source: "NTA pattern — confirm at neet.nta.nic.in",
  },
];

export function milestonesForExam(
  examType: ExamType,
  cycleYear: number,
): OfficialExamMilestone[] {
  return OFFICIAL_EXAM_MILESTONES.filter(
    (m) => m.examType === examType && m.cycleYear === cycleYear,
  ).sort((a, b) => a.startDate.localeCompare(b.startDate));
}
