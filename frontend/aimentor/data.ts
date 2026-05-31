export type MentorTab =
  | "study"
  | "concept"
  | "strategy"
  | "motivation";

export const MENTOR_TABS: { id: MentorTab; label: string }[] = [
  { id: "study", label: "Study Mentor" },
  { id: "concept", label: "Concept Explainer" },
  { id: "strategy", label: "Strategy Coach" },
  { id: "motivation", label: "Motivation Booster" },
];

export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
  plan?: string[];
  actions?: { id: string; label: string; primary?: boolean }[];
};

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "ai",
    content:
      "Hi Bavya! 👋\nI analysed your progress this week.\nYou've improved **18% in Physics** and maintained great consistency! Keep it up.\nBut **Organic Chemistry** needs more attention. Shall we create a plan for it?",
    timestamp: "7:02 PM",
  },
  {
    id: "m2",
    role: "user",
    content: "Yes, I'm struggling with Organic Chemistry.",
    timestamp: "7:03 PM",
  },
  {
    id: "m3",
    role: "ai",
    content:
      "No worries! We'll fix it together.\nHere's what I suggest:",
    timestamp: "7:03 PM",
    plan: [
      "Revise GOC (Nomenclature) today",
      "Solve 20 PYQs on Isomerism",
      "Watch 1 Concept Video (15 min)",
      "Take a Mini Test tomorrow",
    ],
    actions: [
      { id: "yes", label: "Yes, block it", primary: true },
      { id: "no", label: "Not now" },
      { id: "more", label: "Show more plan" },
    ],
  },
];

export const QUICK_ACTIONS = [
  "Explain this concept",
  "Why did I get this wrong?",
  "Suggest a study plan",
  "Motivate me",
];

export const INSIGHTS = {
  focusLevel: 78,
  focusLabel: "Great Focus!",
  bestHours: "7 PM – 10 PM",
  weeklyAccuracy: "+12%",
  consistency: 85,
  consistencyLabel: "Excellent!",
};

export const RECOMMENDED_ACTIONS = [
  { id: "a1", label: "Revise Electrostatics (Weak Topic)", done: false },
  { id: "a2", label: "Solve Chemistry PYQs", done: true },
  { id: "a3", label: "Take Full Mock Test", done: false },
  { id: "a4", label: "Maintain 7+ hrs consistency", done: true },
];

export const FOCUS_TREND = [42, 55, 48, 62, 70, 65, 78];

export const WEEKLY_STREAK = [
  { day: "M", done: true },
  { day: "T", done: true },
  { day: "W", done: true },
  { day: "T", done: true },
  { day: "F", done: true },
  { day: "S", done: true },
  { day: "S", done: false },
];

export const MOTIVATION = {
  quote: "Consistency beats intensity.",
  sub: "Every single day.",
};
