import { CORAL_TELEGRAM_SCHEMA, TELEGRAM_CONFIG } from "./registry";
import { executeCoralSql, isCoralEnabledEnv, sqlString } from "./coral-sql";

let schemaReadyCache: boolean | null = null;

async function schemaRegistered(): Promise<boolean> {
  const rows = await executeCoralSql(
    `SELECT table_name FROM coral.tables WHERE schema_name = ${sqlString(CORAL_TELEGRAM_SCHEMA)} LIMIT 1`,
  );
  return rows !== null && rows.length > 0;
}

export async function isTelegramCoralReadyBackend(): Promise<boolean> {
  if (!isCoralEnabledEnv()) return false;
  if (schemaReadyCache !== null) return schemaReadyCache;
  schemaReadyCache = await schemaRegistered();
  return schemaReadyCache;
}

function botToken(): string | null {
  return process.env[TELEGRAM_CONFIG.botTokenEnv]?.trim() || null;
}

export async function executeTelegramCoralSql(
  sql: string,
): Promise<Record<string, unknown>[] | null> {
  if (!isCoralEnabledEnv()) return null;
  if (!(await isTelegramCoralReadyBackend())) return null;

  const token = botToken();
  if (!token) return null;

  return executeCoralSql(sql, {
    env: { [TELEGRAM_CONFIG.botTokenEnv]: token },
  });
}

export function resetTelegramCoralSchemaCache(): void {
  schemaReadyCache = null;
}
