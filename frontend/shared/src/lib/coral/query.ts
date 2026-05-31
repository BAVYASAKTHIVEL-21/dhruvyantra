/**
 * Coral SQL reads via `coral sql` CLI.
 */
import { executeCoralSqlDetailed, executeCoralSqlWrite, executeCoralWrite } from "./client";
import { isCoralEnabled } from "./config";

export class CoralSqlError extends Error {
  readonly sql: string;
  readonly coralError?: string;

  constructor(message: string, options: { sql: string; coralError?: string }) {
    super(message);
    this.name = "CoralSqlError";
    this.sql = options.sql;
    this.coralError = options.coralError;
  }
}

export function assertCoralEnabled(): void {
  if (!isCoralEnabled()) {
    throw new CoralSqlError(
      "CORAL_ENABLED must be true. Run npm run setup:coral-all and set CORAL_ENABLED=true in .env.local",
      { sql: "" },
    );
  }
}

/** Read via Coral SQL — throws with Coral stderr on failure. */
export async function queryCoralSql(
  sql: string,
  options?: { env?: Record<string, string> },
): Promise<Record<string, unknown>[]> {
  assertCoralEnabled();
  const result = await executeCoralSqlDetailed(sql, options);
  if (!result.ok) {
    throw new CoralSqlError(`Coral SQL failed: ${result.error}`, {
      sql,
      coralError: result.stderr?.trim() || result.error,
    });
  }
  return result.rows;
}

/** Agent write via virtual DML SQL — throws on failure. */
export async function mutateCoralSql(
  sql: string,
  options?: { env?: Record<string, string> },
): Promise<Record<string, unknown>[]> {
  assertCoralEnabled();
  return executeCoralSqlWrite(sql, options);
}

export { executeCoralWrite };
