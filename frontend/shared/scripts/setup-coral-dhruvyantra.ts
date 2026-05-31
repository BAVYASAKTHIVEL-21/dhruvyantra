#!/usr/bin/env npx tsx
/**
 * Install local dhruvyantra Coral source (JSONL app state).
 *
 * Usage (from frontend/shared):
 *   npm run setup:coral-dhruvyantra
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ensureCoralDataDirs, getCoralDataDir } from "../src/lib/coral/dhruvyantra-store";
import { installImportedCoralSource } from "./lib/coral-source-install";

const MANIFEST = resolve(process.cwd(), "../../coral/sources/dhruvyantra/manifest.yaml");

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
  const dataDir = env.CORAL_DATA_DIR?.trim() || resolve(process.cwd(), ".data/coral");

  ensureCoralDataDirs();
  process.env.CORAL_DATA_DIR = dataDir;

  console.log("Coral data directory:", dataDir);
  console.log("Installing dhruvyantra JSONL source...");

  const ok = installImportedCoralSource({
    sourceName: "dhruvyantra",
    manifestPath: MANIFEST,
    secretsLines: [`DATA_DIR=${JSON.stringify(dataDir)}`],
    runEnv: { DATA_DIR: dataDir, CORAL_DATA_DIR: dataDir },
  });

  if (!ok) process.exit(1);

  const coralBin = env.CORAL_BIN?.trim() || "coral";
  try {
    execSync(`${coralBin} source test dhruvyantra`, {
      stdio: "inherit",
      env: { ...process.env, DATA_DIR: dataDir },
    });
  } catch {
    console.warn("source test failed — check DATA_DIR path is absolute in Coral config");
  }

  const envPath = resolve(process.cwd(), ".env.local");
  let content = readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "CORAL_ENABLED", "true");
  content = upsertEnvLine(content, "CORAL_DATA_DIR", dataDir);
  writeFileSync(envPath, content, "utf8");

  console.log("\nDone. Focus/mock routes will log [coral] query → on read/write.");
  console.log("DATA_DIR:", getCoralDataDir());
}

main();
