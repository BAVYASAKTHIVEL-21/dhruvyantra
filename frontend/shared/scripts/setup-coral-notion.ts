#!/usr/bin/env npx tsx
/**
 * Install Coral Notion source, sync API key, copy manifest if needed, verify schema.
 *
 * Usage (from frontend/shared):
 *   npm run setup:coral-notion
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { installImportedCoralSource } from "./lib/coral-source-install";

const NOTION_WRITES_MANIFEST = resolve(
  process.cwd(),
  "../../coral/sources/notion-writes/manifest.yaml",
);

const BUNDLED_MANIFEST_CANDIDATES = [
  join(homedir(), "casr/coral/sources/core/notion/manifest.yaml"),
  "/usr/share/coral/sources/notion/manifest.yaml",
];

function loadEnvLocal(): Record<string, string> {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("Missing .env.local — copy .env.example first.");
    process.exit(1);
  }
  const out: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function coralNotionDir(): string {
  const home = process.env.CORAL_HOME ?? join(homedir(), ".config/coral");
  const workspace = process.env.CORAL_WORKSPACE ?? "default";
  return join(home, "workspaces", workspace, "sources", "notion");
}

function findBundledManifest(): string | null {
  const fromEnv = process.env.CORAL_NOTION_MANIFEST?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  for (const path of BUNDLED_MANIFEST_CANDIDATES) {
    if (existsSync(path)) return path;
  }
  return null;
}

function ensureManifestAndSecrets(apiKey: string): void {
  const dir = coralNotionDir();
  mkdirSync(dir, { recursive: true });

  const manifestPath = join(dir, "manifest.yaml");
  if (!existsSync(manifestPath)) {
    const bundled = findBundledManifest();
    if (!bundled) {
      console.error("Notion manifest missing and bundled path not found.");
      console.error("Set CORAL_NOTION_MANIFEST to your coral notion manifest.yaml");
      process.exit(1);
    }
    copyFileSync(bundled, manifestPath);
    console.log("Copied bundled manifest to", manifestPath);
  }

  const secretsPath = join(dir, "secrets.env");
  writeFileSync(secretsPath, `NOTION_API_KEY=${JSON.stringify(apiKey)}\n`, "utf8");
  console.log("Updated", secretsPath);
}

function coralSql(coralBin: string, sql: string, apiKey: string): string {
  return execSync(`${coralBin} sql --format json ${JSON.stringify(sql)}`, {
    encoding: "utf8",
    env: { ...process.env, NOTION_API_KEY: apiKey },
  });
}

function upsertEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return `${content.trimEnd()}\n${line}\n`;
}

function setCoralEnabledInEnvLocal(dataSourceIds: Record<string, string>): void {
  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "CORAL_ENABLED", "true");
  for (const [key, value] of Object.entries(dataSourceIds)) {
    if (value) content = upsertEnvLine(content, key, value);
  }
  writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  console.log("Updated .env.local (CORAL_ENABLED + data source IDs)");
}

function main() {
  const env = loadEnvLocal();
  const apiKey = env.NOTION_API_KEY?.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!apiKey) {
    console.error("NOTION_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const coralBin = env.CORAL_BIN || "coral";
  const runEnv = { ...process.env, NOTION_API_KEY: apiKey };

  console.log("Installing Coral Notion source...");
  try {
    execSync(`${coralBin} source remove notion`, { stdio: "inherit", env: runEnv });
  } catch {
    // not installed yet
  }

  try {
    execSync(`${coralBin} source add notion`, { stdio: "inherit", env: runEnv });
  } catch {
    console.warn("source add notion failed — will try manifest + secrets sync.");
  }

  ensureManifestAndSecrets(apiKey);

  console.log("\nVerifying notion schema...");
  const schemas = coralSql(
    coralBin,
    "SELECT DISTINCT schema_name FROM coral.tables WHERE schema_name = 'notion'",
    apiKey,
  );
  if (!schemas.includes("notion")) {
    console.error("Notion schema still missing. Try: coral source test notion");
    process.exit(1);
  }
  console.log("notion schema OK");

  const tables = coralSql(
    coralBin,
    "SELECT schema_name, table_name FROM coral.tables WHERE schema_name = 'notion'",
    apiKey,
  );
  console.log("Notion tables:", tables.trim());

  console.log("\nTesting connectivity...");
  try {
    execSync(`${coralBin} source test notion`, { stdio: "inherit", env: runEnv });
  } catch {
    console.warn("source test notion failed — share Notion DBs with your integration.");
  }

  const dbs = [
    ["Study Plans", "NOTION_STUDY_PLANS_DATABASE_ID", "NOTION_STUDY_PLANS_DATA_SOURCE_ID"],
    ["Resources", "NOTION_RESOURCES_DATABASE_ID", "NOTION_RESOURCES_DATA_SOURCE_ID"],
    ["Profiles", "NOTION_PROFILES_DATABASE_ID", "NOTION_PROFILES_DATA_SOURCE_ID"],
  ] as const;

  const dataSourceIds: Record<string, string> = {};

  for (const [label, dbEnv, dsEnv] of dbs) {
    const dbId = env[dbEnv]?.trim();
    if (!dbId) continue;
    console.log(`\n${label}:`);
    try {
      const out = coralSql(
        coralBin,
        `SELECT id, data_sources FROM notion.databases WHERE database_id = '${dbId.replace(/'/g, "''")}' LIMIT 1`,
        apiKey,
      );
      console.log(out.trim() || "(no rows — share database with integration)");
      const parsed = JSON.parse(out.trim() || "[]") as { data_sources?: string }[];
      const raw = parsed[0]?.data_sources;
      if (raw) {
        const sources = JSON.parse(raw) as { id?: string }[];
        const dsId = sources[0]?.id;
        if (dsId) dataSourceIds[dsEnv] = dsId;
      }
    } catch (e) {
      console.warn("  query failed:", e);
    }
  }

  if (existsSync(NOTION_WRITES_MANIFEST)) {
    console.log("\nInstalling notion_writes source (page creates via Coral SQL)...");
    installImportedCoralSource({
      sourceName: "notion_writes",
      manifestPath: NOTION_WRITES_MANIFEST,
      secretsLines: [`NOTION_API_KEY=${JSON.stringify(apiKey)}`],
      runEnv: { NOTION_API_KEY: apiKey },
    });
  } else {
    console.warn("Skip notion_writes — manifest missing at", NOTION_WRITES_MANIFEST);
  }

  setCoralEnabledInEnvLocal(dataSourceIds);
  console.log("\nDone. Restart `npm run dev` and open /api/coral/status?probe=true");
}

main();
