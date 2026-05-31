#!/usr/bin/env npx tsx
/**
 * Register all DhruvYantra Coral sources (imported manifests + bundled notion).
 *
 * Usage (from frontend/shared):
 *   npm run setup:coral-all
 *
 * Requires .env.local with keys for each integration you want secrets synced.
 * Sources without credentials are still registered; run per-integration setup to verify.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  coralBinFromEnv,
  installBundledCoralSource,
  installImportedCoralSource,
} from "./lib/coral-source-install";

const SOURCES_ROOT = resolve(process.cwd(), "../../coral/sources");

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

function upsertEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return `${content.trimEnd()}\n${line}\n`;
}

function main() {
  const env = loadEnvLocal();
  const coralBin = coralBinFromEnv(env);

  console.log("Registering DhruvYantra Coral sources...\n");

  const results: { name: string; ok: boolean }[] = [];

  const dataDir = env.CORAL_DATA_DIR?.trim() || resolve(process.cwd(), ".data/coral");
  results.push({
    name: "dhruvyantra",
    ok: installImportedCoralSource({
      sourceName: "dhruvyantra",
      manifestPath: resolve(SOURCES_ROOT, "dhruvyantra/manifest.yaml"),
      secretsLines: [`DATA_DIR=${JSON.stringify(dataDir)}`],
      runEnv: { DATA_DIR: dataDir, CORAL_DATA_DIR: dataDir },
    }),
  });

  const notionKey = env.NOTION_API_KEY?.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (notionKey) {
    results.push({
      name: "notion",
      ok: installBundledCoralSource("notion", { ...process.env, NOTION_API_KEY: notionKey }),
    });
    results.push({
      name: "notion_writes",
      ok: installImportedCoralSource({
        sourceName: "notion_writes",
        manifestPath: resolve(SOURCES_ROOT, "notion-writes/manifest.yaml"),
        secretsLines: [`NOTION_API_KEY=${JSON.stringify(notionKey)}`],
        runEnv: { NOTION_API_KEY: notionKey },
      }),
    });
  } else {
    console.log("  ⊘ notion — skip (NOTION_API_KEY not set)");
    results.push({ name: "notion", ok: false });
    results.push({ name: "notion_writes", ok: false });
  }

  const openrouterKey = env.OPENROUTER_API_KEY?.trim();
  if (openrouterKey) {
    const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3001";
    const appName = env.OPENROUTER_APP_NAME?.trim() || "DhruvYantra";
    results.push({
      name: "openrouter",
      ok: installImportedCoralSource({
        sourceName: "openrouter",
        manifestPath: resolve(SOURCES_ROOT, "openrouter/manifest.yaml"),
        secretsLines: [
          `OPENROUTER_API_KEY=${JSON.stringify(openrouterKey)}`,
          `OPENROUTER_APP_URL=${JSON.stringify(appUrl)}`,
          `OPENROUTER_APP_NAME=${JSON.stringify(appName)}`,
        ],
        runEnv: {
          OPENROUTER_API_KEY: openrouterKey,
          OPENROUTER_APP_URL: appUrl,
          OPENROUTER_APP_NAME: appName,
        },
      }),
    });
  } else {
    console.log("  ⊘ openrouter — skip (OPENROUTER_API_KEY not set)");
    results.push({ name: "openrouter", ok: false });
  }

  const telegramToken = env.TELEGRAM_BOT_TOKEN?.trim();
  if (telegramToken) {
    results.push({
      name: "telegram",
      ok: installImportedCoralSource({
        sourceName: "telegram",
        manifestPath: resolve(SOURCES_ROOT, "telegram/manifest.yaml"),
        secretsLines: [`TELEGRAM_BOT_TOKEN=${JSON.stringify(telegramToken)}`],
        runEnv: { TELEGRAM_BOT_TOKEN: telegramToken },
      }),
    });
  } else {
    console.log("  ⊘ telegram — skip (TELEGRAM_BOT_TOKEN not set)");
    results.push({ name: "telegram", ok: false });
  }

  const googleRefresh = env.GOOGLE_REFRESH_TOKEN?.trim();
  const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const hasGoogleOAuth = Boolean(googleRefresh && googleClientId && googleClientSecret);

  if (hasGoogleOAuth) {
    console.log(
      "  ℹ google_calendar / google_drive — manifests registered; run setup:coral-google-* for token sync + verify",
    );
    results.push({
      name: "google_calendar",
      ok: installImportedCoralSource({
        sourceName: "google_calendar",
        manifestPath: resolve(SOURCES_ROOT, "google-calendar/manifest.yaml"),
      }),
    });
    results.push({
      name: "google_drive",
      ok: installImportedCoralSource({
        sourceName: "google_drive",
        manifestPath: resolve(SOURCES_ROOT, "google-drive/manifest.yaml"),
      }),
    });
  } else {
    console.log("  ⊘ google_calendar / google_drive — skip (Google OAuth not in .env.local)");
    results.push({ name: "google_calendar", ok: false }, { name: "google_drive", ok: false });
  }

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "CORAL_ENABLED", "true");
  content = upsertEnvLine(content, "CORAL_DATA_DIR", dataDir);
  if (openrouterKey) content = upsertEnvLine(content, "OPENROUTER_ENABLED", "true");
  if (telegramToken) content = upsertEnvLine(content, "TELEGRAM_ENABLED", "true");
  if (hasGoogleOAuth) {
    content = upsertEnvLine(content, "GOOGLE_CALENDAR_ENABLED", "true");
    content = upsertEnvLine(content, "GOOGLE_DRIVE_ENABLED", "true");
  }
  writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`, "utf8");

  console.log("\n--- coral source list ---");
  execSync(`${coralBin} source list`, { stdio: "inherit" });

  const ok = results.filter((r) => r.ok).map((r) => r.name);
  const failed = results.filter((r) => !r.ok).map((r) => r.name);

  console.log("\nRegistered:", ok.length ? ok.join(", ") : "(none)");
  if (failed.length) {
    console.log("Skipped or failed:", failed.join(", "));
    console.log("\nPer-integration verify:");
    console.log("  npm run setup:coral-notion");
    console.log("  npm run setup:coral-openrouter");
    console.log("  npm run setup:coral-telegram");
    console.log("  npm run setup:coral-google-calendar");
    console.log("  npm run setup:coral-google-drive");
  }

  const anyOk = results.some((r) => r.ok);
  if (!anyOk) {
    console.error("\nNo sources registered. Set API keys in .env.local and retry.");
    process.exit(1);
  }

  console.log("\nDone. Restart dev server → /api/coral/status?probe=true");
}

main();
