import type { ExamType } from "@/config/exam-config";
import { buildResourceHrefFromMockRecommendation } from "@/lib/mission-control/navigation";
import type { MockResourceRecommendation, MockSubmissionRecord } from "@/types/mock-results";
import type { Recommendation, Resource } from "@/types/resource";

export type MockRecoveryResourceView = MockResourceRecommendation & {
  href: string;
};

export function enrichMockResourceRecommendations(
  recommendations: MockResourceRecommendation[],
  examType: ExamType | null,
): MockRecoveryResourceView[] {
  return recommendations.map((rec) => ({
    ...rec,
    href: buildResourceHrefFromMockRecommendation({ ...rec, examType }),
  }));
}

export function recoveryResourcesFromSubmission(
  submission: MockSubmissionRecord | null,
): MockRecoveryResourceView[] {
  if (!submission?.resourceRecommendations.length) return [];
  return enrichMockResourceRecommendations(
    submission.resourceRecommendations,
    submission.examType,
  );
}

/** Prioritize resources tied to the latest mock in the general recommendations list. */
export function mergeMockIntoResourceRecommendations(
  recommendations: (Recommendation & { resource: Resource })[],
  submission: MockSubmissionRecord | null,
  limit = 8,
): (Recommendation & { resource: Resource })[] {
  if (!submission?.resourceRecommendations.length) return recommendations;

  const mockRecs = submission.resourceRecommendations;
  const byId = new Map(recommendations.map((r) => [r.resourceId, r]));
  const boosted: (Recommendation & { resource: Resource })[] = [];

  for (const [i, mockRec] of mockRecs.entries()) {
    const existing = byId.get(mockRec.resourceId);
    if (existing) {
      boosted.push({
        ...existing,
        label: "Weak Topic",
        reason: mockRec.reason.replace(/\*\*/g, ""),
      });
      byId.delete(mockRec.resourceId);
      continue;
    }
    boosted.push({
      id: `mock-rec-${mockRec.resourceId}-${i}`,
      resourceId: mockRec.resourceId,
      label: "Weak Topic",
      reason: mockRec.reason.replace(/\*\*/g, ""),
      resource: {
        id: mockRec.resourceId,
        title: mockRec.title,
        subject: mockRec.subject as Resource["subject"],
        topic: mockRec.topic,
        type: mockRec.type as Resource["type"],
        difficulty: "Medium",
        tags: [],
        recommended: true,
        thumbnail: "purple",
        rating: 4.5,
        reviewCount: 0,
        featured: false,
        weakTopicRelated: true,
        source: "notion",
      },
    });
  }

  const rest = [...byId.values()];
  return [...boosted, ...rest].slice(0, limit);
}
