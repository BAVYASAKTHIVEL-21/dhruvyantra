"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useMissionAnalytics } from "@/hooks/useMissionAnalytics";
import { buildFocusHref } from "@/lib/mission-control/navigation";

export function BottomStatsRow() {
  const router = useRouter();
  const { profile } = useProfile();
  const { analytics } = useMissionAnalytics();

  const streak = analytics?.streak;
  const mock = analytics?.upcomingMock;
  const bars = analytics?.streakBars ?? [];

  const focusHref = buildFocusHref({
    topic: profile?.weakTopics[0],
    subject: profile?.weakSubjects[0],
    duration: 45,
    productiveTime: profile?.productiveTime ?? undefined,
  });

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 md:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="dash-glass-card flex h-full min-h-[160px] flex-col rounded-2xl p-5"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A90]">Study Streak</p>
        <p className="mt-1 font-heading text-2xl font-bold text-[#F8FAFC]">
          {streak?.current ?? 0} Days <Flame className="inline h-5 w-5 text-[#F59E0B]" />
        </p>
        <p className="mt-1 text-xs text-[#94A3B8]">
          Longest {streak?.longest ?? 0} · {streak?.studiedToday ? "On track today" : "Complete a task today"}
        </p>
        <div className="mt-auto flex h-14 items-end gap-1.5 pt-4">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-[#8B5CF6] to-[#EC4899]/70"
              style={{ height: `${h}%`, minHeight: "6px" }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="dash-glass-card flex h-full min-h-[160px] flex-col rounded-2xl p-5"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A90]">Next Mock Test</p>
        <p className="mt-1 font-heading text-lg font-bold text-[#F8FAFC]">
          {mock?.title ?? "Full Syllabus Mock"}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#94A3B8]">
          <Target className="h-4 w-4 shrink-0 text-[#8B5CF6]" />
          {mock?.scheduledLabel ?? "Scheduling from planner…"}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-auto h-9 w-full cursor-pointer rounded-lg border-white/10 bg-white/[0.04] text-sm text-[#E2E8F0] hover:border-[#8B5CF6]/20 hover:bg-white/[0.08] active:scale-[0.98]"
          onClick={() => router.push(mock?.href ?? "/dashboard/mock-center")}
        >
          View Details
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="dash-glass-card flex h-full min-h-[160px] flex-col rounded-2xl p-5"
      >
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A90]">Focus Mode</p>
            <p className="mt-1 font-heading text-lg font-bold text-[#F8FAFC]">
              {profile?.productiveTime
                ? `${profile.productiveTime} focus block`
                : "Distraction-free study"}
            </p>
            <Button
              type="button"
              className="btn-gradient-glow mt-5 h-9 cursor-pointer rounded-lg px-6 text-sm font-semibold text-white active:scale-[0.98]"
              onClick={() => router.push(focusHref)}
            >
              Start Now
            </Button>
          </div>
          <Link
            href={focusHref}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/10 ring-1 ring-[#8B5CF6]/20"
            aria-label="Open deep focus"
          >
            <Target className="h-7 w-7 text-[#A78BFA]" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
