/**
 * Single gateway for all Notion HTTP traffic from DhruvYantra.
 *
 * Reads (product): prefer Coral SQL via frontend `lib/coral/notion-reads.ts`.
 * Writes: Coral SQL is read-only — mutations go through this gateway to the Notion REST API
 * so agents and services share one orchestration path (Coral MCP layer).
 */
import { coralDebug } from "./coral-debug";
import { NOTION_DATABASES, type NotionDatabaseKey } from "./registry";

export type NotionGatewayOperation =
  | "auth.query"
  | "auth.create"
  | "auth.updateLogin"
  | "profiles.query"
  | "profiles.create"
  | "profiles.update"
  | "profiles.schema"
  | "studyPlans.query"
  | "studyPlans.create"
  | "studyPlans.update"
  | "resources.query"
  | "resources.create"
  | "resources.seedQuery";

export type NotionGatewayRequestOptions = {
  notionVersion?: string;
  token?: string;
  signal?: AbortSignal;
};

const DEFAULT_NOTION_VERSION = "2022-06-28";

export async function coralNotionRequest(
  operation: NotionGatewayOperation,
  path: string,
  init: RequestInit,
  options?: NotionGatewayRequestOptions,
): Promise<Record<string, unknown>> {
  const token = options?.token ?? process.env.NOTION_API_KEY?.trim();
  if (!token) {
    throw new Error("NOTION_API_KEY is not configured");
  }

  const version = options?.notionVersion ?? DEFAULT_NOTION_VERSION;
  const method = (init.method ?? "GET").toUpperCase();

  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    signal: options?.signal ?? init.signal ?? AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": version,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API error (${operation}): ${res.status} ${err}`);
  }

  if (method === "DELETE" || res.status === 204) {
    return {};
  }

  const body = (await res.json()) as Record<string, unknown>;

  coralDebug("coral/notion", `${method} ${operation} ${path}`);

  return body;
}

export function getNotionDatabaseId(key: NotionDatabaseKey): string | null {
  const envKey = NOTION_DATABASES[key].databaseIdEnv;
  return process.env[envKey]?.trim() ?? null;
}

export function getNotionDataSourceId(key: NotionDatabaseKey): string | null {
  const envKey = NOTION_DATABASES[key].dataSourceIdEnv;
  return process.env[envKey]?.trim() ?? null;
}

/** Fetch database schema (property types) for profile writes. */
export async function coralNotionGetDatabase(
  operation: NotionGatewayOperation,
  databaseKey: NotionDatabaseKey,
  options?: NotionGatewayRequestOptions,
): Promise<Record<string, unknown>> {
  const databaseId = getNotionDatabaseId(databaseKey);
  if (!databaseId) {
    throw new Error(`Notion database not configured for ${databaseKey}`);
  }

  return coralNotionRequest(
    operation,
    `/databases/${databaseId}`,
    { method: "GET" },
    options,
  );
}

/** Query a Notion data source (API 2025-09-03 — auth users DB). */
export async function coralNotionQueryDataSource(
  operation: NotionGatewayOperation,
  dataSourceId: string,
  body: Record<string, unknown>,
  options?: NotionGatewayRequestOptions,
): Promise<Record<string, unknown>> {
  return coralNotionRequest(
    operation,
    `/data_sources/${dataSourceId}/query`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    { notionVersion: "2025-09-03", ...options },
  );
}

/** Create a page in a configured Notion database. */
export async function coralNotionCreatePage(
  operation: NotionGatewayOperation,
  databaseKey: NotionDatabaseKey,
  properties: Record<string, unknown>,
  parent?: Record<string, unknown>,
  options?: NotionGatewayRequestOptions,
): Promise<Record<string, unknown>> {
  const databaseId = getNotionDatabaseId(databaseKey);
  if (!databaseId) {
    throw new Error(`Notion database not configured for ${databaseKey}`);
  }

  return coralNotionRequest(
    operation,
    "/pages",
    {
      method: "POST",
      body: JSON.stringify({
        parent: parent ?? { database_id: databaseId },
        properties,
      }),
    },
    options,
  );
}

/** Patch properties on an existing Notion page. */
export async function coralNotionPatchPage(
  operation: NotionGatewayOperation,
  pageId: string,
  properties: Record<string, unknown>,
  options?: NotionGatewayRequestOptions,
): Promise<Record<string, unknown>> {
  return coralNotionRequest(
    operation,
    `/pages/${pageId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    },
    options,
  );
}

/** Query a Notion database (direct API — used for writes lookup and Coral fallback reads). */
export async function coralNotionQueryDatabase(
  operation: NotionGatewayOperation,
  databaseKey: NotionDatabaseKey,
  body: Record<string, unknown>,
  options?: NotionGatewayRequestOptions,
): Promise<Record<string, unknown>> {
  const databaseId = getNotionDatabaseId(databaseKey);
  if (!databaseId) {
    throw new Error(`Notion database not configured for ${databaseKey}`);
  }

  return coralNotionRequest(
    operation,
    `/databases/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    options,
  );
}
