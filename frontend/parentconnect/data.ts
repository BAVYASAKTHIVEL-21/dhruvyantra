export type ParentTab =
  | "overview"
  | "reports"
  | "study-plan"
  | "communication"
  | "settings";

export const PARENT_TABS: { id: ParentTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Reports" },
  { id: "study-plan", label: "Study Plan" },
  { id: "communication", label: "Communication" },
  { id: "settings", label: "Settings" },
];

export const STUDENT_PROFILE = {
  name: "Bavya",
  role: "JEE Aspirant • 12th Grade",
  targetExam: "JEE Advanced 2025",
  daysRemaining: 148,
};

export const PERFORMANCE_METRICS = [
  {
    id: "progress",
    label: "Overall Progress",
    value: "72%",
    sub: "Good Progress",
    trend: "+8% from last week",
    positive: true,
  },
  {
    id: "hours",
    label: "Study Hours",
    value: "32h 45m",
    sub: "This week",
    trend: "+6h 15m",
    positive: true,
  },
  {
    id: "mock",
    label: "Mock Test Score",
    value: "78/100",
    sub: "Latest mock",
    trend: "+12 points",
    positive: true,
  },
  {
    id: "accuracy",
    label: "Accuracy",
    value: "81%",
    sub: "Average",
    trend: "+7%",
    positive: true,
  },
  {
    id: "streak",
    label: "Consistency",
    value: "14 Days",
    sub: "Current Streak 🔥",
    trend: "Keep it up!",
    positive: true,
  },
];

export type SubjectLevel = "strong" | "average" | "weak";

export const SUBJECT_PERFORMANCE = [
  { subject: "Physics", score: 82, trend: "+10%", level: "strong" as SubjectLevel, color: "#8B5CF6" },
  { subject: "Chemistry", score: 75, trend: "+6%", level: "strong" as SubjectLevel, color: "#38BDF8" },
  { subject: "Mathematics", score: 70, trend: "+8%", level: "average" as SubjectLevel, color: "#22C55E" },
  { subject: "Organic Chemistry", score: 62, trend: "-4%", level: "weak" as SubjectLevel, color: "#EC4899" },
  { subject: "Inorganic Chemistry", score: 68, trend: "+5%", level: "average" as SubjectLevel, color: "#EAB308" },
];

export const ALERTS = [
  {
    id: "a1",
    title: "Organic Chemistry needs more focus",
    time: "2h ago",
    type: "warning" as const,
  },
  {
    id: "a2",
    title: "Mock test this Sunday",
    time: "Today",
    type: "info" as const,
  },
  {
    id: "a3",
    title: "Great consistency streak!",
    time: "Yesterday",
    type: "success" as const,
  },
];

export const AI_PARENT_INSIGHT =
  "Bavya is performing best between 7 PM – 10 PM. Ensure deep focus sessions during this time for maximum productivity.";

export const UPCOMING_EVENTS = [
  { id: "e1", title: "Full Syllabus Mock Test", when: "In 2 Days", icon: "test" as const },
  { id: "e2", title: "Physics Revision Test", when: "In 4 Days", icon: "revision" as const },
  { id: "e3", title: "Doubt Solving Session", when: "In 5 Days", icon: "doubt" as const },
];

export const CONNECT_OPTIONS = [
  { id: "c1", label: "Weekly Report", icon: "report" as const },
  { id: "c2", label: "Telegram Updates", icon: "telegram" as const },
  { id: "c3", label: "Parent Summary", icon: "summary" as const },
];

export const WEEKLY_REPORT = {
  week: "Week 12 — May 2026",
  focusHours: "32h 45m",
  weakTopics: ["Organic Chemistry", "Electrostatics"],
  aiRecommendation:
    "Schedule 2 extra hours for Organic Chemistry this week. Peak focus window: 7–10 PM.",
  summary: "Overall progress up 8%. Mock score improved by 12 points.",
};
