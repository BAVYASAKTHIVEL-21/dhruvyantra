import { CORAL_GOOGLE_CALENDAR_SCHEMA, GOOGLE_CALENDAR_CONFIG } from "./registry";
import { tryExecuteGoogleCoralSql } from "./google-coral-sql";
import { sqlString } from "./coral-sql";

function getCalendarId(): string {
  return (
    process.env[GOOGLE_CALENDAR_CONFIG.calendarIdEnv]?.trim() ||
    GOOGLE_CALENDAR_CONFIG.defaultCalendarId
  );
}

/** Find event id by DhruvYantra task id via Coral SQL. */
export async function findCalendarEventIdByTaskIdViaCoral(
  taskId: string,
): Promise<string | null> {
  const calendarId = getCalendarId();
  const sql = `SELECT id FROM ${CORAL_GOOGLE_CALENDAR_SCHEMA}.events WHERE calendar_id = ${sqlString(calendarId)} AND private_extended_property = ${sqlString(`dhruvyantraTaskId=${taskId}`)} LIMIT 1`;

  const rows = await tryExecuteGoogleCoralSql("calendar", sql);
  if (!rows || rows.length === 0) return null;
  const id = rows[0]?.id;
  return typeof id === "string" ? id : null;
}
