/** Log every `coral sql` invocation (default on; set CORAL_LOG_QUERIES=false to silence). */
export function logCoralQuery(sql: string, schema?: string): void {
  if (process.env.CORAL_LOG_QUERIES === "false") return;

  const oneLine = sql.replace(/\s+/g, " ").trim();
  const prefix = schema ? `[coral/${schema}]` : "[coral]";
  const preview = oneLine.length > 500 ? `${oneLine.slice(0, 500)}…` : oneLine;
  console.info(`${prefix} query → ${preview}`);
}
