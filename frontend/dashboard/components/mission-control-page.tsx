"use client";

import { DashboardHeader } from "./dashboard-header";
import { AiMentorCard } from "./cards/ai-mentor-card";
import { BottomStatsRow } from "./cards/bottom-stats-row";
import { ExamFocusStrip } from "./cards/exam-focus-strip";
import { RevisionPlannerCard } from "./cards/revision-planner-card";
import { TodaysMissionCard } from "./cards/todays-mission-card";
import { WeakTopicsCard } from "./cards/weak-topics-card";
import { WeeklyProgressCard } from "./cards/weekly-progress-card";

export function MissionControlPage() {
  return (
    <>
      <DashboardHeader />

      <ExamFocusStrip />

      <div className="mt-6 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2 xl:gap-6">
        <TodaysMissionCard />
        <WeeklyProgressCard />
      </div>

      <div className="mt-5 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
        <WeakTopicsCard />
        <RevisionPlannerCard />
        <AiMentorCard />
      </div>

      <div className="mt-5 lg:mt-6">
        <BottomStatsRow />
      </div>
    </>
  );
}
