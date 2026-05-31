/**
 * Coral SQL for openrouter.chat_completions (SQL-triggered POST).
 */
import type { OpenRouterChatOptions } from "./openrouter-gateway";
import { OPENROUTER_CONFIG, CORAL_OPENROUTER_SCHEMA } from "./registry";
import { sqlString } from "./coral-sql";

function sqlJsonFilter(value: unknown): string {
  return sqlString(JSON.stringify(value));
}

/** SELECT that triggers POST on openrouter.chat_completions. */
export function buildOpenRouterChatCompletionSql(
  operation: string,
  options: OpenRouterChatOptions,
): string {
  const model =
    options.model?.trim() ||
    process.env[OPENROUTER_CONFIG.modelEnv]?.trim() ||
    OPENROUTER_CONFIG.defaultModel;
  const temperature = options.temperature ?? OPENROUTER_CONFIG.defaultTemperature;
  const maxTokens = options.maxTokens ?? OPENROUTER_CONFIG.defaultMaxTokens;

  const temp = Number(temperature);
  const tokens = Number(maxTokens);
  // Virtual filter columns are Utf8 in the manifest — quote temperature/max_tokens in SQL.
  return `SELECT content, finish_reason, model, operation, raw FROM ${CORAL_OPENROUTER_SCHEMA}.chat_completions WHERE operation = ${sqlString(operation)} AND model = ${sqlString(model)} AND messages_json = ${sqlJsonFilter(options.messages)} AND temperature = ${sqlString(String(temp))} AND max_tokens = ${sqlString(String(tokens))} LIMIT 1`;
}
