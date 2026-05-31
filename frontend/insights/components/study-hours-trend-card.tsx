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
import { STUDY_HOURS_WEEKS } from "../data";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE } from "./chart-theme";

export function StudyHoursTrendCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="dash-glass-card rounded-2xl p-5 md:p-6"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Study Hours Trend</h3>
      <p className="mt-1 text-xs text-[#6B7A90]">Your consistency over the last 8 weeks</p>
      <div className="insights-chart-glow mt-4 h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={STUDY_HOURS_WEEKS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="week" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              dot={{ fill: "#8B5CF6", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#C4B5FD", stroke: "#8B5CF6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
