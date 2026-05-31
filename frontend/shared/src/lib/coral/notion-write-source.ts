import {
  buildNotionPageCreateSql,
  patchNotionPageViaNotionGateway,
} from "@backend/coral-mcp/notion-writes-coral";
import { getNotionDatabaseId } from "./notion-config";
import { assertCoralEnabled, CoralSqlError, queryCoralSql } from "./query";
import { isNotionCoralReady, isNotionWritesCoralReady } from "./readiness";

export async function createNotionPageViaCoralSql(
  databaseKey: "studyPlans" | "resources" | "profiles",
  properties: Record<string, unknown>,
): Promise<{ id: string; created_time?: string }> {
  assertCoralEnabled();

  if (!(await isNotionCoralReady())) {
    throw new Error("[coral] notion schema not ready — run: npm run setup:coral-notion");
  }

  if (!(await isNotionWritesCoralReady())) {
    throw new Error(
      "[coral] notion_writes.page_creates not registered — run: npm run setup:coral-notion",
    );
  }

  const databaseId = getNotionDatabaseId(databaseKey);
  if (!databaseId) {
    throw new Error(`Notion database not configured for ${databaseKey}`);
  }

  const sql = buildNotionPageCreateSql(databaseId, properties);
  let rows: Record<string, unknown>[];
  try {
    rows = await queryCoralSql(sql, {
      env: {
        NOTION_API_KEY: process.env.NOTION_API_KEY?.trim() ?? "",
        NOTION_VERSION: process.env.NOTION_VERSION?.trim() || "2022-06-28",
      },
    });
  } catch (e) {
    if (e instanceof CoralSqlError && e.coralError?.includes("notion_writes")) {
      throw new Error(
        `${e.message} — Run: cd frontend/shared && npm run setup:coral-notion`,
      );
    }
    throw e;
  }
  if (rows.length === 0) {
    throw new Error("[coral] notion_writes.page_creates returned no rows");
  }

  const first = rows[0];
  const id = typeof first.id === "string" ? first.id : "";
  if (!id) {
    throw new Error("[coral] notion page create missing id");
  }

  return {
    id,
    created_time:
      typeof first.created_time === "string"
        ? first.created_time
        : undefined,
  };
}

export async function updateNotionPageViaCoralSql(
  pageId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  assertCoralEnabled();

  if (!(await isNotionCoralReady())) {
    throw new Error("[coral] notion schema not ready — run: npm run setup:coral-notion");
  }

  await patchNotionPageViaNotionGateway("studyPlans.update", pageId, properties);
}
