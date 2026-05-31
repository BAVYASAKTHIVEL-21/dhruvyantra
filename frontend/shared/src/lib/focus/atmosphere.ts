import type { ExamType } from "@/config/exam-config";

export type FocusAtmosphereInput = {
  dailyStudyHours: number;
  productiveTime: string | null;
  examType: ExamType | null;
  topic: string;
  subject: string;
  todayFocusMinutes: number;
  sessionElapsedSeconds: number;
  secondsRemaining: number;
  running: boolean;
  cycle: number;
  totalCycles: number;
  studiedToday: boolean;
  currentStreak: number;
};

export type FocusAtmosphereSnapshot = {
  goalLabel: string;
  goalTarget: string;
  goalProgress: number;
  goalProgressLabel: string;
  energy: string;
  tip: string;
};

function formatGoalTarget(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

function goalLabelForProductiveTime(productiveTime: string | null): string {
  if (productiveTime === "Morning") return "Morning target";
  if (productiveTime === "Evening") return "Evening target";
  if (productiveTime === "Night") return "Tonight's target";
  return "Today's target";
}

function energyLabel(productiveTime: string | null): string {
  if (productiveTime === "Morning") return "Morning focus window";
  if (productiveTime === "Evening") return "Evening focus window";
  if (productiveTime === "Night") return "Peak focus window";
  return "Focus window";
}

export function computeFocusAtmosphere(input: FocusAtmosphereInput): FocusAtmosphereSnapshot {
  const goalMinutes = Math.max(30, Math.round(input.dailyStudyHours * 60));
  const goalLabel = goalLabelForProductiveTime(input.productiveTime);
  const goalTarget = formatGoalTarget(goalMinutes);

  const liveMinutes =
    input.todayFocusMinutes + Math.floor(input.sessionElapsedSeconds / 60);
  const goalProgress = Math.min(100, Math.round((liveMinutes / goalMinutes) * 100));
  const goalProgressLabel = `${goalProgress}% of ${goalLabel.toLowerCase()}`;

  const energy = energyLabel(input.productiveTime);

  let tip: string;
  if (input.running) {
    const minsLeft = Math.max(1, Math.ceil(input.secondsRemaining / 60));
    tip = `Stay in flow — ${minsLeft}m left on cycle ${input.cycle}/${input.totalCycles} for ${input.topic}.`;
  } else if (input.currentStreak === 0 && !input.studiedToday) {
    tip = `Start ${input.topic} now — one full session unlocks your focus streak.`;
  } else if (input.examType === "JEE") {
    tip = `Silence notifications and run timed PYQs on ${input.topic}.`;
  } else if (input.examType === "NEET") {
    tip = `NCERT-line revision on ${input.topic} — active recall without notes.`;
  } else {
    tip = `Deep work queued: ${input.subject} · ${input.topic}.`;
  }

  if (!input.running && input.studiedToday && goalProgress >= 100) {
    tip = `Daily focus goal hit — optional stretch on ${input.topic} if you have energy.`;
  } else if (!input.running && input.currentStreak >= 3 && !input.studiedToday) {
    tip = `Protect your ${input.currentStreak}-day streak — complete one ${input.topic} block today.`;
  }

  return {
    goalLabel,
    goalTarget,
    goalProgress,
    goalProgressLabel,
    energy,
    tip,
  };
}
