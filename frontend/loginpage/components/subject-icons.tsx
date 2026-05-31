"use client";

import { motion } from "framer-motion";
import { Atom, Beaker, Dna, SquareRadical } from "lucide-react";

const subjects = [
  { Icon: Atom, label: "Physics", x: "8%", y: "14%", delay: 0, orbit: 8 },
  { Icon: Beaker, label: "Chemistry", x: "82%", y: "18%", delay: 0.6, orbit: -6 },
  { Icon: SquareRadical, label: "Math", x: "88%", y: "52%", delay: 1.2, orbit: 10 },
  { Icon: Dna, label: "Biology", x: "4%", y: "46%", delay: 1.8, orbit: -8 },
];

export function SubjectIcons() {
  return (
    <>
      {subjects.map(({ Icon, label, x, y, delay, orbit }) => (
        <motion.div
          key={label}
          className="absolute z-20 flex h-11 w-11 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/15 to-[#38BDF8]/10 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: 1,
            y: [0, orbit, 0],
            x: [0, orbit / 2, 0],
          }}
          transition={{
            opacity: { duration: 3, repeat: Infinity, delay },
            scale: { duration: 0.5, delay },
            y: { duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay },
            x: { duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay },
          }}
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 28px rgba(139,92,246,0.35)",
          }}
          title={label}
        >
          <Icon className="h-5 w-5 text-[#A78BFA]" strokeWidth={1.75} />
        </motion.div>
      ))}
    </>
  );
}
