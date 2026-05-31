import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  CORAL_GOOGLE_ACCESS_TOKEN_ENV,
  CORAL_GOOGLE_CALENDAR_SCHEMA,
  CORAL_GOOGLE_DRIVE_SCHEMA,
} from "./registry";
import {
  executeCoralSqlDetailed,
  isCoralEnabledEnv,
  sqlString,
  type CoralSqlExecutionResult,
  type CoralSqlFailure,
} from "./coral-sql";
import { coralDebug } from "./coral-debug";
import { getGoogleCalendarAccessToken, getGoogleDriveAccessToken } from "./google-oauth";

export type GoogleCoralService = "drive" | "calendar";

const schemaReadyCache = new Map<string, boolean>();

const GOOGLE_CALENDAR_SOURCE_NAME = "google_calendar";
const GOOGLE_DRIVE_SOURCE_NAME = "google_drive";

export class GoogleCoralSqlError extends Error {
  readonly service: GoogleCoralService;
  readonly sql: string;
  readonly coralError?: string;
  readonly stderr?: string;
  readonly stdout?: string;
  readonly exitCode?: number | null;

  constructor(
    service: GoogleCoralService,
    message: string,
    options: {
      sql: string;
      cause?: CoralSqlFailure;
      rows?: Record<string, unknown>[];
    },
  ) {
    super(message);
    this.name = "GoogleCoralSqlError";
    this.service = service;
    this.sql = options.sql;
    if (options.cause) {
      this.coralError = options.cause.error;
      this.stderr = options.cause.stderr;
      this.stdout = options.cause.stdout;
      this.exitCode = options.cause.exitCode;
    }
    if (options.rows) {
      this.stdout = `${this.stdout ?? ""}\nrows=${JSON.stringify(options.rows)}`.trim();
    }
  }
}

async function schemaRegistered(schemaName: string): Promise<boolean> {
  const result = await executeCoralSqlDetailed(
    `SELECT table_name FROM coral.tables WHERE schema_name = ${sqlString(schemaName)} LIMIT 1`,
  );
  return result.ok && result.rows.length > 0;
}

export async function isGoogleDriveCoralReadyBackend(): Promise<boolean> {
  if (!isCoralEnabledEnv()) return false;
  const key = CORAL_GOOGLE_DRIVE_SCHEMA;
  if (schemaReadyCache.has(key)) return schemaReadyCache.get(key)!;
  const ready = await schemaRegistered(key);
  schemaReadyCache.set(key, ready);
  return ready;
}

export async function isGoogleCalendarCoralReadyBackend(): Promise<boolean> {
  if (!isCoralEnabledEnv()) return false;
  const key = CORAL_GOOGLE_CALENDAR_SCHEMA;
  if (schemaReadyCache.has(key)) return schemaReadyCache.get(key)!;
  const ready = await schemaRegistered(key);
  schemaReadyCache.set(key, ready);
  return ready;
}

function coralImportedSourceDir(sourceName: string): string {
  const home = process.env.CORAL_HOME ?? join(homedir(), ".config/coral");
  const workspace = process.env.CORAL_WORKSPACE ?? "default";
  return join(home, "workspaces", workspace, "sources", sourceName);
}

function syncGoogleCoralAccessToken(sourceName: string, accessToken: string, label: string): void {
  try {
    const dir = coralImportedSourceDir(sourceName);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "secrets.env"),
      `GOOGLE_ACCESS_TOKEN=${JSON.stringify(accessToken)}\n`,
      "utf8",
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    coralDebug(`coral/${label}`, `secrets.env sync skipped (non-fatal): ${msg}`);
  }
}

/** Keep Coral google_calendar source secrets aligned with a fresh access token. */
export function syncGoogleCalendarCoralAccessToken(accessToken: string): void {
  syncGoogleCoralAccessToken(GOOGLE_CALENDAR_SOURCE_NAME, accessToken, "google-calendar");
}

/** Keep Coral google_drive source secrets aligned with a fresh access token. */
export function syncGoogleDriveCoralAccessToken(accessToken: string): void {
  syncGoogleCoralAccessToken(GOOGLE_DRIVE_SOURCE_NAME, accessToken, "google-drive");
}

async function accessTokenFor(service: GoogleCoralService): Promise<string> {
  if (service === "drive") {
    const token = await getGoogleDriveAccessToken();
    syncGoogleDriveCoralAccessToken(token);
    return token;
  }
  const token = await getGoogleCalendarAccessToken();
  syncGoogleCalendarCoralAccessToken(token);
  return token;
}

function shouldLogGoogleSql(): boolean {
  return (
    process.env.CORAL_DEBUG_SQL === "true" ||
    process.env.CORAL_DEBUG_GOOGLE_CALENDAR === "true"
  );
}

function logGoogleSql(service: GoogleCoralService, sql: string): void {
  if (!shouldLogGoogleSql()) return;
  coralDebug(`coral/google-${service}`, sql);
  console.info(`[coral/google-${service}] SQL:\n${sql}`);
}

function failureMessage(service: GoogleCoralService, reason: string): string {
  return `[coral] google_${service === "calendar" ? "calendar" : "drive"} ${reason}`;
}

function extractApiErrorFromRows(rows: Record<string, unknown>[]): string | null {
  const raw = rows[0]?.raw;
  if (raw && typeof raw === "object" && raw !== null) {
    const err = (raw as { error?: { message?: string } }).error;
    if (err?.message) return err.message;
  }
  const errCol = rows[0]?.error;
  if (typeof errCol === "string" && errCol.trim()) return errCol;
  return null;
}

function throwOnCoralFailure(
  service: GoogleCoralService,
  sql: string,
  result: CoralSqlFailure,
): never {
  throw new GoogleCoralSqlError(service, failureMessage(service, result.error), {
    sql,
    cause: result,
  });
}

function throwOnEmptyRows(
  service: GoogleCoralService,
  sql: string,
  result: CoralSqlExecutionResult & { ok: true },
): never {
  const hint =
    service === "calendar"
      ? "event_creates returned 0 rows — check GOOGLE_REFRESH_TOKEN, run npm run setup:coral-google-calendar, and test with: coral sql \"<query>\""
      : "query returned 0 rows";
  const apiErr = extractApiErrorFromRows(result.rows);
  const detail = apiErr ? `${hint}; API: ${apiErr}` : `${hint}; stdout=${result.stdout.trim().slice(0, 500)}`;
  throw new GoogleCoralSqlError(service, failureMessage(service, detail), {
    sql,
    rows: result.rows,
  });
}

/**
 * Run Coral SQL with a refreshed Google access token.
 * Throws {@link GoogleCoralSqlError} with stderr/stdout on failure (no silent null).
 */
export async function executeGoogleCoralSql(
  service: GoogleCoralService,
  sql: string,
  options?: { allowEmpty?: boolean },
): Promise<Record<string, unknown>[]> {
  if (!isCoralEnabledEnv()) {
    throw new GoogleCoralSqlError(service, failureMessage(service, "CORAL_ENABLED is not true"), {
      sql,
    });
  }

  const ready =
    service === "drive"
      ? await isGoogleDriveCoralReadyBackend()
      : await isGoogleCalendarCoralReadyBackend();
  if (!ready) {
    throw new GoogleCoralSqlError(
      service,
      failureMessage(
        service,
        `schema ${service === "calendar" ? CORAL_GOOGLE_CALENDAR_SCHEMA : CORAL_GOOGLE_DRIVE_SCHEMA} not registered — run setup:coral-google-${service}`,
      ),
      { sql },
    );
  }

  let token: string;
  try {
    token = await accessTokenFor(service);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new GoogleCoralSqlError(
      service,
      failureMessage(service, `OAuth refresh failed: ${msg}`),
      { sql },
    );
  }

  logGoogleSql(service, sql);

  const result = await executeCoralSqlDetailed(sql, {
    env: { [CORAL_GOOGLE_ACCESS_TOKEN_ENV]: token },
  });

  if (!result.ok) {
    throwOnCoralFailure(service, sql, result);
  }

  if (result.rows.length === 0 && !options?.allowEmpty) {
    throwOnEmptyRows(service, sql, result);
  }

  return result.rows;
}

/** Legacy helper — returns null on failure instead of throwing. */
export async function tryExecuteGoogleCoralSql(
  service: GoogleCoralService,
  sql: string,
): Promise<Record<string, unknown>[] | null> {
  try {
    return await executeGoogleCoralSql(service, sql, { allowEmpty: true });
  } catch {
    return null;
  }
}

export function resetGoogleCoralSchemaCache(): void {
  schemaReadyCache.clear();
}
