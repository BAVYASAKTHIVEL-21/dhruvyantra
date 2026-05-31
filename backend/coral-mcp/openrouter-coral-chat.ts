/**
 * OpenRouter uses Coral SQL when enabled (same default as Notion reads).
 * Set CORAL_OPENROUTER_DIRECT=true only to bypass `coral sql` for debugging.
 */
import { isCoralEnabledEnv } from "./coral-sql";
import { isOpenRouterConfigured } from "./openrouter-gateway";

export function shouldUseOpenRouterCoralSql(): boolean {
  if (!isCoralEnabledEnv()) return false;
  if (!isOpenRouterConfigured()) return false;
  if (process.env.CORAL_OPENROUTER_DIRECT === "true") return false;
  return true;
}

export const shouldUseOpenRouterCoralChatSql = shouldUseOpenRouterCoralSql;

export function isOpenRouterCoralFilterSchemaError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return text.includes("No column named") || text.includes("is in scope");
}

export function openRouterGatewayFallbackEnabled(): boolean {
  return process.env.CORAL_OPENROUTER_GATEWAY_FALLBACK === "true";
}
