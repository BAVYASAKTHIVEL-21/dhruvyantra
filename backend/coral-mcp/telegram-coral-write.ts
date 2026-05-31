import { CORAL_TELEGRAM_SCHEMA } from "./registry";
import { sqlString } from "./coral-sql";

function sqlJsonFragment(value: unknown): string {
  return sqlString(JSON.stringify(value));
}

/** SELECT that triggers POST on telegram.message_sends. */
export function buildTelegramMessageSendSql(chatId: string, text: string): string {
  return `SELECT ok, message_id, raw FROM ${CORAL_TELEGRAM_SCHEMA}.message_sends WHERE chat_id = ${sqlString(chatId)} AND text_json = ${sqlJsonFragment(text)} LIMIT 1`;
}
