import type { NotionDatabaseKey } from "@backend/coral-mcp/registry";
import type { CoralNotionPageRow } from "./notion-source";

type CacheEntry = {
  loadedAt: number;
  pages: CoralNotionPageRow[];
};

const pagesByKey = new Map<NotionDatabaseKey, CacheEntry>();
const inFlight = new Map<NotionDatabaseKey, Promise<CoralNotionPageRow[]>>();

function cacheTtlMs(): number {
  const raw = process.env.CORAL_PAGES_CACHE_TTL_MS;
  // `notion.data_source_pages` is expensive (subprocess + network + large payload),
  // so default to a longer TTL. Override via CORAL_PAGES_CACHE_TTL_MS when needed.
  const parsed = raw ? Number(raw) : 600_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 600_000;
}

export function invalidateNotionPagesCache(key?: NotionDatabaseKey): void {
  if (key) {
    pagesByKey.delete(key);
    inFlight.delete(key);
    return;
  }
  pagesByKey.clear();
  inFlight.clear();
}

/**
 * Cache Coral `data_source_pages` reads — each uncached call spawns `coral sql` (~2–8s).
 * Coalesce concurrent requests for the same database key.
 */
export async function getCachedDataSourcePages(
  key: NotionDatabaseKey,
  loader: () => Promise<CoralNotionPageRow[]>,
): Promise<CoralNotionPageRow[]> {
  const ttl = cacheTtlMs();
  const hit = pagesByKey.get(key);
  if (hit && Date.now() - hit.loadedAt < ttl) {
    return hit.pages;
  }

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = loader()
    .then((pages) => {
      pagesByKey.set(key, { loadedAt: Date.now(), pages });
      inFlight.delete(key);
      return pages;
    })
    .catch((e) => {
      inFlight.delete(key);
      throw e;
    });

  inFlight.set(key, promise);
  return promise;
}
