/**
 * Agent-facing Coral SQL catalog — reads and writes for all DhruvYantra integrations.
 * Agents should use `runCoralSql` / `executeCoralSqlWrite` with these patterns.
 */
export { CORAL_NOTION_QUERIES, CORAL_GOOGLE_QUERIES, CORAL_OPENROUTER_QUERIES, CORAL_TELEGRAM_QUERIES } from "@backend/coral-mcp/registry";
export { CORAL_WRITE_SQL_BUILDERS } from "@backend/coral-mcp/coral-write-sql";

/** Example cross-agent write SQL (virtual tables). */
export const CORAL_AGENT_WRITE_EXAMPLES = {
  telegramSend: `INSERT INTO telegram.outbound_messages (chat_id, text) VALUES ('<chat_id>', 'Hello parent')`,
  notionCreateTask: `INSERT INTO notion.study_plan_pages (properties_json) VALUES ('<notion-properties-json>')`,
  notionUpdateTask: `UPDATE notion.pages SET properties_json = '{"Status":{"select":{"name":"Completed"}}}' WHERE page_id = '<page-uuid>'`,
  calendarUpsert: `SELECT ok, event_id, html_link FROM google_calendar.event_creates WHERE calendar_id = 'primary' AND summary_json = '"Study block"' AND description_json = '""' AND start_json = '{"dateTime":"2026-05-27T09:00:00","timeZone":"Asia/Kolkata"}' AND end_json = '{"dateTime":"2026-05-27T10:00:00","timeZone":"Asia/Kolkata"}' AND task_id_json = '"task-1"' AND category_json = '"planner"' LIMIT 1`,
  mentorChat: `INSERT INTO openrouter.chat_completions (payload_json) VALUES ('<openrouter-chat-json>')`,
} as const;
