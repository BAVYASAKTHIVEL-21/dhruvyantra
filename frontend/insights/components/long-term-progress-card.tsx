"use client";

import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LONG_TERM_MONTHS } from "../data";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE } from "./chart-theme";

export function LongTermProgressCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="dash-glass-card rounded-2xl p-5 md:p-6"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Long Term Progress</h3>
      <p className="mt-1 text-xs text-[#6B7A90]">Your improvement over time</p>
      <div className="insights-chart-glow mt-4 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={LONG_TERM_MONTHS} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: CHART_AXIS, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis domain={[40, 90]} tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#C4B5FD" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
