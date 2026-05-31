import type { MissionAlert } from "@/types/mission-control";
import type { AlertItem } from "../data";

const ICON_BY_CATEGORY: Record<MissionAlert["category"], AlertItem["icon"]> = {
  important: "warning",
  study: "plan",
  tests: "test",
  mentor: "mentor",
  system: "chart",
};

export function mapMissionAlertsToFeed(alerts: MissionAlert[]): AlertItem[] {
  return alerts.map((a, i) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    source: a.category === "tests" ? "Mock Center" : "Mission Control",
    time: "Today",
    group: "today" as const,
    category: a.category === "important" ? "study" : a.category,
    important: a.important,
    icon: ICON_BY_CATEGORY[a.category],
  }));
}
