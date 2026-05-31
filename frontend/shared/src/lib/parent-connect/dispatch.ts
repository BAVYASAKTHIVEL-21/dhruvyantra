/** Fire-and-forget parent Telegram notifications (never blocks API responses). */
export function dispatchParentNotification(
  work: () => Promise<unknown>,
  label = "parent-connect",
): void {
  void work().catch((e) => {
    console.warn(`[${label}] Telegram notification failed:`, e);
  });
}
