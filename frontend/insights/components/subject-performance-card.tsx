"use client";

import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SUBJECT_PERFORMANCE } from "../data";
import { CHART_TOOLTIP_STYLE } from "./chart-theme";

export function SubjectPerformanceCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="dash-glass-card rounded-2xl p-5 md:p-6"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Subject Wise Performance</h3>
      <div className="relative mt-2 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={SUBJECT_PERFORMANCE}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              stroke="transparent"
            >
              {SUBJECT_PERFORMANCE.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-bold text-[#F8FAFC]">78%</span>
          <span className="text-[10px] text-[#6B7A90]">Overall</span>
        </div>
      </div>
      <ul className="mt-2 space-y-2">
        {SUBJECT_PERFORMANCE.map((s) => (
          <li key={s.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-[#94A3B8]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
            <span className="font-medium text-[#E2E8F0]">{s.value}%</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
