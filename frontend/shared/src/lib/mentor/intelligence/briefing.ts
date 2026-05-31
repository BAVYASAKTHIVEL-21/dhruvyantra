import type { MentorIntelligenceBriefing, MentorIntelligenceContext } from "@/types/mentor";
import {
  buildFocusRecommendations,
  buildPlannerRecommendations,
  buildRecoverySuggestions,
  buildStudyAdvice,
} from "./recommendations";
import { detectMentorSignals, pickPrimarySignal } from "./signals";

export function buildMentorBriefing(ctx: MentorIntelligenceContext): MentorIntelligenceBriefing {
  const signals = detectMentorSignals(ctx);
  const primarySignal = pickPrimarySignal(signals);
  const plannerRecommendations = buildPlannerRecommendations(ctx);
  const focusRecommendations = buildFocusRecommendations(ctx);
  const studyAdvice = buildStudyAdvice(ctx, primarySignal);
  const recoverySuggestions = buildRecoverySuggestions(ctx);

  const anchorFacts = [
    ctx.examType ? `${ctx.examType} aspirant · target ${ctx.targetYear ?? "—"}` : "Onboarding incomplete",
    `Planner: ${ctx.planner.todayCompleted}/${ctx.planner.todayTotal} today · ${ctx.planner.weekCompletionRate}% this week`,
    `Focus: ${ctx.focus.streakCurrent}-day streak · ${ctx.focus.weeklyMinutes}m this week · studied today: ${ctx.focus.studiedToday ? "yes" : "no"}`,
    ctx.weakness.topWeakTopics[0]
      ? `Top weak: ${ctx.weakness.topWeakTopics[0].topic} (${ctx.weakness.topWeakTopics[0].subject}, ${ctx.weakness.topWeakTopics[0].masteryScore}/100)`
      : `Weak topics: ${ctx.weakTopics.slice(0, 3).join(", ") || "—"}`,
    ...signals.slice(0, 2).map((s) => s.message.replace(/\*\*/g, "")),
  ];

  return {
    primarySignal,
    studyAdvice,
    recoverySuggestions,
    plannerRecommendations,
    focusRecommendations,
    anchorFacts,
  };
}

export function formatBriefingForPrompt(briefing: MentorIntelligenceBriefing): string {
  const plannerLines =
    briefing.plannerRecommendations.length > 0
      ? briefing.plannerRecommendations
          .map(
            (r, i) =>
              `${i + 1}. [${r.priority}] ${r.taskTitle} (${r.subject}) — ${r.reason}`,
          )
          .join("\n")
      : "None — suggest adding tasks to planner.";

  const focusLines =
    briefing.focusRecommendations.length > 0
      ? briefing.focusRecommendations
          .map(
            (r, i) =>
              `${i + 1}. ${r.durationMinutes}m · ${r.subject} · ${r.topic} · ${r.suggestedWindow} — ${r.reason}`,
          )
          .join("\n")
      : "None.";

  return [
    `PRIMARY SIGNAL (lead with this when relevant):\n${briefing.primarySignal}`,
    "",
    "STUDY ADVICE (use 1–2 in replies):",
    briefing.studyAdvice.map((a) => `- ${a}`).join("\n"),
    "",
    "RECOVERY SUGGESTIONS (offer when student is stuck or demotivated):",
    briefing.recoverySuggestions.length > 0
      ? briefing.recoverySuggestions.map((r) => `- ${r}`).join("\n")
      : "- On track — reinforce consistency.",
    "",
    "PLANNER TASK RECOMMENDATIONS (cite specific titles):",
    plannerLines,
    "",
    "FOCUS SESSION RECOMMENDATIONS (subject, duration, window):",
    focusLines,
    "",
    "ANCHOR FACTS (must reference at least TWO in every reply):",
    briefing.anchorFacts.map((f) => `- ${f}`).join("\n"),
  ].join("\n");
}
