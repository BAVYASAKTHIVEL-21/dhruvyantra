/**
 * Local focus / mock-center state via Coral JSONL (`dhruvyantra` schema).
 * Server-only — uses fs + `coral sql`.
 */
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { executeCoralSqlDetailed, sqlString } from "./client";

const SCHEMA = "dhruvyantra";

function dataDir(): string {
  const fromEnv = process.env.CORAL_DATA_DIR?.trim();
  if (fromEnv) return resolve(fromEnv);
  return resolve(process.cwd(), ".data/coral");
}

function coralEnv(): Record<string, string> {
  const dir = dataDir();
  return { DATA_DIR: dir, CORAL_DATA_DIR: dir };
}

function safeUserFileName(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function focusActivePath(userId: string): string {
  return join(dataDir(), "focus", "active", `${safeUserFileName(userId)}.jsonl`);
}

function focusCompletionsPath(userId: string): string {
  return join(dataDir(), "focus", "completions", `${safeUserFileName(userId)}.jsonl`);
}

function mockSubmissionsPath(userId: string): string {
  return join(dataDir(), "mock", "submissions", `${safeUserFileName(userId)}.jsonl`);
}

function ensureParent(filePath: string): void {
  mkdirSync(join(filePath, ".."), { recursive: true });
}

async function query(sql: string): Promise<Record<string, unknown>[]> {
  const result = await executeCoralSqlDetailed(sql, { env: coralEnv() });
  if (!result.ok) {
    throw new Error(`[coral] dhruvyantra query failed: ${result.error}`);
  }
  return result.rows;
}

export function getCoralDataDir(): string {
  return dataDir();
}

export function ensureCoralDataDirs(): void {
  const root = dataDir();
  for (const sub of ["focus/active", "focus/completions", "mock/submissions"]) {
    mkdirSync(join(root, sub), { recursive: true });
  }
}

let schemaReady: boolean | null = null;

export async function isDhruvyantraStoreReady(): Promise<boolean> {
  if (process.env.CORAL_ENABLED !== "true") return false;
  if (schemaReady !== null) return schemaReady;
  const result = await executeCoralSqlDetailed(
    `SELECT table_name FROM coral.tables WHERE schema_name = 'dhruvyantra' LIMIT 1`,
    { env: coralEnv() },
  );
  schemaReady = result.ok && result.rows.length > 0;
  return schemaReady;
}

export async function writeFocusActiveSession(
  userId: string,
  sessionJson: string | null,
): Promise<void> {
  const path = focusActivePath(userId);
  if (!sessionJson) {
    if (existsSync(path)) writeFileSync(path, "", "utf8");
    return;
  }
  ensureParent(path);
  writeFileSync(path, `${JSON.stringify({ user_id: userId, session_json: sessionJson })}\n`, "utf8");
  await query(
    `SELECT session_json FROM ${SCHEMA}.focus_active_sessions WHERE user_id = ${sqlString(userId)} LIMIT 1`,
  );
}

export async function readFocusActiveSession(userId: string): Promise<string | null> {
  const rows = await query(
    `SELECT session_json FROM ${SCHEMA}.focus_active_sessions WHERE user_id = ${sqlString(userId)} LIMIT 1`,
  );
  const raw = rows[0]?.session_json;
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw;
}

export async function appendFocusCompletion(
  userId: string,
  row: {
    id: string;
    date: string;
    completed_at: string;
    mode: string;
    topic: string;
    subject: string;
    elapsed_seconds: number;
  },
): Promise<void> {
  const path = focusCompletionsPath(userId);
  ensureParent(path);
  appendFileSync(path, `${JSON.stringify({ user_id: userId, ...row })}\n`, "utf8");
  await query(
    `SELECT id, date, completed_at, mode, topic, subject, elapsed_seconds FROM ${SCHEMA}.focus_completions WHERE user_id = ${sqlString(userId)}`,
  );
}

export async function readFocusCompletions(userId: string): Promise<Record<string, unknown>[]> {
  return query(
    `SELECT id, date, completed_at, mode, topic, subject, elapsed_seconds FROM ${SCHEMA}.focus_completions WHERE user_id = ${sqlString(userId)}`,
  );
}

export async function rewriteMockSubmissions(
  userId: string,
  records: { submittedAt: string; record: Record<string, unknown> }[],
): Promise<void> {
  const path = mockSubmissionsPath(userId);
  const lines = records
    .slice(0, 40)
    .map((r) =>
      JSON.stringify({
        user_id: userId,
        submitted_at: r.submittedAt,
        record_json: r.record,
      }),
    )
    .join("\n");
  ensureParent(path);
  writeFileSync(path, lines ? `${lines}\n` : "", "utf8");
  await query(
    `SELECT record_json, submitted_at FROM ${SCHEMA}.mock_submissions WHERE user_id = ${sqlString(userId)}`,
  );
}

export async function readMockSubmissions(userId: string): Promise<Record<string, unknown>[]> {
  return query(
    `SELECT record_json, submitted_at FROM ${SCHEMA}.mock_submissions WHERE user_id = ${sqlString(userId)}`,
  );
}
