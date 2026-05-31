import { FALLBACK_RESOURCES } from "./fallback";
import type { ExamType } from "@/config/exam-config";
import { EXAM_CONFIG } from "@/config/exam-config";
import { fetchAllResourcesViaCoral } from "@/lib/coral/notion-reads";
import { getNotionDatabaseConfig } from "@/lib/notion/client";
import { resourceFromPage } from "@/lib/notion/mappers";
import type {
  Recommendation,
  RecommendationLabel,
  Resource,
  ResourceSubject,
} from "@/types/resource";

/**
 * Notion Resources — Coral SQL only.
 */

const RESOURCES_DB_ENV = "NOTION_RESOURCES_DATABASE_ID";

function getConfig() {
  return getNotionDatabaseConfig(RESOURCES_DB_ENV);
}

export function isNotionResourcesConfigured(): boolean {
  return getConfig() !== null;
}

async function queryAllNotionPages(): Promise<Resource[]> {
  return fetchAllResourcesViaCoral();
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function matchesSearch(resource: Resource, query: string): boolean {
  if (!query) return true;
  const haystack = [resource.title, resource.topic, resource.subject, ...resource.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export async function getAllResources(): Promise<Resource[]> {
  try {
    const fromNotion = await queryAllNotionPages();
    if (fromNotion.length > 0) return fromNotion;
  } catch (e) {
    console.warn("[resources] Coral SQL read failed, using fallback:", e);
  }

  return FALLBACK_RESOURCES;
}

export function getResourcesBySubject(
  resources: Resource[],
  subject: ResourceSubject,
): Resource[] {
  return resources.filter((r) => r.subject === subject);
}

export function searchResources(resources: Resource[], query: string): Resource[] {
  const q = normalizeQuery(query);
  if (!q) return resources;
  return resources.filter((r) => matchesSearch(r, q));
}

const WEAK_SUBJECT_TO_RESOURCE_SUBJECT: Record<string, ResourceSubject> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
  math: "Mathematics",
  biology: "Biology",
  "organic chemistry": "Chemistry",
  "inorganic chemistry": "Chemistry",
};

function weakSubjectMatchesResource(weakSubject: string, resource: Resource): boolean {
  const ws = weakSubject.toLowerCase().trim();
  if (!ws) return false;

  const mapped = WEAK_SUBJECT_TO_RESOURCE_SUBJECT[ws];
  if (mapped && resource.subject === mapped) return true;

  const haystack = [resource.title, resource.topic, resource.subject, ...resource.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(ws);
}

type ScoredResource = { resource: Resource; score: number; label: RecommendationLabel; reason: string };

function examResourceBoost(
  examType: ExamType | null,
  resource: Resource,
): { score: number; label?: RecommendationLabel; reason?: string } {
  if (!examType) return { score: 0 };

  const cfg = EXAM_CONFIG[examType];
  let score = 0;
  let label: RecommendationLabel | undefined;
  let reason: string | undefined;

  if (examType === "JEE") {
    if (resource.type === "PYQs") {
      score += 10;
      label = "Exam Booster";
      reason = "High-yield JEE PYQ practice for your weak syllabus topics.";
    }
    if (resource.type === "DPPs") score += 8;
    if (resource.difficulty === "Hard") score += 4;
    if (resource.tags.some((t) => /advanced|numerical|mock/i.test(t))) score += 5;
  }

  if (examType === "NEET") {
    if (resource.type === "Notes") {
      score += 10;
      label = "NCERT Focus";
      reason = "NCERT-aligned notes for NEET revision.";
    }
    if (resource.subject === "Biology") score += 8;
    if (resource.tags.some((t) => /revision|flashcard|ncert/i.test(t))) score += 6;
    if (resource.tags.some((t) => /diagram|figure/i.test(t))) score += 5;
    if (resource.type === "Videos" && resource.subject === "Biology") score += 4;
  }

  for (const tag of cfg.resourceTags) {
    if (resource.tags.some((t) => t.toLowerCase().includes(tag))) score += 2;
  }

  if ((cfg.resourcePriorities as readonly string[]).includes(resource.type)) {
    score += 3;
  }

  return { score, label, reason };
}

export function getRecommendedResources(
  resources: Resource[],
  weakSubjects: string[] = [],
  weakTopics: string[] = [],
  examType?: ExamType | null,
): (Recommendation & { resource: Resource })[] {
  if (resources.length === 0) return [];

  const exam = examType ?? null;
  const scored: ScoredResource[] = [];

  for (const resource of resources) {
    let score = 0;
    let label: RecommendationLabel = "Suggested for You";
    let reason = "Curated for your study plan and mission goals.";
    let weakMatch = false;

    for (const ws of weakSubjects) {
      if (weakSubjectMatchesResource(ws, resource)) {
        score += 12;
        weakMatch = true;
        label = "Weak Topic";
        reason = `Strengthen ${ws} — focused material for your weak area.`;
      }
    }

    for (const wt of weakTopics) {
      const haystack = [resource.title, resource.topic, resource.subject, ...resource.tags]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(wt.toLowerCase())) {
        score += 14;
        weakMatch = true;
        label = "Weak Topic";
        reason = `Target ${wt} — syllabus-specific pick for ${exam ?? "your exam"}.`;
      }
    }

    const examBoost = examResourceBoost(exam, resource);
    score += examBoost.score;
    if (examBoost.label && weakMatch) label = examBoost.label;
    if (examBoost.reason && weakMatch) reason = examBoost.reason;

    if (resource.recommended) score += 6;
    if (exam && resource.tags.some((t) => t.toLowerCase().includes(exam.toLowerCase()))) score += 3;

    if (score > 0 || resource.recommended) {
      scored.push({ resource, score: score + (resource.recommended ? 2 : 0), label, reason });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  if (top.length === 0) {
    return resources
      .filter((r) => r.recommended || r.featured)
      .slice(0, 3)
      .map((resource, i) => ({
        id: `rec-fallback-${i}`,
        resourceId: resource.id,
        label: "Suggested for You" as RecommendationLabel,
        reason: "Top-rated material picked for your preparation journey.",
        resource: { ...resource, weakTopicRelated: false },
      }));
  }

  return top.map(({ resource, label, reason }, i) => ({
    id: `rec-${resource.id}-${i}`,
    resourceId: resource.id,
    label,
    reason,
    resource: {
      ...resource,
      weakTopicRelated: weakSubjects.some((ws) => weakSubjectMatchesResource(ws, resource)),
    },
  }));
}

export function countBySubject(resources: Resource[]): Record<ResourceSubject, number> {
  const counts: Record<ResourceSubject, number> = {
    Physics: 0,
    Chemistry: 0,
    Mathematics: 0,
    Biology: 0,
    Others: 0,
  };
  for (const r of resources) counts[r.subject] += 1;
  return counts;
}

export async function fetchResourcesViaAgent(params: {
  search?: string;
  subject?: string;
  weakSubjects?: string[];
}): Promise<Resource[]> {
  let resources = await getAllResources();
  if (params.subject) {
    resources = resources.filter(
      (r) => r.subject.toLowerCase() === params.subject!.toLowerCase(),
    );
  }
  if (params.search) {
    resources = searchResources(resources, params.search);
  }
  return resources;
}
