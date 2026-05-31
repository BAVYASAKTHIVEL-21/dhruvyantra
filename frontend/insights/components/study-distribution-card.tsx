"use client";

import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { STUDY_DISTRIBUTION } from "../data";
import { CHART_TOOLTIP_STYLE } from "./chart-theme";

export function StudyDistributionCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="dash-glass-card rounded-2xl p-5 md:p-6"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Study Distribution</h3>
      <div className="relative mt-2 h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={STUDY_DISTRIBUTION}
              dataKey="hours"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={2}
              stroke="transparent"
            >
              {STUDY_DISTRIBUTION.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-xl font-bold text-[#F8FAFC]">28.5</span>
          <span className="text-[10px] text-[#6B7A90]">Total Hours</span>
        </div>
      </div>
      <ul className="mt-2 space-y-1.5 text-xs">
        {STUDY_DISTRIBUTION.map((s) => (
          <li key={s.name} className="flex justify-between text-[#94A3B8]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
            <span className="text-[#E2E8F0]">{s.hours}h</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3">
        <Lightbulb className="h-4 w-4 shrink-0 text-[#A78BFA]" />
        <p className="text-xs leading-relaxed text-[#C4B5FD]">
          Great balance! Try increasing Physics by 1–2 hours.
        </p>
      </div>
    </motion.div>
  );
}
