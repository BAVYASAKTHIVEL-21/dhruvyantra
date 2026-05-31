/**
 * Google Calendar — Coral SQL only.
 */
export type {
  CalendarEventInput,
  CalendarEventResult,
  CalendarTaskCategory,
} from "@backend/coral-mcp/google-calendar-gateway";

import {
  getGoogleCalendarSetupHint,
  getGoogleCalendarTimeZone,
  isGoogleCalendarConfigured,
  isGoogleCalendarEnabled,
  minutesToDateTime,
} from "@backend/coral-mcp/google-calendar-gateway";
import { upsertCalendarEventViaCoral } from "@/lib/coral/writes";

export {
  getGoogleCalendarSetupHint,
  isGoogleCalendarConfigured,
  isGoogleCalendarEnabled,
  minutesToDateTime,
};

export function calendarTimeZone(): string {
  return getGoogleCalendarTimeZone();
}

export async function createCalendarEvent(
  input: import("@backend/coral-mcp/google-calendar-gateway").CalendarEventInput,
): Promise<import("@backend/coral-mcp/google-calendar-gateway").CalendarEventResult> {
  return upsertCalendarEventViaCoral(input);
}

/** Planner Agent → Google Calendar via Coral SQL. */
export async function createCalendarEventViaAgent(
  input: import("@backend/coral-mcp/google-calendar-gateway").CalendarEventInput,
): Promise<import("@backend/coral-mcp/google-calendar-gateway").CalendarEventResult> {
  return upsertCalendarEventViaCoral(input);
}
