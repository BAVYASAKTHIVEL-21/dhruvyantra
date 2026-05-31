"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useMissionAnalytics } from "@/hooks/useMissionAnalytics";
import { weakTopicResourcesHref } from "@/lib/mission-control/navigation";

export function WeakTopicsCard() {
  const { profile } = useProfile();
  const { analytics, loading } = useMissionAnalytics();
  const topics = analytics?.weakTopics ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45 }}
      className="dash-glass-card flex h-full flex-col rounded-2xl p-5 md:p-6"
    >
      <h2 className="shrink-0 font-heading text-lg font-bold text-[#F8FAFC]">
        Weak Topics
        {profile?.examType ? (
          <span className="ml-2 text-xs font-normal text-[#8B5CF6]">{profile.examType}</span>
        ) : null}
      </h2>
      <p className="mt-0.5 text-xs text-[#6B7A90]">Mastery from planner completion (14d)</p>

      {loading && topics.length === 0 ? (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <ul className="mt-5 flex-1 space-y-4">
          {topics.map((topic) => (
            <li key={topic.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#E2E8F0]">{topic.name}</span>
                <span className="font-semibold text-[#F472B6]">{topic.masteryPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${topic.masteryPercent}%` }}
                  transition={{ delay: 0.35, duration: 0.6 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#EC4899]/80 to-[#8B5CF6]/60"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-wide text-[#6B7A90]">
                  {topic.subject} · {topic.completedTasks}/{topic.totalTasks} done
                </p>
                <Link
                  href={weakTopicResourcesHref(
                    topic.name,
                    topic.subject,
                    profile?.examType ?? null,
                  )}
                  className="inline-flex cursor-pointer items-center gap-0.5 text-[10px] font-semibold text-[#A78BFA] hover:text-[#C4B5FD]"
                >
                  Practice Now
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-auto rounded-xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/8 px-3.5 py-3 text-xs leading-relaxed text-[#C4B5FD]">
        <span className="font-semibold text-[#E9D5FF]">AI Recommendation:</span> Spend{" "}
        {Math.max(2, Math.round((profile?.dailyStudyHours ?? 6) / 3))} more hours on low-mastery{" "}
        {profile?.examType ?? ""} topics this week.
      </p>
    </motion.div>
  );
}
