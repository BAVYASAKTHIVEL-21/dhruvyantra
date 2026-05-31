export function isCoralEnabled(): boolean {
  // Opt-in only — avoids slow failed subprocess calls when Coral Notion source is not installed.
  return process.env.CORAL_ENABLED === "true";
}

export function getCoralBin(): string {
  return process.env.CORAL_BIN?.trim() || "coral";
}

export function getCoralTimeoutMs(): number {
  const raw = process.env.CORAL_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : 30_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000;
}
