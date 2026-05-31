import { spawn } from "node:child_process";

export type CoralRow = Record<string, unknown>;

function coralBin(): string {
  return process.env.CORAL_BIN?.trim() || "coral";
}

function coralTimeoutMs(): number {
  const raw = process.env.CORAL_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : 30_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000;
}

function parseCoralJson(stdout: string): CoralRow[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];

  const parsed = JSON.parse(trimmed) as unknown;

  if (Array.isArray(parsed)) {
    return parsed.filter((row): row is CoralRow => row !== null && typeof row === "object");
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["rows", "data", "results"]) {
      const candidate = obj[key];
      if (Array.isArray(candidate)) {
        return candidate.filter((row): row is CoralRow => row !== null && typeof row === "object");
      }
    }
  }

  return [];
}

import { coralDebug } from "./coral-debug";
import { logCoralQuery } from "./coral-query-log";
import { isCoralEnabledEnv } from "./coral-env";
import { executeParsedCoralWrite } from "./coral-write-executor";
import { parseDhruvYantraWriteSql, type ParsedCoralWrite } from "./coral-write-sql";

function isWriteSql(sql: string): boolean {
  const t = sql.trim();
  return /^(INSERT|UPDATE|DELETE)\s+/i.test(t);
}

export type CoralSqlFailure = {
  ok: false;
  error: string;
  stderr: string;
  stdout: string;
  exitCode: number | null;
  sql: string;
};

export type CoralSqlSuccess = {
  ok: true;
  rows: CoralRow[];
  stderr: string;
  stdout: string;
};

export type CoralSqlExecutionResult = CoralSqlSuccess | CoralSqlFailure;

function formatCoralSqlError(stderr: string, stdout: string, exitCode: number | null): string {
  const parts: string[] = [];
  if (exitCode !== null && exitCode !== 0) parts.push(`exit ${exitCode}`);
  const errText = stderr.trim() || stdout.trim();
  if (errText) parts.push(errText);
  return parts.join(": ") || "Coral SQL failed with no output";
}

/** Execute read-only SQL; returns structured success/failure (no silent null). */
export async function executeCoralSqlDetailed(
  sql: string,
  options?: { env?: Record<string, string> },
): Promise<CoralSqlExecutionResult> {
  const bin = coralBin();
  const timeoutMs = coralTimeoutMs();
  const trimmed = sql.trim();
  logCoralQuery(trimmed);

  if (process.env.CORAL_DEBUG_SQL === "true") {
    coralDebug("coral-sql", trimmed);
  }

  return new Promise((resolve) => {
    const child = spawn(bin, ["sql", "--format", "json", trimmed], {
      env: { ...process.env, ...options?.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        error: `spawn failed: ${err.message}`,
        stderr: err.message,
        stdout,
        exitCode: null,
        sql: trimmed,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve({
          ok: false,
          error: formatCoralSqlError(stderr, stdout, code),
          stderr,
          stdout,
          exitCode: code,
          sql: trimmed,
        });
        return;
      }
      try {
        resolve({
          ok: true,
          rows: parseCoralJson(stdout),
          stderr,
          stdout,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        resolve({
          ok: false,
          error: `JSON parse failed: ${msg}`,
          stderr,
          stdout,
          exitCode: code,
          sql: trimmed,
        });
      }
    });
  });
}

/** Execute read-only SQL against the local Coral runtime. */
export async function executeCoralSql(
  sql: string,
  options?: { env?: Record<string, string> },
): Promise<CoralRow[] | null> {
  const result = await executeCoralSqlDetailed(sql, options);
  if (!result.ok) {
    if (process.env.CORAL_DEBUG_SQL === "true") {
      console.warn("[coral] sql failed:", result.error);
    }
    return null;
  }
  return result.rows;
}

export function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export { isCoralEnabledEnv } from "./coral-env";

/**
 * Execute a typed Coral write (app/services). Uses manifests + `coral sql` for reads
 * via manifest POST tables; legacy virtual DML still parses to the same Coral SQL paths.
 */
export async function executeCoralWrite(parsed: ParsedCoralWrite): Promise<CoralRow[]> {
  if (!isCoralEnabledEnv()) {
    throw new Error("CORAL_ENABLED is not true — enable Coral for writes");
  }
  return executeParsedCoralWrite(parsed);
}

/**
 * Parse agent virtual DML SQL and execute (not passed to `coral sql` CLI).
 */
export async function executeCoralSqlWrite(
  sql: string,
  _options?: { env?: Record<string, string> },
): Promise<CoralRow[]> {
  if (!isCoralEnabledEnv()) {
    throw new Error("CORAL_ENABLED is not true — enable Coral for SQL writes");
  }

  const parsed = parseDhruvYantraWriteSql(sql);
  if (!parsed) {
    throw new Error(
      `Unsupported Coral write SQL. See CORAL_WRITE_SQL_BUILDERS in coral-write-sql.ts`,
    );
  }

  return executeCoralWrite(parsed);
}

/** Run read or write SQL — writes throw; reads return null on failure. */
export async function runCoralSql(
  sql: string,
  options?: { env?: Record<string, string> },
): Promise<CoralRow[] | null> {
  if (isWriteSql(sql)) {
    return executeCoralSqlWrite(sql, options);
  }
  return executeCoralSql(sql, options);
}
