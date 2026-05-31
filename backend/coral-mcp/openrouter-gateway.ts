/**
 * Single gateway for all OpenRouter HTTP traffic from DhruvYantra.
 *
 * LLM calls (mentor chat, future agents) go through this layer so Coral MCP
 * and services share one orchestration path — not direct fetch in app code.
 */
import { coralDebug } from "./coral-debug";
import { isCoralEnabledEnv } from "./coral-env";
import { OPENROUTER_CONFIG, type OpenRouterGatewayOperation } from "./registry";
import { fetchModelsFromCoral, modelExistsViaCoral } from "./openrouter-coral";

export type { OpenRouterGatewayOperation };

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterChatOptions = {
  model?: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
};

export type OpenRouterChatResult = {
  content: string;
  model: string;
  finishReason: string | null;
};

export type OpenRouterGatewayRequestOptions = {
  apiKey?: string;
  signal?: AbortSignal;
};

function getConfig() {
  const apiKey = process.env[OPENROUTER_CONFIG.apiKeyEnv]?.trim();
  const model =
    process.env[OPENROUTER_CONFIG.modelEnv]?.trim() ?? OPENROUTER_CONFIG.defaultModel;
  const appUrl =
    process.env[OPENROUTER_CONFIG.appUrlEnv]?.trim() ?? OPENROUTER_CONFIG.defaultAppUrl;
  const appName =
    process.env[OPENROUTER_CONFIG.appNameEnv]?.trim() ?? OPENROUTER_CONFIG.defaultAppName;
  return { apiKey, model, appUrl, appName };
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env[OPENROUTER_CONFIG.apiKeyEnv]?.trim());
}

export function isOpenRouterEnabled(): boolean {
  return process.env[OPENROUTER_CONFIG.enabledEnv] === "true";
}

export function getOpenRouterModel(): string {
  return getConfig().model;
}

export async function coralOpenRouterRequest(
  operation: OpenRouterGatewayOperation,
  path: string,
  init: RequestInit,
  options?: OpenRouterGatewayRequestOptions,
): Promise<Response> {
  const { apiKey, appUrl, appName } = getConfig();
  const key = options?.apiKey ?? apiKey;
  if (!key) {
    throw new Error(`${OPENROUTER_CONFIG.apiKeyEnv} is not configured`);
  }

  const method = (init.method ?? "GET").toUpperCase();
  const url = `${OPENROUTER_CONFIG.baseUrl}${path}`;

  const res = await fetch(url, {
    ...init,
    signal: options?.signal ?? init.signal ?? AbortSignal.timeout(OPENROUTER_CONFIG.timeoutMs),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-Title": appName,
      ...init.headers,
    },
  });

  coralDebug("coral", `${method} ${operation} ${path}`);

  return res;
}

/** List models — Coral SQL when CORAL_ENABLED; direct API only when Coral is off. */
export async function coralOpenRouterListModels(
  options?: OpenRouterGatewayRequestOptions,
): Promise<{ ok: boolean; count: number }> {
  if (isCoralEnabledEnv()) {
    const fromCoral = await fetchModelsFromCoral();
    if (fromCoral === null) {
      throw new Error("[coral] openrouter.models read failed — register openrouter source");
    }
    return { ok: true, count: fromCoral.length };
  }

  const res = await coralOpenRouterRequest(
    "models.list",
    "/models",
    { method: "GET" },
    options,
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`OpenRouter models error: ${res.status} ${err || res.statusText}`);
  }

  const data = (await res.json()) as { data?: unknown[] };
  const count = Array.isArray(data.data) ? data.data.length : 0;
  return { ok: true, count };
}

/** Non-streaming chat completion. */
export async function coralOpenRouterChatCompletion(
  operation: OpenRouterGatewayOperation,
  options: OpenRouterChatOptions,
  requestOptions?: OpenRouterGatewayRequestOptions,
): Promise<OpenRouterChatResult> {
  const { model } = getConfig();
  const resolvedModel = options.model ?? model;

  try {
    const exists = await modelExistsViaCoral(resolvedModel);
    if (exists === false) {
      console.warn(`[openrouter] Model not in Coral catalog: ${resolvedModel}`);
    }
  } catch {
    // Coral model check is best-effort before gateway chat
  }

  const res = await coralOpenRouterRequest(
    operation,
    "/chat/completions",
    {
      method: "POST",
      body: JSON.stringify({
        model: resolvedModel,
        messages: options.messages,
        temperature: options.temperature ?? OPENROUTER_CONFIG.defaultTemperature,
        max_tokens: options.maxTokens ?? OPENROUTER_CONFIG.defaultMaxTokens,
        stream: false,
      }),
    },
    requestOptions,
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter error (${operation}): ${res.status} ${errText || res.statusText}`);
  }

  const data = (await res.json()) as {
    model?: string;
    choices?: { message?: { content?: string }; finish_reason?: string }[];
  };

  const choice = data.choices?.[0];
  return {
    content: choice?.message?.content?.trim() ?? "",
    model: data.model ?? options.model ?? model,
    finishReason: choice?.finish_reason ?? null,
  };
}

/** Streaming chat — returns raw upstream Response for SSE passthrough. */
export async function coralOpenRouterStreamChat(
  operation: OpenRouterGatewayOperation,
  options: OpenRouterChatOptions,
  requestOptions?: OpenRouterGatewayRequestOptions,
): Promise<Response> {
  const { model } = getConfig();
  const resolvedModel = options.model ?? model;

  const res = await coralOpenRouterRequest(
    operation,
    "/chat/completions",
    {
      method: "POST",
      body: JSON.stringify({
        model: resolvedModel,
        messages: options.messages,
        temperature: options.temperature ?? OPENROUTER_CONFIG.defaultTemperature,
        max_tokens: options.maxTokens ?? OPENROUTER_CONFIG.defaultMaxTokens,
        stream: true,
      }),
    },
    requestOptions,
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter error (${operation}): ${res.status} ${errText || res.statusText}`);
  }

  return res;
}
