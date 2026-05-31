import { EXAM_CONFIG } from "@/config/exam-config";
import { productiveHoursLabel } from "@/lib/mentor/insights";
import type {
  MentorFocusRecommendation,
  MentorIntelligenceContext,
  MentorPlannerRecommendation,
} from "@/types/mentor";

export function buildPlannerRecommendations(
  ctx: MentorIntelligenceContext,
): MentorPlannerRecommendation[] {
  const recs: MentorPlannerRecommendation[] = [];
  const exam = ctx.examType;

  for (const task of ctx.planner.todayPending.slice(0, 3)) {
    recs.push({
      taskTitle: task.title,
      subject: task.subject,
      topic: task.topic,
      reason: "Scheduled in today's planner and still pending.",
      priority: "high",
    });
  }

  const topWeak = ctx.weakness.topWeakTopics[0];
  if (topWeak && !recs.some((r) => r.topic === topWeak.topic)) {
    const title =
      exam === "JEE"
        ? `Advanced PYQs: ${topWeak.topic}`
        : exam === "NEET"
          ? topWeak.subject === "Biology"
            ? `NCERT diagrams: ${topWeak.topic}`
            : `NCERT revision: ${topWeak.topic}`
          : `Revise: ${topWeak.topic}`;
    recs.push({
      taskTitle: title,
      subject: topWeak.subject,
      topic: topWeak.topic,
      reason: `Weak topic (mastery ${topWeak.masteryScore}/100, ${topWeak.missedTasks} missed).`,
      priority: "high",
    });
  }

  for (const missed of ctx.planner.recentMissed.slice(0, 2)) {
    if (recs.some((r) => r.taskTitle === missed.title)) continue;
    recs.push({
      taskTitle: missed.title,
      subject: missed.subject,
      topic: missed.topic,
      reason: `Missed on ${missed.date} — recovery item.`,
      priority: "medium",
    });
  }

  const mockPending = ctx.planner.todayPending.find(
    (t) =>
      t.subject === "Full Length Test" || t.title.toLowerCase().includes("mock"),
  );
  if (mockPending) {
    recs.unshift({
      taskTitle: mockPending.title,
      subject: mockPending.subject,
      topic: mockPending.topic,
      reason: "Mock scheduled today — prioritize analysis after attempt.",
      priority: "high",
    });
  }

  return recs.slice(0, 4);
}

export function buildFocusRecommendations(
  ctx: MentorIntelligenceContext,
): MentorFocusRecommendation[] {
  const recs: MentorFocusRecommendation[] = [];
  const exam = ctx.examType;
  const window = productiveHoursLabel(ctx.productiveTime);
  const goalMinutes = Math.min(Math.max(ctx.dailyStudyHours * 15, 30), 60);

  const topWeak = ctx.weakness.topWeakTopics[0];
  if (topWeak) {
    const duration =
      exam === "JEE" ? Math.max(goalMinutes, 45) : exam === "NEET" ? Math.max(goalMinutes, 35) : goalMinutes;
    const reason =
      exam === "JEE"
        ? `Timed numerical/PYQ block for weak **${topWeak.topic}**.`
        : exam === "NEET" && topWeak.subject === "Biology"
          ? `Diagram + NCERT recall for **${topWeak.topic}**.`
          : `Concept + recall block for **${topWeak.topic}**.`;
    recs.push({
      subject: topWeak.subject,
      topic: topWeak.topic,
      durationMinutes: duration,
      reason,
      suggestedWindow: window,
    });
  }

  const weakSubject = ctx.weakSubjects[0] ?? (exam ? EXAM_CONFIG[exam].subjects[0] : "Physics");
  if (!recs.some((r) => r.subject === weakSubject)) {
    recs.push({
      subject: weakSubject,
      topic: ctx.weakTopics[0] ?? "General revision",
      durationMinutes: goalMinutes,
      reason: `Cover weak subject **${weakSubject}** before lower-priority tasks.`,
      suggestedWindow: window,
    });
  }

  if (!ctx.focus.studiedToday) {
    recs.unshift({
      subject: recs[0]?.subject ?? weakSubject,
      topic: recs[0]?.topic ?? "Daily focus",
      durationMinutes: 45,
      reason: "No focus logged today — start here to protect your streak.",
      suggestedWindow: window,
    });
  }

  if (ctx.focus.weeklyMinutes < ctx.dailyStudyHours * 60 * 3) {
    recs.push({
      subject: weakSubject,
      topic: "Consistency catch-up",
      durationMinutes: 30,
      reason: `Weekly focus (${ctx.focus.weeklyMinutes}m) is below your ${ctx.dailyStudyHours}h/day goal.`,
      suggestedWindow: window,
    });
  }

  return recs.slice(0, 3);
}

export function buildStudyAdvice(
  ctx: MentorIntelligenceContext,
  primarySignal: string,
): string[] {
  const advice: string[] = [primarySignal];
  const exam = ctx.examType;

  if (ctx.planner.todayTotal > 0) {
    const remaining = ctx.planner.todayTotal - ctx.planner.todayCompleted;
    if (remaining > 0) {
      advice.push(
        `Finish **${remaining}** of **${ctx.planner.todayTotal}** planner tasks today (${ctx.planner.weekCompletionRate}% weekly completion).`,
      );
    }
  }

  if (exam === "JEE" && ctx.weakness.topWeakTopics[0]) {
    const w = ctx.weakness.topWeakTopics[0];
    advice.push(
      `JEE priority: **${w.topic}** — ${w.focusSessions} focus sessions logged; push timed Advanced PYQs.`,
    );
  } else if (exam === "NEET" && ctx.weakness.topWeakTopics[0]) {
    const w = ctx.weakness.topWeakTopics[0];
    advice.push(
      `NEET priority: **${w.topic}** — NCERT line-by-line + diagrams (${w.masteryScore}/100 mastery).`,
    );
  }

  if (ctx.focus.streakCurrent > 0) {
    advice.push(`Protect your **${ctx.focus.streakCurrent}-day** focus streak with one session in ${productiveHoursLabel(ctx.productiveTime)}.`);
  }

  return advice.slice(0, 4);
}

export function buildRecoverySuggestions(ctx: MentorIntelligenceContext): string[] {
  const recovery: string[] = [];

  if (ctx.focus.streakCurrent === 0 && ctx.focus.streakLongest >= 2) {
    recovery.push(
      `Restart streak: 45m focus on **${ctx.weakness.topWeakTopics[0]?.topic ?? ctx.weakSubjects[0] ?? "weakest topic"}** before scrolling planner.`,
    );
  }

  for (const missed of ctx.planner.recentMissed.slice(0, 2)) {
    recovery.push(`Recover missed task: **${missed.title}** (${missed.subject}, ${missed.date}).`);
  }

  for (const row of ctx.planner.missedBySubject.filter((r) => r.missedCount >= 2)) {
    if (ctx.examType === "NEET" && row.subject === "Biology") {
      recovery.push("Biology gap: 25m NCERT diagram sprint + label-the-diagram recall.");
    } else if (ctx.examType === "JEE") {
      recovery.push(`${row.subject} gap: 20 timed PYQs + error log before next mock.`);
    }
  }

  if (ctx.focus.weeklyMinutes < ctx.focus.prevWeekMinutes * 0.7 && ctx.focus.prevWeekMinutes > 0) {
    recovery.push(
      `Focus volume dropped (${ctx.focus.weeklyMinutes}m vs ${ctx.focus.prevWeekMinutes}m last week) — schedule two 30m blocks this week.`,
    );
  }

  if (recovery.length === 0 && ctx.planner.weekCompletionRate < 60) {
    recovery.push("Planner completion is low — complete the smallest pending task first to rebuild momentum.");
  }

  return recovery.slice(0, 3);
}
