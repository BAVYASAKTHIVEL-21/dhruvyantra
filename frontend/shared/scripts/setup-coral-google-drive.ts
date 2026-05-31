#!/usr/bin/env npx tsx
/**
 * Install Coral google_drive source + verify schema (DhruvYantra Vault).
 *
 * Usage (from frontend/shared):
 *   npm run setup:coral-google-drive
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { coralBinFromEnv, installImportedCoralSource } from "./lib/coral-source-install";
import { loadAndApplyEnvLocal } from "./lib/load-env-local";
import { getGoogleDriveAccessToken } from "../../../backend/coral-mcp/google-oauth";

const MANIFEST = resolve(process.cwd(), "../../coral/sources/google-drive/manifest.yaml");
const SOURCE_NAME = "google_drive";

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
  loadAndApplyEnvLocal();

  let accessToken: string;
  try {
    accessToken = await getGoogleDriveAccessToken();
  } catch (e) {
    console.error("Google Drive auth failed:", e);
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
  console.log("\nVerifying google_drive schema...");
  const verify = execSync(
    `${coralBin} sql --format json ${JSON.stringify("SELECT table_name FROM coral.tables WHERE schema_name = 'google_drive' LIMIT 5")}`,
    {
      encoding: "utf8",
      env: { ...process.env, GOOGLE_ACCESS_TOKEN: accessToken },
    },
  );
  if (!verify.includes("google_drive") && !verify.includes("files")) {
    console.error("google_drive schema missing. Try: coral source test google_drive");
    process.exit(1);
  }
  console.log("google_drive schema OK");

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (folderId) {
    const folderProbe = `SELECT id, name FROM google_drive.files WHERE folder_id = ${JSON.stringify(folderId)} LIMIT 3`;
    try {
      const probeOut = execSync(
        `${coralBin} sql --format json ${JSON.stringify(folderProbe)}`,
        { encoding: "utf8", env: { ...process.env, GOOGLE_ACCESS_TOKEN: accessToken } },
      );
      console.log("Vault folder probe OK:", probeOut.trim().slice(0, 120));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Vault folder probe failed:", msg);
      console.error("Check GOOGLE_DRIVE_FOLDER_ID and folder share with the service account / OAuth user.");
      process.exit(1);
    }
  } else {
    console.warn("GOOGLE_DRIVE_FOLDER_ID not set — skip folder probe");
  }

  try {
    execSync(`${coralBin} source test ${SOURCE_NAME}`, {
      stdio: "inherit",
      env: { ...process.env, GOOGLE_ACCESS_TOKEN: accessToken },
    });
  } catch {
    console.warn("source test failed — check folder share / token scopes.");
  }

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "CORAL_ENABLED", "true");
  content = upsertEnvLine(content, "GOOGLE_DRIVE_ENABLED", "true");
  writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`, "utf8");

  console.log("\nDone. Restart dev server → /api/coral/status?probe=true");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
