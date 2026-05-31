"use client";

import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useMissionAnalytics } from "@/hooks/useMissionAnalytics";
import { weeklyStatRows } from "@/services/analytics/mission-analytics";

export function WeeklyProgressCard() {
  const { profile } = useProfile();
  const { analytics, loading } = useMissionAnalytics();

  const weekly = analytics?.weekly;
  const stats = weekly && profile ? weeklyStatRows(weekly, profile) : [];
  const progress = weekly?.progressPercent ?? 0;
  const dailyBars = analytics?.dailyBars ?? [];

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const maxBar = Math.max(1, ...dailyBars.map((b) => b.tasksCompleted));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
      className="dash-glass-card flex h-full flex-col rounded-2xl p-5 md:p-6"
    >
      <h2 className="shrink-0 font-heading text-lg font-bold text-[#F8FAFC]">
        Weekly Progress
        {profile?.examType ? (
          <span className="ml-2 text-xs font-normal text-[#8B5CF6]">{profile.examType}</span>
        ) : null}
      </h2>
      {weekly ? (
        <p className="mt-0.5 text-xs text-[#6B7A90]">
          {weekly.completedTasks}/{weekly.totalTasks} tasks · planner-driven
        </p>
      ) : null}

      <div className="mt-5 flex flex-1 flex-col items-center justify-start gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="relative flex shrink-0 items-center justify-center">
          {loading && !analytics ? (
            <div className="h-36 w-36 animate-pulse rounded-full bg-white/[0.04]" />
          ) : (
            <>
              <svg
                className="dash-progress-ring h-36 w-36 -rotate-90 md:h-40 md:w-40"
                viewBox="0 0 120 120"
              >
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="url(#weeklyProgressGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="weeklyProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <p className="font-heading text-2xl font-bold text-[#F8FAFC]">{progress}%</p>
                <p className="text-xs text-[#94A3B8]">Completed</p>
              </div>
            </>
          )}
        </div>

        <div className="w-full flex-1 space-y-3 lg:max-w-[200px] lg:pt-2">
          {loading && stats.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
              ))
            : stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs text-[#6B7A90]">{stat.label}</p>
                    <p className="text-sm font-semibold text-[#F8FAFC]">{stat.value}</p>
                  </div>
                  <span className="text-xs font-medium text-[#34D399]">{stat.change}</span>
                </div>
              ))}
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/[0.06] pt-5">
        {dailyBars.map((bar, i) => (
          <div key={bar.date} className="flex flex-1 flex-col items-center gap-2">
            <motion.div
              initial={{ height: 4 }}
              animate={{
                height: Math.round((bar.tasksCompleted / maxBar) * 56) + 4,
              }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
              className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#8B5CF6] to-[#38BDF8]/80"
              title={`${bar.tasksCompleted}/${bar.tasksTotal} tasks · ${Math.round(bar.studyMinutes / 60)}h`}
            />
            <span className="text-[10px] text-[#6B7A90]">{bar.day}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
