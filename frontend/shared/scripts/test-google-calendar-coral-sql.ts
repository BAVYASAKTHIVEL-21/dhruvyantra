#!/usr/bin/env npx tsx
/**
 * Print and optionally run google_calendar.event_creates SQL (debug).
 *
 * Usage (from frontend/shared):
 *   npx tsx scripts/test-google-calendar-coral-sql.ts
 *   npx tsx scripts/test-google-calendar-coral-sql.ts --run
 */
import { buildCalendarEventCreateSql } from "../../../backend/coral-mcp/google-calendar-coral-write";
import { executeGoogleCoralSql } from "../../../backend/coral-mcp/google-coral-sql";
import { loadAndApplyEnvLocal } from "./lib/load-env-local";

const run = process.argv.includes("--run");

async function main() {
  loadAndApplyEnvLocal();

  const sql = buildCalendarEventCreateSql({
    summary: "DhruvYantra Coral test",
    description: "Created by test-google-calendar-coral-sql.ts",
    startDateTime: "2026-05-27T09:00:00",
    endDateTime: "2026-05-27T09:30:00",
    taskId: "coral-sql-test",
    category: "planner",
  });

  console.log("Generated SQL:\n");
  console.log(sql);
  console.log("\nTest manually:\n");
  console.log(`  coral sql ${JSON.stringify(sql)}`);

  if (!run) {
    console.log("\nPass --run to execute via executeGoogleCoralSql (needs CORAL_ENABLED=true).");
    return;
  }

  const rows = await executeGoogleCoralSql("calendar", sql);
  console.log("\nResult rows:", JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
