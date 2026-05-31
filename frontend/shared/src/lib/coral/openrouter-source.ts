/**
 * OpenRouter reads via `coral sql` (same pattern as notion-source.ts).
 */
import { CORAL_OPENROUTER_SCHEMA } from "@backend/coral-mcp/registry";
import { openRouterCoralEnv } from "@backend/coral-mcp/openrouter-coral-sql";
import { sqlString } from "./client";
import { queryCoralSql } from "./query";
import { isOpenRouterCoralReady } from "./readiness";

export type CoralOpenRouterModelRow = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
};

function rowToModel(row: Record<string, unknown>): CoralOpenRouterModelRow | null {
  if (typeof row.id !== "string") return null;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : undefined,
    description: typeof row.description === "string" ? row.description : undefined,
    context_length:
      typeof row.context_length === "number"
        ? row.context_length
        : row.context_length != null
          ? Number(row.context_length)
          : undefined,
  };
}

function coralEnv(): Record<string, string> {
  const env = openRouterCoralEnv();
  if (!env) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured — add it to .env.local and run npm run setup:coral-openrouter",
    );
  }
  return env;
}

/** List models from openrouter.models via Coral SQL. */
export async function queryOpenRouterModelsViaCoral(): Promise<CoralOpenRouterModelRow[]> {
  if (!(await isOpenRouterCoralReady())) {
    throw new Error("[coral] openrouter schema not ready — run: npm run setup:coral-openrouter");
  }

  const rows = await queryCoralSql(
    `SELECT id, name, description, context_length FROM ${CORAL_OPENROUTER_SCHEMA}.models`,
    { env: coralEnv() },
  );

  const models: CoralOpenRouterModelRow[] = [];
  for (const row of rows) {
    const mapped = rowToModel(row);
    if (mapped) models.push(mapped);
  }
  return models;
}

/** Single model row via Coral SQL. */
export async function queryOpenRouterModelByIdViaCoral(
  modelId: string,
): Promise<CoralOpenRouterModelRow | null> {
  if (!(await isOpenRouterCoralReady())) {
    throw new Error("[coral] openrouter schema not ready — run: npm run setup:coral-openrouter");
  }

  const rows = await queryCoralSql(
    `SELECT id, name, description, context_length FROM ${CORAL_OPENROUTER_SCHEMA}.models WHERE id = ${sqlString(modelId)} LIMIT 1`,
    { env: coralEnv() },
  );

  if (rows.length === 0) return null;
  return rowToModel(rows[0]) ?? null;
}
