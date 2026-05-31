import { NOTION_DATABASES, type NotionDatabaseKey } from "@backend/coral-mcp/registry";
import { CORAL_NOTION_SCHEMA } from "@backend/coral-mcp/registry";
import { sqlString } from "./client";
import { queryCoralSql } from "./query";

export type NotionPropertySchema = Record<string, { type: string }>;

function parseDatabaseRaw(raw: unknown): NotionPropertySchema {
  if (!raw) return {};

  let record: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      record = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  } else if (typeof raw === "object" && raw !== null) {
    record = raw as Record<string, unknown>;
  }

  if (!record) return {};

  const properties = record.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return {};
  }

  const schema: NotionPropertySchema = {};
  for (const [key, value] of Object.entries(properties as Record<string, unknown>)) {
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: unknown }).type;
      if (typeof type === "string") {
        schema[key] = { type };
      }
    }
  }
  return schema;
}

/** Load Notion database property schema via Coral SQL only. */
export async function fetchNotionDatabaseSchemaViaCoral(
  key: NotionDatabaseKey,
): Promise<NotionPropertySchema> {
  const databaseId = process.env[NOTION_DATABASES[key].databaseIdEnv]?.trim();
  if (!databaseId) return {};

  const rows = await queryCoralSql(
    `SELECT raw FROM ${CORAL_NOTION_SCHEMA}.databases WHERE database_id = ${sqlString(databaseId)} LIMIT 1`,
  );

  return parseDatabaseRaw(rows[0]?.raw);
}
