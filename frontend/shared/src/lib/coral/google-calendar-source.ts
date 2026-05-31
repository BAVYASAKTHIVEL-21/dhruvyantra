import {
  CORAL_GOOGLE_CALENDAR_SCHEMA,
} from "@backend/coral-mcp/registry";
import { getGoogleCalendarId } from "@backend/coral-mcp/google-calendar-gateway";
import { tryExecuteGoogleCoralSql } from "@backend/coral-mcp/google-coral-sql";
import { sqlString } from "@backend/coral-mcp/coral-sql";

export type CoralCalendarEventRow = {
  id?: string;
  summary?: string;
  description?: string;
  html_link?: string;
  start?: unknown;
  end?: unknown;
  extended_properties?: unknown;
};

function rowToCoralEvent(row: Record<string, unknown>): CoralCalendarEventRow {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    summary: typeof row.summary === "string" ? row.summary : undefined,
    description: typeof row.description === "string" ? row.description : undefined,
    html_link: typeof row.html_link === "string" ? row.html_link : undefined,
    start: row.start,
    end: row.end,
    extended_properties: row.extended_properties,
  };
}

/** List calendar events via Coral SQL. */
export async function fetchCalendarEventsFromCoral(
  options?: { taskId?: string },
): Promise<CoralCalendarEventRow[] | null> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) return null;

  let sql = `SELECT id, summary, description, html_link, start, end, extended_properties FROM ${CORAL_GOOGLE_CALENDAR_SCHEMA}.events WHERE calendar_id = ${sqlString(calendarId)}`;

  if (options?.taskId) {
    sql += ` AND private_extended_property = ${sqlString(`dhruvyantraTaskId=${options.taskId}`)}`;
  }

  const rows = await tryExecuteGoogleCoralSql("calendar", sql);
  if (!rows) return null;

  return rows.map(rowToCoralEvent);
}

export { findCalendarEventIdByTaskIdViaCoral } from "@backend/coral-mcp/google-calendar-coral";
