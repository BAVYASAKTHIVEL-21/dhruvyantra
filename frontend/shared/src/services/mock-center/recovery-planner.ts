import type { ExamType } from "@/config/exam-config";
import { isoDate } from "@/lib/mission-control/dates";
import type { UserProfile } from "@/lib/profile/types";
import type { MockAnalysisResult, MockResourceRecommendation } from "@/types/mock-results";
import type { StudyTask, TaskPriority } from "@/types/planner";

function recoveryTitle(exam: ExamType | null, topic: string, subject: string): string {
  if (exam === "JEE") return `${topic} PYQ Recovery Session`;
  if (exam === "NEET" && subject === "Biology") return `${topic} NCERT Diagram Recovery`;
  if (exam === "NEET") return `${topic} NCERT Recovery Session`;
  return `${topic} Recovery Session`;
}

function recoveryDuration(exam: ExamType | null, accuracy: number): number {
  if (accuracy <= 35) return exam === "JEE" ? 60 : 45;
  if (accuracy <= 50) return exam === "JEE" ? 50 : 40;
  return exam === "JEE" ? 45 : 35;
}

function recoveryPriority(accuracy: number): TaskPriority {
  if (accuracy <= 40) return "High";
  if (accuracy <= 55) return "High";
  return "Medium";
}

function resourceIdsForTopic(
  topic: string,
  recommendations: MockResourceRecommendation[],
): string[] {
  return recommendations.filter((r) => r.topic === topic).map((r) => r.resourceId);
}

/**
 * Build recovery planner tasks from mock weak-topic analysis.
 * Example: low Mechanics → "Mechanics PYQ Recovery Session"
 */
export function buildRecoveryPlannerTasks(
  profile: UserProfile,
  analysis: MockAnalysisResult,
  resourceRecommendations: MockResourceRecommendation[],
  date?: string,
): StudyTask[] {
  const planDate = date ?? isoDate();
  const exam = profile.examType;

  return analysis.weakTopics.slice(0, 3).map((weak, index) => {
    const title = recoveryTitle(exam, weak.topic, weak.subject);
    const resourceIds = resourceIdsForTopic(weak.topic, resourceRecommendations);

    return {
      id: `recovery-${planDate}-${index}-${weak.topic.replace(/\s+/g, "-").toLowerCase()}`,
      studentId: profile.userId,
      title,
      subject: weak.subject,
      topic: weak.topic,
      priority: recoveryPriority(weak.accuracy),
      date: planDate,
      duration: recoveryDuration(exam, weak.accuracy),
      status: "Pending",
      aiGenerated: true,
      recommendedResourceIds: resourceIds.slice(0, 3),
      createdAt: new Date().toISOString(),
    };
  });
}

export function buildMockAnalysisSummary(
  analysis: MockAnalysisResult,
  exam: ExamType | null,
): string {
  const weak = analysis.weakTopics[0];
  if (!weak) {
    return `Mock completed at **${analysis.overallAccuracy}%** overall accuracy.`;
  }
  if (exam === "JEE") {
    return `Your **${weak.topic}** score dropped to **${weak.accuracy}%**. Attempt PYQs tonight.`;
  }
  if (exam === "NEET" && weak.skipped >= 2) {
    return `You skipped **${weak.topic}** revision ${weak.skipped} times in the mock. Revise NCERT diagrams today.`;
  }
  return `Low **${weak.topic}** accuracy (**${weak.accuracy}%**). Schedule NCERT recovery today.`;
}
