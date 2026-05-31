/** Calendar date for planner (local TZ). Safe for client + server bundles. */
export function todayPlanDate(): string {
  const tz =
    process.env.GOOGLE_CALENDAR_TIMEZONE?.trim() ||
    process.env.TZ?.trim() ||
    "Asia/Kolkata";
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
