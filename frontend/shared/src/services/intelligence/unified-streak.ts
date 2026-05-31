import { addDays, isoDate, lastNDays } from "@/lib/mission-control/dates";
import type { CompletedFocusSession } from "@/types/focus";
import type { StreakSnapshot } from "@/types/mission-control";
import type { StudyTask } from "@/types/planner";
import { WEAKNESS_MIN_FOCUS_SECONDS } from "@/services/weakness-engine/constants";

/** Days with a completed planner task or qualifying focus session. */
export function studyActivityDates(
  tasks: StudyTask[],
  focusSessions: CompletedFocusSession[],
): Set<string> {
  const dates = new Set<string>();
  for (const t of tasks) {
    if (t.status === "Completed") dates.add(t.date);
  }
  for (const s of focusSessions) {
    if (s.elapsedSeconds >= WEAKNESS_MIN_FOCUS_SECONDS) dates.add(s.date);
  }
  return dates;
}

function dayHasActivity(dates: Set<string>, date: string): boolean {
  return dates.has(date);
}

/** Streak from real planner + focus activity (not planner-only). */
export function computeUnifiedStreak(
  tasks: StudyTask[],
  focusSessions: CompletedFocusSession[],
  today: string = isoDate(),
): StreakSnapshot {
  const datesWithStudy = studyActivityDates(tasks, focusSessions);

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
    studiedToday: dayHasActivity(datesWithStudy, today),
  };
}

export function unifiedStreakBarHeights(
  tasks: StudyTask[],
  focusSessions: CompletedFocusSession[],
  days = 8,
): number[] {
  const today = isoDate();
  const range = lastNDays(days, today);
  const dates = studyActivityDates(tasks, focusSessions);

  const scores = range.map((d) => {
    const taskCount = tasks.filter((t) => t.date === d && t.status === "Completed").length;
    const focusCount = focusSessions.filter(
      (s) => s.date === d && s.elapsedSeconds >= WEAKNESS_MIN_FOCUS_SECONDS,
    ).length;
    return taskCount + focusCount * 2;
  });

  const max = Math.max(1, ...scores);
  return scores.map((n) => Math.max(12, Math.round((n / max) * 100)));
}
