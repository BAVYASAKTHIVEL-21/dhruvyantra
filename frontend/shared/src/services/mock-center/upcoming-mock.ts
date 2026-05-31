import type { ProfileMe } from "@/lib/profile/me-types";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import { buildMockCenterHref } from "@/lib/mission-control/navigation";
import { isMockTask } from "@/lib/mock-center/tasks";
import type { StudyTask } from "@/types/planner";
import type { UpcomingMockSession } from "@/types/mission-control";

function mockTimeLabel(productiveTime: string | null): string {
  if (productiveTime === "Morning") return "6:30 AM";
  if (productiveTime === "Night") return "9:00 PM";
  if (productiveTime === "Evening") return "7:00 PM";
  return "10:00 AM";
}

export function buildUpcomingMockSession(
  profile: ProfileMe,
  tasks: StudyTask[],
  today: string = isoDate(),
): UpcomingMockSession {
  const exam = profile.examType;
  const title =
    exam === "NEET"
      ? "NEET Full Syllabus Mock"
      : exam === "JEE"
        ? "JEE Advanced Pattern Mock"
        : "Full Syllabus Mock";

  const pendingMock = tasks
    .filter((t) => isMockTask(t) && t.status !== "Completed" && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const mockDate = pendingMock?.date ?? addDays(today, 1);
  const time = pendingMock?.scheduledTime ?? mockTimeLabel(profile.productiveTime);
  const scheduledLabel = `${mockDate === addDays(today, 1) ? "Tomorrow" : mockDate}, ${time}`;

  return {
    title: pendingMock?.title ?? title,
    scheduledLabel,
    scheduledAt: `${mockDate}T${time}`,
    href: buildMockCenterHref(exam),
    examType: exam,
  };
}
