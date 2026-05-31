"use client";

import { motion } from "framer-motion";

export function MotivationBanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="focus-motivation-banner relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 md:p-8"
    >
      <div className="focus-silhouette absolute inset-0" aria-hidden />
      <div className="relative z-10 max-w-md">
        <p className="font-heading text-lg font-bold leading-snug text-[#F8FAFC] md:text-xl">
          The harder you focus,
          <br />
          the luckier you get.
        </p>
        <p className="mt-2 text-sm text-[#94A3B8]">Stay consistent. Success is near.</p>
      </div>
    </motion.div>
  );
}
