#!/usr/bin/env npx tsx
/**
 * Install Coral google_calendar source + verify schema.
 *
 * Usage (from frontend/shared):
 *   npm run setup:coral-google-calendar
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { coralBinFromEnv, installImportedCoralSource } from "./lib/coral-source-install";
import { loadAndApplyEnvLocal } from "./lib/load-env-local";
import { getGoogleCalendarAccessToken } from "../../../backend/coral-mcp/google-oauth";

const MANIFEST = resolve(process.cwd(), "../../coral/sources/google-calendar/manifest.yaml");
const SOURCE_NAME = "google_calendar";

function upsertEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return `${content.trimEnd()}\n${line}\n`;
}

async function main() {
  loadAndApplyEnvLocal();

  let accessToken: string;
  try {
    accessToken = await getGoogleCalendarAccessToken();
  } catch (e) {
    console.error("Google Calendar auth failed:", e);
    process.exit(1);
  }

  if (!existsSync(MANIFEST)) {
    console.error("Missing manifest:", MANIFEST);
    process.exit(1);
  }

  if (
    !installImportedCoralSource({
      sourceName: SOURCE_NAME,
      manifestPath: MANIFEST,
      secretsLines: [`GOOGLE_ACCESS_TOKEN=${JSON.stringify(accessToken)}`],
      runEnv: { GOOGLE_ACCESS_TOKEN: accessToken },
    })
  ) {
    process.exit(1);
  }

  const coralBin = coralBinFromEnv();
  const verify = execSync(
    `${coralBin} sql --format json ${JSON.stringify("SELECT table_name FROM coral.tables WHERE schema_name = 'google_calendar' LIMIT 5")}`,
    {
      encoding: "utf8",
      env: { ...process.env, GOOGLE_ACCESS_TOKEN: accessToken },
    },
  );
  if (!verify.includes("google_calendar") && !verify.includes("events")) {
    console.error("google_calendar schema missing. Try: coral source test google_calendar");
    process.exit(1);
  }
  console.log("google_calendar schema OK");

  try {
    execSync(`${coralBin} source test ${SOURCE_NAME}`, { stdio: "inherit", env: { ...process.env, GOOGLE_ACCESS_TOKEN: accessToken } });
  } catch {
    console.warn("source test failed — check Calendar OAuth scopes.");
  }

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "CORAL_ENABLED", "true");
  content = upsertEnvLine(content, "GOOGLE_CALENDAR_ENABLED", "true");
  writeFileSync(envPath, content, "utf8");

  console.log("\nDone. Restart dev server → /api/coral/status?probe=true");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
