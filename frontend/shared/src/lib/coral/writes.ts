/**
 * Coral writes — all mutations go through `coral sql` (SELECT-triggered POST or manifest writes).
 */
import type { NotionDatabaseKey } from "@backend/coral-mcp/registry";
import {
  CORAL_WRITE_ACTIONS,
  CORAL_WRITE_SQL_BUILDERS,
  parseDhruvYantraWriteSql,
} from "@backend/coral-mcp/coral-write-sql";
import { buildCalendarEventCreateSql } from "@backend/coral-mcp/google-calendar-coral-write";
import { executeGoogleCoralSql } from "@backend/coral-mcp/google-coral-sql";
import { invalidateNotionPagesCache } from "./pages-cache";
import {
  createNotionPageViaCoralSql,
  updateNotionPageViaCoralSql,
} from "./notion-write-source";
import { chatCompletionViaCoralSql } from "./openrouter-chat-source";
import { sendTelegramMessageViaCoralSql } from "./telegram-send-source";
import {
  executeCoralSqlWrite,
  executeCoralWrite,
  runCoralSql,
  sqlString,
} from "@backend/coral-mcp/coral-sql";
import type { CalendarEventInput } from "@backend/coral-mcp/google-calendar-gateway";
import type { DriveFileItem } from "@backend/coral-mcp/google-drive-gateway";
import type { OpenRouterChatOptions } from "@backend/coral-mcp/openrouter-gateway";
import {
  openRouterGatewayFallbackEnabled,
  shouldUseOpenRouterCoralSql,
} from "@backend/coral-mcp/openrouter-coral-chat";
import {
  calendarGatewayFallbackEnabled,
  shouldUseGoogleCalendarCoralSql,
} from "@backend/coral-mcp/google-calendar-coral-write-mode";

function invalidateAfterNotionWrite(databaseKey: NotionDatabaseKey): void {
  invalidateNotionPagesCache(databaseKey);
}

export {
  CORAL_WRITE_ACTIONS,
  CORAL_WRITE_SQL_BUILDERS,
  executeCoralSqlWrite,
  executeCoralWrite,
  runCoralSql,
  parseDhruvYantraWriteSql,
  sqlString,
};

export async function insertNotionPageViaCoral(
  databaseKey: NotionDatabaseKey,
  properties: Record<string, unknown>,
): Promise<{ id: string; created_time?: string }> {
  const page = await createNotionPageViaCoralSql(databaseKey, properties);
  invalidateAfterNotionWrite(databaseKey);
  return page;
}

export async function patchNotionPageViaCoral(
  pageId: string,
  properties: Record<string, unknown>,
  databaseKey: NotionDatabaseKey = "studyPlans",
): Promise<void> {
  await updateNotionPageViaCoralSql(pageId, properties);
  invalidateAfterNotionWrite(databaseKey);
}

export async function sendTelegramViaCoral(
  text: string,
  chatId?: string,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  return sendTelegramMessageViaCoralSql(text, chatId);
}

export async function upsertCalendarEventViaCoral(
  input: CalendarEventInput,
): Promise<{ ok: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  if (shouldUseGoogleCalendarCoralSql()) {
    try {
      const sql = buildCalendarEventCreateSql(input);
      const rows = await executeGoogleCoralSql("calendar", sql);
      const first = rows?.[0] ?? {};
      const ok = first.ok !== false && first.ok !== 0;
      return {
        ok: Boolean(ok),
        eventId: typeof first.event_id === "string" ? first.event_id : undefined,
        htmlLink: typeof first.html_link === "string" ? first.html_link : undefined,
        error: typeof first.error === "string" ? first.error : undefined,
      };
    } catch (e) {
      if (!calendarGatewayFallbackEnabled()) throw e;
      console.warn(
        "[coral/google-calendar] Coral SQL failed; set CORAL_CALENDAR_GATEWAY_FALLBACK=true for direct API:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  const rows = await executeCoralWrite(CORAL_WRITE_ACTIONS.calendarUpsertEvent(input));
  return {
    ok: Boolean(rows[0]?.ok),
    eventId: rows[0]?.event_id as string | undefined,
    htmlLink: rows[0]?.html_link as string | undefined,
    error: rows[0]?.error as string | undefined,
  };
}

export async function uploadDriveFileViaCoral(params: {
  title: string;
  mimeType: string;
  data: Buffer | Uint8Array;
}): Promise<DriveFileItem> {
  const contentBase64 = Buffer.from(params.data).toString("base64");
  const sql = CORAL_WRITE_SQL_BUILDERS.driveUpload({
    name: params.title,
    mimeType: params.mimeType,
    contentBase64,
  });
  const rows = await executeCoralSqlWrite(sql);
  return {
    id: String(rows[0]?.id ?? ""),
    title: String(rows[0]?.name ?? params.title),
    fileUrl: String(rows[0]?.web_view_link ?? ""),
    mimeType: String(rows[0]?.mime_type ?? params.mimeType),
  };
}

export async function chatCompletionViaCoral(
  options: OpenRouterChatOptions,
  operation: "mentor.chat" | "mentor.stream" = "mentor.chat",
): Promise<{ content: string; model: string; finishReason: string | null }> {
  if (shouldUseOpenRouterCoralSql()) {
    try {
      return await chatCompletionViaCoralSql(options, operation);
    } catch (e) {
      if (!openRouterGatewayFallbackEnabled()) throw e;
      console.warn(
        "[coral/openrouter] Coral SQL failed; set CORAL_OPENROUTER_GATEWAY_FALLBACK=true for direct API:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  const rows = await executeCoralWrite(CORAL_WRITE_ACTIONS.openRouterChat(options, operation));
  return {
    content: String(rows[0]?.content ?? ""),
    model: String(rows[0]?.model ?? ""),
    finishReason: (rows[0]?.finish_reason as string | null) ?? null,
  };
}
