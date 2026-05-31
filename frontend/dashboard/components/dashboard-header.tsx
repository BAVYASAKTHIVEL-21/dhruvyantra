"use client";

import { motion } from "framer-motion";
import { Bell, Calendar, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { dashboardSubtitle, greetingForProfile } from "@/lib/personalization/dashboard";
import { HeaderProfileMenu } from "./header-profile-menu";

type TodayParts = {
  weekday: string;
  day: string;
  month: string;
};

function useTodayParts(): TodayParts | null {
  const [parts, setParts] = useState<TodayParts | null>(null);

  useEffect(() => {
    const now = new Date();
    setParts({
      weekday: now.toLocaleDateString("en-IN", { weekday: "short" }),
      day: now.toLocaleDateString("en-IN", { day: "numeric" }),
      month: now.toLocaleDateString("en-IN", { month: "short" }),
    });
  }, []);

  return parts;
}

function HeaderTodayDate({ parts }: { parts: TodayParts | null }) {
  return (
    <div
      className="flex h-10 shrink-0 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-left"
      aria-label={parts ? `Today, ${parts.weekday} ${parts.day} ${parts.month}` : "Today"}
    >
      <Calendar className="h-[18px] w-[18px] shrink-0 text-[#8B5CF6]" aria-hidden />
      {parts ? (
        <div className="flex min-w-[2.5rem] flex-col leading-none">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6B7A90]">
            {parts.weekday}
          </span>
          <span className="mt-0.5 text-sm font-semibold tabular-nums text-[#F8FAFC]">
            {parts.day} {parts.month}
          </span>
        </div>
      ) : (
        <span className="h-8 w-12 animate-pulse rounded bg-white/[0.06]" />
      )}
    </div>
  );
}

export function DashboardHeader() {
  const { profile, loading } = useProfile();
  const todayParts = useTodayParts();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_auto] lg:items-center lg:gap-6"
    >
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F8FAFC] md:text-[1.75rem] lg:text-3xl">
          {loading && !profile ? (
            <span className="inline-block h-9 w-64 max-w-full animate-pulse rounded-lg bg-white/[0.06]" />
          ) : (
            <>{greetingForProfile(profile)} 👋</>
          )}
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8] md:text-[15px]">
          {loading && !profile ? (
            <span className="inline-block h-4 w-80 max-w-full animate-pulse rounded bg-white/[0.04]" />
          ) : (
            dashboardSubtitle(profile)
          )}
        </p>
      </div>

      <div className="dash-search hidden items-center gap-2 rounded-xl px-3.5 py-2.5 transition-all md:flex lg:w-full">
        <Search className="h-4 w-4 shrink-0 text-[#6B7A90]" />
        <input
          type="search"
          placeholder="Search anything..."
          className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#6B7A90]"
        />
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-2.5">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#94A3B8] transition-colors hover:border-[#8B5CF6]/25 hover:bg-white/[0.06] hover:text-[#F8FAFC] active:scale-95 md:hidden"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        <HeaderTodayDate parts={todayParts} />
        <button
          type="button"
          className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#94A3B8] transition-colors hover:border-[#8B5CF6]/25 hover:bg-white/[0.06] hover:text-[#F8FAFC] active:scale-95"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#8B5CF6] ring-2 ring-[#0B1020]" />
        </button>
        <HeaderProfileMenu />
      </div>
    </motion.header>
  );
}
