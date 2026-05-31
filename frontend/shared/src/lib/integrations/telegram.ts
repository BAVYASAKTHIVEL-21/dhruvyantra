/**
 * Telegram Parent Connect — Coral SQL only.
 */
export type { TelegramSendResult } from "@backend/coral-mcp/telegram-gateway";

import {
  getTelegramSetupHint,
  isTelegramConfigured,
  isTelegramEnabled,
} from "@backend/coral-mcp/telegram-gateway";
import { verifyParentChatViaCoral } from "@/lib/coral/telegram-reads";
import { sendTelegramViaCoral } from "@/lib/coral/writes";
import type { TelegramSendResult } from "@backend/coral-mcp/telegram-gateway";

export {
  getTelegramSetupHint,
  isTelegramConfigured,
  isTelegramEnabled,
};

export async function sendTelegramMessage(
  text: string,
  options?: { chatId?: string },
): Promise<TelegramSendResult> {
  try {
    await verifyParentChatViaCoral(options?.chatId);
  } catch {
    // best-effort before send
  }
  return sendTelegramViaCoral(text, options?.chatId);
}

export async function sendParentUpdateViaAgent(text: string): Promise<TelegramSendResult> {
  return sendTelegramMessage(text);
}
