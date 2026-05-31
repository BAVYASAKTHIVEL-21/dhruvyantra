import {
  coralNotionCreatePage,
  coralNotionPatchPage,
  coralNotionQueryDataSource,
  coralNotionQueryDatabase,
  getNotionDataSourceId,
  getNotionDatabaseId,
} from "../coral-mcp/notion-gateway";
import { OAUTH_GOOGLE_MARKER } from "./oauth";
import { hashPassword, verifyPassword } from "./password";
import { normalizeEmail, userIdFromEmail } from "./validation";

/**
 * Notion users database — reads/writes via Coral gateway → Notion REST API.
 *
 * NOTION_API_KEY, NOTION_USERS_DATABASE_ID, NOTION_USERS_DATA_SOURCE_ID (2025-09-03 multi-source)
 */

const LEGACY_NOTION_VERSION = "2022-06-28";
const DATA_SOURCE_NOTION_VERSION = "2025-09-03";

export type StoredUser = {
  pageId: string;
  userId: string;
  email: string;
  passwordHash: string;
  authProvider?: "email" | "google";
};

type NotionConfig = {
  token: string;
  databaseId?: string;
  dataSourceId?: string;
};

function getConfig(): NotionConfig | null {
  const token = process.env.NOTION_API_KEY;
  const databaseId = getNotionDatabaseId("users") ?? undefined;
  const dataSourceId = getNotionDataSourceId("users") ?? undefined;
  if (!token || (!databaseId && !dataSourceId)) return null;
  return { token, databaseId, dataSourceId };
}

function usesDataSource(config: NotionConfig): boolean {
  return Boolean(config.dataSourceId);
}

export class NotionAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotionAccessError";
  }
}

function mapGatewayError(error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("404") || msg.includes("object_not_found")) {
    throw new NotionAccessError(
      "Notion database not found. Share your Users database with the DhruvYantra integration in Notion.",
    );
  }
  if (msg.includes("multiple data sources")) {
    throw new NotionAccessError(
      "Notion database uses multiple data sources. Set NOTION_USERS_DATA_SOURCE_ID in .env.local (see .env.example).",
    );
  }
  throw error instanceof Error ? error : new Error(msg);
}

function richText(value: string) {
  return { rich_text: [{ text: { content: value } }] };
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

function readEmail(props: Record<string, { type: string; [k: string]: unknown }>): string | null {
  const p = props.email;
  if (!p) return null;

  if (p.type === "title") {
    return (p.title as { plain_text: string }[])?.[0]?.plain_text ?? null;
  }
  if (p.type === "rich_text") {
    return (p.rich_text as { plain_text: string }[])?.[0]?.plain_text ?? null;
  }
  if (p.type === "email" && typeof p.email === "string") {
    return p.email;
  }
  return null;
}

function emailQueryFilter(normalized: string, asRichText: boolean) {
  if (asRichText) {
    return { property: "email", rich_text: { equals: normalized } };
  }
  return { property: "email", title: { equals: normalized } };
}

function userFromPage(page: Record<string, unknown>, emailAsRichText = false): StoredUser | null {
  const props = page.properties as Record<string, { type: string; [k: string]: unknown }>;
  if (!props) return null;

  const email = readEmail(props);
  if (!email) return null;

  const passwordHash = readRichText(props, "passwordHash");
  const userId = readRichText(props, "userId") || userIdFromEmail(email);
  if (!passwordHash) return null;

  const providerRaw = readRichText(props, "authProvider");
  const authProvider =
    providerRaw === "google" ? "google" : providerRaw === "email" ? "email" : undefined;

  return {
    pageId: page.id as string,
    userId,
    email: normalizeEmail(email),
    passwordHash,
    authProvider: authProvider ?? (passwordHash === OAUTH_GOOGLE_MARKER ? "google" : "email"),
  };
}

function buildUserProperties(
  normalized: string,
  userId: string,
  passwordHash: string,
  authProvider: "email" | "google",
  now: string,
  emailAsRichText: boolean,
) {
  const properties: Record<string, unknown> = {
    userId: richText(userId),
    passwordHash: richText(passwordHash),
    authProvider: richText(authProvider),
    createdAt: richText(now),
    lastLoginAt: richText(now),
  };

  if (emailAsRichText) {
    properties.name = { title: [{ text: { content: normalized } }] };
    properties.email = richText(normalized);
  } else {
    properties.email = { title: [{ text: { content: normalized } }] };
  }

  return properties;
}

export function isNotionAuthConfigured(): boolean {
  return getConfig() !== null;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const config = getConfig();
  if (!config) return null;

  const normalized = normalizeEmail(email);
  const emailAsRichText = usesDataSource(config);

  try {
    const data = usesDataSource(config)
      ? await coralNotionQueryDataSource(
          "auth.query",
          config.dataSourceId!,
          {
            filter: emailQueryFilter(normalized, emailAsRichText),
            page_size: 1,
          },
        )
      : await coralNotionQueryDatabase("auth.query", "users", {
          filter: emailQueryFilter(normalized, false),
          page_size: 1,
        });

    const results = data.results as Record<string, unknown>[] | undefined;
    const page = results?.[0];
    if (!page) return null;
    return userFromPage(page, emailAsRichText);
  } catch (e) {
    mapGatewayError(e);
  }
}

async function createUserPage(
  config: NotionConfig,
  normalized: string,
  passwordHash: string,
  authProvider: "email" | "google",
): Promise<StoredUser> {
  const userId = userIdFromEmail(normalized);
  const now = new Date().toISOString();
  const emailAsRichText = usesDataSource(config);
  const properties = buildUserProperties(
    normalized,
    userId,
    passwordHash,
    authProvider,
    now,
    emailAsRichText,
  );

  const parent = usesDataSource(config)
    ? { type: "data_source_id", data_source_id: config.dataSourceId }
    : { database_id: config.databaseId };

  try {
    const page = await coralNotionCreatePage(
      "auth.create",
      "users",
      properties,
      parent,
      {
        notionVersion: usesDataSource(config)
          ? DATA_SOURCE_NOTION_VERSION
          : LEGACY_NOTION_VERSION,
      },
    );

    return {
      pageId: page.id as string,
      userId,
      email: normalized,
      passwordHash,
      authProvider,
    };
  } catch (e) {
    mapGatewayError(e);
  }
}

export async function createGoogleUserInNotion(email: string): Promise<StoredUser> {
  const config = getConfig();
  if (!config) {
    throw new Error("Notion auth database is not configured");
  }

  const normalized = normalizeEmail(email);
  const existing = await findUserByEmail(normalized);
  if (existing) return existing;

  return createUserPage(config, normalized, OAUTH_GOOGLE_MARKER, "google");
}

export async function createUserInNotion(email: string, password: string): Promise<StoredUser> {
  const config = getConfig();
  if (!config) {
    throw new Error("Notion auth database is not configured");
  }

  const normalized = normalizeEmail(email);
  const existing = await findUserByEmail(normalized);
  if (existing) {
    throw new Error("USER_EXISTS");
  }

  return createUserPage(config, normalized, hashPassword(password), "email");
}

export async function verifyUserCredentials(
  email: string,
  password: string,
): Promise<StoredUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (user.passwordHash === OAUTH_GOOGLE_MARKER) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function touchLastLogin(pageId: string): Promise<void> {
  const config = getConfig();
  if (!config) return;

  try {
    await coralNotionPatchPage(
      "auth.updateLogin",
      pageId,
      {
        lastLoginAt: richText(new Date().toISOString()),
      },
      {
        notionVersion: usesDataSource(config)
          ? DATA_SOURCE_NOTION_VERSION
          : LEGACY_NOTION_VERSION,
      },
    );
  } catch (e) {
    mapGatewayError(e);
  }
}
