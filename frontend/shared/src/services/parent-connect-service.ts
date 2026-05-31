import type { ParentConnectOverview } from "@/types/parent-connect";

export async function fetchParentConnectOverview(): Promise<ParentConnectOverview> {
  const res = await fetch("/api/parent-connect/overview", { cache: "no-store" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load parent overview");
  }
  return res.json();
}
