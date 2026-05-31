import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Parse `frontend/shared/.env.local` into key/value pairs. */
export function loadEnvLocal(cwd = process.cwd()): Record<string, string> {
  const envPath = resolve(cwd, ".env.local");
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

/** Make setup scripts see .env.local (Next.js loads this at runtime; tsx does not). */
export function applyEnvLocal(env: Record<string, string>): void {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

export function loadAndApplyEnvLocal(cwd = process.cwd()): Record<string, string> {
  const env = loadEnvLocal(cwd);
  applyEnvLocal(env);
  return env;
}
