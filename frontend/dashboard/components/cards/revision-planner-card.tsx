"use client";

import { motion } from "framer-motion";
import { useMissionAnalytics } from "@/hooks/useMissionAnalytics";

const priorityStyles = {
  purple: "bg-[#8B5CF6]/20 text-[#C4B5FD] ring-[#8B5CF6]/30",
  blue: "bg-[#38BDF8]/15 text-[#7DD3FC] ring-[#38BDF8]/25",
  muted: "bg-white/[0.06] text-[#94A3B8] ring-white/10",
};

export function RevisionPlannerCard() {
  const { analytics, loading } = useMissionAnalytics();
  const items = analytics?.revisions ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45 }}
      className="dash-glass-card flex h-full flex-col rounded-2xl p-5 md:p-6"
    >
      <h2 className="shrink-0 font-heading text-lg font-bold text-[#F8FAFC]">
        Revision Planner
      </h2>
      <p className="mt-0.5 text-xs text-[#6B7A90]">Spaced revision from planner history</p>

      {loading && items.length === 0 ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <ul className="relative mt-6 flex-1 space-y-0 pl-1">
          <div
            className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-[#8B5CF6] via-[#38BDF8]/50 to-transparent"
            aria-hidden
          />
          {items.map((item) => (
            <li key={item.topic} className="relative flex gap-4 pb-5 last:pb-0">
              <div className="relative z-10 mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                <div className="absolute h-[22px] w-[22px] rounded-full bg-[#8B5CF6]/25 blur-md" />
                <div className="relative h-3 w-3 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#38BDF8] ring-2 ring-[#0B1020]" />
              </div>
              <div className="min-w-0 flex-1 pt-0">
                <p className="text-xs font-medium text-[#8B5CF6]">{item.when}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#F8FAFC]">{item.topic}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${priorityStyles[item.tone]}`}
                >
                  {item.priority}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
