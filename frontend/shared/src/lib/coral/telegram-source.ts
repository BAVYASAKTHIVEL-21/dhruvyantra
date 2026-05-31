import { CORAL_TELEGRAM_SCHEMA, TELEGRAM_CONFIG } from "@backend/coral-mcp/registry";
import { executeTelegramCoralSql } from "@backend/coral-mcp/telegram-coral-sql";
import { sqlString } from "@backend/coral-mcp/coral-sql";
import { getParentChatId } from "@backend/coral-mcp/telegram-gateway";

export type CoralTelegramBotRow = {
  id?: number;
  username?: string;
  first_name?: string;
};

export type CoralTelegramChatRow = {
  id?: number;
  type?: string;
  title?: string;
  username?: string;
  first_name?: string;
};

/** Bot profile via Coral SQL → getMe. */
export async function fetchBotMeFromCoral(): Promise<CoralTelegramBotRow | null> {
  const rows = await executeTelegramCoralSql(
    `SELECT id, username, first_name FROM ${CORAL_TELEGRAM_SCHEMA}.me LIMIT 1`,
  );
  if (!rows || rows.length === 0) return null;

  const row = rows[0];
  return {
    id: typeof row.id === "number" ? row.id : Number(row.id),
    username: typeof row.username === "string" ? row.username : undefined,
    first_name: typeof row.first_name === "string" ? row.first_name : undefined,
  };
}

/** Parent chat metadata via Coral SQL → getChat. */
export async function fetchParentChatFromCoral(
  chatId?: string,
): Promise<CoralTelegramChatRow | null> {
  const id = chatId?.trim() || getParentChatId();
  if (!id) return null;

  const rows = await executeTelegramCoralSql(
    `SELECT id, type, title, username, first_name FROM ${CORAL_TELEGRAM_SCHEMA}.chats WHERE chat_id = ${sqlString(id)} LIMIT 1`,
  );
  if (!rows || rows.length === 0) return null;

  const row = rows[0];
  return {
    id: typeof row.id === "number" ? row.id : Number(row.id),
    type: typeof row.type === "string" ? row.type : undefined,
    title: typeof row.title === "string" ? row.title : undefined,
    username: typeof row.username === "string" ? row.username : undefined,
    first_name: typeof row.first_name === "string" ? row.first_name : undefined,
  };
}

/** Recent updates via Coral SQL → getUpdates. */
export async function fetchUpdatesFromCoral(limit = 10): Promise<Record<string, unknown>[] | null> {
  return executeTelegramCoralSql(
    `SELECT update_id, message, edited_message FROM ${CORAL_TELEGRAM_SCHEMA}.updates WHERE limit = ${sqlString(String(limit))}`,
  );
}

export { TELEGRAM_CONFIG };
