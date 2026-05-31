import type { MissionAlert, MissionAlertCategory } from "@/types/mission-control";

export type FeedAlertItem = {
  id: string;
  title: string;
  message: string;
  source: string;
  time: string;
  group: "today" | "yesterday" | "older";
  category: MissionAlertCategory;
  important?: boolean;
  icon: "calendar" | "warning" | "success" | "mentor" | "chart" | "plan" | "test";
};

const ICON_BY_CATEGORY: Record<MissionAlertCategory, FeedAlertItem["icon"]> = {
  important: "warning",
  study: "plan",
  tests: "test",
  mentor: "mentor",
  system: "chart",
};

const SOURCE_BY_CATEGORY: Record<MissionAlertCategory, string> = {
  important: "Mission Control",
  study: "Mission Control",
  tests: "Mock Center",
  mentor: "AI Mentor",
  system: "DhruvYantra",
};

export function missionAlertsToFeedItems(alerts: MissionAlert[]): FeedAlertItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    message: alert.message,
    source: SOURCE_BY_CATEGORY[alert.category] ?? "Mission Control",
    time: "Today",
    group: "today" as const,
    category: alert.category,
    important: alert.important,
    icon: ICON_BY_CATEGORY[alert.category] ?? "plan",
  }));
}

export function buildAlertSummary(alerts: MissionAlert[]) {
  const breakdown = [
    { name: "Important", value: alerts.filter((a) => a.category === "important").length, color: "#EF4444" },
    { name: "Study & Progress", value: alerts.filter((a) => a.category === "study").length, color: "#22C55E" },
    { name: "Tests & Deadlines", value: alerts.filter((a) => a.category === "tests").length, color: "#8B5CF6" },
    { name: "Mentor & Sessions", value: alerts.filter((a) => a.category === "mentor").length, color: "#38BDF8" },
    { name: "System", value: alerts.filter((a) => a.category === "system").length, color: "#94A3B8" },
  ].filter((b) => b.value > 0);

  return {
    total: alerts.length,
    breakdown: breakdown.length > 0 ? breakdown : [{ name: "All clear", value: 1, color: "#22C55E" }],
  };
}

export function buildUpcomingRemindersFromAnalytics(
  mockTitle: string | undefined,
  mockWhen: string | undefined,
) {
  const items: { id: string; title: string; when: string; urgent: boolean }[] = [];
  if (mockTitle && mockWhen) {
    items.push({ id: "mock", title: mockTitle, when: mockWhen, urgent: true });
  }
  return items;
}
