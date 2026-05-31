import { fetchAllResourcesViaCoral } from "@/lib/coral/notion-reads";
import { getNotionDatabaseId } from "@/lib/coral/notion-config";
import { insertNotionPageViaCoral } from "@/lib/coral/writes";
import type { Resource } from "@/types/resource";

function isSeedConfigured(): boolean {
  return getNotionDatabaseId("resources") !== null;
}

function resourceToNotionProperties(resource: Resource): Record<string, unknown> {
  const props: Record<string, unknown> = {
    Title: { title: [{ text: { content: resource.title.slice(0, 200) } }] },
    Subject: { select: { name: resource.subject } },
    Topic: { rich_text: [{ text: { content: resource.topic.slice(0, 200) } }] },
    Type: { select: { name: resource.type } },
    Difficulty: { select: { name: resource.difficulty } },
    Recommended: { checkbox: resource.recommended },
    Tags: {
      multi_select: resource.tags.slice(0, 8).map((name) => ({
        name: name.slice(0, 100),
      })),
    },
  };

  if (resource.fileSize) {
    props["File Size"] = { rich_text: [{ text: { content: resource.fileSize } }] };
  }
  if (resource.duration) {
    props.Duration = { rich_text: [{ text: { content: resource.duration } }] };
  }
  if (resource.driveUrl && resource.driveUrl !== "#") {
    props["Drive URL"] = { url: resource.driveUrl };
  }

  return props;
}

async function listExistingTitles(): Promise<Set<string>> {
  const titles = new Set<string>();
  const resources = await fetchAllResourcesViaCoral();
  for (const r of resources) {
    titles.add(r.title.trim().toLowerCase());
  }
  return titles;
}

export async function createNotionResource(resource: Resource): Promise<string | null> {
  if (!isSeedConfigured()) return null;

  const page = await insertNotionPageViaCoral("resources", resourceToNotionProperties(resource));

  return page.id || null;
}

export type SeedNotionResourcesResult = {
  created: number;
  skipped: number;
  failed: number;
};

/** Insert fallback resources via Coral SQL (skips existing titles). */
export async function seedNotionResources(
  resources: Resource[],
): Promise<SeedNotionResourcesResult> {
  const result: SeedNotionResourcesResult = { created: 0, skipped: 0, failed: 0 };

  if (!isSeedConfigured()) {
    return { ...result, failed: resources.length };
  }

  const existing = await listExistingTitles();

  for (const resource of resources) {
    const key = resource.title.trim().toLowerCase();
    if (existing.has(key)) {
      result.skipped += 1;
      continue;
    }

    try {
      const id = await createNotionResource(resource);
      if (id) {
        result.created += 1;
        existing.add(key);
      } else {
        result.failed += 1;
      }
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
