import type { ExamType } from "@/config/exam-config";
import type { FocusAnalyticsSnapshot, FocusStreakSnapshot } from "@/types/focus";
import type { MentorIntelligenceContext } from "@/types/mentor";
import type { StudyTask } from "@/types/planner";

export type MentorRecommendedAction = {
  id: string;
  label: string;
  done: boolean;
};

export type MentorInsightsSnapshot = {
  focusLevel: number;
  focusLabel: string;
  focusTrend: number[];
  bestHours: string;
  weeklyAccuracy: number;
  weeklyTrend: number[];
  consistencyScore: number;
  consistencyLabel: string;
  recommendedActions: MentorRecommendedAction[];
  motivation: { quote: string; action: string };
  focusStreak: {
    current: number;
    longest: number;
    weekDays: { day: string; done: boolean }[];
  };
};

export function productiveHoursLabel(productiveTime: string | null | undefined): string {
  if (productiveTime === "Morning") return "6:00 AM – 10:00 AM";
  if (productiveTime === "Night") return "9:00 PM – 1:00 AM";
  if (productiveTime === "Evening") return "5:00 PM – 9:00 PM";
  return "7:00 PM – 10:00 PM";
}

function consistencyLabel(score: number): string {
  if (score >= 85) return "Excellent!";
  if (score >= 70) return "Strong rhythm";
  if (score >= 50) return "Building habit";
  return "Needs attention";
}

function normalizeTrend(values: number[]): number[] {
  if (values.length === 0) return [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

function weeklyAccuracyFromTasks(tasks: StudyTask[], today: string, start: string): number {
  const week = tasks.filter((t) => t.date >= start && t.date <= today);
  if (week.length === 0) return 0;
  const completed = week.filter((t) => t.status === "Completed").length;
  return Math.round((completed / week.length) * 100);
}

function weeklyTrendFromTasks(tasks: StudyTask[], dates: string[]): number[] {
  return dates.map((date) => {
    const dayTasks = tasks.filter((t) => t.date === date);
    if (dayTasks.length === 0) return 0;
    return Math.round(
      (dayTasks.filter((t) => t.status === "Completed").length / dayTasks.length) * 100,
    );
  });
}

function buildRecommendedActions(
  ctx: MentorIntelligenceContext,
  todayTasks: StudyTask[],
  exam: ExamType | null,
): MentorRecommendedAction[] {
  const actions: MentorRecommendedAction[] = [];

  for (const task of todayTasks.slice(0, 3)) {
    actions.push({
      id: task.id,
      label: task.title,
      done: task.status === "Completed",
    });
  }

  const weak = ctx.weakness.topWeakTopics[0];
  if (weak) {
    const weakLabel =
      exam === "NEET"
        ? `NCERT revision: ${weak.topic}`
        : exam === "JEE"
          ? `Advanced PYQs: ${weak.topic}`
          : `Revise: ${weak.topic}`;
    actions.push({
      id: `weak-${weak.topic}`,
      label: weakLabel,
      done: weak.masteryScore >= 55 && weak.completedTasks > weak.missedTasks,
    });
  }

  if (exam === "JEE") {
    actions.push({
      id: "timed-numericals",
      label: `Timed numericals: ${ctx.weakSubjects[0] ?? "Physics"}`,
      done: ctx.focus.recentSessions.some(
        (s) => s.subject === (ctx.weakSubjects[0] ?? "Physics") && s.minutes >= 30,
      ),
    });
  } else if (exam === "NEET") {
    actions.push({
      id: "diagram-practice",
      label: `Diagram practice: ${ctx.weakSubjects[0] ?? "Biology"}`,
      done: ctx.focus.recentSessions.some((s) => s.subject === "Biology" && s.minutes >= 25),
    });
  }

  actions.push({
    id: "daily-consistency",
    label: `Maintain ${ctx.dailyStudyHours}+ hr consistency`,
    done:
      ctx.planner.todayTotal > 0 &&
      ctx.planner.todayCompleted >= Math.ceil(ctx.planner.todayTotal * 0.5),
  });

  const mockPending = todayTasks.some(
    (t) =>
      t.status !== "Completed" &&
      (t.subject === "Full Length Test" || t.title.toLowerCase().includes("mock")),
  );
  if (mockPending) {
    actions.push({
      id: "mock-analysis",
      label: "Full mock analysis",
      done: false,
    });
  }

  return actions.slice(0, 4);
}

function buildMotivation(
  ctx: MentorIntelligenceContext,
  focusLevel: number,
  weeklyAccuracy: number,
): { quote: string; action: string } {
  const exam = ctx.examType;
  const weak = ctx.weakness.topWeakTopics[0];
  const weakName = weak?.topic ?? ctx.weakTopics[0] ?? ctx.weakSubjects[0] ?? "your syllabus";

  if (!exam) {
    return {
      quote: "Complete onboarding so I can personalize insights to your exam journey.",
      action: "Finish setup to unlock AI mentor mode.",
    };
  }

  if (exam === "JEE") {
    if (weak && weak.completedTasks > weak.missedTasks && focusLevel >= 60) {
      return {
        quote: `Your **${weakName}** consistency improved. Advanced practice is paying off.`,
        action: "Attempt Advanced PYQs in your productive window tonight.",
      };
    }
    if (ctx.focus.streakCurrent === 0 && !ctx.focus.studiedToday) {
      return {
        quote: `Your focus streak reset — **${weakName}** needs a timed session today.`,
        action: "Block 45 minutes for numerical drills before your mock tasks.",
      };
    }
    return {
      quote: `Weekly task accuracy is **${weeklyAccuracy}%** — sharpen **${weakName}** with timed PYQs.`,
      action: "Let's push problem-solving speed together.",
    };
  }

  if (weak && ctx.focus.streakCurrent < ctx.focus.streakLongest && weeklyAccuracy < 70) {
    return {
      quote: `Your **${weakName}** revision streak dropped. NCERT gaps may be widening.`,
      action: "Revise NCERT diagrams and flash recall today.",
    };
  }

  return {
    quote: `Your NEET plan prioritizes **${weakName}** — diagram recall will give quick gains.`,
    action: "Let's build a rapid revision loop for today.",
  };
}

export function buildMentorInsights(input: {
  context: MentorIntelligenceContext;
  focusAnalytics: FocusAnalyticsSnapshot;
  focusStreak: FocusStreakSnapshot;
  todayTasks: StudyTask[];
  weekTasks: StudyTask[];
  weekDates: string[];
  today: string;
  weekStart: string;
}): MentorInsightsSnapshot {
  const { context, focusAnalytics, focusStreak, todayTasks, weekTasks, weekDates, today, weekStart } =
    input;
  const focusTrend = normalizeTrend(focusAnalytics.weeklyBars.map((b) => b.minutes));

  const weeklyAccuracy = weeklyAccuracyFromTasks(weekTasks, today, weekStart);
  const weeklyTrend = weeklyTrendFromTasks(weekTasks, weekDates);

  const focusConsistency = Math.round((context.focus.weeklySessions / 7) * 100);
  const plannerConsistency =
    context.planner.todayTotal > 0
      ? Math.round((context.planner.todayCompleted / context.planner.todayTotal) * 100)
      : weeklyAccuracy;
  const consistencyScore = Math.min(
    100,
    Math.round(focusConsistency * 0.45 + plannerConsistency * 0.35 + weeklyAccuracy * 0.2),
  );

  const streakDays = focusStreak.current;
  const weekDaysFromFocus = focusStreak.weekDays.map((d) => ({
    day: d.short,
    done: d.completed,
  }));

  return {
    focusLevel: focusAnalytics.focusScore,
    focusLabel: focusAnalytics.focusScoreLabel,
    focusTrend,
    bestHours: productiveHoursLabel(context.productiveTime),
    weeklyAccuracy,
    weeklyTrend: weeklyTrend.length > 0 ? weeklyTrend : focusTrend,
    consistencyScore,
    consistencyLabel: consistencyLabel(consistencyScore),
    recommendedActions: buildRecommendedActions(context, todayTasks, context.examType),
    motivation: buildMotivation(context, focusAnalytics.focusScore, weeklyAccuracy),
    focusStreak: {
      current: streakDays,
      longest: focusStreak.longest,
      weekDays: weekDaysFromFocus,
    },
  };
}

export function emptyMentorInsights(): MentorInsightsSnapshot {
  return {
    focusLevel: 0,
    focusLabel: "Start a session today",
    focusTrend: [0, 0, 0, 0, 0, 0, 0],
    bestHours: "7:00 PM – 10:00 PM",
    weeklyAccuracy: 0,
    weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
    consistencyScore: 0,
    consistencyLabel: "Building habit",
    recommendedActions: [],
    motivation: {
      quote: "Connect your study data to unlock personalized mentor insights.",
      action: "Complete a focus session or planner task today.",
    },
    focusStreak: { current: 0, longest: 0, weekDays: [] },
  };
}

export function sparklinePoints(values: number[], width = 100, height = 40): string {
  if (values.length === 0) return `0,${height}`;
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
      const y = height - (v / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
}
