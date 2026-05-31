"use client";

import { motion } from "framer-motion";
import { MASTERY_COLORS, TOPIC_MASTERY } from "../data";

export function TopicMasteryCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="dash-glass-card rounded-2xl p-5 md:p-6"
    >
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Topic Mastery</h3>
      <ul className="mt-5 space-y-4">
        {TOPIC_MASTERY.map((item) => (
          <li key={item.topic}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-[#E2E8F0]">{item.topic}</span>
              <span className="font-medium" style={{ color: MASTERY_COLORS[item.level] }}>
                {item.pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${MASTERY_COLORS[item.level]}99, ${MASTERY_COLORS[item.level]})`,
                  boxShadow: `0 0 12px ${MASTERY_COLORS[item.level]}44`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
