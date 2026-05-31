#!/usr/bin/env npx tsx
/**
 * Install Coral openrouter source + verify model catalog schema.
 *
 * Usage (from frontend/shared):
 *   npm run setup:coral-openrouter
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { coralBinFromEnv, installImportedCoralSource } from "./lib/coral-source-install";

const MANIFEST = resolve(process.cwd(), "../../coral/sources/openrouter/manifest.yaml");
const SOURCE_NAME = "openrouter";

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
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error("Set OPENROUTER_API_KEY in .env.local first.");
    process.exit(1);
  }

  const model = env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3001";
  const appName = env.OPENROUTER_APP_NAME?.trim() || "DhruvYantra";

  const runEnv = {
    OPENROUTER_API_KEY: apiKey,
    OPENROUTER_APP_URL: appUrl,
    OPENROUTER_APP_NAME: appName,
  };

  if (
    !installImportedCoralSource({
      sourceName: SOURCE_NAME,
      manifestPath: MANIFEST,
      secretsLines: [
        `OPENROUTER_API_KEY=${JSON.stringify(apiKey)}`,
        `OPENROUTER_APP_URL=${JSON.stringify(appUrl)}`,
        `OPENROUTER_APP_NAME=${JSON.stringify(appName)}`,
      ],
      runEnv,
    })
  ) {
    process.exit(1);
  }

  const coralBin = coralBinFromEnv(env);
  console.log("\nVerifying openrouter schema...");
  const verify = execSync(
    `${coralBin} sql --format json ${JSON.stringify("SELECT id, name FROM openrouter.models LIMIT 3")}`,
    { encoding: "utf8", env: { ...process.env, ...runEnv } },
  );
  if (!verify.includes("id")) {
    console.error("openrouter schema probe failed. Try: coral source test openrouter");
    process.exit(1);
  }
  console.log("openrouter schema OK — sample:", verify.trim().slice(0, 200));

  try {
    execSync(`${coralBin} source test ${SOURCE_NAME}`, {
      stdio: "inherit",
      env: { ...process.env, ...runEnv },
    });
  } catch {
    console.warn("source test failed — check OPENROUTER_API_KEY.");
  }

  // SQL string literals must use single quotes; JSON.stringify would produce double quotes
  // which Coral SQL interprets as an identifier, not a string.
  const modelSql = `'${model.replace(/'/g, "''")}'`;
  const chatProbe =
    `SELECT content FROM openrouter.chat_completions ` +
    `WHERE operation = 'mentor.chat' ` +
    `AND model = ${modelSql} ` +
    `AND messages_json = '[{"role":"user","content":"ping"}]' ` +
    `AND temperature = '0.2' ` +
    `AND max_tokens = '8' ` +
    `LIMIT 1`;
  try {
    execSync(`${coralBin} sql --format json ${JSON.stringify(chatProbe)}`, {
      encoding: "utf8",
      env: { ...process.env, ...runEnv },
      stdio: "pipe",
    });
    console.log("openrouter chat_completions filter columns OK");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      "\nchat_completions probe FAILED (AI Mentor needs this):\n",
      msg,
      "\n\nRe-run after fixing manifest:",
      "  npm run setup:coral-openrouter",
    );
    process.exit(1);
  }

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "CORAL_ENABLED", "true");
  content = upsertEnvLine(content, "OPENROUTER_ENABLED", "true");
  if (!env.OPENROUTER_MODEL) {
    content = upsertEnvLine(content, "OPENROUTER_MODEL", model);
  }
  writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`, "utf8");

  console.log("\nDone. Default model:", model);
}

main();
