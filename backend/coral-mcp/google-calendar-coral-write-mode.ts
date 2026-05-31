import { isCoralEnabledEnv } from "./coral-sql";
import { isGoogleCalendarConfigured } from "./google-calendar-gateway";

export function shouldUseGoogleCalendarCoralSql(): boolean {
  if (!isCoralEnabledEnv()) return false;
  if (!isGoogleCalendarConfigured()) return false;
  if (process.env.CORAL_CALENDAR_DIRECT === "true") return false;
  return true;
}

export function isGoogleCalendarCoralFilterSchemaError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return text.includes("No column named") || text.includes("is in scope");
}

export function calendarGatewayFallbackEnabled(): boolean {
  return process.env.CORAL_CALENDAR_GATEWAY_FALLBACK === "true";
}
