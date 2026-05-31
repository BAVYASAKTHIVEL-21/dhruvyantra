"use client";

import { useMemo } from "react";
import { Zap } from "lucide-react";
import { useFocusStreak } from "@/hooks/useFocusStreak";
import { useProfile } from "@/hooks/useProfile";
import { computeFocusAtmosphere } from "@/lib/focus/atmosphere";
import { isoDate } from "@/lib/mission-control/dates";
import { loadLocalFocusHistory } from "@/services/focus/focus-history-service";

export type FocusAtmospherePanelProps = {
  topic: string;
  subject: string;
  elapsedSeconds: number;
  secondsRemaining: number;
  running: boolean;
  cycle: number;
  totalCycles: number;
};

export function FocusAtmospherePanel({
  topic,
  subject,
  elapsedSeconds,
  secondsRemaining,
  running,
  cycle,
  totalCycles,
}: FocusAtmospherePanelProps) {
  const { profile } = useProfile();
  const { streak } = useFocusStreak();

  const atmosphere = useMemo(() => {
    const today = isoDate();
    const completedTodayMinutes = Math.round(
      loadLocalFocusHistory()
        .filter((s) => s.date === today)
        .reduce((sum, s) => sum + s.elapsedSeconds, 0) / 60,
    );

    return computeFocusAtmosphere({
      dailyStudyHours: profile?.dailyStudyHours ?? 2,
      productiveTime: profile?.productiveTime ?? null,
      examType: profile?.examType ?? null,
      topic,
      subject,
      todayFocusMinutes: completedTodayMinutes,
      sessionElapsedSeconds: elapsedSeconds,
      secondsRemaining,
      running,
      cycle,
      totalCycles,
      studiedToday: streak.studiedToday || completedTodayMinutes > 0,
      currentStreak: streak.current,
    });
  }, [
    profile?.dailyStudyHours,
    profile?.productiveTime,
    profile?.examType,
    topic,
    subject,
    elapsedSeconds,
    secondsRemaining,
    running,
    cycle,
    totalCycles,
    streak.studiedToday,
    streak.current,
  ]);

  return (
    <div className="flex flex-col justify-center gap-4 border-b border-white/[0.06] p-5 lg:border-b-0 lg:border-r lg:p-6">
      <div className="rounded-xl border border-white/[0.08] bg-[#111827]/80 p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[#94A3B8]">{atmosphere.goalLabel}</span>
          <span className="font-semibold tabular-nums text-[#F8FAFC]">
            {atmosphere.goalTarget}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] transition-all duration-700"
            style={{ width: `${atmosphere.goalProgress}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-[#6B7A90]">{atmosphere.goalProgressLabel}</p>
      </div>

      <div className="flex gap-3 rounded-xl border border-[#38BDF8]/15 bg-[#38BDF8]/8 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8]/15">
          <Zap className="h-4 w-4 text-[#38BDF8]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#7DD3FC]">{atmosphere.energy}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">{atmosphere.tip}</p>
        </div>
      </div>
    </div>
  );
}
