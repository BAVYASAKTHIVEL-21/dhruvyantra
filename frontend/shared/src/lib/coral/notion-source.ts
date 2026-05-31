import {
  CORAL_NOTION_SCHEMA,
  NOTION_DATABASES,
  type NotionDatabaseKey,
} from "@backend/coral-mcp/registry";
import { pageFromCoralRow } from "@/lib/notion/mappers";
import { sqlString } from "./client";
import { getCachedDataSourcePages } from "./pages-cache";
import { queryCoralSql } from "./query";
import { isNotionCoralReady } from "./readiness";

const dataSourceCache = new Map<string, string>();

function dataSourceEnvKey(key: NotionDatabaseKey): string {
  return NOTION_DATABASES[key].dataSourceIdEnv;
}

export function getConfiguredDataSourceId(key: NotionDatabaseKey): string | null {
  const envKey = dataSourceEnvKey(key);
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;
  return null;
}

function parseDataSourcesJson(raw: unknown): string | null {
  if (!raw) return null;
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value[0];
  if (first && typeof first === "object" && "id" in first) {
    const id = (first as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

/** Resolve Notion data_source_id for a database (env override, then Coral catalog). */
export async function resolveDataSourceId(key: NotionDatabaseKey): Promise<string | null> {
  const config = NOTION_DATABASES[key];
  const fromEnv = getConfiguredDataSourceId(key);
  if (fromEnv) return fromEnv;

  const cached = dataSourceCache.get(config.databaseIdEnv);
  if (cached) return cached;

  const databaseId = process.env[config.databaseIdEnv]?.trim();
  if (!databaseId) return null;

  if (!(await isNotionCoralReady())) {
    return databaseId;
  }

  const rows = await queryCoralSql(
    `SELECT data_sources FROM ${CORAL_NOTION_SCHEMA}.databases WHERE database_id = ${sqlString(databaseId)} LIMIT 1`,
  );
  const dataSourceId = parseDataSourcesJson(rows?.[0]?.data_sources);
  if (dataSourceId) {
    dataSourceCache.set(config.databaseIdEnv, dataSourceId);
    return dataSourceId;
  }

  // Plain single-table databases often use the database id as the data source id.
  return databaseId;
}

export type CoralNotionPageRow = {
  id: string;
  properties: unknown;
  created_time?: string;
};

/** Fetch pages from a Notion data source via Coral (bundled notion source). */
export async function fetchDataSourcePages(
  key: NotionDatabaseKey,
): Promise<CoralNotionPageRow[]> {
  if (!(await isNotionCoralReady())) {
    throw new Error(
      `[coral] notion schema not ready — run: npm run setup:coral-notion`,
    );
  }

  return getCachedDataSourcePages(key, async () => {
    const dataSourceId = await resolveDataSourceId(key);
    if (!dataSourceId) return [];

    const rows = await queryCoralSql(
      `SELECT id, properties, created_time FROM ${CORAL_NOTION_SCHEMA}.data_source_pages WHERE data_source_id = ${sqlString(dataSourceId)}`,
    );

    const pages: CoralNotionPageRow[] = [];
    for (const row of rows) {
      if (typeof row.id !== "string") continue;
      const normalized = pageFromCoralRow({
        id: row.id,
        properties: row.properties,
        created_time:
          typeof row.created_time === "string"
            ? row.created_time
            : row.created_time instanceof Date
              ? row.created_time.toISOString()
              : undefined,
      });
      if (!normalized) continue;
      pages.push({
        id: normalized.id as string,
        properties: normalized.properties,
        created_time:
          typeof normalized.created_time === "string"
            ? normalized.created_time
            : undefined,
      });
    }
    return pages;
  });
}
