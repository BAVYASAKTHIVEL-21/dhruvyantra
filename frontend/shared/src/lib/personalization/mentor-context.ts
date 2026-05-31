import type { ProfileMe } from "@/lib/profile/me-types";
import { buildMentorContext } from "@/lib/personalization/dashboard";
import type { DailyPlan } from "@/types/planner";
import type { Recommendation, Resource } from "@/types/resource";

export type MentorAgentContext = ReturnType<typeof buildMentorContext> & {
  studentName: string;
  targetRank: string | null;
  plannerSummary: {
    totalTasks: number;
    completedTasks: number;
    pendingTitles: string[];
  } | null;
  topRecommendations: { title: string; label: string; reason: string }[];
};

export function buildMentorAgentContext(
  profile: ProfileMe,
  plan: DailyPlan | null,
  recommendations: (Recommendation & { resource: Resource })[] = [],
): MentorAgentContext {
  return {
    ...buildMentorContext(profile),
    studentName: profile.name,
    targetRank: profile.targetRank,
    plannerSummary: plan
      ? {
          totalTasks: plan.totalTasks,
          completedTasks: plan.completedCount,
          pendingTitles: plan.pendingTasks.slice(0, 5).map((t) => t.title),
        }
      : null,
    topRecommendations: recommendations.slice(0, 3).map((r) => ({
      title: r.resource.title,
      label: r.label,
      reason: r.reason,
    })),
  };
}

/** Serialize for future LLM / Coral MCP mentor workflows */
export function serializeMentorContext(ctx: MentorAgentContext): string {
  return JSON.stringify(ctx, null, 2);
}
