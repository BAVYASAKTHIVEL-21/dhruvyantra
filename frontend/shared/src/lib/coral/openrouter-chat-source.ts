/**
 * OpenRouter chat via `coral sql` — same pattern as notion-source (queryCoralSql → manifest → API).
 */
import { buildOpenRouterChatCompletionSql } from "@backend/coral-mcp/openrouter-coral-write";
import { openRouterCoralEnv } from "@backend/coral-mcp/openrouter-coral-sql";
import type {
  OpenRouterChatOptions,
  OpenRouterChatResult,
  OpenRouterGatewayOperation,
} from "@backend/coral-mcp/openrouter-gateway";
import { assertCoralEnabled, CoralSqlError, queryCoralSql } from "./query";
import { isOpenRouterCoralReady } from "./readiness";

function logChatSql(sql: string): void {
  if (
    process.env.CORAL_DEBUG_SQL === "true" ||
    process.env.CORAL_DEBUG_OPENROUTER === "true"
  ) {
    console.info("[coral/openrouter] chat_completions SQL:\n", sql);
  }
}

/** Non-streaming chat through Coral `openrouter.chat_completions`. */
export async function chatCompletionViaCoralSql(
  options: OpenRouterChatOptions,
  operation: OpenRouterGatewayOperation = "mentor.chat",
): Promise<OpenRouterChatResult> {
  assertCoralEnabled();

  if (!(await isOpenRouterCoralReady())) {
    throw new Error(
      "[coral] openrouter schema not ready — run: npm run setup:coral-openrouter",
    );
  }

  const env = openRouterCoralEnv();
  if (!env) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured — add it to .env.local and run npm run setup:coral-openrouter",
    );
  }

  const sql = buildOpenRouterChatCompletionSql(operation, options);
  logChatSql(sql);

  let rows: Record<string, unknown>[];
  try {
    rows = await queryCoralSql(sql, { env });
  } catch (e) {
    if (e instanceof CoralSqlError) {
      const detail = e.coralError ? `${e.message} | ${e.coralError}` : e.message;
      if (detail.includes("messages_json")) {
        throw new Error(
          `${detail} — Re-run: cd frontend/shared && npm run setup:coral-openrouter`,
        );
      }
      throw new Error(detail);
    }
    throw e;
  }
  const first = rows[0] ?? {};
  const content = typeof first.content === "string" ? first.content : "";
  const finishReason =
    typeof first.finish_reason === "string" ? first.finish_reason : null;
  const model =
    typeof first.model === "string"
      ? first.model
      : options.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

  if (!content.trim()) {
    const raw = first.raw;
    if (raw && typeof raw === "object" && raw !== null) {
      const err = (raw as { error?: { message?: string } }).error;
      if (err?.message) {
        throw new Error(`[coral] openrouter chat failed: ${err.message}`);
      }
    }
    throw new Error("[coral] openrouter chat returned empty content");
  }

  return { content, model, finishReason };
}
