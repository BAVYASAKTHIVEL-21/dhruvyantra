import { EXAM_CONFIG, type ExamType } from "@/config/exam-config";
import { filterResourcesForExam } from "@/lib/resources/exam-filter";
import { getAllResources } from "@/lib/resources/notion";
import { topicMatchesText } from "@/services/weakness-engine/topic-resolution";
import type { MockAnalysisResult, MockResourceRecommendation } from "@/types/mock-results";
import type { Resource, ResourceType } from "@/types/resource";

const RECOVERY_RESOURCE_TYPES: Record<ExamType, ResourceType[]> = {
  JEE: ["PYQs", "DPPs", "Notes"],
  NEET: ["Notes", "PYQs", "DPPs"],
};

function syntheticRecoveryRec(
  weak: { topic: string; subject: string },
  examType: ExamType,
  type: ResourceType,
): MockResourceRecommendation {
  const label = type === "PYQs" ? "PYQ set" : type === "DPPs" ? "DPP" : "Notes";
  return {
    resourceId: `browse-${weak.topic}-${type}`.replace(/\s+/g, "-").toLowerCase(),
    title: `${weak.topic} ${label}`,
    type,
    subject: weak.subject,
    topic: weak.topic,
    reason:
      examType === "JEE"
        ? `Weak in **${weak.topic}** — open filtered ${type} in your library.`
        : `Low **${weak.topic}** accuracy — browse ${type} for NCERT recovery.`,
  };
}

function scoreResource(
  resource: Resource,
  topic: string,
  subject: string,
  exam: ExamType,
  preferredTypes: ResourceType[],
): number {
  let score = 0;
  const haystack = [resource.title, resource.topic, resource.subject, ...resource.tags].join(" ").toLowerCase();

  if (resource.subject.toLowerCase() === subject.toLowerCase()) score += 6;
  if (topicMatchesText(topic, haystack)) score += 10;
  if (preferredTypes.includes(resource.type)) score += 8;
  if (resource.recommended) score += 3;
  if (exam === "JEE" && (resource.type === "PYQs" || resource.type === "DPPs")) score += 4;
  if (exam === "NEET" && resource.type === "Notes" && subject === "Biology") score += 5;

  return score;
}

function reasonForResource(
  resource: Resource,
  topic: string,
  exam: ExamType,
): string {
  if (resource.type === "PYQs") {
    return exam === "JEE"
      ? `Weak in **${topic}** — timed Advanced PYQs for recovery.`
      : `Low accuracy on **${topic}** — practice PYQs for recall.`;
  }
  if (resource.type === "Notes") {
    return exam === "NEET"
      ? `Revise **${topic}** with NCERT-aligned notes.`
      : `Concept gap in **${topic}** — review notes before PYQs.`;
  }
  if (resource.type === "DPPs") {
    return `Daily practice set for **${topic}** recovery.`;
  }
  return `Suggested material for **${topic}** recovery.`;
}

export async function recommendRecoveryResources(
  analysis: MockAnalysisResult,
  examType: ExamType | null,
): Promise<MockResourceRecommendation[]> {
  if (!examType || analysis.weakTopics.length === 0) return [];

  const all = filterResourcesForExam(await getAllResources(), examType);
  const preferredTypes = RECOVERY_RESOURCE_TYPES[examType];
  const recs: MockResourceRecommendation[] = [];
  const usedIds = new Set<string>();

  for (const weak of analysis.weakTopics.slice(0, 3)) {
    const ranked = all
      .map((resource) => ({
        resource,
        score: scoreResource(resource, weak.topic, weak.subject, examType, preferredTypes),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score);

    const subjectFallback = all
      .filter(
        (r) =>
          r.subject.toLowerCase() === weak.subject.toLowerCase() &&
          preferredTypes.includes(r.type) &&
          !usedIds.has(r.id),
      )
      .sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));

    for (const type of preferredTypes) {
      const match =
        ranked.find((r) => r.resource.type === type && !usedIds.has(r.resource.id)) ??
        subjectFallback
          .filter((r) => r.type === type)
          .map((resource) => ({ resource, score: 1 }))
          .find((row) => !usedIds.has(row.resource.id));

      if (!match) continue;
      usedIds.add(match.resource.id);
      recs.push({
        resourceId: match.resource.id,
        title: match.resource.title,
        type: match.resource.type,
        subject: match.resource.subject,
        topic: weak.topic,
        reason: reasonForResource(match.resource, weak.topic, examType),
      });
      if (recs.length >= 6) return recs;
    }

    if (!recs.some((r) => r.topic === weak.topic)) {
      const type = preferredTypes[0];
      recs.push(syntheticRecoveryRec(weak, examType, type));
    }
  }

  return recs;
}

export function resourceIdsFromRecommendations(
  recommendations: MockResourceRecommendation[],
): string[] {
  return recommendations.map((r) => r.resourceId);
}
