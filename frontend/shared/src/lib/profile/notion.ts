import { fetchProfileViaCoral } from "@/lib/coral/notion-reads";
import { fetchNotionDatabaseSchemaViaCoral } from "@/lib/coral/notion-schema";
import { invalidateNotionPagesCache } from "@/lib/coral/pages-cache";
import { getNotionDatabaseId } from "@/lib/coral/notion-config";
import {
  coralNotionCreatePage,
  coralNotionGetDatabase,
  coralNotionPatchPage,
  coralNotionQueryDatabase,
  coralNotionQueryDataSource,
  getNotionDataSourceId,
} from "@backend/coral-mcp/notion-gateway";
import { getNotionDatabaseConfig } from "@/lib/notion/client";
import type { UserProfile } from "./types";

/**
 * Notion user profiles — gateway REST (same reliability as auth/users DB).
 * Coral SQL is an optional read cache only.
 */

const PROFILES_DB_ENV = "NOTION_PROFILES_DATABASE_ID";
const DATA_SOURCE_NOTION_VERSION = "2025-09-03";

type PropertySchema = Record<string, { type: string }>;

function getConfig() {
  return getNotionDatabaseConfig(PROFILES_DB_ENV);
}

let schemaCache: { databaseId: string; schema: PropertySchema } | null = null;

function parseGatewaySchema(db: Record<string, unknown>): PropertySchema {
  const properties = db.properties as Record<string, { type?: string }> | undefined;
  if (!properties) return {};
  const schema: PropertySchema = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value?.type) schema[key] = { type: value.type };
  }
  return schema;
}

async function getDatabaseSchema(): Promise<PropertySchema> {
  const databaseId = getNotionDatabaseId("profiles");
  if (!databaseId) return {};

  if (schemaCache?.databaseId === databaseId) return schemaCache.schema;

  try {
    const db = await coralNotionGetDatabase("profiles.schema", "profiles");
    const schema = parseGatewaySchema(db);
    schemaCache = { databaseId, schema };
    return schema;
  } catch (e) {
    console.warn("[profile] Gateway schema read failed, trying Coral:", e);
  }

  try {
    const schema = await fetchNotionDatabaseSchemaViaCoral("profiles");
    schemaCache = { databaseId, schema };
    return schema;
  } catch {
    return {};
  }
}

function propType(schema: PropertySchema, key: string): string | undefined {
  return schema[key]?.type;
}

function readRichText(
  props: Record<string, { type: string; [k: string]: unknown }>,
  key: string,
): string {
  const p = props[key];
  if (p?.type === "rich_text") {
    return (p.rich_text as { plain_text: string }[])?.[0]?.plain_text ?? "";
  }
  return "";
}

function readNumber(
  props: Record<string, { type: string; [k: string]: unknown }>,
  key: string,
): number {
  const p = props[key];
  if (p?.type === "number") return Number(p.number ?? 0);
  if (p?.type === "rich_text") {
    const raw = readRichText(props, key);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function readCheckbox(
  props: Record<string, { type: string; [k: string]: unknown }>,
  key: string,
): boolean {
  const p = props[key];
  if (p?.type === "checkbox") return Boolean(p.checkbox);
  if (p?.type === "rich_text") {
    const raw = readRichText(props, key).toLowerCase();
    return raw === "true" || raw === "1" || raw === "yes";
  }
  return false;
}

function writeRichText(value: string) {
  return { rich_text: [{ text: { content: value.slice(0, 2000) } }] };
}

function writeProperty(schema: PropertySchema, key: string, value: string | number | boolean) {
  const type = propType(schema, key) ?? "rich_text";

  if (type === "title") {
    return { title: [{ text: { content: String(value).slice(0, 2000) } }] };
  }
  if (type === "number") {
    const n = typeof value === "number" ? value : Number(value);
    return { number: Number.isFinite(n) ? n : 0 };
  }
  if (type === "checkbox") {
    const checked =
      typeof value === "boolean"
        ? value
        : String(value).toLowerCase() === "true" || value === 1;
    return { checkbox: checked };
  }
  return writeRichText(String(value));
}

function profileFromPage(page: Record<string, unknown>): UserProfile | null {
  const props = page.properties as Record<string, { type: string; [k: string]: unknown }>;
  if (!props) return null;

  const title =
    props.userId?.type === "title"
      ? (props.userId.title as { plain_text: string }[])?.[0]?.plain_text
      : readRichText(props, "userId") || null;
  if (!title) return null;

  let weakSubjects: string[] = [];
  let weakTopics: string[] = [];
  let parentContact: UserProfile["parentContact"] = null;
  try {
    const ws = readRichText(props, "weakSubjects");
    if (ws) weakSubjects = JSON.parse(ws);
  } catch {
    weakSubjects = [];
  }
  try {
    const wt = readRichText(props, "weakTopics");
    if (wt) weakTopics = JSON.parse(wt);
  } catch {
    weakTopics = [];
  }
  try {
    const pc = readRichText(props, "parentContact");
    if (pc) parentContact = JSON.parse(pc);
  } catch {
    parentContact = null;
  }

  const targetYear = readNumber(props, "targetYear");

  return {
    userId: title,
    email: readRichText(props, "email") || undefined,
    examType: (readRichText(props, "examType") as UserProfile["examType"]) || null,
    targetYear: targetYear || null,
    weakSubjects,
    weakTopics,
    dailyStudyHours: readNumber(props, "dailyStudyHours") || 6,
    productiveTime: (readRichText(props, "productiveTime") as UserProfile["productiveTime"]) || null,
    parentContact,
    onboardingCompleted: readCheckbox(props, "onboardingCompleted"),
    updatedAt: readRichText(props, "updatedAt") || undefined,
  };
}

function userIdQueryFilter(userId: string, asRichText: boolean) {
  if (asRichText) {
    return { property: "userId", rich_text: { equals: userId } };
  }
  return { property: "userId", title: { equals: userId } };
}

async function queryProfilePage(userId: string): Promise<Record<string, unknown> | null> {
  const dataSourceId = getNotionDataSourceId("profiles");

  if (dataSourceId) {
    const schema = await getDatabaseSchema();
    const userIdType = propType(schema, "userId");
    const asRichText = userIdType === "rich_text";

    const data = await coralNotionQueryDataSource(
      "profiles.query",
      dataSourceId,
      { filter: userIdQueryFilter(userId, asRichText), page_size: 1 },
      { notionVersion: DATA_SOURCE_NOTION_VERSION },
    );
    const page = (data.results as Record<string, unknown>[] | undefined)?.[0];
    return page ?? null;
  }

  let data = await coralNotionQueryDatabase("profiles.query", "profiles", {
    filter: userIdQueryFilter(userId, false),
    page_size: 1,
  });
  let page = (data.results as Record<string, unknown>[] | undefined)?.[0];
  if (page) return page;

  data = await coralNotionQueryDatabase("profiles.query", "profiles", {
    filter: userIdQueryFilter(userId, true),
    page_size: 1,
  });
  page = (data.results as Record<string, unknown>[] | undefined)?.[0];
  return page ?? null;
}

export async function fetchProfileFromNotion(userId: string): Promise<UserProfile | null> {
  if (!getConfig()) return null;

  try {
    const page = await queryProfilePage(userId);
    if (page) return profileFromPage(page);
  } catch (e) {
    console.warn("[profile] Gateway read failed, trying Coral:", e);
  }

  try {
    const coralPage = await fetchProfileViaCoral(userId);
    if (coralPage) return profileFromPage(coralPage);
  } catch {
    /* Coral optional */
  }

  return null;
}

function buildProfileProperties(profile: UserProfile, schema: PropertySchema) {
  const updatedAt = new Date().toISOString();
  return {
    userId: writeProperty(schema, "userId", profile.userId),
    email: writeProperty(schema, "email", profile.email ?? ""),
    examType: writeProperty(schema, "examType", profile.examType ?? ""),
    targetYear: writeProperty(schema, "targetYear", profile.targetYear ?? 0),
    weakSubjects: writeProperty(schema, "weakSubjects", JSON.stringify(profile.weakSubjects)),
    weakTopics: writeProperty(schema, "weakTopics", JSON.stringify(profile.weakTopics)),
    dailyStudyHours: writeProperty(schema, "dailyStudyHours", profile.dailyStudyHours),
    productiveTime: writeProperty(schema, "productiveTime", profile.productiveTime ?? ""),
    parentContact: writeProperty(schema, "parentContact", JSON.stringify(profile.parentContact)),
    onboardingCompleted: writeProperty(schema, "onboardingCompleted", profile.onboardingCompleted),
    updatedAt: writeProperty(schema, "updatedAt", updatedAt),
  };
}

export async function saveProfileToNotion(profile: UserProfile): Promise<void> {
  if (!getConfig()) {
    return;
  }

  const schema = await getDatabaseSchema();
  const properties = buildProfileProperties(profile, schema);
  const existing = await queryProfilePage(profile.userId);
  const pageId = existing?.id as string | undefined;

  const dataSourceId = getNotionDataSourceId("profiles");
  const parent = dataSourceId
    ? { type: "data_source_id", data_source_id: dataSourceId }
    : undefined;
  const versionOpts = dataSourceId
    ? { notionVersion: DATA_SOURCE_NOTION_VERSION }
    : undefined;

  if (pageId) {
    await coralNotionPatchPage("profiles.update", pageId, properties, versionOpts);
  } else {
    await coralNotionCreatePage(
      "profiles.create",
      "profiles",
      properties,
      parent,
      versionOpts,
    );
  }

  invalidateNotionPagesCache("profiles");
}

export function isNotionConfigured(): boolean {
  return getConfig() !== null;
}
