"use client";

import { Check, Flame } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { focusStreakMessage, useFocusStreak } from "@/hooks/useFocusStreak";

export function FocusStreakCard() {
  const { profile } = useProfile();
  const { streak, loading } = useFocusStreak();

  const message = focusStreakMessage(streak, profile?.name);
  const weekDays = streak.weekDays;

  return (
    <div className="dash-glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Flame className="h-6 w-6 text-[#F97316]" />
        <p className="font-heading text-2xl font-bold text-[#F8FAFC]">
          {loading ? "…" : `${streak.current} Day${streak.current === 1 ? "" : "s"}`}
        </p>
      </div>
      <p className="mt-2 text-sm text-[#94A3B8]">{message}</p>

      <p className="mt-4 text-xs font-medium text-[#6B7A90]">This week&apos;s streak</p>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-semibold transition-all ${
                day.completed
                  ? "bg-[#8B5CF6]/30 text-[#E9D5FF] ring-1 ring-[#8B5CF6]/50"
                  : day.isToday
                    ? "bg-white/[0.08] text-[#94A3B8] ring-1 ring-dashed ring-[#8B5CF6]/40"
                    : "bg-white/[0.04] text-[#6B7A90]"
              }`}
              title={day.day}
            >
              {day.completed ? (
                <Check className="h-3.5 w-3.5 text-[#C4B5FD]" />
              ) : (
                day.short
              )}
            </div>
            <span
              className={`text-[9px] ${
                day.isToday ? "font-medium text-[#C4B5FD]" : "text-[#6B7A90]"
              }`}
            >
              {day.day.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#94A3B8]">
        {streak.weeklyCompletedCount} of 7 days focused this week
        {streak.longest > streak.current ? ` · Best ${streak.longest} days` : ""}
      </p>
    </div>
  );
}
