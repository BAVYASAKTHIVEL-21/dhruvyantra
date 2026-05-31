import { EXAM_CONFIG } from "@/config/exam-config";
import type { OpenRouterMessage } from "@/lib/llm/openrouter";
import { productiveHoursLabel } from "@/lib/mentor/insights";
import { buildMentorBriefing, formatBriefingForPrompt } from "@/lib/mentor/intelligence";
import type { MentorChatTurn, MentorIntelligenceContext, MentorMode } from "@/types/mentor";

const MODE_GUIDANCE: Record<MentorMode, string> = {
  study:
    "Give personalized study advice tied to today's planner tasks, weak topics, and focus streak. Recommend specific planner tasks and focus blocks from the briefing.",
  concept:
    "Explain concepts with exam-specific depth. Tie explanations to the student's weak topics and recent missed planner tasks when relevant.",
  strategy:
    "Recommend exam strategy using real completion rates, weak-topic trends, and productive window. Prioritize syllabus gaps from the briefing.",
  motivation:
    "Provide streak-aware motivation and concrete recovery suggestions from the briefing — never generic pep talk alone.",
};

const MODE_OUTPUT: Record<MentorMode, string> = {
  study: "Include at least one planner task recommendation and one focus session recommendation when advising.",
  concept: "End with one micro-practice action (PYQ for JEE, NCERT/diagram for NEET) tied to a weak topic.",
  strategy: "Reference weekly completion % and which subject/topic to deprioritize vs double down on.",
  motivation: "Acknowledge streak or missed tasks, then give one recovery step from RECOVERY SUGGESTIONS.",
};

function formatContext(ctx: MentorIntelligenceContext): string {
  const examLine = ctx.examType
    ? `${ctx.examType} · ${EXAM_CONFIG[ctx.examType].mentorStyle}`
    : "Complete onboarding to unlock exam-specific mentoring.";

  const weakTopics =
    ctx.weakness.topWeakTopics.length > 0
      ? ctx.weakness.topWeakTopics
          .map(
            (t) =>
              `${t.topic} (${t.subject}, mastery ${t.masteryScore}/100, completed ${t.completedTasks}, missed ${t.missedTasks}, focus sessions ${t.focusSessions})`,
          )
          .join("\n")
      : ctx.weakTopics.join(", ") || "None selected";

  const topicTrends =
    ctx.weakness.topicTrends.length > 0
      ? ctx.weakness.topicTrends
          .map(
            (t) =>
              `${t.topic}: ${t.weekCompleted} done / ${t.weekMissed} missed this week · focus ${t.weekFocusMinutes}m (prev ${t.prevWeekFocusMinutes}m)`,
          )
          .join("\n")
      : "No weekly topic trend data.";

  const pending =
    ctx.planner.todayPending.length > 0
      ? ctx.planner.todayPending.map((t) => `${t.title} (${t.subject})`).join("; ")
      : "No pending tasks scheduled today.";

  const missed =
    ctx.planner.recentMissed.length > 0
      ? ctx.planner.recentMissed.map((t) => `${t.title} (${t.date})`).join("; ")
      : "None recently.";

  const subjectSkips =
    ctx.planner.missedBySubject.length > 0
      ? ctx.planner.missedBySubject.map((r) => `${r.subject}: ${r.missedCount} missed`).join("; ")
      : "None this week.";

  const focusSessions =
    ctx.focus.recentSessions.length > 0
      ? ctx.focus.recentSessions
          .map((s) => `${s.topic} · ${s.subject} · ${s.minutes}m · ${s.date}`)
          .join("; ")
      : "No recent focus sessions.";

  const latestMock = ctx.latestMock
    ? `Latest mock "${ctx.latestMock.title}" · ${ctx.latestMock.overallAccuracy}% overall · weak: ${ctx.latestMock.weakTopics.map((t) => `${t.topic} (${t.accuracy}%)`).join(", ") || "—"}`
    : "No mock submissions yet.";

  return [
    `Student: ${ctx.studentName}`,
    `Exam: ${ctx.examType ?? "Not set"} (${examLine})`,
    `Target year: ${ctx.targetYear ?? "—"}`,
    `Weak subjects: ${ctx.weakSubjects.join(", ") || "—"}`,
    `Evolved weak topics:\n${weakTopics}`,
    `Weekly topic trends:\n${topicTrends}`,
    `Daily study goal: ${ctx.dailyStudyHours}h · productive window: ${productiveHoursLabel(ctx.productiveTime)}`,
    `Planner today: ${ctx.planner.todayCompleted}/${ctx.planner.todayTotal} completed · ${ctx.planner.weekCompletionRate}% weekly completion`,
    `Pending today: ${pending}`,
    `Missed by subject (this week): ${subjectSkips}`,
    `Recently missed tasks: ${missed}`,
    `Focus streak: ${ctx.focus.streakCurrent} days (longest ${ctx.focus.streakLongest}) · studied today: ${ctx.focus.studiedToday ? "yes" : "no"}`,
    `Focus this week: ${ctx.focus.weeklyMinutes}m (${ctx.focus.weeklySessions} sessions) · prev week: ${ctx.focus.prevWeekMinutes}m`,
    `Recent focus: ${focusSessions}`,
    `Latest mock: ${latestMock}`,
  ].join("\n");
}

export function buildMentorSystemPrompt(
  ctx: MentorIntelligenceContext,
  mode: MentorMode,
): string {
  const briefing = buildMentorBriefing(ctx);
  const exam = ctx.examType;

  const examTone =
    exam === "JEE"
      ? 'JEE voice: timed PYQs, numerical drills, Advanced problem sets. Example: "Your Mechanics consistency dropped this week. Attempt PYQs tonight."'
      : exam === "NEET"
        ? 'NEET voice: NCERT lines, diagrams, rapid recall. Example: "You skipped Biology revision twice. Revise NCERT diagrams today."'
        : "Guide the student to complete onboarding before exam-specific advice.";

  return [
    "You are DhruvYantra AI Mentor — a concise, warm, exam-aware study coach for Indian JEE/NEET aspirants.",
    MODE_GUIDANCE[mode],
    MODE_OUTPUT[mode],
    examTone,
    "",
    "ANTI-GENERIC RULES (mandatory):",
    "- Every reply MUST cite at least TWO facts from ANCHOR FACTS or STUDENT CONTEXT.",
    "- Prefer briefing lines (PRIMARY SIGNAL, planner/focus recommendations) over inventing advice.",
    "- Name real topics, tasks, subjects, streak counts, and completion percentages.",
    "- Never say 'stay consistent' or 'keep working hard' without a specific next action.",
    "- Never invent scores, tasks, or topics not in context.",
    "- Use **bold** for key topics and actions (markdown).",
    "- Keep replies under 180 words unless the student asks for a detailed plan.",
    "- If onboarding is incomplete, guide them to finish setup.",
    "",
    "PRE-COMPUTED MENTOR BRIEFING:",
    formatBriefingForPrompt(briefing),
    "",
    "RAW STUDENT CONTEXT:",
    formatContext(ctx),
  ].join("\n");
}

export function buildMentorMessages(
  ctx: MentorIntelligenceContext,
  mode: MentorMode,
  history: MentorChatTurn[],
  userMessage?: string,
  intent: "chat" | "welcome" = "chat",
): OpenRouterMessage[] {
  const system = buildMentorSystemPrompt(ctx, mode);
  const messages: OpenRouterMessage[] = [{ role: "system", content: system }];
  const briefing = buildMentorBriefing(ctx);

  for (const turn of history.slice(-10)) {
    messages.push({
      role: turn.role === "user" ? "user" : "assistant",
      content: turn.content,
    });
  }

  if (intent === "welcome") {
    messages.push({
      role: "user",
      content: [
        "Generate an opening mentor message for this student.",
        `Greet ${ctx.studentName} by first name.`,
        `Lead with the PRIMARY SIGNAL: ${briefing.primarySignal}`,
        "Mention one planner recommendation and one focus recommendation if available.",
        "Ask one focused question to start the conversation.",
        "Do not use generic motivational filler.",
      ].join(" "),
    });
  } else if (userMessage?.trim()) {
    messages.push({ role: "user", content: userMessage.trim() });
  }

  return messages;
}
