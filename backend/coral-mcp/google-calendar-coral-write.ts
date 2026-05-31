/**
 * Coral SQL for google_calendar.event_creates (SQL-triggered POST).
 * Filter names match manifest.yaml — values are JSON fragments for the request body template.
 */
import type { CalendarEventInput } from "./google-calendar-gateway";
import { getGoogleCalendarId, getGoogleCalendarTimeZone } from "./google-calendar-gateway";
import { CORAL_GOOGLE_CALENDAR_SCHEMA } from "./registry";
import { sqlString } from "./coral-sql";

/** SQL literal whose value is a JSON fragment (e.g. `"title"` or `{"dateTime":"..."}`). */
export function sqlJsonFilter(value: unknown): string {
  return sqlString(JSON.stringify(value));
}

/** SELECT that triggers POST on google_calendar.event_creates per manifest filters. */
export function buildCalendarEventCreateSql(input: CalendarEventInput): string {
  const calendarId = getGoogleCalendarId();
  const tz = input.timeZone ?? getGoogleCalendarTimeZone();
  const start = { dateTime: input.startDateTime, timeZone: tz };
  const end = { dateTime: input.endDateTime, timeZone: tz };

  return `SELECT ok, event_id, html_link, error, raw FROM ${CORAL_GOOGLE_CALENDAR_SCHEMA}.event_creates WHERE calendar_id = ${sqlString(calendarId)} AND summary_json = ${sqlJsonFilter(input.summary)} AND description_json = ${sqlJsonFilter(input.description ?? "")} AND start_json = ${sqlJsonFilter(start)} AND end_json = ${sqlJsonFilter(end)} AND task_id_json = ${sqlJsonFilter(input.taskId ?? "")} AND category_json = ${sqlJsonFilter(input.category ?? "")} LIMIT 1`;
}
