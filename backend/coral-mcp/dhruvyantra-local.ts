/**
 * @deprecated Use `frontend/shared/src/lib/coral/dhruvyantra-store.ts` from the app.
 * Kept for registry constant and legacy imports.
 */
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { executeCoralSqlDetailed, sqlString } from "./coral-sql";

export const CORAL_DHRUVYANTRA_SCHEMA = "dhruvyantra";

function defaultDataDir(): string {
  const fromEnv = process.env.CORAL_DATA_DIR?.trim();
  if (fromEnv) return resolve(fromEnv);
  return resolve(process.cwd(), ".data/coral");
}

export function getCoralDataDir(): string {
  return defaultDataDir();
}

function safeUserFileName(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function focusActivePath(userId: string): string {
  return join(getCoralDataDir(), "focus", "active", `${safeUserFileName(userId)}.jsonl`);
}

function focusCompletionsPath(userId: string): string {
  return join(getCoralDataDir(), "focus", "completions", `${safeUserFileName(userId)}.jsonl`);
}

function mockSubmissionsPath(userId: string): string {
  return join(getCoralDataDir(), "mock", "submissions", `${safeUserFileName(userId)}.jsonl`);
}

function ensureParent(filePath: string): void {
  mkdirSync(join(filePath, ".."), { recursive: true });
}

function writeJsonlLine(filePath: string, record: Record<string, unknown>): void {
  ensureParent(filePath);
  writeFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

function appendJsonlLine(filePath: string, record: Record<string, unknown>): void {
  ensureParent(filePath);
  appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

function coralDataEnv(): Record<string, string> {
  const dir = getCoralDataDir();
  return { DATA_DIR: dir, CORAL_DATA_DIR: dir };
}

async function queryDhruvyantra(sql: string): Promise<Record<string, unknown>[]> {
  const result = await executeCoralSqlDetailed(sql, { env: coralDataEnv() });
  if (!result.ok) {
    throw new Error(`[coral] dhruvyantra query failed: ${result.error}`);
  }
  return result.rows;
}

export function buildFocusActiveSelectSql(userId: string): string {
  return `SELECT session_json FROM ${CORAL_DHRUVYANTRA_SCHEMA}.focus_active_sessions WHERE user_id = ${sqlString(userId)} LIMIT 1`;
}

export function buildFocusCompletionsSelectSql(userId: string): string {
  return `SELECT id, date, completed_at, mode, topic, subject, elapsed_seconds FROM ${CORAL_DHRUVYANTRA_SCHEMA}.focus_completions WHERE user_id = ${sqlString(userId)}`;
}

export function buildMockSubmissionsSelectSql(userId: string): string {
  return `SELECT record_json, submitted_at FROM ${CORAL_DHRUVYANTRA_SCHEMA}.mock_submissions WHERE user_id = ${sqlString(userId)}`;
}

/** Persist active session to JSONL then read back via Coral SQL (logs query). */
export async function writeFocusActiveSessionCoral(
  userId: string,
  sessionJson: string | null,
): Promise<void> {
  const path = focusActivePath(userId);
  if (!sessionJson) {
    if (existsSync(path)) writeFileSync(path, "", "utf8");
    return;
  }
  writeJsonlLine(path, { user_id: userId, session_json: sessionJson });
  await queryDhruvyantra(buildFocusActiveSelectSql(userId));
}

export async function readFocusActiveSessionCoral(
  userId: string,
): Promise<string | null> {
  const rows = await queryDhruvyantra(buildFocusActiveSelectSql(userId));
  const raw = rows[0]?.session_json;
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw;
}

export async function appendFocusCompletionCoral(
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
  appendJsonlLine(focusCompletionsPath(userId), { user_id: userId, ...row });
  await queryDhruvyantra(buildFocusCompletionsSelectSql(userId));
}

export async function readFocusCompletionsCoral(
  userId: string,
): Promise<Record<string, unknown>[]> {
  return queryDhruvyantra(buildFocusCompletionsSelectSql(userId));
}

export async function rewriteMockSubmissionsCoral(
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
  await queryDhruvyantra(buildMockSubmissionsSelectSql(userId));
}

export async function readMockSubmissionsCoral(
  userId: string,
): Promise<Record<string, unknown>[]> {
  return queryDhruvyantra(buildMockSubmissionsSelectSql(userId));
}

export function ensureCoralDataDirs(): void {
  const root = getCoralDataDir();
  for (const sub of ["focus/active", "focus/completions", "mock/submissions"]) {
    mkdirSync(join(root, sub), { recursive: true });
  }
}
