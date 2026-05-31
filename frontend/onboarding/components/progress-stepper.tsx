"use client";

import { motion } from "framer-motion";

export function ProgressStepper({
  current,
  total = 6,
}: {
  current: number;
  total?: number;
}) {
  return (
    <div className="mx-auto flex max-w-md items-center justify-center gap-0 px-4">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;

        return (
          <div key={step} className="flex flex-1 items-center">
            <motion.div
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                active
                  ? "bg-[#8B5CF6] text-white shadow-[0_0_24px_rgba(139,92,246,0.6)] ring-2 ring-[#8B5CF6]/40"
                  : done
                    ? "bg-[#8B5CF6]/30 text-[#C4B5FD]"
                    : "bg-white/[0.06] text-[#6B7A90]"
              }`}
              animate={active ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {step}
            </motion.div>
            {step < total && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded-full transition-colors ${
                  done ? "bg-[#8B5CF6]/50" : "bg-white/[0.08]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
