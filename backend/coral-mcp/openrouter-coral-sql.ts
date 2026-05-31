import { CORAL_OPENROUTER_SCHEMA, OPENROUTER_CONFIG } from "./registry";
import {
  executeCoralSqlDetailed,
  isCoralEnabledEnv,
  sqlString,
  type CoralSqlFailure,
} from "./coral-sql";
import { coralDebug } from "./coral-debug";

let schemaReadyCache: boolean | null = null;

export class OpenRouterCoralSqlError extends Error {
  readonly sql: string;
  readonly coralError?: string;
  readonly stderr?: string;
  readonly stdout?: string;

  constructor(message: string, options: { sql: string; cause?: CoralSqlFailure }) {
    super(message);
    this.name = "OpenRouterCoralSqlError";
    this.sql = options.sql;
    if (options.cause) {
      this.coralError = options.cause.error;
      this.stderr = options.cause.stderr;
      this.stdout = options.cause.stdout;
    }
  }
}

async function schemaRegistered(): Promise<boolean> {
  const result = await executeCoralSqlDetailed(
    `SELECT table_name FROM coral.tables WHERE schema_name = ${sqlString(CORAL_OPENROUTER_SCHEMA)} LIMIT 1`,
  );
  return result.ok && result.rows.length > 0;
}

export async function isOpenRouterCoralReadyBackend(): Promise<boolean> {
  if (!isCoralEnabledEnv()) return false;
  if (schemaReadyCache !== null) return schemaReadyCache;
  schemaReadyCache = await schemaRegistered();
  return schemaReadyCache;
}

export function openRouterCoralEnv(): Record<string, string> | null {
  const apiKey = process.env[OPENROUTER_CONFIG.apiKeyEnv]?.trim();
  if (!apiKey) return null;

  return {
    [OPENROUTER_CONFIG.apiKeyEnv]: apiKey,
    OPENROUTER_APP_URL:
      process.env[OPENROUTER_CONFIG.appUrlEnv]?.trim() ?? OPENROUTER_CONFIG.defaultAppUrl,
    OPENROUTER_APP_NAME:
      process.env[OPENROUTER_CONFIG.appNameEnv]?.trim() ?? OPENROUTER_CONFIG.defaultAppName,
  };
}

function shouldLogOpenRouterSql(): boolean {
  return (
    process.env.CORAL_DEBUG_SQL === "true" ||
    process.env.CORAL_DEBUG_OPENROUTER === "true"
  );
}

/** Run Coral SQL with OpenRouter credentials (throws on failure). */
export async function executeOpenRouterCoralSql(
  sql: string,
): Promise<Record<string, unknown>[]> {
  if (!isCoralEnabledEnv()) {
    throw new OpenRouterCoralSqlError("[coral] openrouter CORAL_ENABLED is not true", { sql });
  }

  if (!(await isOpenRouterCoralReadyBackend())) {
    throw new OpenRouterCoralSqlError(
      "[coral] openrouter schema not registered — run: npm run setup:coral-openrouter",
      { sql },
    );
  }

  const env = openRouterCoralEnv();
  if (!env) {
    throw new OpenRouterCoralSqlError(
      `[coral] openrouter ${OPENROUTER_CONFIG.apiKeyEnv} is not configured`,
      { sql },
    );
  }

  if (shouldLogOpenRouterSql()) {
    coralDebug("coral/openrouter", sql);
    console.info("[coral/openrouter] SQL:\n", sql);
  }

  const result = await executeCoralSqlDetailed(sql, { env });
  if (!result.ok) {
    throw new OpenRouterCoralSqlError(`[coral] openrouter ${result.error}`, {
      sql,
      cause: result,
    });
  }

  if (result.rows.length === 0) {
    throw new OpenRouterCoralSqlError(
      "[coral] openrouter query returned 0 rows",
      { sql },
    );
  }

  return result.rows;
}

/** Legacy helper — returns null on failure. */
export async function tryExecuteOpenRouterCoralSql(
  sql: string,
): Promise<Record<string, unknown>[] | null> {
  try {
    return await executeOpenRouterCoralSql(sql);
  } catch {
    return null;
  }
}

export function resetOpenRouterCoralSchemaCache(): void {
  schemaReadyCache = null;
}
