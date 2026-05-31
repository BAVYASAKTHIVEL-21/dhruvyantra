/**
 * Executes DhruvYantra write operations.
 * Reads and writes are routed through Coral SQL sources whenever possible.
 */
import type { CalendarEventInput } from "./google-calendar-gateway";
import {
  coralGoogleCalendarCreateEvent,
  isGoogleCalendarConfigured,
} from "./google-calendar-gateway";
import { findCalendarEventIdByTaskIdViaCoral } from "./google-calendar-coral";
import { buildCalendarEventCreateSql } from "./google-calendar-coral-write";
import {
  calendarGatewayFallbackEnabled,
  shouldUseGoogleCalendarCoralSql,
} from "./google-calendar-coral-write-mode";
import { buildTelegramMessageSendSql } from "./telegram-coral-write";
import { executeTelegramCoralSql } from "./telegram-coral-sql";
import { executeGoogleCoralSql, GoogleCoralSqlError } from "./google-coral-sql";
import { coralGoogleDriveUploadFile } from "./google-drive-gateway";
import { coralNotionQueryDataSource } from "./notion-gateway";
import { getNotionDatabaseId } from "./notion-gateway";
import {
  buildNotionPageCreateSql,
  executeNotionWritesCoralSqlDetailed,
  patchNotionPageViaNotionGateway,
} from "./notion-writes-coral";
import {
  coralOpenRouterChatCompletion,
  type OpenRouterChatOptions,
} from "./openrouter-gateway";
import { buildOpenRouterChatCompletionSql } from "./openrouter-coral-write";
import {
  isOpenRouterCoralFilterSchemaError,
  openRouterGatewayFallbackEnabled,
  shouldUseOpenRouterCoralSql,
} from "./openrouter-coral-chat";
import {
  executeOpenRouterCoralSql,
  OpenRouterCoralSqlError,
} from "./openrouter-coral-sql";
import { coralDebug } from "./coral-debug";
import type { ParsedCoralWrite } from "./coral-write-sql";

type WriteRow = Record<string, unknown>;

function row(data: Record<string, unknown>): WriteRow[] {
  return [data];
}

function logCalendarWriteSql(sql: string): void {
  coralDebug("coral/google-calendar/write", sql);
  if (
    process.env.CORAL_DEBUG_SQL === "true" ||
    process.env.CORAL_DEBUG_GOOGLE_CALENDAR === "true"
  ) {
    console.info("[coral/google-calendar] event_creates SQL:\n", sql);
  }
}

function calendarWriteErrorDetail(err: unknown, sql: string): string {
  if (err instanceof GoogleCoralSqlError) {
    const parts = [err.message];
    if (err.coralError) parts.push(`coral: ${err.coralError}`);
    if (err.stderr?.trim()) parts.push(`stderr: ${err.stderr.trim().slice(0, 800)}`);
    if (err.stdout?.trim()) parts.push(`stdout: ${err.stdout.trim().slice(0, 800)}`);
    return parts.join(" | ");
  }
  const msg = err instanceof Error ? err.message : String(err);
  return `[coral] google_calendar event write failed: ${msg} | sql=${sql.slice(0, 400)}`;
}

function logOpenRouterChatSql(sql: string): void {
  coralDebug("coral/openrouter/chat", sql);
  if (
    process.env.CORAL_DEBUG_SQL === "true" ||
    process.env.CORAL_DEBUG_OPENROUTER === "true"
  ) {
    console.info("[coral/openrouter] chat_completions SQL:\n", sql);
  }
}

function openRouterChatErrorDetail(err: unknown, sql: string): string {
  if (err instanceof OpenRouterCoralSqlError) {
    const parts = [err.message];
    if (err.coralError) parts.push(`coral: ${err.coralError}`);
    if (err.stderr?.trim()) parts.push(`stderr: ${err.stderr.trim().slice(0, 800)}`);
    return parts.join(" | ");
  }
  const msg = err instanceof Error ? err.message : String(err);
  return `[coral] openrouter chat failed: ${msg} | sql=${sql.slice(0, 400)}`;
}

async function openRouterChatViaGateway(
  operation: import("./openrouter-gateway").OpenRouterGatewayOperation,
  options: OpenRouterChatOptions,
): Promise<WriteRow[]> {
  const result = await coralOpenRouterChatCompletion(operation, options);
  return row({
    content: result.content,
    model: result.model,
    finish_reason: result.finishReason,
  });
}

/** Mentor chat — Coral SQL `openrouter.chat_completions` (like Notion writes). */
async function executeOpenRouterChat(
  operation: import("./openrouter-gateway").OpenRouterGatewayOperation,
  options: OpenRouterChatOptions,
): Promise<WriteRow[]> {
  if (!shouldUseOpenRouterCoralSql()) {
    return openRouterChatViaGateway(operation, options);
  }

  const sql = buildOpenRouterChatCompletionSql(operation, options);
  logOpenRouterChatSql(sql);

  try {
    const rows = await executeOpenRouterCoralSql(sql);
    const first = rows[0] ?? {};
    const content = typeof first.content === "string" ? first.content : "";
    const finishReason =
      typeof first.finish_reason === "string" ? first.finish_reason : null;
    const model =
      typeof first.model === "string"
        ? first.model
        : options.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

    if (!content.trim()) {
      const raw = first.raw;
      if (raw && typeof raw === "object" && raw !== null) {
        const err = (raw as { error?: { message?: string } }).error;
        if (err?.message) {
          throw new OpenRouterCoralSqlError(
            `[coral] openrouter chat failed: ${err.message}`,
            { sql },
          );
        }
      }
    }

    return row({
      content,
      model,
      finish_reason: finishReason,
    });
  } catch (err) {
    if (openRouterGatewayFallbackEnabled()) {
      const hint = isOpenRouterCoralFilterSchemaError(err)
        ? " Re-run: npm run setup:coral-openrouter (manifest needs virtual filter columns)."
        : "";
      console.warn(
        `[coral/openrouter] Coral chat failed, using gateway:${hint}`,
        openRouterChatErrorDetail(err, sql),
      );
      return openRouterChatViaGateway(operation, options);
    }
    throw new Error(openRouterChatErrorDetail(err, sql));
  }
}

async function executeCalendarUpsertViaCoralSql(input: CalendarEventInput): Promise<WriteRow[]> {
  const existingId = input.taskId
    ? await findCalendarEventIdByTaskIdViaCoral(input.taskId)
    : null;

  if (existingId) {
    const patched = await coralGoogleCalendarCreateEvent(input);
    return row({
      ok: patched.ok,
      event_id: patched.eventId ?? null,
      html_link: patched.htmlLink ?? null,
      error: patched.error ?? null,
    });
  }

  const sql = buildCalendarEventCreateSql(input);
  logCalendarWriteSql(sql);

  if (!shouldUseGoogleCalendarCoralSql()) {
    if (!isGoogleCalendarConfigured()) {
      return row({
        ok: false,
        event_id: null,
        html_link: null,
        error: "Google Calendar OAuth is not configured",
      });
    }
    const viaApi = await coralGoogleCalendarCreateEvent(input);
    return row({
      ok: viaApi.ok,
      event_id: viaApi.eventId ?? null,
      html_link: viaApi.htmlLink ?? null,
      error: viaApi.error ?? null,
    });
  }

  try {
    const rows = await executeGoogleCoralSql("calendar", sql);
    const first = rows[0] ?? {};
    const ok = first.ok !== false && first.ok !== 0;
    const eventId = first.event_id;
    const rowError = typeof first.error === "string" ? first.error : null;
    const raw = first.raw;

    if (!ok || (rowError && !eventId)) {
      let apiDetail = rowError ?? "event_creates returned ok=false";
      if (raw && typeof raw === "object" && raw !== null) {
        const gErr = (raw as { error?: { message?: string; code?: number } }).error;
        if (gErr?.message) {
          apiDetail = `Google Calendar API ${gErr.code ?? ""}: ${gErr.message}`.trim();
        }
      }
      throw new GoogleCoralSqlError("calendar", `[coral] google_calendar event write failed: ${apiDetail}`, {
        sql,
        rows,
      });
    }

    return row({
      ok: true,
      event_id: typeof eventId === "string" ? eventId : null,
      html_link: typeof first.html_link === "string" ? first.html_link : null,
      error: null,
    });
  } catch (err) {
    if (calendarGatewayFallbackEnabled()) {
      console.warn(
        "[coral/google-calendar] Coral SQL failed; direct API (CORAL_CALENDAR_GATEWAY_FALLBACK=true):",
        calendarWriteErrorDetail(err, sql),
      );
      const fallback = await coralGoogleCalendarCreateEvent(input);
      return row({
        ok: fallback.ok,
        event_id: fallback.eventId ?? null,
        html_link: fallback.htmlLink ?? null,
        error: fallback.error ?? null,
      });
    }

    if (err instanceof GoogleCoralSqlError) {
      throw new Error(calendarWriteErrorDetail(err, sql));
    }
    throw new Error(calendarWriteErrorDetail(err, sql));
  }
}

export async function executeParsedCoralWrite(
  parsed: ParsedCoralWrite,
): Promise<WriteRow[]> {
  switch (parsed.kind) {
    case "notion.insert_page": {
      const databaseId = getNotionDatabaseId(parsed.databaseKey);
      if (!databaseId) {
        throw new Error(`Notion database not configured for ${parsed.databaseKey}`);
      }
      const sql = buildNotionPageCreateSql(databaseId, parsed.properties);
      const result = await executeNotionWritesCoralSqlDetailed(sql);
      if (!result.ok) {
        throw new Error(
          `[coral] notion_writes.page_creates failed: ${result.error} — run npm run setup:coral-notion`,
        );
      }
      if (result.rows.length === 0) {
        throw new Error("[coral] notion_writes.page_creates returned no rows");
      }
      const first = result.rows[0];
      return row({
        id: first.id,
        created_time: first.created_time,
        object: "page",
      });
    }
    case "notion.update_page": {
      const page = await patchNotionPageViaNotionGateway(
        parsed.operation,
        parsed.pageId,
        parsed.properties,
      );
      return row({
        id: page.id,
        last_edited_time: page.last_edited_time,
      });
    }
    case "notion.query_data_source": {
      const data = await coralNotionQueryDataSource(
        parsed.operation,
        parsed.dataSourceId,
        parsed.body,
      );
      const results = Array.isArray(data.results) ? data.results : [];
      return results.filter((r): r is WriteRow => r !== null && typeof r === "object");
    }
    case "telegram.send_message": {
      const chatId =
        parsed.chatId?.trim() || process.env.TELEGRAM_PARENT_CHAT_ID?.trim() || "";
      if (!chatId) {
        return row({ ok: false, message_id: null, error: "TELEGRAM_PARENT_CHAT_ID missing" });
      }
      const sql = buildTelegramMessageSendSql(chatId, parsed.text);
      const rows = await executeTelegramCoralSql(sql);
      if (!rows || rows.length === 0) {
        throw new Error(
          "[coral] telegram.message_sends returned no rows — run npm run setup:coral-telegram",
        );
      }
      const first = rows[0] ?? {};
      const ok = first.ok !== false && first.ok !== 0;
      if (!ok) {
        throw new Error("[coral] telegram.message_sends failed");
      }
      return row({
        ok: true,
        message_id: first.message_id ?? null,
        error: null,
      });
    }
    case "google_calendar.upsert_event": {
      return executeCalendarUpsertViaCoralSql(parsed.input);
    }
    case "google_drive.upload_file": {
      const file = await coralGoogleDriveUploadFile({
        title: parsed.params.name,
        mimeType: parsed.params.mimeType,
        data: Buffer.from(parsed.params.contentBase64, "base64"),
      });
      return row({
        id: file.id,
        name: file.title,
        mime_type: file.mimeType,
        web_view_link: file.fileUrl,
      });
    }
    case "openrouter.chat_completion": {
      return executeOpenRouterChat(parsed.operation, parsed.options);
    }
    default: {
      const _exhaustive: never = parsed;
      throw new Error(`Unhandled write: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export type { CalendarEventInput };
