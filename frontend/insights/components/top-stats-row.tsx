"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Brain,
  Clock,
  FileQuestion,
  Target,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TOP_STATS } from "../data";

const ICONS: Record<string, typeof Clock> = {
  hours: Clock,
  questions: FileQuestion,
  tests: Target,
  accuracy: BarChart3,
  focus: Brain,
};

export function TopStatsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {TOP_STATS.map((stat, i) => {
        const Icon = ICONS[stat.id] ?? Clock;
        const sparkData = stat.spark.map((v, idx) => ({ i: idx, v }));

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="dash-glass-card group rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10"
                style={{
                  background: `linear-gradient(135deg, ${stat.accent}22, transparent)`,
                  boxShadow: `0 0 20px ${stat.accent}33`,
                }}
              >
                <Icon className="h-5 w-5" style={{ color: stat.accent }} />
              </div>
              <div className="h-10 w-20 opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id={`spark-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stat.accent} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={stat.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={stat.accent}
                      strokeWidth={1.5}
                      fill={`url(#spark-${stat.id})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6B7A90]">{stat.label}</p>
            <p className="font-heading mt-1 text-xl font-bold text-[#F8FAFC]">{stat.value}</p>
            <p className="mt-1 text-xs text-[#22C55E]">{stat.trend}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
