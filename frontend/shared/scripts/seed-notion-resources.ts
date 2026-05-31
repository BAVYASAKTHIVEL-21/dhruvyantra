/**
 * Seed Notion Resources DB from local fallback library.
 * Usage: npm run seed:resources   (from frontend/shared)
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { FALLBACK_RESOURCES } from "../src/lib/resources/fallback";
import { seedNotionResources } from "../src/lib/resources/seed-notion";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  console.log(`Seeding ${FALLBACK_RESOURCES.length} resources into Notion…`);
  const result = await seedNotionResources(FALLBACK_RESOURCES);
  console.log(`Done — created: ${result.created}, skipped: ${result.skipped}, failed: ${result.failed}`);
  if (result.failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
