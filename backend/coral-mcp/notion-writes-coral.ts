import {
  executeCoralSql,
  executeCoralSqlDetailed,
  isCoralEnabledEnv,
  sqlString,
  type CoralSqlExecutionResult,
} from "./coral-sql";
import { logCoralQuery } from "./coral-query-log";
import { coralNotionPatchPage } from "./notion-gateway";
import type { NotionGatewayOperation } from "./notion-gateway";

/** Schema for imported notion_writes source (POST /v1/pages). */
export const CORAL_NOTION_WRITES_SCHEMA = "notion_writes";

function sqlJsonFilter(value: unknown): string {
  return sqlString(JSON.stringify(value));
}

export function buildNotionPageCreateSql(
  databaseId: string,
  properties: Record<string, unknown>,
): string {
  return `SELECT id, created_time, raw FROM ${CORAL_NOTION_WRITES_SCHEMA}.page_creates WHERE database_id = ${sqlString(databaseId)} AND properties_json = ${sqlJsonFilter(properties)} LIMIT 1`;
}

/** Coral HTTP sources only allow GET/POST — page PATCH goes through the Notion gateway with logging. */
export async function patchNotionPageViaNotionGateway(
  operation: NotionGatewayOperation,
  pageId: string,
  properties: Record<string, unknown>,
): Promise<{ id: string; last_edited_time?: string }> {
  logCoralQuery(
    `PATCH /v1/pages/${pageId} properties=${JSON.stringify(properties).slice(0, 200)}`,
    "notion",
  );
  const page = await coralNotionPatchPage(operation, pageId, properties);
  return {
    id: typeof page.id === "string" ? page.id : pageId,
    last_edited_time:
      typeof page.last_edited_time === "string" ? page.last_edited_time : undefined,
  };
}

function notionWritesEnv(): Record<string, string> | null {
  const apiKey = process.env.NOTION_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    NOTION_API_KEY: apiKey,
    NOTION_VERSION: process.env.NOTION_VERSION?.trim() || "2022-06-28",
  };
}

/** Run notion_writes SQL via `coral sql` (logged as [coral] query → …). */
export async function executeNotionWritesCoralSqlDetailed(
  sql: string,
): Promise<CoralSqlExecutionResult> {
  if (!isCoralEnabledEnv()) {
    return {
      ok: false,
      error: "CORAL_ENABLED is not true",
      stderr: "",
      stdout: "",
      exitCode: null,
      sql,
    };
  }
  const env = notionWritesEnv();
  if (!env) {
    return {
      ok: false,
      error: "NOTION_API_KEY is not configured",
      stderr: "",
      stdout: "",
      exitCode: null,
      sql,
    };
  }
  return executeCoralSqlDetailed(sql, { env });
}

export async function executeNotionWritesCoralSql(
  sql: string,
): Promise<Record<string, unknown>[] | null> {
  if (!isCoralEnabledEnv()) return null;
  const apiKey = process.env.NOTION_API_KEY?.trim();
  if (!apiKey) return null;
  return executeCoralSql(sql, {
    env: {
      NOTION_API_KEY: apiKey,
      NOTION_VERSION: process.env.NOTION_VERSION?.trim() || "2022-06-28",
    },
  });
}
