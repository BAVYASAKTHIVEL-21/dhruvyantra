"use client";

import { motion } from "framer-motion";
import type { ParentSubjectPerformance } from "@/types/parent-connect";
import { SUBJECT_PERFORMANCE, type SubjectLevel } from "../data";

const LEVEL_COLORS: Record<SubjectLevel, string> = {
  strong: "#22C55E",
  average: "#EAB308",
  weak: "#EF4444",
};

type Props = {
  subjects?: ParentSubjectPerformance[];
};

export function SubjectPerformanceCard({ subjects }: Props) {
  const rows = subjects ?? SUBJECT_PERFORMANCE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="dash-glass-card rounded-2xl p-5 md:p-6"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">
        Subject Wise Performance
      </h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[#94A3B8]">Complete planner tasks to see subject scores.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {rows.map((item) => (
            <li key={item.subject}>
              <motion.div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-[#E2E8F0]">{item.subject}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      item.trend.startsWith("-") ? "text-[#F87171]" : "text-[#34D399]"
                    }`}
                  >
                    {item.trend}
                  </span>
                  <span className="font-heading font-bold text-[#F8FAFC]">{item.score}%</span>
                </div>
              </motion.div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                    boxShadow: `0 0 10px ${LEVEL_COLORS[item.level]}44`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
