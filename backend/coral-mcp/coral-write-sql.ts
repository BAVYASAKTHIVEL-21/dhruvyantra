/**
 * DhruvYantra Coral SQL write dialect — virtual DML tables for agent-facing writes.
 *
 * Example SQL (agents / services):
 *   INSERT INTO telegram.outbound_messages (chat_id, text) VALUES ('123', 'Hello');
 *   UPDATE notion.pages SET properties_json = '{...}' WHERE page_id = 'uuid';
 *   INSERT INTO notion.study_plan_pages (properties_json) VALUES ('{...}');
 *   INSERT INTO google_calendar.events (payload_json) VALUES ('{...}');
 *   INSERT INTO openrouter.chat_completions (payload_json) VALUES ('{...}');
 */
import type { CalendarEventInput } from "./google-calendar-gateway";
import type { NotionDatabaseKey } from "./registry";
import type { NotionGatewayOperation } from "./notion-gateway";
import type { OpenRouterChatOptions, OpenRouterGatewayOperation } from "./openrouter-gateway";
function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export type ParsedCoralWrite =
  | {
      kind: "notion.insert_page";
      operation: NotionGatewayOperation;
      databaseKey: NotionDatabaseKey;
      properties: Record<string, unknown>;
      parent?: Record<string, unknown>;
    }
  | {
      kind: "notion.update_page";
      operation: NotionGatewayOperation;
      pageId: string;
      properties: Record<string, unknown>;
    }
  | {
      kind: "notion.query_data_source";
      operation: NotionGatewayOperation;
      dataSourceId: string;
      body: Record<string, unknown>;
    }
  | { kind: "telegram.send_message"; chatId?: string; text: string }
  | { kind: "google_calendar.upsert_event"; input: CalendarEventInput }
  | {
      kind: "google_drive.upload_file";
      params: {
        name: string;
        mimeType: string;
        contentBase64: string;
        folderId?: string;
      };
    }
  | {
      kind: "openrouter.chat_completion";
      operation: OpenRouterGatewayOperation;
      options: OpenRouterChatOptions;
    };

function parseJsonColumn(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as Record<string, unknown>;
  }
  return JSON.parse(trimmed.replace(/^'|'$/g, "").replace(/''/g, "'")) as Record<
    string,
    unknown
  >;
}

function unquoteSqlValue(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("'") && t.endsWith("'")) {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

/** Parse INSERT INTO schema.table (cols) VALUES (...). */
function parseInsert(sql: string): ParsedCoralWrite | null {
  const m = sql.match(
    /^\s*INSERT\s+INTO\s+([a-z_]+)\.([a-z_]+)\s*\(([^)]+)\)\s*VALUES\s*\((.+)\)\s*$/is,
  );
  if (!m) return null;

  const schema = m[1];
  const table = m[2];
  const columns = m[3].split(",").map((c) => c.trim());
  const values = splitSqlValues(m[4]);

  if (columns.length !== values.length) {
    throw new Error("INSERT column count does not match VALUES count");
  }

  const record: Record<string, string> = {};
  columns.forEach((col, i) => {
    record[col] = values[i];
  });

  if (schema === "telegram" && table === "outbound_messages") {
    const textVal = record.text ?? record.message;
    if (!textVal) throw new Error("telegram.outbound_messages requires text column");
    return {
      kind: "telegram.send_message",
      chatId: record.chat_id ? unquoteSqlValue(record.chat_id) : undefined,
      text: unquoteSqlValue(textVal),
    };
  }

  if (schema === "notion" && table === "study_plan_pages") {
    return {
      kind: "notion.insert_page",
      operation: "studyPlans.create",
      databaseKey: "studyPlans",
      properties: parseJsonColumn(record.properties_json ?? "{}"),
    };
  }

  if (schema === "notion" && table === "resource_pages") {
    return {
      kind: "notion.insert_page",
      operation: "resources.create",
      databaseKey: "resources",
      properties: parseJsonColumn(record.properties_json ?? "{}"),
    };
  }

  if (schema === "notion" && table === "profile_pages") {
    return {
      kind: "notion.insert_page",
      operation: "profiles.create",
      databaseKey: "profiles",
      properties: parseJsonColumn(record.properties_json ?? "{}"),
    };
  }

  if (schema === "google_calendar" && table === "events") {
    const payload = parseJsonColumn(record.payload_json ?? "{}") as CalendarEventInput;
    return { kind: "google_calendar.upsert_event", input: payload };
  }

  if (schema === "google_drive" && table === "file_uploads") {
    const payload = parseJsonColumn(record.payload_json ?? "{}");
    return {
      kind: "google_drive.upload_file",
      params: {
        name: String(payload.name ?? "upload"),
        mimeType: String(payload.mimeType ?? "application/octet-stream"),
        contentBase64: String(payload.contentBase64 ?? ""),
        folderId: payload.folderId ? String(payload.folderId) : undefined,
      },
    };
  }

  if (schema === "openrouter" && table === "chat_completions") {
    const payload = parseJsonColumn(record.payload_json ?? "{}");
    return {
      kind: "openrouter.chat_completion",
      operation: (payload.operation as OpenRouterGatewayOperation) ?? "mentor.chat",
      options: {
        model: payload.model ? String(payload.model) : undefined,
        messages: (payload.messages as OpenRouterChatOptions["messages"]) ?? [],
        temperature:
          typeof payload.temperature === "number" ? payload.temperature : undefined,
        maxTokens: typeof payload.maxTokens === "number" ? payload.maxTokens : undefined,
        stream: false,
      },
    };
  }

  return null;
}

/** Parse UPDATE schema.table SET col = val WHERE ... */
function parseUpdate(sql: string): ParsedCoralWrite | null {
  const m = sql.match(
    /^\s*UPDATE\s+([a-z_]+)\.([a-z_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+)\s*$/is,
  );
  if (!m) return null;

  const schema = m[1];
  const table = m[2];
  const setClause = m[3];
  const whereClause = m[4];

  if (schema === "notion" && table === "pages") {
    const propsMatch = setClause.match(/properties_json\s*=\s*(.+)/i);
    const pageMatch = whereClause.match(/page_id\s*=\s*(.+)/i);
    if (!propsMatch || !pageMatch) return null;
    return {
      kind: "notion.update_page",
      operation: "studyPlans.update",
      pageId: unquoteSqlValue(pageMatch[1]),
      properties: parseJsonColumn(propsMatch[1]),
    };
  }

  return null;
}

function splitSqlValues(valuesPart: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < valuesPart.length; i++) {
    const ch = valuesPart[i];
    if (ch === "'" && valuesPart[i - 1] !== "\\") {
      inQuote = !inQuote;
      cur += ch;
      continue;
    }
    if (ch === "," && !inQuote) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function parseDhruvYantraWriteSql(sql: string): ParsedCoralWrite | null {
  const trimmed = sql.trim();
  if (/^INSERT\s+INTO/i.test(trimmed)) return parseInsert(trimmed);
  if (/^UPDATE\s+/i.test(trimmed)) return parseUpdate(trimmed);
  return null;
}

/** Typed write actions for app code (no virtual SQL strings). */
export const CORAL_WRITE_ACTIONS = {
  telegramSend: (chatId: string, text: string): ParsedCoralWrite => ({
    kind: "telegram.send_message",
    chatId,
    text,
  }),
  telegramSendDefaultChat: (text: string): ParsedCoralWrite => ({
    kind: "telegram.send_message",
    text,
  }),
  notionInsertStudyPlan: (properties: Record<string, unknown>): ParsedCoralWrite => ({
    kind: "notion.insert_page",
    operation: "studyPlans.create",
    databaseKey: "studyPlans",
    properties,
  }),
  notionInsertResource: (properties: Record<string, unknown>): ParsedCoralWrite => ({
    kind: "notion.insert_page",
    operation: "resources.create",
    databaseKey: "resources",
    properties,
  }),
  notionInsertProfile: (properties: Record<string, unknown>): ParsedCoralWrite => ({
    kind: "notion.insert_page",
    operation: "profiles.create",
    databaseKey: "profiles",
    properties,
  }),
  notionUpdatePage: (pageId: string, properties: Record<string, unknown>): ParsedCoralWrite => ({
    kind: "notion.update_page",
    operation: "studyPlans.update",
    pageId,
    properties,
  }),
  calendarUpsertEvent: (input: CalendarEventInput): ParsedCoralWrite => ({
    kind: "google_calendar.upsert_event",
    input,
  }),
  openRouterChat: (
    options: OpenRouterChatOptions,
    operation: OpenRouterGatewayOperation = "mentor.chat",
  ): ParsedCoralWrite => ({
    kind: "openrouter.chat_completion",
    operation,
    options: { ...options, stream: false },
  }),
  driveUpload: (payload: {
    name: string;
    mimeType: string;
    contentBase64: string;
    folderId?: string;
  }): ParsedCoralWrite => ({
    kind: "google_drive.upload_file",
    params: payload,
  }),
} as const;

/** Build INSERT SQL for agents (copy-paste / MCP). */
export const CORAL_WRITE_SQL_BUILDERS = {
  telegramSend: (chatId: string, text: string) =>
    `INSERT INTO telegram.outbound_messages (chat_id, text) VALUES (${sqlString(chatId)}, ${sqlString(text)})`,
  notionInsertStudyPlan: (properties: Record<string, unknown>) =>
    `INSERT INTO notion.study_plan_pages (properties_json) VALUES (${sqlString(JSON.stringify(properties))})`,
  notionUpdatePage: (pageId: string, properties: Record<string, unknown>) =>
    `UPDATE notion.pages SET properties_json = ${sqlString(JSON.stringify(properties))} WHERE page_id = ${sqlString(pageId)}`,
  calendarUpsertEvent: (input: CalendarEventInput) =>
    `INSERT INTO google_calendar.events (payload_json) VALUES (${sqlString(JSON.stringify(input))})`,
  openRouterChat: (options: OpenRouterChatOptions, operation = "mentor.chat") =>
    `INSERT INTO openrouter.chat_completions (payload_json) VALUES (${sqlString(JSON.stringify({ ...options, operation }))})`,
  driveUpload: (payload: {
    name: string;
    mimeType: string;
    contentBase64: string;
    folderId?: string;
  }) =>
    `INSERT INTO google_drive.file_uploads (payload_json) VALUES (${sqlString(JSON.stringify(payload))})`,
} as const;
