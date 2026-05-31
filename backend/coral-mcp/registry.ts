/**
 * Coral MCP — Notion source registry for DhruvYantra agents.
 *
 * Reads: Agent / server → Coral SQL → source manifests → external APIs
 * Writes: Coral SQL (`SELECT … FROM notion_writes.*`, `telegram.message_sends`, etc.)
 */

export const CORAL_INTEGRATIONS = [
  "dhruvyantra",
  "google-calendar",
  "google-drive",
  "notion",
  "notion-writes",
  "openrouter",
  "telegram",
] as const;

/** Local JSONL schema for focus, mock-center, and other app state. */
export const CORAL_DHRUVYANTRA_SCHEMA = "dhruvyantra";

export const CORAL_MODULES = ["tools", "workflows", "context"] as const;

/** Bundled Coral Notion source schema name. */
export const CORAL_NOTION_SCHEMA = "notion";

/** DhruvYantra Coral source schema names for Google integrations. */
export const CORAL_GOOGLE_DRIVE_SCHEMA = "google_drive";
export const CORAL_GOOGLE_CALENDAR_SCHEMA = "google_calendar";

export const CORAL_GOOGLE_ACCESS_TOKEN_ENV = "GOOGLE_ACCESS_TOKEN";

export type NotionDatabaseKey = "studyPlans" | "resources" | "profiles" | "users";

export const NOTION_DATABASES: Record<
  NotionDatabaseKey,
  {
    databaseIdEnv: string;
    dataSourceIdEnv: string;
    coralTable: string;
    description: string;
  }
> = {
  studyPlans: {
    databaseIdEnv: "NOTION_STUDY_PLANS_DATABASE_ID",
    dataSourceIdEnv: "NOTION_STUDY_PLANS_DATA_SOURCE_ID",
    coralTable: "data_source_pages",
    description: "Daily study tasks (planner, recovery, mission control)",
  },
  resources: {
    databaseIdEnv: "NOTION_RESOURCES_DATABASE_ID",
    dataSourceIdEnv: "NOTION_RESOURCES_DATA_SOURCE_ID",
    coralTable: "data_source_pages",
    description: "Resource library (PYQs, notes, videos)",
  },
  profiles: {
    databaseIdEnv: "NOTION_PROFILES_DATABASE_ID",
    dataSourceIdEnv: "NOTION_PROFILES_DATA_SOURCE_ID",
    coralTable: "data_source_pages",
    description: "User onboarding profile",
  },
  users: {
    databaseIdEnv: "NOTION_USERS_DATABASE_ID",
    dataSourceIdEnv: "NOTION_USERS_DATA_SOURCE_ID",
    description: "Auth credentials (gateway REST; Coral SQL optional for reads)",
    coralTable: "data_source_pages",
  },
};

/** Example Coral SQL for agents / debugging. */
export const CORAL_NOTION_QUERIES = {
  listStudyPlanPages: (dataSourceId: string) =>
    `SELECT id, properties, created_time FROM ${CORAL_NOTION_SCHEMA}.data_source_pages WHERE data_source_id = '${dataSourceId}'`,
  listResourcePages: (dataSourceId: string) =>
    `SELECT id, properties FROM ${CORAL_NOTION_SCHEMA}.data_source_pages WHERE data_source_id = '${dataSourceId}'`,
  databaseMeta: (databaseId: string) =>
    `SELECT id, data_sources, title FROM ${CORAL_NOTION_SCHEMA}.databases WHERE database_id = '${databaseId}'`,
} as const;

/** Example Coral SQL for Google integrations. */
export const CORAL_GOOGLE_QUERIES = {
  listVaultFiles: (folderId: string) =>
    `SELECT id, name, mime_type FROM ${CORAL_GOOGLE_DRIVE_SCHEMA}.files WHERE folder_id = '${folderId}'`,
  listCalendarEvents: (calendarId: string) =>
    `SELECT id, summary, html_link FROM ${CORAL_GOOGLE_CALENDAR_SCHEMA}.events WHERE calendar_id = '${calendarId}' LIMIT 50`,
} as const;

/** DhruvYantra Coral source schema for OpenRouter model catalog reads. */
export const CORAL_OPENROUTER_SCHEMA = "openrouter";

/** OpenRouter — Coral SQL reads + SQL-triggered POST chat completions. */
export const OPENROUTER_CONFIG = {
  baseUrl: "https://openrouter.ai/api/v1",
  apiKeyEnv: "OPENROUTER_API_KEY",
  modelEnv: "OPENROUTER_MODEL",
  appUrlEnv: "NEXT_PUBLIC_APP_URL",
  appNameEnv: "OPENROUTER_APP_NAME",
  enabledEnv: "OPENROUTER_ENABLED",
  defaultModel: "openai/gpt-4o-mini",
  defaultAppUrl: "http://localhost:3001",
  defaultAppName: "DhruvYantra",
  defaultTemperature: 0.7,
  defaultMaxTokens: 900,
  timeoutMs: 60_000,
} as const;

export type OpenRouterGatewayOperation =
  | "mentor.chat"
  | "mentor.stream"
  | "models.list";

/** Example Coral SQL for OpenRouter / mentor. */
export const CORAL_OPENROUTER_QUERIES = {
  listModels: `SELECT id, name, context_length FROM ${CORAL_OPENROUTER_SCHEMA}.models LIMIT 20`,
  modelById: (modelId: string) =>
    `SELECT id, name, description, context_length FROM ${CORAL_OPENROUTER_SCHEMA}.models WHERE id = '${modelId.replace(/'/g, "''")}' LIMIT 1`,
} as const;

/** Google Calendar — Coral SQL reads + SQL POST create (PATCH fallback for existing task events). */
export const GOOGLE_CALENDAR_CONFIG = {
  baseUrl: "https://www.googleapis.com/calendar/v3",
  clientIdEnv: "GOOGLE_CLIENT_ID",
  clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  refreshTokenEnv: "GOOGLE_REFRESH_TOKEN",
  calendarIdEnv: "GOOGLE_CALENDAR_ID",
  timeZoneEnv: "GOOGLE_CALENDAR_TIMEZONE",
  enabledEnv: "GOOGLE_CALENDAR_ENABLED",
  defaultCalendarId: "primary",
  defaultTimeZone: "Asia/Kolkata",
  scope: "https://www.googleapis.com/auth/calendar.events",
  timeoutMs: 30_000,
} as const;

/** Google Drive Vault — Coral SQL reads + gateway REST writes. */
export const GOOGLE_DRIVE_CONFIG = {
  apiBaseUrl: "https://www.googleapis.com/drive/v3",
  uploadBaseUrl: "https://www.googleapis.com/upload/drive/v3",
  folderIdEnv: "GOOGLE_DRIVE_FOLDER_ID",
  clientIdEnv: "GOOGLE_CLIENT_ID",
  clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  refreshTokenEnv: "GOOGLE_DRIVE_REFRESH_TOKEN",
  serviceAccountEmailEnv: "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  serviceAccountKeyEnv: "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  enabledEnv: "GOOGLE_DRIVE_ENABLED",
  scope: "https://www.googleapis.com/auth/drive",
  timeoutMs: 60_000,
} as const;

export type GoogleCalendarGatewayOperation =
  | "calendar.token"
  | "calendar.events.list"
  | "calendar.events.create"
  | "calendar.events.patch";

export type GoogleDriveGatewayOperation =
  | "drive.token"
  | "drive.files.list"
  | "drive.files.get"
  | "drive.files.upload";

/** DhruvYantra Coral source schema for Telegram Bot API reads. */
export const CORAL_TELEGRAM_SCHEMA = "telegram";

/** Telegram Parent Connect — Coral SQL reads + gateway REST sends. */
export const TELEGRAM_CONFIG = {
  baseUrl: "https://api.telegram.org",
  botTokenEnv: "TELEGRAM_BOT_TOKEN",
  parentChatIdEnv: "TELEGRAM_PARENT_CHAT_ID",
  enabledEnv: "TELEGRAM_ENABLED",
  timeoutMs: 30_000,
  maxMessageLength: 4096,
} as const;

export type TelegramGatewayOperation =
  | "bot.getMe"
  | "bot.getChat"
  | "parent.sendMessage";

/** Example Coral SQL for Telegram / Parent Connect. */
export const CORAL_TELEGRAM_QUERIES = {
  botProfile: `SELECT id, username, first_name FROM ${CORAL_TELEGRAM_SCHEMA}.me LIMIT 1`,
  parentChat: (chatId: string) =>
    `SELECT id, type, title, username FROM ${CORAL_TELEGRAM_SCHEMA}.chats WHERE chat_id = '${chatId.replace(/'/g, "''")}'`,
  recentUpdates: (limit = 10) =>
    `SELECT update_id, message FROM ${CORAL_TELEGRAM_SCHEMA}.updates WHERE limit = '${limit}'`,
} as const;
