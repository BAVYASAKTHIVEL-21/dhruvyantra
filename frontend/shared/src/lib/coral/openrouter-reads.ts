import type { CoralOpenRouterModelRow } from "./openrouter-source";
import {
  queryOpenRouterModelByIdViaCoral,
  queryOpenRouterModelsViaCoral,
} from "./openrouter-source";
import { assertCoralEnabled } from "./query";

export type OpenRouterModelInfo = {
  id: string;
  name?: string;
  description?: string;
  contextLength?: number;
};

function mapModel(row: CoralOpenRouterModelRow): OpenRouterModelInfo {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contextLength: row.context_length,
  };
}

/** List models via Coral SQL (`openrouter.models`). */
export async function listModelsViaCoral(): Promise<OpenRouterModelInfo[]> {
  assertCoralEnabled();
  const rows = await queryOpenRouterModelsViaCoral();
  return rows.map(mapModel);
}

export async function getModelViaCoral(modelId: string): Promise<OpenRouterModelInfo | null> {
  assertCoralEnabled();
  const row = await queryOpenRouterModelByIdViaCoral(modelId);
  if (!row) return null;
  return mapModel(row);
}

export async function probeOpenRouterViaCoral(): Promise<{
  ok: boolean;
  modelCount?: number;
  error?: string;
}> {
  try {
    const models = await listModelsViaCoral();
    return { ok: true, modelCount: models.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
