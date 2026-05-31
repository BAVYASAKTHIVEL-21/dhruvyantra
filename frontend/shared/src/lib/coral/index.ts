/** Coral SQL — single entry for agents and app (reads + writes). No direct REST from UI routes. */
export {
  executeCoralSql,
  executeCoralSqlWrite,
  executeCoralWrite,
  runCoralSql,
  sqlString,
} from "./client";
export type { CoralRow } from "./client";
export { assertCoralEnabled, mutateCoralSql, queryCoralSql, CoralSqlError } from "./query";
export { isCoralEnabled, getCoralBin } from "./config";
export { getNotionDatabaseId, getNotionDataSourceId } from "./notion-config";
export { fetchNotionDatabaseSchemaViaCoral } from "./notion-schema";
export {
  isNotionCoralReady,
  isGoogleCalendarCoralReady,
  isGoogleDriveCoralReady,
  isTelegramCoralReady,
  isOpenRouterCoralReady,
  isDhruvyantraCoralReady,
  isNotionWritesCoralReady,
  probeGoogleCalendarCoralSchema,
  probeGoogleDriveCoralSchema,
  probeNotionCoralSchema,
  probeTelegramCoralSchema,
  probeOpenRouterCoralSchema,
  resetGoogleCoralReadinessCache,
  resetNotionCoralReadinessCache,
  resetTelegramCoralReadinessCache,
  resetOpenRouterCoralReadinessCache,
  resetDhruvyantraCoralReadinessCache,
  resetNotionWritesCoralReadinessCache,
} from "./readiness";
export {
  fetchAllResourcesViaCoral,
  fetchProfileViaCoral,
  fetchStudyTasksForDateViaCoral,
  fetchStudyTasksForRangeViaCoral,
} from "./notion-reads";
export { fetchDataSourcePages, resolveDataSourceId } from "./notion-source";
export {
  chatCompletionViaCoral,
  insertNotionPageViaCoral,
  patchNotionPageViaCoral,
  sendTelegramViaCoral,
  upsertCalendarEventViaCoral,
  uploadDriveFileViaCoral,
  CORAL_WRITE_ACTIONS,
  CORAL_WRITE_SQL_BUILDERS,
} from "./writes";
export { CORAL_AGENT_WRITE_EXAMPLES } from "./agent-sql";
export {
  getModelViaCoral,
  listModelsViaCoral,
  probeOpenRouterViaCoral,
} from "./openrouter-reads";
export {
  queryOpenRouterModelsViaCoral,
  queryOpenRouterModelByIdViaCoral,
} from "./openrouter-source";
export { chatCompletionViaCoralSql } from "./openrouter-chat-source";
export {
  createNotionPageViaCoralSql,
  updateNotionPageViaCoralSql,
} from "./notion-write-source";
export { sendTelegramMessageViaCoralSql } from "./telegram-send-source";
export { listDriveFilesViaCoral } from "./google-drive-reads";
export { listCalendarEventsViaCoral, findCalendarEventIdByTaskIdViaCoral } from "./google-calendar-reads";
export {
  getBotInfoViaCoral,
  probeTelegramViaCoral,
  verifyParentChatViaCoral,
} from "./telegram-reads";
export {
  OPENROUTER_CONFIG,
  GOOGLE_CALENDAR_CONFIG,
  GOOGLE_DRIVE_CONFIG,
  TELEGRAM_CONFIG,
  CORAL_NOTION_QUERIES,
  CORAL_GOOGLE_QUERIES,
  CORAL_OPENROUTER_QUERIES,
  CORAL_TELEGRAM_QUERIES,
  CORAL_OPENROUTER_SCHEMA,
  CORAL_TELEGRAM_SCHEMA,
} from "@backend/coral-mcp/registry";
export {
  isOpenRouterConfigured,
  isOpenRouterEnabled,
  getOpenRouterModel,
} from "@backend/coral-mcp/openrouter-gateway";
export {
  isGoogleCalendarConfigured,
  isGoogleCalendarEnabled,
  getGoogleCalendarId,
  getGoogleCalendarTimeZone,
} from "@backend/coral-mcp/google-calendar-gateway";
export {
  isGoogleDriveConfigured,
  isGoogleDriveEnabled,
  getGoogleDriveFolderId,
} from "@backend/coral-mcp/google-drive-gateway";
export {
  isTelegramConfigured,
  isTelegramEnabled,
  getParentChatId,
} from "@backend/coral-mcp/telegram-gateway";

export { AGENTS } from "@backend/agents/registry";
