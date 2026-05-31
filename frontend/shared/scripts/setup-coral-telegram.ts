#!/usr/bin/env npx tsx
/**
 * Install Coral telegram source + verify schema (Parent Connect).
 *
 * Usage (from frontend/shared):
 *   npm run setup:coral-telegram
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { coralBinFromEnv, installImportedCoralSource } from "./lib/coral-source-install";

const MANIFEST = resolve(process.cwd(), "../../coral/sources/telegram/manifest.yaml");
const SOURCE_NAME = "telegram";

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
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_PARENT_CHAT_ID?.trim();

  if (!token) {
    console.error("Set TELEGRAM_BOT_TOKEN in .env.local (from @BotFather).");
    process.exit(1);
  }
  if (!chatId) {
    console.error("Set TELEGRAM_PARENT_CHAT_ID in .env.local (parent Telegram chat id).");
    process.exit(1);
  }

  if (!existsSync(MANIFEST)) {
    console.error("Missing manifest:", MANIFEST);
    process.exit(1);
  }

  const coralBin = coralBinFromEnv(env);
  const runEnv = { ...process.env, TELEGRAM_BOT_TOKEN: token };

  if (
    !installImportedCoralSource({
      sourceName: SOURCE_NAME,
      manifestPath: MANIFEST,
      secretsLines: [`TELEGRAM_BOT_TOKEN=${JSON.stringify(token)}`],
      runEnv,
    })
  ) {
    process.exit(1);
  }

  console.log("\nVerifying telegram schema...");
  const schemaProbe = execSync(
    `${coralBin} sql --format json ${JSON.stringify(
      "SELECT table_name FROM coral.tables WHERE schema_name = 'telegram' LIMIT 10",
    )}`,
    { encoding: "utf8", env: runEnv },
  );
  if (!schemaProbe.includes("table_name")) {
    console.error("telegram schema probe failed. Try: coral source test telegram");
    process.exit(1);
  }
  console.log("telegram schema OK —", schemaProbe.trim());

  // Optional: actually send a probe message to confirm the bot/chat_id works.
  try {
    const textJson = JSON.stringify("coral_setup_probe").replace(/'/g, "''");
    const sendProbe = execSync(
      `${coralBin} sql --format json ${JSON.stringify(
        `SELECT ok, message_id FROM telegram.message_sends WHERE chat_id = '${chatId.replace(
          /'/g,
          "''",
        )}' AND text_json = '${textJson}' LIMIT 1`,
      )}`,
      { encoding: "utf8", env: runEnv },
    );
    console.log("telegram.message_sends probe:", sendProbe.trim());
  } catch {
    console.warn(
      "telegram.message_sends probe failed — ensure parent has messaged the bot (/start) and chat id is correct.",
    );
  }

  try {
    execSync(`${coralBin} source test ${SOURCE_NAME}`, { stdio: "inherit", env: runEnv });
  } catch {
    console.warn("source test failed — confirm bot token and parent chat id.");
  }

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "CORAL_ENABLED", "true");
  content = upsertEnvLine(content, "TELEGRAM_ENABLED", "true");
  writeFileSync(envPath, content, "utf8");

  console.log("\nDone. Restart dev server → /api/coral/status?probe=true");
}

main();
