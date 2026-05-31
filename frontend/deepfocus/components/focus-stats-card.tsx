"use client";

import { motion } from "framer-motion";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";

const CHART_HEIGHT = 72;

export function FocusStatsCard() {
  const { analytics, loading } = useFocusAnalytics();
  const maxMinutes = Math.max(1, ...analytics.weeklyBars.map((b) => b.minutes));
  const isEmpty = analytics.weeklyBars.every((b) => b.minutes === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="dash-glass-card rounded-2xl p-5"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Focus Stats</h3>

      {loading && isEmpty ? (
        <p className="mt-4 text-sm text-[#94A3B8]">Loading your focus data…</p>
      ) : null}

      {!loading && isEmpty ? (
        <p className="mt-4 text-sm text-[#94A3B8]">
          Complete a focus session to see your stats here.
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {analytics.stats.map((stat) => (
          <li
            key={stat.label}
            className="flex items-center justify-between border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
          >
            <span className="text-sm text-[#6B7A90]">{stat.label}</span>
            <div className="text-right">
              <p className="font-heading text-sm font-bold text-[#F8FAFC]">{stat.value}</p>
              {stat.trend ? (
                <p
                  className={`text-xs ${
                    stat.trendPositive === false ? "text-[#F87171]" : "text-[#34D399]"
                  }`}
                >
                  {stat.trend}
                </p>
              ) : null}
              {stat.sub ? <p className="text-xs text-[#8B5CF6]">{stat.sub}</p> : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-[#6B7A90]">Weekly focus</p>
          <p className="text-xs font-medium text-[#94A3B8]">{analytics.weeklyTotalLabel} total</p>
        </div>
        <div className="flex items-end justify-between gap-1" style={{ height: CHART_HEIGHT + 36 }}>
          {analytics.weeklyBars.map((bar) => {
            const barHeight =
              bar.minutes > 0 ? Math.max(8, (bar.minutes / maxMinutes) * CHART_HEIGHT) : 4;
            return (
              <div
                key={bar.date}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-[9px] tabular-nums text-[#6B7A90]">{bar.label}</span>
                <div
                  className="flex w-full items-end justify-center"
                  style={{ height: CHART_HEIGHT }}
                >
                  <div
                    className={`w-[78%] max-w-[22px] rounded-t transition-all ${
                      bar.isToday
                        ? "bg-gradient-to-t from-[#EC4899] to-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.45)]"
                        : bar.minutes > 0
                          ? "bg-gradient-to-t from-[#8B5CF6]/45 to-[#8B5CF6]"
                          : "bg-white/[0.08]"
                    }`}
                    style={{ height: barHeight }}
                    title={`${bar.day}: ${bar.label}`}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    bar.isToday ? "font-semibold text-[#C4B5FD]" : "text-[#6B7A90]"
                  }`}
                >
                  {bar.day.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
