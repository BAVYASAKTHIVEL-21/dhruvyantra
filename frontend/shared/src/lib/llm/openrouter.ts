/**
 * OpenRouter — Coral SQL reads (`openrouter.models`) and chat (`openrouter.chat_completions`).
 */
export type {
  OpenRouterChatOptions,
  OpenRouterChatResult,
  OpenRouterMessage,
} from "@backend/coral-mcp/openrouter-gateway";

import {
  isOpenRouterConfigured,
  isOpenRouterEnabled,
  getOpenRouterModel,
  coralOpenRouterChatCompletion,
} from "@backend/coral-mcp/openrouter-gateway";
import {
  openRouterGatewayFallbackEnabled,
  shouldUseOpenRouterCoralSql,
} from "@backend/coral-mcp/openrouter-coral-chat";
import { getModelViaCoral, listModelsViaCoral } from "@/lib/coral/openrouter-reads";
import { chatCompletionViaCoralSql } from "@/lib/coral/openrouter-chat-source";
import { assertCoralEnabled } from "@/lib/coral/query";
import type {
  OpenRouterChatOptions,
  OpenRouterChatResult,
} from "@backend/coral-mcp/openrouter-gateway";

export {
  isOpenRouterConfigured,
  isOpenRouterEnabled,
  getOpenRouterModel,
  listModelsViaCoral,
  getModelViaCoral,
};

export async function createChatCompletion(
  options: OpenRouterChatOptions,
): Promise<OpenRouterChatResult> {
  if (shouldUseOpenRouterCoralSql()) {
    assertCoralEnabled();
    try {
      return await chatCompletionViaCoralSql(options, "mentor.chat");
    } catch (err) {
      if (!openRouterGatewayFallbackEnabled()) throw err;
      console.warn(
        "[coral/openrouter] Coral SQL failed; direct API fallback (CORAL_OPENROUTER_GATEWAY_FALLBACK=true):",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return coralOpenRouterChatCompletion("mentor.chat", options);
}

export async function streamChatCompletion(
  options: OpenRouterChatOptions,
): Promise<Response> {
  const result = await createChatCompletion(options);
  const body = JSON.stringify({
    choices: [{ message: { content: result.content }, finish_reason: result.finishReason }],
    model: result.model,
  });
  return new Response(body, {
    headers: { "Content-Type": "application/json" },
  });
}
