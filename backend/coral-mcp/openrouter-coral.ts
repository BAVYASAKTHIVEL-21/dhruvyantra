import { CORAL_OPENROUTER_SCHEMA } from "./registry";
import { tryExecuteOpenRouterCoralSql } from "./openrouter-coral-sql";
import { sqlString } from "./coral-sql";

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

/** All models via Coral SQL → GET /models. */
export async function fetchModelsFromCoral(): Promise<CoralOpenRouterModelRow[] | null> {
  const rows = await tryExecuteOpenRouterCoralSql(
    `SELECT id, name, description, context_length FROM ${CORAL_OPENROUTER_SCHEMA}.models`,
  );
  if (!rows) return null;

  const models: CoralOpenRouterModelRow[] = [];
  for (const row of rows) {
    const mapped = rowToModel(row);
    if (mapped) models.push(mapped);
  }
  return models;
}

/** Check model id exists in catalog via Coral SQL. */
export async function modelExistsViaCoral(modelId: string): Promise<boolean | null> {
  const rows = await tryExecuteOpenRouterCoralSql(
    `SELECT id FROM ${CORAL_OPENROUTER_SCHEMA}.models WHERE id = ${sqlString(modelId)} LIMIT 1`,
  );
  if (!rows) return null;
  return rows.length > 0;
}

/** Single model metadata via Coral SQL. */
export async function fetchModelFromCoral(
  modelId: string,
): Promise<CoralOpenRouterModelRow | null> {
  const rows = await tryExecuteOpenRouterCoralSql(
    `SELECT id, name, description, context_length FROM ${CORAL_OPENROUTER_SCHEMA}.models WHERE id = ${sqlString(modelId)} LIMIT 1`,
  );
  if (!rows || rows.length === 0) return null;
  return rowToModel(rows[0]) ?? null;
}
