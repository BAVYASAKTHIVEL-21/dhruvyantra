import type { StudyTask } from "@/types/planner";
import { addDays, dayLabel, isoDate, lastNDays } from "@/lib/mission-control/dates";
import type { StreakSnapshot } from "@/types/mission-control";

function dayHasCompletion(tasks: StudyTask[], date: string): boolean {
  return tasks.some((t) => t.date === date && t.status === "Completed");
}

export function computeStreak(tasks: StudyTask[], today: string = isoDate()): StreakSnapshot {
  const datesWithStudy = new Set(
    tasks.filter((t) => t.status === "Completed").map((t) => t.date),
  );

  let current = 0;
  let cursor = today;
  while (datesWithStudy.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const windowStart = addDays(today, -89);
  const orderedDays: string[] = [];
  for (let d = windowStart; d <= today; d = addDays(d, 1)) {
    orderedDays.push(d);
  }

  let longest = 0;
  let run = 0;
  for (const d of orderedDays) {
    if (datesWithStudy.has(d)) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  const last7 = lastNDays(7, today);
  const missedDays = last7.filter((d) => !datesWithStudy.has(d)).length;

  return {
    current,
    longest,
    missedDays,
    studiedToday: dayHasCompletion(tasks, today),
  };
}

export function streakBarHeights(tasks: StudyTask[], days = 8): number[] {
  const today = isoDate();
  const range = lastNDays(days, today);
  const maxCompleted = Math.max(
    1,
    ...range.map(
      (d) => tasks.filter((t) => t.date === d && t.status === "Completed").length,
    ),
  );
  return range.map((d) => {
    const count = tasks.filter((t) => t.date === d && t.status === "Completed").length;
    return Math.max(12, Math.round((count / maxCompleted) * 100));
  });
}

export function streakBarLabels(days = 8): string[] {
  return lastNDays(days).map((d) => dayLabel(d));
}
