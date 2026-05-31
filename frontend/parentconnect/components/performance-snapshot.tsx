"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import type { ParentPerformanceMetric } from "@/types/parent-connect";
import { PERFORMANCE_METRICS } from "../data";

const ICONS = {
  progress: TrendingUp,
  hours: Clock,
  mock: Activity,
  accuracy: Target,
  streak: Calendar,
};

type Props = {
  metrics?: ParentPerformanceMetric[];
};

export function PerformanceSnapshot({ metrics }: Props) {
  const rows =
    metrics ??
    PERFORMANCE_METRICS.map((m) => ({
      ...m,
      id: m.id as ParentPerformanceMetric["id"],
      progressPercent: m.id === "progress" ? 72 : undefined,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="dash-glass-card rounded-2xl p-5 md:p-6"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Performance Snapshot</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((metric) => {
          const Icon = ICONS[metric.id] ?? TrendingUp;
          const progress =
            metric.id === "progress"
              ? (metric.progressPercent ?? (Number.parseInt(metric.value, 10) || 0))
              : 0;
          const ringOffset = 2 * Math.PI * 22 * (1 - Math.min(progress, 100) / 100);

          return (
            <div
              key={metric.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5"
            >
              {metric.id === "progress" ? (
                <div className="relative mb-2 flex h-14 w-14 items-center justify-center">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-[#F8FAFC]">{metric.value}</span>
                </div>
              ) : (
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
                  <Icon className="h-5 w-5 text-[#A78BFA]" />
                </div>
              )}
              <p className="text-[10px] text-[#6B7A90]">{metric.label}</p>
              <p className="font-heading mt-0.5 text-lg font-bold text-[#F8FAFC]">{metric.value}</p>
              <p className="text-[10px] text-[#94A3B8]">{metric.sub}</p>
              <p
                className={`mt-1 text-[10px] font-medium ${
                  metric.positive ? "text-[#34D399]" : "text-[#F87171]"
                }`}
              >
                {metric.trend}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
