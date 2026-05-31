/**
 * Single gateway for all Google Calendar HTTP traffic from DhruvYantra.
 */
import { isCoralEnabledEnv } from "./coral-env";
import {
  getGoogleCalendarAccessToken,
  getGoogleCalendarOAuthConfig,
} from "./google-oauth";
import { findCalendarEventIdByTaskIdViaCoral } from "./google-calendar-coral";
import { coralDebug } from "./coral-debug";
import { GOOGLE_CALENDAR_CONFIG, type GoogleCalendarGatewayOperation } from "./registry";

export type { GoogleCalendarGatewayOperation };

export type CalendarTaskCategory = "planner" | "mock" | "revision" | "recovery" | "focus";

export type CalendarEventInput = {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  taskId?: string;
  category?: CalendarTaskCategory;
};

export type CalendarEventResult = {
  ok: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
};

type CalendarEventBody = {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  extendedProperties?: {
    private?: Record<string, string>;
  };
};

type CalendarListResponse = {
  items?: { id: string; htmlLink?: string }[];
};

export function getGoogleCalendarId(): string {
  return (
    process.env[GOOGLE_CALENDAR_CONFIG.calendarIdEnv]?.trim() ||
    GOOGLE_CALENDAR_CONFIG.defaultCalendarId
  );
}

export function getGoogleCalendarTimeZone(): string {
  return (
    process.env[GOOGLE_CALENDAR_CONFIG.timeZoneEnv]?.trim() ||
    GOOGLE_CALENDAR_CONFIG.defaultTimeZone
  );
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(getGoogleCalendarOAuthConfig() && getGoogleCalendarId());
}

export function isGoogleCalendarEnabled(): boolean {
  return process.env[GOOGLE_CALENDAR_CONFIG.enabledEnv] === "true";
}

export function getGoogleCalendarSetupHint(): string {
  const missing: string[] = [];
  if (!process.env[GOOGLE_CALENDAR_CONFIG.clientIdEnv]?.trim()) {
    missing.push(GOOGLE_CALENDAR_CONFIG.clientIdEnv);
  }
  if (!process.env[GOOGLE_CALENDAR_CONFIG.clientSecretEnv]?.trim()) {
    missing.push(GOOGLE_CALENDAR_CONFIG.clientSecretEnv);
  }
  if (!process.env[GOOGLE_CALENDAR_CONFIG.refreshTokenEnv]?.trim()) {
    missing.push(GOOGLE_CALENDAR_CONFIG.refreshTokenEnv);
  }
  if (!process.env[GOOGLE_CALENDAR_CONFIG.calendarIdEnv]?.trim()) {
    missing.push(`${GOOGLE_CALENDAR_CONFIG.calendarIdEnv} (optional — defaults to primary)`);
  }
  if (missing.length === 0) return "";
  return `Add to .env.local: ${missing.join(", ")}. Authorize Calendar scope and store refresh token.`;
}

async function coralGoogleCalendarRequest(
  operation: GoogleCalendarGatewayOperation,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const token = await getGoogleCalendarAccessToken();
  const method = (init.method ?? "GET").toUpperCase();

  const res = await fetch(`${GOOGLE_CALENDAR_CONFIG.baseUrl}${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(GOOGLE_CALENDAR_CONFIG.timeoutMs),
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  coralDebug("coral/google-calendar", `${method} ${operation} ${path}`);

  return res;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function minutesToDateTime(date: string, minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60) % 24;
  const mins = minutesFromMidnight % 60;
  return `${date}T${pad2(hours)}:${pad2(mins)}:00`;
}

function buildEventBody(input: CalendarEventInput): CalendarEventBody {
  const tz = input.timeZone ?? getGoogleCalendarTimeZone();
  const body: CalendarEventBody = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startDateTime, timeZone: tz },
    end: { dateTime: input.endDateTime, timeZone: tz },
  };

  if (input.taskId) {
    body.extendedProperties = {
      private: {
        dhruvyantraTaskId: input.taskId,
        ...(input.category ? { dhruvyantraCategory: input.category } : {}),
      },
    };
  }

  return body;
}

async function findEventIdByTaskId(taskId: string): Promise<string | null> {
  if (isCoralEnabledEnv()) {
    return findCalendarEventIdByTaskIdViaCoral(taskId);
  }

  const calId = encodeURIComponent(getGoogleCalendarId());
  const params = new URLSearchParams({
    privateExtendedProperty: `dhruvyantraTaskId=${taskId}`,
    maxResults: "1",
    singleEvents: "true",
  });

  const res = await coralGoogleCalendarRequest(
    "calendar.events.list",
    `/calendars/${calId}/events?${params}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(`Calendar list failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as CalendarListResponse;
  return data.items?.[0]?.id ?? null;
}

/** Probe connectivity — lists up to 1 event on the configured calendar. */
export async function coralGoogleCalendarProbe(): Promise<{ ok: boolean; error?: string }> {
  if (!isGoogleCalendarConfigured()) {
    return { ok: false, error: getGoogleCalendarSetupHint() || "Calendar not configured" };
  }

  try {
    const calId = encodeURIComponent(getGoogleCalendarId());
    const res = await coralGoogleCalendarRequest(
      "calendar.events.list",
      `/calendars/${calId}/events?maxResults=1&singleEvents=true`,
      { method: "GET" },
    );
    if (!res.ok) {
      return { ok: false, error: `Calendar API ${res.status}: ${await res.text()}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function coralGoogleCalendarCreateEvent(
  input: CalendarEventInput,
): Promise<CalendarEventResult> {
  if (!isGoogleCalendarConfigured()) {
    return { ok: false, error: getGoogleCalendarSetupHint() || "Calendar not configured" };
  }

  try {
    const calId = encodeURIComponent(getGoogleCalendarId());
    const body = buildEventBody(input);

    let eventId = input.taskId ? await findEventIdByTaskId(input.taskId) : null;
    let res: Response;

    if (eventId) {
      res = await coralGoogleCalendarRequest(
        "calendar.events.patch",
        `/calendars/${calId}/events/${eventId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
    } else {
      res = await coralGoogleCalendarRequest(
        "calendar.events.create",
        `/calendars/${calId}/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
    }

    if (!res.ok) {
      return { ok: false, error: `Calendar API ${res.status}: ${await res.text()}` };
    }

    const event = (await res.json()) as { id?: string; htmlLink?: string };
    return { ok: true, eventId: event.id, htmlLink: event.htmlLink };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Calendar event failed" };
  }
}
