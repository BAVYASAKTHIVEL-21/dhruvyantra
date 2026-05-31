"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Study Plans",
    description: "Personalized schedules aligned to your exam timeline.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Track mastery, weak topics, and revision gaps.",
  },
  {
    icon: Sparkles,
    title: "Stay Consistent",
    description: "Daily missions and streaks that keep you on track.",
  },
  {
    icon: Bot,
    title: "AI Mentor",
    description: "Guidance when you are stuck — not just answers.",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
            <feature.icon className="h-4 w-4 text-[#A78BFA]" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-semibold text-[#F8FAFC]">{feature.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
