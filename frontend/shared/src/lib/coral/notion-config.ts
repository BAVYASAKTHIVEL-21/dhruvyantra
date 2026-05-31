import { NOTION_DATABASES, type NotionDatabaseKey } from "@backend/coral-mcp/registry";

export function getNotionDatabaseId(key: NotionDatabaseKey): string | null {
  return process.env[NOTION_DATABASES[key].databaseIdEnv]?.trim() ?? null;
}

export function getNotionDataSourceId(key: NotionDatabaseKey): string | null {
  return process.env[NOTION_DATABASES[key].dataSourceIdEnv]?.trim() ?? null;
}
