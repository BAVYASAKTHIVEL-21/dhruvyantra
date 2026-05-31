"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import type { InsightsTab } from "../data";
import { AccuracyOverTimeCard } from "./accuracy-over-time-card";
import { AchievementCard } from "./achievement-card";
import { AiInsightCard } from "./ai-insight-card";
import { InsightsFilterTabs } from "./insights-filter-tabs";
import { LongTermProgressCard } from "./long-term-progress-card";
import { StudyDistributionCard } from "./study-distribution-card";
import { StudyHoursTrendCard } from "./study-hours-trend-card";
import { SubjectPerformanceCard } from "./subject-performance-card";
import { TimeFilter } from "./time-filter";
import { TopicMasteryCard } from "./topic-mastery-card";
import { TopStatsRow } from "./top-stats-row";

export function InsightsPage() {
  const [activeTab, setActiveTab] = useState<InsightsTab>("overview");

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-[#8B5CF6]" />
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
              Insights
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Track your journey. Improve every day.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <InsightsFilterTabs active={activeTab} onChange={setActiveTab} />
          <TimeFilter />
        </div>
      </motion.header>

      <div className="space-y-6">
        <TopStatsRow />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <StudyHoursTrendCard />
          <SubjectPerformanceCard />
          <AccuracyOverTimeCard />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TopicMasteryCard />
          <StudyDistributionCard />
          <AiInsightCard />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <LongTermProgressCard />
          <AchievementCard />
        </div>
      </div>
    </>
  );
}
