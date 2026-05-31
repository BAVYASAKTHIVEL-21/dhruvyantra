"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useState } from "react";
import { useParentConnectOverview } from "@/hooks/useParentConnectOverview";
import type { ParentTab } from "../data";
import { AiInsightsCard } from "./ai-insights-card";
import { AlertsPanel } from "./alerts-panel";
import { ParentConnectTabs } from "./parent-connect-tabs";
import { PerformanceSnapshot } from "./performance-snapshot";
import { StayConnectedCard } from "./stay-connected-card";
import { StudentOverviewCard } from "./student-overview-card";
import { SubjectPerformanceCard } from "./subject-performance-card";
import { UpcomingSchedule } from "./upcoming-schedule";
import { WeeklyReportPreview } from "./weekly-report-preview";

export function ParentConnectPage() {
  const [activeTab, setActiveTab] = useState<ParentTab>("overview");
  const { overview, loading, error } = useParentConnectOverview();

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <motion.div>
          <motion.div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-[#8B5CF6]" />
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
              Parent Connect
            </h1>
          </motion.div>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Stay informed. Support better. Celebrate together.
          </p>
          {error ? (
            <p className="mt-2 text-xs text-[#F87171]">{error}</p>
          ) : loading && !overview ? (
            <p className="mt-2 text-xs text-[#6B7A90]">Loading live progress…</p>
          ) : null}
        </motion.div>
        <ParentConnectTabs active={activeTab} onChange={setActiveTab} />
      </motion.header>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <StudentOverviewCard student={overview?.student} />
            <PerformanceSnapshot metrics={overview?.metrics} />
            <SubjectPerformanceCard subjects={overview?.subjects} />
            <WeeklyReportPreview report={overview?.weeklyReport} />
          </div>
          <aside className="space-y-4">
            <AlertsPanel alerts={overview?.alerts} />
            <AiInsightsCard insight={overview?.aiInsight} />
            <UpcomingSchedule events={overview?.upcoming} />
            <StayConnectedCard telegramConfigured={overview?.telegramConfigured} />
          </aside>
        </div>
      ) : (
        <div className="dash-glass-card rounded-2xl p-8 text-center">
          <p className="font-heading text-lg font-bold text-[#F8FAFC]">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")}
          </p>
          <p className="mt-2 text-sm text-[#94A3B8]">
            This section will be available soon. Overview shows your child&apos;s full progress.
          </p>
        </div>
      )}
    </>
  );
}
