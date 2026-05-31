export type AlertFilter =
  | "all"
  | "important"
  | "study"
  | "tests"
  | "mentor"
  | "system";

export const ALERT_FILTERS: { id: AlertFilter; label: string }[] = [
  { id: "all", label: "All Alerts" },
  { id: "important", label: "Important" },
  { id: "study", label: "Study & Progress" },
  { id: "tests", label: "Tests & Deadlines" },
  { id: "mentor", label: "Mentor & Sessions" },
  { id: "system", label: "System" },
];

export type AlertCategory =
  | "important"
  | "study"
  | "tests"
  | "mentor"
  | "system";

export type AlertItem = {
  id: string;
  title: string;
  message: string;
  source: string;
  time: string;
  group: "today" | "yesterday" | "older";
  category: AlertCategory;
  important?: boolean;
  icon: "calendar" | "warning" | "success" | "mentor" | "chart" | "plan" | "test";
};

export const ALERTS: AlertItem[] = [
  {
    id: "t1",
    title: "Mock Test Tomorrow",
    message: "Full Syllabus Mock Test is scheduled for tomorrow, 9:00 AM.",
    source: "Mock Center",
    time: "10:30 AM",
    group: "today",
    category: "tests",
    important: true,
    icon: "calendar",
  },
  {
    id: "t2",
    title: "Organic Chemistry Needs Focus",
    message: "AI noticed a drop in your Organic Chemistry accuracy.",
    source: "AI Mentor",
    time: "09:15 AM",
    group: "today",
    category: "mentor",
    important: true,
    icon: "warning",
  },
  {
    id: "t3",
    title: "Daily Goal Achieved 🎉",
    message: "Great job! You completed your study goal for today.",
    source: "Mission Control",
    time: "08:45 AM",
    group: "today",
    category: "study",
    icon: "success",
  },
  {
    id: "y1",
    title: "Mentor Session Reminder",
    message: "Your AI Mentor session starts in 30 minutes.",
    source: "AI Mentor",
    time: "Yesterday",
    group: "yesterday",
    category: "mentor",
    icon: "mentor",
  },
  {
    id: "y2",
    title: "Weekly Progress Report Ready",
    message: "Your Week 12 progress report is ready to view.",
    source: "Insights",
    time: "Yesterday",
    group: "yesterday",
    category: "study",
    icon: "chart",
  },
  {
    id: "y3",
    title: "New Study Plan Generated",
    message: "AI updated your study plan based on mock performance.",
    source: "Mission Control",
    time: "Yesterday",
    group: "yesterday",
    category: "study",
    icon: "plan",
  },
  {
    id: "y4",
    title: "Physics Revision Test",
    message: "Chapter test on Electrostatics scheduled for Friday.",
    source: "Mock Center",
    time: "Yesterday",
    group: "yesterday",
    category: "tests",
    icon: "test",
  },
];

export const SUMMARY_BREAKDOWN = [
  { name: "Important", value: 8, color: "#EF4444" },
  { name: "Study & Progress", value: 7, color: "#22C55E" },
  { name: "Tests & Deadlines", value: 6, color: "#8B5CF6" },
  { name: "Mentor & Sessions", value: 4, color: "#38BDF8" },
  { name: "System", value: 3, color: "#94A3B8" },
];

export const TOTAL_ALERTS = 28;
export const OLDER_COUNT = 23;

export const UPCOMING_REMINDERS = [
  { id: "r1", title: "Full Syllabus Mock Test", when: "In 18h", urgent: true },
  { id: "r2", title: "AI Mentor Session", when: "In 6h", urgent: true },
  { id: "r3", title: "Physics Revision Test", when: "In 2 Days", urgent: false },
];

export const ALERT_PREFERENCES = [
  { id: "p1", label: "Study & Progress", enabled: true },
  { id: "p2", label: "Tests & Deadlines", enabled: true },
  { id: "p3", label: "Mentor & Sessions", enabled: true },
  { id: "p4", label: "System & Updates", enabled: false },
];
