import { NextResponse } from "next/server";
import {
  executeCoralSql,
  isCoralEnabled,
  isGoogleCalendarCoralReady,
  isGoogleDriveCoralReady,
  isNotionCoralReady,
  isDhruvyantraCoralReady,
  isOpenRouterCoralReady,
  isTelegramCoralReady,
  probeGoogleCalendarCoralSchema,
  probeGoogleDriveCoralSchema,
  probeNotionCoralSchema,
  probeOpenRouterCoralSchema,
  probeTelegramCoralSchema,
  probeOpenRouterViaCoral,
  probeTelegramViaCoral,
} from "@/lib/coral";
import {
  isGoogleCalendarConfigured,
  isGoogleCalendarEnabled,
} from "@/lib/integrations/google-calendar";
import {
  isGoogleDriveConfigured,
  isGoogleDriveEnabled,
} from "@/lib/integrations/google-drive";
import { getOpenRouterModel, isOpenRouterConfigured, isOpenRouterEnabled } from "@/lib/llm/openrouter";
import { getGoogleCalendarId } from "@backend/coral-mcp/google-calendar-gateway";
import { listCalendarEventsViaCoral } from "@/lib/coral/google-calendar-reads";
import { listDriveFilesViaCoral } from "@/lib/coral/google-drive-reads";
import {
  isTelegramConfigured,
  isTelegramEnabled,
} from "@/lib/integrations/telegram";
import { isNotionPlannerConfigured } from "@/lib/planner/notion";
import { isNotionResourcesConfigured } from "@/lib/resources/notion";
import { isNotionConfigured as isNotionProfileConfigured } from "@/lib/profile/notion";

/** Dev/diagnostic: Coral + integrations wiring status (no secrets). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const probe = searchParams.get("probe") === "true" || isCoralEnabled();

  const coralEnabled = isCoralEnabled();
  let notionTables: unknown[] = [];
  let googleDriveTables: unknown[] = [];
  let googleCalendarTables: unknown[] = [];
  let telegramTables: unknown[] = [];
  let openrouterTables: unknown[] = [];
  let registeredSchemas: unknown[] = [];

  if (probe) {
    const schemas = await executeCoralSql(
      "SELECT DISTINCT schema_name FROM coral.tables ORDER BY schema_name",
    );
    registeredSchemas = schemas ?? [];

    notionTables =
      (await executeCoralSql(
        "SELECT schema_name, table_name FROM coral.tables WHERE schema_name = 'notion' LIMIT 20",
      )) ?? [];

    googleDriveTables =
      (await executeCoralSql(
        "SELECT schema_name, table_name FROM coral.tables WHERE schema_name = 'google_drive' LIMIT 20",
      )) ?? [];

    googleCalendarTables =
      (await executeCoralSql(
        "SELECT schema_name, table_name FROM coral.tables WHERE schema_name = 'google_calendar' LIMIT 20",
      )) ?? [];

    telegramTables =
      (await executeCoralSql(
        "SELECT schema_name, table_name FROM coral.tables WHERE schema_name = 'telegram' LIMIT 20",
      )) ?? [];

    openrouterTables =
      (await executeCoralSql(
        "SELECT schema_name, table_name FROM coral.tables WHERE schema_name = 'openrouter' LIMIT 20",
      )) ?? [];
  }

  const notionCoralReady = probe
    ? coralEnabled
      ? await isNotionCoralReady()
      : await probeNotionCoralSchema()
    : false;

  const googleDriveCoralReady = probe
    ? coralEnabled
      ? await isGoogleDriveCoralReady()
      : await probeGoogleDriveCoralSchema()
    : false;

  const googleCalendarCoralReady = probe
    ? coralEnabled
      ? await isGoogleCalendarCoralReady()
      : await probeGoogleCalendarCoralSchema()
    : false;

  const telegramCoralReady = probe
    ? coralEnabled
      ? await isTelegramCoralReady()
      : await probeTelegramCoralSchema()
    : false;

  const openRouterCoralReady = probe
    ? coralEnabled
      ? await isOpenRouterCoralReady()
      : await probeOpenRouterCoralSchema()
    : false;

  const dhruvyantraCoralReady = probe && coralEnabled ? await isDhruvyantraCoralReady() : false;

  let openRouterProbe: { ok: boolean; modelCount?: number; error?: string } | undefined;
  if (probe && isOpenRouterConfigured()) {
    openRouterProbe = await probeOpenRouterViaCoral();
  }

  let googleCalendarProbe: { ok: boolean; error?: string } | undefined;
  if (probe && isGoogleCalendarConfigured()) {
    try {
      await listCalendarEventsViaCoral();
      googleCalendarProbe = { ok: true };
    } catch (e) {
      googleCalendarProbe = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  let googleDriveProbe: { ok: boolean; fileCount?: number; error?: string } | undefined;
  if (probe && isGoogleDriveConfigured()) {
    try {
      const files = await listDriveFilesViaCoral();
      googleDriveProbe = { ok: true, fileCount: files.length };
    } catch (e) {
      googleDriveProbe = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  let telegramProbe: { ok: boolean; botUsername?: string; chatType?: string; error?: string } | undefined;
  if (probe && isTelegramConfigured()) {
    telegramProbe = await probeTelegramViaCoral();
  }

  return NextResponse.json({
    coralEnabled,
    notionCoralReady,
    googleDriveCoralReady,
    googleCalendarCoralReady,
    telegramCoralReady,
    openRouterCoralReady,
    dhruvyantraCoralReady,
    coralDataDir: process.env.CORAL_DATA_DIR?.trim() || null,
    registeredSchemas,
    notionSourceTables: notionTables,
    googleDriveSourceTables: googleDriveTables,
    googleCalendarSourceTables: googleCalendarTables,
    telegramSourceTables: telegramTables,
    openrouterSourceTables: openrouterTables,
    openRouter: {
      configured: isOpenRouterConfigured(),
      enabled: isOpenRouterEnabled(),
      coralReady: openRouterCoralReady,
      model: getOpenRouterModel(),
      probe: openRouterProbe,
    },
    googleCalendar: {
      configured: isGoogleCalendarConfigured(),
      enabled: isGoogleCalendarEnabled(),
      calendarId: getGoogleCalendarId(),
      probe: googleCalendarProbe,
    },
    googleDrive: {
      configured: isGoogleDriveConfigured(),
      enabled: isGoogleDriveEnabled(),
      probe: googleDriveProbe,
    },
    telegram: {
      configured: isTelegramConfigured(),
      enabled: isTelegramEnabled(),
      probe: telegramProbe,
    },
    setup: {
      notion: "cd frontend/shared && npm run setup:coral-notion",
      openRouter: "cd frontend/shared && npm run setup:coral-openrouter",
      googleCalendar: "cd frontend/shared && npm run setup:coral-google-calendar",
      googleDrive: "cd frontend/shared && npm run setup:coral-google-drive",
      telegram: "cd frontend/shared && npm run setup:coral-telegram",
      dhruvyantra: "cd frontend/shared && npm run setup:coral-dhruvyantra",
      enableCoral: "Set CORAL_ENABLED=true after running setup:coral-* scripts",
    },
    notionConfigured: {
      studyPlans: isNotionPlannerConfigured(),
      resources: isNotionResourcesConfigured(),
      profiles: isNotionProfileConfigured(),
    },
  });
}
