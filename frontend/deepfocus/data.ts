export type FocusTab = "focus" | "pomodoro" | "flow";

export const FOCUS_TABS: { id: FocusTab; label: string }[] = [
  { id: "focus", label: "Focus Mode" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "flow", label: "Flow Mode" },
];

export const SESSION_DETAILS = {
  subject: "Physics — Rotational Motion",
  priority: "High Priority",
  target: "Complete Notes + 50 PYQs",
  estimated: "2h 30m",
  startTime: "7:00 PM",
};

export const INITIAL_TIMER_SECONDS = 1 * 3600 + 25 * 60; // 01:25:00

export type FocusModeConfig = {
  id: FocusTab;
  title: string;
  hint: string;
  workSeconds: number;
  breakSeconds?: number;
  totalCycles: number;
  useHours: boolean;
};

export const FOCUS_MODE_CONFIG: Record<FocusTab, FocusModeConfig> = {
  focus: {
    id: "focus",
    title: "Focus Mode",
    hint: "One long deep-work block — minimize context switching.",
    workSeconds: 1 * 3600 + 25 * 60,
    totalCycles: 4,
    useHours: true,
  },
  pomodoro: {
    id: "pomodoro",
    title: "Pomodoro",
    hint: "25 min focus → 5 min break. Repeat for 4 rounds.",
    workSeconds: 25 * 60,
    breakSeconds: 5 * 60,
    totalCycles: 4,
    useHours: false,
  },
  flow: {
    id: "flow",
    title: "Flow Mode",
    hint: "50 min flow blocks for PYQs & problem sets.",
    workSeconds: 50 * 60,
    totalCycles: 3,
    useHours: false,
  },
};

export type FocusTask = {
  id: string;
  title: string;
  duration: string;
  done: boolean;
};

export const FOCUS_QUEUE: FocusTask[] = [
  { id: "1", title: "Rotational Motion Notes", duration: "45m", done: true },
  { id: "2", title: "50 PYQs — Rotational Motion", duration: "50m", done: true },
  { id: "3", title: "DPP — Advanced Questions", duration: "40m", done: false },
  { id: "4", title: "Error Log Analysis", duration: "25m", done: false },
];

export type AmbientSound = {
  id: string;
  label: string;
  gradient: string;
};

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: "rain", label: "Night Rain", gradient: "from-[#1e3a5f] to-[#0f172a]" },
  { id: "lofi", label: "Lo-fi Beats", gradient: "from-[#4c1d95] to-[#1e1b4b]" },
  { id: "forest", label: "Forest", gradient: "from-[#14532d] to-[#052e16]" },
  { id: "ocean", label: "Ocean Waves", gradient: "from-[#0c4a6e] to-[#082f49]" },
  { id: "cafe", label: "Café Ambience", gradient: "from-[#78350f] to-[#451a03]" },
  { id: "noise", label: "White Noise", gradient: "from-[#374151] to-[#111827]" },
];

export const FOCUS_STATS = [
  { label: "Focus Time", value: "4h 35m", trend: "+28%", positive: true },
  { label: "Sessions", value: "3", trend: "+1", positive: true },
  { label: "Distractions Blocked", value: "47", trend: "+12", positive: true },
  { label: "Focus Score", value: "86/100", sub: "Great Focus!", positive: true },
];

export const WEEKLY_FOCUS_BARS = [
  { day: "Mon", minutes: 52, label: "52m" },
  { day: "Tue", minutes: 68, label: "1h 8m" },
  { day: "Wed", minutes: 58, label: "58m" },
  { day: "Thu", minutes: 85, label: "1h 25m" },
  { day: "Fri", minutes: 72, label: "1h 12m" },
  { day: "Sat", minutes: 95, label: "1h 35m", isToday: true },
  { day: "Sun", minutes: 45, label: "45m" },
];

export const WEEKLY_STREAK = [
  { day: "Mon", short: "M", completed: true },
  { day: "Tue", short: "T", completed: true },
  { day: "Wed", short: "W", completed: true },
  { day: "Thu", short: "T", completed: true },
  { day: "Fri", short: "F", completed: true },
  { day: "Sat", short: "S", completed: true, isToday: true },
  { day: "Sun", short: "S", completed: false },
];