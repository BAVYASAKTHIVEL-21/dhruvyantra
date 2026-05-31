import { executeCoralSql } from "./client";
import { isCoralEnabled } from "./config";
import {
  CORAL_GOOGLE_CALENDAR_SCHEMA,
  CORAL_GOOGLE_DRIVE_SCHEMA,
  CORAL_OPENROUTER_SCHEMA,
  CORAL_TELEGRAM_SCHEMA,
} from "@backend/coral-mcp/registry";
import { isDhruvyantraStoreReady } from "./dhruvyantra-store";

let notionSchemaReady: boolean | null = null;
let googleDriveSchemaReady: boolean | null = null;
let googleCalendarSchemaReady: boolean | null = null;
let telegramSchemaReady: boolean | null = null;
let openRouterSchemaReady: boolean | null = null;
let dhruvyantraSchemaReady: boolean | null = null;
let notionWritesSchemaReady: boolean | null = null;

async function schemaRegistered(schemaName: string): Promise<boolean> {
  const rows = await executeCoralSql(
    `SELECT table_name FROM coral.tables WHERE schema_name = '${schemaName.replace(/'/g, "''")}' LIMIT 1`,
  );
  return rows !== null && rows.length > 0;
}

/**
 * True when Coral has the bundled `notion` schema registered (source fully installed).
 * Cached for the process lifetime to avoid repeated failed SQL subprocess calls.
 */
export async function isNotionCoralReady(): Promise<boolean> {
  if (!isCoralEnabled()) return false;
  if (notionSchemaReady !== null) return notionSchemaReady;

  notionSchemaReady = await schemaRegistered("notion");

  if (!notionSchemaReady) {
    console.warn(
      "[coral] notion schema not registered — run: npm run setup:coral-notion",
    );
  }

  return notionSchemaReady;
}

export async function isGoogleDriveCoralReady(): Promise<boolean> {
  if (!isCoralEnabled()) return false;
  if (googleDriveSchemaReady !== null) return googleDriveSchemaReady;

  googleDriveSchemaReady = await schemaRegistered(CORAL_GOOGLE_DRIVE_SCHEMA);

  if (!googleDriveSchemaReady) {
    console.warn(
      "[coral] google_drive schema not registered — run: npm run setup:coral-google-drive",
    );
  }

  return googleDriveSchemaReady;
}

export async function isGoogleCalendarCoralReady(): Promise<boolean> {
  if (!isCoralEnabled()) return false;
  if (googleCalendarSchemaReady !== null) return googleCalendarSchemaReady;

  googleCalendarSchemaReady = await schemaRegistered(CORAL_GOOGLE_CALENDAR_SCHEMA);

  if (!googleCalendarSchemaReady) {
    console.warn(
      "[coral] google_calendar schema not registered — run: npm run setup:coral-google-calendar",
    );
  }

  return googleCalendarSchemaReady;
}

export async function isTelegramCoralReady(): Promise<boolean> {
  if (!isCoralEnabled()) return false;
  if (telegramSchemaReady !== null) return telegramSchemaReady;

  telegramSchemaReady = await schemaRegistered(CORAL_TELEGRAM_SCHEMA);

  if (!telegramSchemaReady) {
    console.warn(
      "[coral] telegram schema not registered — run: npm run setup:coral-telegram",
    );
  }

  return telegramSchemaReady;
}

/** `notion_writes.page_creates` for Coral SQL page creates (PATCH uses Notion gateway). */
export async function isNotionWritesCoralReady(): Promise<boolean> {
  if (!isCoralEnabled()) return false;
  if (notionWritesSchemaReady !== null) return notionWritesSchemaReady;

  const rows = await executeCoralSql(
    `SELECT table_name FROM coral.tables WHERE schema_name = 'notion_writes' AND table_name = 'page_creates' LIMIT 1`,
  );
  notionWritesSchemaReady = rows !== null && rows.length > 0;

  if (!notionWritesSchemaReady) {
    console.warn(
      "[coral] notion_writes not registered — run: npm run setup:coral-notion",
    );
  }

  return notionWritesSchemaReady;
}

export async function isDhruvyantraCoralReady(): Promise<boolean> {
  if (!isCoralEnabled()) return false;
  if (dhruvyantraSchemaReady !== null) return dhruvyantraSchemaReady;

  dhruvyantraSchemaReady = await isDhruvyantraStoreReady();

  if (!dhruvyantraSchemaReady) {
    console.warn(
      "[coral] dhruvyantra schema not registered — run: npm run setup:coral-dhruvyantra",
    );
  }

  return dhruvyantraSchemaReady;
}

export async function isOpenRouterCoralReady(): Promise<boolean> {
  if (!isCoralEnabled()) return false;
  if (openRouterSchemaReady !== null) return openRouterSchemaReady;

  openRouterSchemaReady = await schemaRegistered(CORAL_OPENROUTER_SCHEMA);

  if (!openRouterSchemaReady) {
    console.warn(
      "[coral] openrouter schema not registered — run: npm run setup:coral-openrouter",
    );
  }

  return openRouterSchemaReady;
}

/** Probe whether Coral has the notion schema (ignores CORAL_ENABLED). */
export async function probeNotionCoralSchema(): Promise<boolean> {
  return schemaRegistered("notion");
}

export async function probeGoogleDriveCoralSchema(): Promise<boolean> {
  return schemaRegistered(CORAL_GOOGLE_DRIVE_SCHEMA);
}

export async function probeGoogleCalendarCoralSchema(): Promise<boolean> {
  return schemaRegistered(CORAL_GOOGLE_CALENDAR_SCHEMA);
}

export async function probeTelegramCoralSchema(): Promise<boolean> {
  return schemaRegistered(CORAL_TELEGRAM_SCHEMA);
}

export async function probeOpenRouterCoralSchema(): Promise<boolean> {
  return schemaRegistered(CORAL_OPENROUTER_SCHEMA);
}

/** Clear cached readiness (tests / after source install). */
export function resetNotionCoralReadinessCache(): void {
  notionSchemaReady = null;
}

export function resetGoogleCoralReadinessCache(): void {
  googleDriveSchemaReady = null;
  googleCalendarSchemaReady = null;
}

export function resetTelegramCoralReadinessCache(): void {
  telegramSchemaReady = null;
}

export function resetOpenRouterCoralReadinessCache(): void {
  openRouterSchemaReady = null;
}

export function resetDhruvyantraCoralReadinessCache(): void {
  dhruvyantraSchemaReady = null;
}

export function resetNotionWritesCoralReadinessCache(): void {
  notionWritesSchemaReady = null;
}
