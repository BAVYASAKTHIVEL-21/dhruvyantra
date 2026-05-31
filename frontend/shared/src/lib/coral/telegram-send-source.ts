import { buildTelegramMessageSendSql } from "@backend/coral-mcp/telegram-coral-write";
import { getParentChatId } from "@backend/coral-mcp/telegram-gateway";
import { assertCoralEnabled, CoralSqlError, queryCoralSql } from "./query";
import { isTelegramCoralReady } from "./readiness";

export type CoralTelegramSendResult = {
  ok: boolean;
  messageId?: number;
  error?: string;
};

/** Send parent message via Coral SQL (`telegram.message_sends`). */
export async function sendTelegramMessageViaCoralSql(
  text: string,
  chatId?: string,
): Promise<CoralTelegramSendResult> {
  assertCoralEnabled();

  if (!(await isTelegramCoralReady())) {
    throw new Error("[coral] telegram schema not ready — run: npm run setup:coral-telegram");
  }

  const id = chatId?.trim() || getParentChatId();
  if (!id) {
    throw new Error("TELEGRAM_PARENT_CHAT_ID is not configured");
  }

  const sql = buildTelegramMessageSendSql(id, text);
  let rows: Record<string, unknown>[];
  try {
    rows = await queryCoralSql(sql, {
      env: {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "",
      },
    });
  } catch (e) {
    if (e instanceof CoralSqlError) {
      const detail = e.coralError ? `${e.message} | ${e.coralError}` : e.message;
      return { ok: false, error: detail };
    }
    throw e;
  }
  if (rows.length === 0) {
    return {
      ok: false,
      error:
        "[coral] telegram.message_sends returned no rows (check bot token, chat_id, and that the chat exists)",
    };
  }

  const first = rows[0];
  const ok = first.ok !== false && first.ok !== 0;
  const messageId =
    typeof first.message_id === "number"
      ? first.message_id
      : first.message_id != null
        ? Number(first.message_id)
        : undefined;

  return {
    ok,
    messageId: Number.isFinite(messageId) ? messageId : undefined,
    error: ok ? undefined : (() => {
      const raw = first.raw;
      if (raw && typeof raw === "object") {
        const maybeError = raw as { description?: unknown; error_code?: unknown };
        const desc = typeof maybeError.description === "string" ? maybeError.description : null;
        const code =
          typeof maybeError.error_code === "number" || typeof maybeError.error_code === "string"
            ? String(maybeError.error_code)
            : null;
        if (desc || code) return `Telegram send failed${code ? ` (code ${code})` : ""}${desc ? `: ${desc}` : ""}`;
      }
      return "Telegram send failed";
    })(),
  };
}
