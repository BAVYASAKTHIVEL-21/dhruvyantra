#!/usr/bin/env npx tsx
/**
 * Verify Google Calendar OAuth and enable gateway in .env.local.
 *
 * Usage (from frontend/shared):
 *   npm run setup:google-calendar
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { coralGoogleCalendarProbe } from "../../../backend/coral-mcp/google-calendar-gateway";
import { loadAndApplyEnvLocal } from "./lib/load-env-local";

function upsertEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return `${content.trimEnd()}\n${line}\n`;
}

async function main() {
  const env = loadAndApplyEnvLocal();
  const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"] as const;
  const missing = required.filter((k) => !env[k]?.trim());
  if (missing.length > 0) {
    console.error(`Missing in .env.local: ${missing.join(", ")}`);
    console.error("Authorize https://www.googleapis.com/auth/calendar.events and save refresh token.");
    process.exit(1);
  }

  console.log("Probing Google Calendar via Coral gateway…");
  const probe = await coralGoogleCalendarProbe();
  if (!probe.ok) {
    console.error("Calendar probe failed:", probe.error);
    process.exit(1);
  }

  console.log("Google Calendar OK");

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "GOOGLE_CALENDAR_ENABLED", "true");
  writeFileSync(envPath, content, "utf8");
  console.log("Updated .env.local (GOOGLE_CALENDAR_ENABLED=true)");
  console.log("\nRestart dev server, then check /api/coral/status?probe=true");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
