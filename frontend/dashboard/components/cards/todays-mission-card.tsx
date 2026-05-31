"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { usePlanner } from "@/hooks/usePlanner";
import { useProfile } from "@/hooks/useProfile";
import { useMissionAnalytics } from "@/hooks/useMissionAnalytics";
import { buildResourceHrefFromMockRecommendation } from "@/lib/mission-control/navigation";
import { dashboardSubtitle } from "@/lib/personalization/dashboard";

export function TodaysMissionCard() {
  const { profile } = useProfile();
  const { refresh: refreshAnalytics } = useMissionAnalytics();
  const { plan, loading, error, updatingId, toggleTask, refresh } = usePlanner();

  const tasks = plan?.tasks ?? [];
  const completed = plan?.completedCount ?? 0;
  const total = plan?.totalTasks ?? 0;
  const progressPercent = plan?.progressPercent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.45 }}
      className="dash-glass-card flex h-full flex-col rounded-2xl p-5 md:p-6"
    >
      <div className="shrink-0">
        <h2 className="font-heading text-lg font-bold text-[#F8FAFC]">
          Today&apos;s Mission
        </h2>
        <p className="mt-0.5 text-sm text-[#94A3B8]">
          {profile ? dashboardSubtitle(profile) : "Your personalized plan for today"}
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-2 text-center">
          <p className="text-xs text-[#F87171]">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 cursor-pointer text-xs text-[#8B5CF6] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <ul className="mt-5 flex-1 space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="h-[72px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]"
              />
            ))
          : tasks.map((task) => {
              const done = task.status === "Completed";
              const isUpdating = updatingId === task.id;
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      toggleTask(task.id);
                      void refreshAnalytics();
                    }}
                    className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-left transition-colors hover:border-[#8B5CF6]/25 hover:bg-white/[0.04] active:scale-[0.99] disabled:opacity-60"
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        done
                          ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          done ? "text-[#94A3B8] line-through" : "text-[#F8FAFC]"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#6B7A90]">
                        <span className="rounded-md bg-white/[0.05] px-2 py-0.5">
                          {task.subject}
                        </span>
                        <span className="rounded-md bg-white/[0.05] px-2 py-0.5">
                          {task.priority}
                        </span>
                        <span>{task.scheduledTime ?? "—"}</span>
                        <span>{task.duration} min</span>
                      </div>
                      {task.recommendedResources && task.recommendedResources.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {task.recommendedResources.slice(0, 2).map((resource) => (
                            <Link
                              key={resource.id}
                              href={buildResourceHrefFromMockRecommendation({
                                topic: resource.topic || task.topic,
                                subject: resource.subject,
                                type: resource.type,
                                title: resource.title,
                                examType: profile?.examType,
                              })}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-md bg-[#8B5CF6]/15 px-2 py-0.5 text-[10px] font-medium text-[#C4B5FD] hover:bg-[#8B5CF6]/25"
                            >
                              {resource.type}: {resource.title}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
      </ul>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8]"
        />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="text-sm text-[#94A3B8]">
          {completed}/{total} completed · {progressPercent}%
        </span>
        <span className="text-sm font-medium text-[#A78BFA]">
          Keep going! You&apos;ve got this! 💪
        </span>
      </div>
    </motion.div>
  );
}
