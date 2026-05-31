import { fetchBotMeFromCoral, fetchParentChatFromCoral } from "./telegram-source";
import { assertCoralEnabled } from "./query";

export type TelegramBotInfo = {
  id?: number;
  username?: string;
  firstName?: string;
};

export type TelegramChatInfo = {
  id?: number;
  type?: string;
  title?: string;
  username?: string;
};

export async function getBotInfoViaCoral(): Promise<TelegramBotInfo> {
  assertCoralEnabled();
  const row = await fetchBotMeFromCoral();
  if (!row) {
    throw new Error("[coral] telegram.me returned no rows — check TELEGRAM_BOT_TOKEN");
  }
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
  };
}

export async function verifyParentChatViaCoral(
  chatId?: string,
): Promise<TelegramChatInfo> {
  assertCoralEnabled();
  const row = await fetchParentChatFromCoral(chatId);
  if (!row) {
    throw new Error("[coral] telegram.chats returned no rows — verify TELEGRAM_PARENT_CHAT_ID");
  }
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    username: row.username,
  };
}

export async function probeTelegramViaCoral(): Promise<{
  ok: boolean;
  botUsername?: string;
  chatType?: string;
  error?: string;
}> {
  try {
    const bot = await getBotInfoViaCoral();
    const chat = await verifyParentChatViaCoral();
    return { ok: true, botUsername: bot.username, chatType: chat.type };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
