#!/usr/bin/env npx tsx
/**
 * Verify Google Drive Vault auth and enable gateway in .env.local.
 *
 * Usage (from frontend/shared):
 *   npm run setup:google-drive
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { coralGoogleDriveProbe } from "../../../backend/coral-mcp/google-drive-gateway";

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

async function main() {
  const env = loadEnvLocal();
  if (!env.GOOGLE_DRIVE_FOLDER_ID?.trim()) {
    console.error("Set GOOGLE_DRIVE_FOLDER_ID in .env.local");
    process.exit(1);
  }

  const hasServiceAccount =
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  const hasRefresh =
    env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim() &&
    env.GOOGLE_CLIENT_ID?.trim() &&
    env.GOOGLE_CLIENT_SECRET?.trim();

  if (!hasServiceAccount && !hasRefresh) {
    console.error(
      "Set GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
      "or GOOGLE_DRIVE_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET",
    );
    process.exit(1);
  }

  console.log("Probing Google Drive Vault folder via Coral gateway…");
  const probe = await coralGoogleDriveProbe();
  if (!probe.ok) {
    console.error("Drive probe failed:", probe.error);
    process.exit(1);
  }

  console.log(`Google Drive OK — ${probe.fileCount ?? 0} file(s) in Vault folder`);

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "GOOGLE_DRIVE_ENABLED", "true");
  writeFileSync(envPath, content, "utf8");
  console.log("Updated .env.local (GOOGLE_DRIVE_ENABLED=true)");
  console.log("\nRestart dev server, then check /api/coral/status?probe=true");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
