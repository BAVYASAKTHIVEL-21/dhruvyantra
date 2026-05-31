"use client";

import { motion } from "framer-motion";
import { Bot, CalendarCheck, Target } from "lucide-react";

const features = [
  { icon: CalendarCheck, title: "Smart Planning" },
  { icon: Bot, title: "AI Mentor" },
  { icon: Target, title: "Stay Consistent" },
];

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          className="feature-glass-card flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-shadow duration-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
          whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(139, 92, 246, 0.12)" }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] shadow-[0_0_20px_rgba(139,92,246,0.08)] ring-1 ring-white/[0.12]">
            <feature.icon className="h-4 w-4 text-[#C4B5FD]" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium text-[#E8EDF4]">{feature.title}</span>
        </motion.div>
      ))}
    </div>
  );
}
