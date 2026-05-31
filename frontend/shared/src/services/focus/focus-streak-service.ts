import { addDays, dayLabel, isoDate, lastNDays } from "@/lib/mission-control/dates";
import type { CompletedFocusSession, FocusStreakSnapshot, FocusWeekDay } from "@/types/focus";

const DAY_SHORT: Record<string, string> = {
  Sun: "S",
  Mon: "M",
  Tue: "T",
  Wed: "W",
  Thu: "T",
  Fri: "F",
  Sat: "S",
};

function currentWeekDates(today: string = isoDate()): string[] {
  const d = new Date(`${today}T12:00:00`);
  const weekday = d.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(today, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function computeFocusStreak(
  sessions: CompletedFocusSession[],
  today: string = isoDate(),
): FocusStreakSnapshot {
  const datesWithFocus = new Set(sessions.map((s) => s.date));

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
    return {
      date,
      day: label,
      short: DAY_SHORT[label] ?? label.charAt(0),
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

export function mergeFocusHistory(
  local: CompletedFocusSession[],
  remote: CompletedFocusSession[],
): CompletedFocusSession[] {
  const byId = new Map<string, CompletedFocusSession>();
  for (const s of remote) byId.set(s.id, s);
  for (const s of local) byId.set(s.id, s);
  const cutoff = addDays(isoDate(), -90);
  return [...byId.values()]
    .filter((s) => s.date >= cutoff)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function focusSessionsThisWeek(
  sessions: CompletedFocusSession[],
  today: string = isoDate(),
): number {
  const week = new Set(currentWeekDates(today));
  return sessions.filter((s) => week.has(s.date)).length;
}

export function lastSevenDayFocusCount(sessions: CompletedFocusSession[]): number {
  const range = new Set(lastNDays(7));
  return sessions.filter((s) => range.has(s.date)).length;
}
