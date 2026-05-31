"use client";

import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useMissionAnalytics } from "@/hooks/useMissionAnalytics";
import {
  buildAlertSummary,
  buildUpcomingRemindersFromAnalytics,
  missionAlertsToFeedItems,
} from "@/lib/mission-control/map-alerts";
import type { AlertFilter } from "../data";
import { ALERTS } from "../data";
import { filterAlerts, searchAlerts } from "../services/alertsService";
import { AlertFilterTabs } from "./alert-filter-tabs";
import { AlertsFeed } from "./alerts-feed";
import { AlertsSidebar } from "./alerts-sidebar";

export function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("all");
  const [query, setQuery] = useState("");
  const { analytics, loading } = useMissionAnalytics();

  const feedAlerts = useMemo(() => {
    const missionItems = analytics?.alerts?.length
      ? missionAlertsToFeedItems(analytics.alerts)
      : [];
    return missionItems.length > 0 ? missionItems : ALERTS;
  }, [analytics?.alerts]);

  const filtered = useMemo(() => {
    const byFilter = filterAlerts(feedAlerts, activeFilter);
    return searchAlerts(byFilter, query);
  }, [feedAlerts, activeFilter, query]);

  const summary = useMemo(
    () =>
      analytics?.alerts?.length
        ? buildAlertSummary(analytics.alerts)
        : undefined,
    [analytics?.alerts],
  );

  const reminders = useMemo(
    () =>
      analytics?.upcomingMock
        ? buildUpcomingRemindersFromAnalytics(
            analytics.upcomingMock.title,
            analytics.upcomingMock.scheduledLabel,
          )
        : undefined,
    [analytics?.upcomingMock],
  );

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-7 w-7 text-[#8B5CF6]" />
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
              Alerts
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">
            {loading
              ? "Loading mission alerts…"
              : analytics?.alerts?.length
                ? "Planner-driven alerts from Mission Control"
                : "Stay updated. Never miss what matters."}
          </p>
        </div>
      </motion.header>

      <div className="dash-search mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#6B7A90]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search alerts..."
          className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#6B7A90]"
        />
      </div>

      <AlertFilterTabs active={activeFilter} onChange={setActiveFilter} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <AlertsFeed alerts={filtered} />
        <AlertsSidebar summary={summary} reminders={reminders} />
      </div>
    </>
  );
}
