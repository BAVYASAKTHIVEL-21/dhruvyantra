import { coralNotionRequest } from "@backend/coral-mcp/notion-gateway";
import type { NotionGatewayOperation } from "@backend/coral-mcp/notion-gateway";

export const NOTION_VERSION = "2022-06-28";

export type NotionConfig = {
  token: string;
  databaseId: string;
};

export function getNotionToken(): string | null {
  const token = process.env.NOTION_API_KEY?.trim();
  return token || null;
}

export function getNotionDatabaseConfig(databaseIdEnv: string): NotionConfig | null {
  const token = getNotionToken();
  const databaseId = process.env[databaseIdEnv]?.trim();
  if (!token || !databaseId) return null;
  return { token, databaseId };
}

/**
 * @deprecated Prefer typed helpers from `@backend/coral-mcp/notion-gateway`.
 * All Notion HTTP traffic should go through the Coral gateway.
 */
export async function notionFetch(
  path: string,
  init: RequestInit,
  token: string,
  operation: NotionGatewayOperation = "resources.query",
): Promise<Record<string, unknown>> {
  return coralNotionRequest(operation, path, init, { token });
}
