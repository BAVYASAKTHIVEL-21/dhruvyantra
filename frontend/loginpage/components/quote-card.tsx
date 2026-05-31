"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { HolographicCard } from "./holographic-card";

export function QuoteCard() {
  return (
    <HolographicCard
      glow="purple"
      float
      className="max-w-md px-5 py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ opacity: { duration: 0.8, delay: 0.6 }, y: { duration: 0.8, delay: 0.6 } }}
    >
      <Quote className="mb-2 h-5 w-5 text-[#8B5CF6]/80" />
      <p className="font-heading text-base font-medium leading-relaxed text-[#F8FAFC]">
        &ldquo;Discipline today. Freedom tomorrow.&rdquo;
      </p>
      <p className="mt-2 text-xs text-[#94A3B8]">— Your future self</p>
    </HolographicCard>
  );
}
