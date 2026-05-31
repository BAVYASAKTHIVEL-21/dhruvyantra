import type { CompletedFocusSession, FocusStreakSnapshot, FocusWeekDay } from "@/types/focus";
import { addDays, dayLabel, isoDate } from "@/lib/mission-control/dates";

const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** Monday–Sunday week containing `today`. */
export function currentWeekDates(today: string = isoDate()): string[] {
  const d = new Date(`${today}T12:00:00`);
  const weekday = d.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(today, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function datesWithCompletedSessions(sessions: CompletedFocusSession[]): Set<string> {
  return new Set(sessions.map((s) => s.date));
}

export function computeFocusStreak(
  sessions: CompletedFocusSession[],
  today: string = isoDate(),
): FocusStreakSnapshot {
  const datesWithFocus = datesWithCompletedSessions(sessions);

  let current = 0;
  let cursor = today;
  while (datesWithFocus.has(cursor)) {
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
    if (datesWithFocus.has(d)) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  const weekDates = currentWeekDates(today);
  const weekDays: FocusWeekDay[] = weekDates.map((date) => {
    const label = dayLabel(date);
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return {
      date,
      day: label,
      short: DAY_SHORT[weekday],
      completed: datesWithFocus.has(date),
      isToday: date === today,
    };
  });

  return {
    current,
    longest,
    studiedToday: datesWithFocus.has(today),
    weeklyCompletedCount: weekDays.filter((d) => d.completed).length,
    weekDays,
  };
}
