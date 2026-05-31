/** Opt-in verbose Coral tracing: set CORAL_DEBUG=true in .env.local */
export function coralDebug(channel: string, message: string): void {
  if (process.env.CORAL_DEBUG === "true") {
    console.info(`[${channel}] ${message}`);
  }
}
