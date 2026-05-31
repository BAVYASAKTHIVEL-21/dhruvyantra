"use client";

import { motion } from "framer-motion";
import { Check, Clock, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { focusStreakMessage } from "@/hooks/useFocusStreak";
import { useMentorInsights } from "@/hooks/useMentorInsights";
import { useProfile } from "@/hooks/useProfile";
import { sparklinePoints, type MentorRecommendedAction } from "@/lib/mentor/insights";

export function MentorInsightsPanel() {
  const { profile } = useProfile();
  const { insights, loading } = useMentorInsights();
  const [actions, setActions] = useState<MentorRecommendedAction[]>(insights.recommendedActions);

  useEffect(() => {
    setActions(insights.recommendedActions);
  }, [insights.recommendedActions]);

  const maxTrend = Math.max(...insights.focusTrend, 1);
  const streakMessage = focusStreakMessage(
    {
      current: insights.focusStreak.current,
      longest: insights.focusStreak.longest,
      studiedToday: insights.focusStreak.weekDays.some((d) => d.done),
      weeklyCompletedCount: insights.focusStreak.weekDays.filter((d) => d.done).length,
      weekDays: [],
    },
    profile?.name,
  );

  return (
    <aside className="space-y-4">
      {/* Focus level */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="dash-glass-card rounded-2xl p-5"
      >
        <p className="text-xs text-[#6B7A90]">Focus Level</p>
        <div className="mt-2 flex items-center gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="url(#focusInsightGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - insights.focusLevel / 100)}
              />
              <defs>
                <linearGradient id="focusInsightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute font-heading text-lg font-bold text-[#F8FAFC]">
              {loading ? "…" : `${insights.focusLevel}%`}
            </span>
          </div>
          <div>
            <p className="font-medium text-[#34D399]">{loading ? "Loading…" : insights.focusLabel}</p>
            <div className="mt-2 flex h-8 items-end gap-0.5">
              {insights.focusTrend.map((v, i) => (
                <div
                  key={i}
                  className="w-2 rounded-t bg-gradient-to-t from-[#8B5CF6]/40 to-[#8B5CF6]"
                  style={{ height: `${(v / maxTrend) * 100}%`, minHeight: 4 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI observation */}
      <div className="dash-glass-card rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15">
            <Clock className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#8B5CF6]">AI Observation</p>
            <p className="mt-1 text-sm text-[#94A3B8]">You perform best during:</p>
            <p className="font-heading text-sm font-bold text-[#F8FAFC]">{insights.bestHours}</p>
          </div>
        </div>
      </div>

      {/* Weekly improvement */}
      <div className="dash-glass-card rounded-2xl p-4">
        <p className="text-xs text-[#6B7A90]">Weekly Improvement</p>
        <p className="font-heading mt-1 text-xl font-bold text-[#34D399]">
          {loading ? "…" : `${insights.weeklyAccuracy}%`} Accuracy
        </p>
        <div className="mt-2 h-10">
          <svg viewBox="0 0 100 40" className="h-full w-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#22C55E"
              strokeWidth="2"
              points={sparklinePoints(insights.weeklyTrend)}
              className="drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]"
            />
          </svg>
        </div>
      </div>

      {/* Consistency */}
      <div className="dash-glass-card rounded-2xl p-4">
        <p className="text-xs text-[#6B7A90]">Consistency Score</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - insights.consistencyScore / 100)}
              />
            </svg>
            <span className="absolute text-sm font-bold text-[#F8FAFC]">
              {loading ? "…" : `${insights.consistencyScore}%`}
            </span>
          </div>
          <p className="text-sm font-medium text-[#A78BFA]">
            {loading ? "…" : insights.consistencyLabel}
          </p>
        </div>
      </div>

      {/* Recommended actions */}
      <div className="dash-glass-card rounded-2xl p-4">
        <p className="text-xs font-medium text-[#6B7A90]">Recommended Actions</p>
        <ul className="mt-3 space-y-2">
          {actions.length === 0 ? (
            <li className="text-xs text-[#6B7A90]">
              {loading ? "Loading actions…" : "Complete onboarding or add planner tasks."}
            </li>
          ) : (
            actions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  setActions((prev) =>
                    prev.map((a) =>
                      a.id === item.id ? { ...a, done: !a.done } : a,
                    ),
                  )
                }
                className="flex w-full cursor-pointer items-start gap-2 text-left text-xs text-[#E2E8F0]"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    item.done
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/30"
                      : "border-white/20"
                  }`}
                >
                  {item.done ? <Check className="h-2.5 w-2.5" /> : null}
                </span>
                <span className={item.done ? "text-[#6B7A90] line-through" : ""}>
                  {item.label}
                </span>
              </button>
            </li>
          ))
          )}
        </ul>
      </div>

      {/* Motivation */}
      <div className="mentor-motivation relative overflow-hidden rounded-2xl border border-white/[0.08] p-4">
        <div className="mentor-motivation-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <p className="font-heading text-sm font-bold leading-snug text-[#F8FAFC]">
            {insights.motivation.quote.replace(/\*\*(.*?)\*\*/g, "$1")}
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">{insights.motivation.action}</p>
        </div>
      </div>

      {/* Streak */}
      <div className="dash-glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-[#F97316]" />
          <span className="font-heading text-lg font-bold text-[#F8FAFC]">{loading ? "…" : `${insights.focusStreak.current} Days`}</span>
        </div>
        <p className="mt-1 text-xs text-[#94A3B8]">{streakMessage}</p>
        <div className="mt-3 flex justify-between gap-1">
          {insights.focusStreak.weekDays.map((d, i) => (
            <div
              key={`${d.day}-${i}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-medium ${
                d.done
                  ? "bg-[#8B5CF6]/30 text-[#C4B5FD] ring-1 ring-[#8B5CF6]/40"
                  : "bg-white/[0.06] text-[#6B7A90]"
              }`}
            >
              {d.done ? <Check className="h-3 w-3" /> : d.day}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
