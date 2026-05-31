import type { ExamType } from "@/config/exam-config";
import type { MentorIntelligenceContext } from "@/types/mentor";

export type MentorSignal = {
  id: string;
  severity: "critical" | "warning" | "positive";
  message: string;
  subject?: string;
  topic?: string;
};

function examAction(exam: ExamType | null, topic: string, subject: string): string {
  if (exam === "JEE") {
    return `Attempt Advanced PYQs on **${topic}** tonight during your productive window.`;
  }
  if (exam === "NEET") {
    if (subject === "Biology") {
      return `Revise **NCERT diagrams** for **${topic}** today.`;
    }
    return `Revise **NCERT** for **${topic}** and run rapid recall today.`;
  }
  return `Block time for **${topic}** revision today.`;
}

export function detectMentorSignals(ctx: MentorIntelligenceContext): MentorSignal[] {
  const signals: MentorSignal[] = [];
  const exam = ctx.examType;

  if (ctx.latestMock?.weakTopics[0]) {
    const mockWeak = ctx.latestMock.weakTopics[0];
    const msg =
      exam === "JEE"
        ? `Latest mock: **${mockWeak.topic}** at **${mockWeak.accuracy}%**. Attempt PYQs tonight.`
        : `Latest mock: **${mockWeak.topic}** accuracy **${mockWeak.accuracy}%**. Revise NCERT diagrams today.`;
    signals.push({
      id: `mock-${mockWeak.topic}`,
      severity: mockWeak.accuracy <= 45 ? "critical" : "warning",
      message: msg,
      subject: mockWeak.subject,
      topic: mockWeak.topic,
    });
  }

  for (const trend of ctx.weakness.topicTrends) {
    const focusDropped =
      trend.prevWeekFocusMinutes > 0 &&
      trend.weekFocusMinutes < trend.prevWeekFocusMinutes * 0.6;
    const missedSpike = trend.weekMissed >= 2 && trend.weekMissed > trend.weekCompleted;

    if (focusDropped || missedSpike) {
      const label =
        exam === "JEE"
          ? `Your **${trend.topic}** consistency dropped this week. ${examAction(exam, trend.topic, trend.subject)}`
          : `Your **${trend.topic}** revision slipped this week. ${examAction(exam, trend.topic, trend.subject)}`;
      signals.push({
        id: `decline-${trend.topic}`,
        severity: "critical",
        message: label,
        subject: trend.subject,
        topic: trend.topic,
      });
    }
  }

  for (const row of ctx.planner.missedBySubject) {
    if (row.missedCount >= 2) {
      const msg =
        exam === "NEET" && row.subject === "Biology"
          ? `You skipped **Biology** revision ${row.missedCount} times this week. Revise **NCERT diagrams** today.`
          : exam === "JEE"
            ? `You missed **${row.missedCount}** ${row.subject} planner tasks this week. Run timed PYQs tonight.`
            : `You skipped **${row.subject}** revision ${row.missedCount} times this week. Catch up in today's planner.`;
      signals.push({
        id: `skip-${row.subject}`,
        severity: "warning",
        message: msg,
        subject: row.subject,
      });
    }
  }

  const topWeak = ctx.weakness.topWeakTopics[0];
  if (topWeak && topWeak.missedTasks > topWeak.completedTasks && !signals.some((s) => s.topic === topWeak.topic)) {
    signals.push({
      id: `weak-${topWeak.topic}`,
      severity: "warning",
      message: examAction(exam, topWeak.topic, topWeak.subject),
      subject: topWeak.subject,
      topic: topWeak.topic,
    });
  }

  if (ctx.focus.streakCurrent === 0 && ctx.focus.streakLongest >= 3) {
    signals.push({
      id: "streak-broken",
      severity: "critical",
      message: `Your **${ctx.focus.streakLongest}-day** focus streak broke. Start a **45-minute** recovery session today.`,
    });
  } else if (!ctx.focus.studiedToday && ctx.planner.todayCompleted < ctx.planner.todayTotal) {
    signals.push({
      id: "no-focus-today",
      severity: "warning",
      message: "No focus session logged today — lock a block before pending planner tasks pile up.",
    });
  }

  if (ctx.planner.weekCompletionRate >= 75 && ctx.focus.weeklySessions >= 4) {
    signals.push({
      id: "momentum",
      severity: "positive",
      message: `Strong week: **${ctx.planner.weekCompletionRate}%** planner completion and **${ctx.focus.weeklySessions}** focus sessions.`,
    });
  }

  if (ctx.focus.prevWeekMinutes > 0 && ctx.focus.weeklyMinutes > ctx.focus.prevWeekMinutes * 1.15) {
    signals.push({
      id: "focus-up",
      severity: "positive",
      message: `Focus time is up vs last week (**${ctx.focus.weeklyMinutes}m** this week).`,
    });
  }

  return signals;
}

export function pickPrimarySignal(signals: MentorSignal[]): string {
  const critical = signals.find((s) => s.severity === "critical");
  if (critical) return critical.message;
  const warning = signals.find((s) => s.severity === "warning");
  if (warning) return warning.message;
  const positive = signals.find((s) => s.severity === "positive");
  if (positive) return positive.message;
  return "Stay aligned with today's planner and your weakest syllabus areas.";
}
