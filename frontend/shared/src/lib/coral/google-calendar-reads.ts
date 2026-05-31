import { fetchCalendarEventsFromCoral } from "./google-calendar-source";
import { assertCoralEnabled } from "./query";

export type CalendarEventSummary = {
  id: string;
  summary?: string;
  htmlLink?: string;
};

export async function listCalendarEventsViaCoral(params?: {
  taskId?: string;
}): Promise<CalendarEventSummary[]> {
  assertCoralEnabled();
  const rows = await fetchCalendarEventsFromCoral(params);
  if (rows === null) {
    throw new Error("[coral] google_calendar.events read failed — check calendar OAuth");
  }
  return rows
    .filter((row) => typeof row.id === "string")
    .map((row) => ({
      id: row.id as string,
      summary: row.summary,
      htmlLink: row.html_link,
    }));
}

export { findCalendarEventIdByTaskIdViaCoral } from "./google-calendar-source";
