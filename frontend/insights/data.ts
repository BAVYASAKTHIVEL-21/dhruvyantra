export type InsightsTab =
  | "overview"
  | "study"
  | "performance"
  | "subjects"
  | "time"
  | "progress";

export const INSIGHTS_TABS: { id: InsightsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "study", label: "Study" },
  { id: "performance", label: "Performance" },
  { id: "subjects", label: "Subjects" },
  { id: "time", label: "Time" },
  { id: "progress", label: "Progress" },
];

export const TIME_FILTERS = ["This Week", "This Month", "Last 3 Months", "This Year"];

export const TOP_STATS = [
  {
    id: "hours",
    label: "Total Study Hours",
    value: "28.5 hrs",
    trend: "+18% from last week",
    accent: "#8B5CF6",
    spark: [12, 18, 14, 22, 20, 26, 28],
  },
  {
    id: "questions",
    label: "Questions Solved",
    value: "1,248",
    trend: "+22% from last week",
    accent: "#22C55E",
    spark: [80, 95, 110, 105, 130, 145, 160],
  },
  {
    id: "tests",
    label: "Tests Taken",
    value: "12",
    trend: "+20% from last week",
    accent: "#38BDF8",
    spark: [2, 3, 2, 4, 3, 5, 4],
  },
  {
    id: "accuracy",
    label: "Accuracy",
    value: "78%",
    trend: "+6% from last week",
    accent: "#EC4899",
    spark: [68, 72, 70, 74, 76, 75, 78],
  },
  {
    id: "focus",
    label: "Focus Score",
    value: "86/100",
    trend: "+10% from last week",
    accent: "#A78BFA",
    spark: [72, 78, 80, 82, 84, 85, 86],
  },
];

export const STUDY_HOURS_WEEKS = [
  { week: "Wk1", hours: 18 },
  { week: "Wk2", hours: 22 },
  { week: "Wk3", hours: 20 },
  { week: "Wk4", hours: 24 },
  { week: "Wk5", hours: 26 },
  { week: "Wk6", hours: 23 },
  { week: "Wk7", hours: 27 },
  { week: "Wk8", hours: 28.5 },
];

export const SUBJECT_PERFORMANCE = [
  { name: "Physics", value: 82, color: "#38BDF8" },
  { name: "Chemistry", value: 64, color: "#EC4899" },
  { name: "Mathematics", value: 71, color: "#8B5CF6" },
  { name: "Others", value: 67, color: "#14B8A6" },
];

export const ACCURACY_DAYS = [
  { day: "Mon", accuracy: 72 },
  { day: "Tue", accuracy: 74 },
  { day: "Wed", accuracy: 76 },
  { day: "Thu", accuracy: 75 },
  { day: "Fri", accuracy: 78 },
  { day: "Sat", accuracy: 80 },
  { day: "Sun", accuracy: 78 },
];

export type MasteryLevel = "strong" | "average" | "weak";

export const TOPIC_MASTERY: {
  topic: string;
  pct: number;
  level: MasteryLevel;
}[] = [
  { topic: "Thermodynamics", pct: 85, level: "strong" },
  { topic: "Rotational Motion", pct: 42, level: "weak" },
  { topic: "Organic Chemistry", pct: 68, level: "average" },
  { topic: "Electrostatics", pct: 38, level: "weak" },
  { topic: "Chemical Bonding", pct: 74, level: "strong" },
];

export const STUDY_DISTRIBUTION = [
  { name: "Physics", hours: 9.5, color: "#38BDF8" },
  { name: "Chemistry", hours: 7, color: "#EC4899" },
  { name: "Mathematics", hours: 8.5, color: "#8B5CF6" },
  { name: "Others", hours: 3.5, color: "#14B8A6" },
];

export const LONG_TERM_MONTHS = [
  { month: "Jan", score: 52 },
  { month: "Feb", score: 55 },
  { month: "Mar", score: 58 },
  { month: "Apr", score: 62 },
  { month: "May", score: 65 },
  { month: "Jun", score: 68 },
  { month: "Jul", score: 70 },
  { month: "Aug", score: 72 },
  { month: "Sep", score: 74 },
  { month: "Oct", score: 76 },
  { month: "Nov", score: 78 },
  { month: "Dec", score: 82 },
];

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  strong: "#22C55E",
  average: "#EAB308",
  weak: "#EF4444",
};
