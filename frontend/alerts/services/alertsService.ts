import {
  ALERTS,
  ALERT_PREFERENCES,
  OLDER_COUNT,
  SUMMARY_BREAKDOWN,
  TOTAL_ALERTS,
  UPCOMING_REMINDERS,
} from "../data";
import type { AlertFilter, AlertItem } from "../data";
import { mapMissionAlertsToFeed } from "./mission-alert-mapper";
import type { MissionAlert } from "@/types/mission-control";

let liveAlerts: AlertItem[] | null = null;

export function setLiveAlertsFromMission(alerts: MissionAlert[]) {
  liveAlerts = mapMissionAlertsToFeed(alerts);
}

export function getAlerts(): AlertItem[] {
  return liveAlerts && liveAlerts.length > 0 ? liveAlerts : ALERTS;
}

export function filterAlerts(alerts: AlertItem[], filter: AlertFilter): AlertItem[] {
  if (filter === "all") return alerts;
  if (filter === "important") return alerts.filter((a) => a.important);
  return alerts.filter((a) => a.category === filter);
}

export function searchAlerts(alerts: AlertItem[], query: string): AlertItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return alerts;
  return alerts.filter((a) =>
    [a.title, a.message, a.source].join(" ").toLowerCase().includes(q),
  );
}

export function getSummary(liveCount?: number) {
  const total = liveCount ?? (liveAlerts?.length || TOTAL_ALERTS);
  return { total, breakdown: SUMMARY_BREAKDOWN };
}

export function getUpcomingReminders() {
  return UPCOMING_REMINDERS;
}

export function getPreferences() {
  return ALERT_PREFERENCES;
}

export function getOlderCount() {
  return OLDER_COUNT;
}
