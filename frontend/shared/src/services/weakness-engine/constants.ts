/** Scoring weights for the weakness engine (0–100 mastery scale). */
export const WEAKNESS_SCORING = {
  onboardingWeakBaseline: 32,
  onboardingSubjectBaseline: 48,
  discoveredBaseline: 42,
  completedTaskGain: 6,
  missedTaskLoss: 9,
  focusSessionGain: 5,
  focusMinuteScale: 30,
  maxFocusGainPerSession: 8,
  mockIncorrectLoss: 7,
  mockSkippedLoss: 5,
  mockCorrectGain: 4,
  mockLowAccuracyPenalty: 12,
  mockLowAccuracyThreshold: 55,
  minScore: 0,
  maxScore: 100,
} as const;

export const WEAKNESS_DEFAULT_WINDOW_DAYS = 90;
export const WEAKNESS_TOP_TOPIC_LIMIT = 8;
export const WEAKNESS_ANALYTICS_LIMIT = 4;
/** Focus blocks shorter than this do not affect mastery. */
export const WEAKNESS_MIN_FOCUS_SECONDS = 600;
