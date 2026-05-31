/**
 * Single gateway for all Telegram Bot API writes from DhruvYantra.
 * Reads: Coral SQL via lib/coral/telegram-reads.ts.
 */
import { coralDebug } from "./coral-debug";
import { TELEGRAM_CONFIG, type TelegramGatewayOperation } from "./registry";

export type { TelegramGatewayOperation };

export type TelegramSendResult = {
  ok: boolean;
  error?: string;
  messageId?: number;
};

function botToken(): string | null {
  return process.env[TELEGRAM_CONFIG.botTokenEnv]?.trim() || null;
}

export function getParentChatId(): string | null {
  return process.env[TELEGRAM_CONFIG.parentChatIdEnv]?.trim() || null;
}

export function isTelegramConfigured(): boolean {
  return Boolean(botToken() && getParentChatId());
}

export function isTelegramEnabled(): boolean {
  return process.env[TELEGRAM_CONFIG.enabledEnv] === "true";
}

export function getTelegramSetupHint(): string {
  const missing: string[] = [];
  if (!botToken()) missing.push(TELEGRAM_CONFIG.botTokenEnv);
  if (!getParentChatId()) missing.push(TELEGRAM_CONFIG.parentChatIdEnv);
  if (missing.length === 0) return "";
  return `Add to .env.local: ${missing.join(", ")}. Get chat id via @userinfobot or Bot API getUpdates.`;
}

function apiUrl(method: string, token: string): string {
  return `${TELEGRAM_CONFIG.baseUrl}/bot${token}/${method}`;
}

async function coralTelegramRequest(
  operation: TelegramGatewayOperation,
  method: string,
  init: RequestInit,
): Promise<Response> {
  const token = botToken();
  if (!token) {
    throw new Error(`${TELEGRAM_CONFIG.botTokenEnv} is not configured`);
  }

  const httpMethod = (init.method ?? "GET").toUpperCase();
  const res = await fetch(apiUrl(method, token), {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(TELEGRAM_CONFIG.timeoutMs),
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  coralDebug("coral/telegram", `${httpMethod} ${operation} /${method}`);

  return res;
}

/** Gateway fallback probe — getMe without Coral SQL. */
export async function coralTelegramProbe(): Promise<{ ok: boolean; error?: string; username?: string }> {
  if (!botToken()) {
    return { ok: false, error: getTelegramSetupHint() || "Telegram not configured" };
  }

  try {
    const res = await coralTelegramRequest("bot.getMe", "getMe", { method: "GET" });
    if (!res.ok) {
      return { ok: false, error: `Telegram API ${res.status}: ${await res.text()}` };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      result?: { username?: string };
      description?: string;
    };
    if (!data.ok) {
      return { ok: false, error: data.description ?? "getMe failed" };
    }
    return { ok: true, username: data.result?.username };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Send a plain-text message via Coral gateway → Telegram sendMessage. */
export async function coralTelegramSendMessage(
  text: string,
  options?: { chatId?: string },
): Promise<TelegramSendResult> {
  const chatId = options?.chatId?.trim() || getParentChatId();
  if (!botToken() || !chatId) {
    return { ok: false, error: getTelegramSetupHint() || "Telegram is not configured" };
  }

  try {
    const res = await coralTelegramRequest("parent.sendMessage", "sendMessage", {
      method: "POST",
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, TELEGRAM_CONFIG.maxMessageLength),
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Telegram API ${res.status}: ${body}` };
    }

    const data = (await res.json()) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };

    if (!data.ok) {
      return { ok: false, error: data.description ?? "Telegram send failed" };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Telegram send failed" };
  }
}
