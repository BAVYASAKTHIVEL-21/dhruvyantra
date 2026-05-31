/**
 * Resource data layer — browser calls /api/resources; server runs Coral SQL
 * (`notion.data_source_pages`) via lib/resources/notion.ts.
 */

import type { ExamType } from "@/config/exam-config";
import { orderedSubjectsWithCounts } from "@/lib/resources/exam-filter";
import type {
  Recommendation,
  Resource,
  ResourceFilter,
  ResourceSubject,
  ResourcesApiResponse,
} from "@/types/resource";
import {
  QUICK_ACCESS,
  RECENT_FILES,
  STORAGE_USAGE,
  SUBJECT_ICONS,
} from "../data/resources";
import type { QuickAccessItem, RecentFile, SubjectSummary, StorageUsage } from "../types";

const API_BASE = "/api/resources";
const RETRY_DELAY_MS = 600;

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function matchesSearch(resource: Resource, query: string): boolean {
  if (!query) return true;
  const haystack = [resource.title, resource.subject, resource.topic, ...resource.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesType(resource: Resource, filter: ResourceFilter): boolean {
  if (filter === "All") return true;
  return resource.type === filter;
}

async function fetchWithRetry(url: string, retries = 1): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export type FetchResourcesParams = {
  search?: string;
  subject?: ResourceSubject | null;
};

/** Fetch resources + personalized recommendations from API */
export async function fetchResources(
  params: FetchResourcesParams = {},
): Promise<ResourcesApiResponse> {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.subject) qs.set("subject", params.subject);

  const url = qs.size > 0 ? `${API_BASE}?${qs}` : API_BASE;
  const res = await fetchWithRetry(url);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to load resources",
    );
  }

  return res.json();
}

/** @deprecated Use fetchResources — kept for compatibility */
export async function getAllResources(): Promise<Resource[]> {
  const data = await fetchResources();
  return data.resources;
}

/** Client-side type filter on already-fetched resources */
export function searchResources(
  resources: Resource[],
  query: string,
  typeFilter: ResourceFilter = "All",
): Resource[] {
  const q = normalizeQuery(query);
  return resources.filter((r) => matchesSearch(r, q) && matchesType(r, typeFilter));
}

export function getRecommendedResources(resources: Resource[]): Resource[] {
  return resources.filter((r) => r.recommended || r.weakTopicRelated);
}

export function getFeaturedResources(resources: Resource[]): Resource[] {
  return resources.filter((r) => r.featured);
}

export function getResourcesBySubject(
  resources: Resource[],
  subject: ResourceSubject,
): Resource[] {
  return resources.filter((r) => r.subject === subject);
}

export function getResourceById(
  resources: Resource[],
  id: string,
): Resource | undefined {
  return resources.find((r) => r.id === id);
}

export function getRecommendationsWithResources(
  recommendations: (Recommendation & { resource: Resource })[],
) {
  return recommendations.filter((r) => r.resource != null);
}

export function buildSubjectSummaries(
  counts: Partial<Record<ResourceSubject, number>>,
  examType: ExamType | null = null,
): SubjectSummary[] {
  return orderedSubjectsWithCounts(counts, examType).map((name) => ({
    id: name.toLowerCase(),
    name,
    resourceCount: counts[name] ?? 0,
    icon: SUBJECT_ICONS[name] ?? "other",
  }));
}

export function getRecentFiles(resources: Resource[] = []): RecentFile[] {
  if (resources.length === 0) return [];
  const ids = new Set(resources.map((r) => r.id));
  return RECENT_FILES.filter((file) => ids.has(file.resourceId));
}

export function getQuickAccess(resources: Resource[] = []): QuickAccessItem[] {
  if (resources.length === 0) return [];
  return QUICK_ACCESS.filter(
    (item) => filterByQuickAccessTag(resources, item.filterTag).length > 0,
  );
}

export function getStorageUsage(): StorageUsage {
  return STORAGE_USAGE;
}

export function filterByQuickAccessTag(
  resources: Resource[],
  filterTag: string,
): Resource[] {
  const tag = filterTag.toLowerCase();
  return resources.filter((r) =>
    r.tags.some((t) => t.toLowerCase().includes(tag)),
  );
}

export const RESOURCE_TYPE_FILTERS: ResourceFilter[] = [
  "All",
  "Notes",
  "Books",
  "PYQs",
  "DPPs",
  "Videos",
  "Others",
];

export type { ResourceType } from "@/types/resource";
