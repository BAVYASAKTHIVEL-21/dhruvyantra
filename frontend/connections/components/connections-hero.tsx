"use client";

import { motion } from "framer-motion";
import { UserPlus, Users } from "lucide-react";

function NetworkIllustration() {
  const avatars = [
    { x: "15%", y: "25%", delay: 0 },
    { x: "75%", y: "20%", delay: 0.3 },
    { x: "20%", y: "70%", delay: 0.6 },
    { x: "80%", y: "65%", delay: 0.9 },
  ];
  return (
    <div className="relative h-36 w-full max-w-[280px] md:h-40">
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="#8B5CF6" strokeWidth="1" />
        <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="#8B5CF6" strokeWidth="1" />
        <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="#38BDF8" strokeWidth="1" />
        <line x1="75%" y1="70%" x2="50%" y2="50%" stroke="#38BDF8" strokeWidth="1" />
      </svg>
      <motion.div
        className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] shadow-[0_0_32px_rgba(139,92,246,0.5)]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="text-lg">✦</span>
      </motion.div>
      {avatars.map((a, i) => (
        <motion.div
          key={i}
          className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#38BDF8] to-[#8B5CF6] text-xs font-bold text-white ring-2 ring-[#0B1020]"
          style={{ left: a.x, top: a.y }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, delay: a.delay, repeat: Infinity }}
        >
          {String.fromCharCode(65 + i)}
        </motion.div>
      ))}
    </div>
  );
}

export function ConnectionsHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="connections-hero relative overflow-hidden rounded-2xl border border-[#8B5CF6]/20 p-6 md:p-8"
    >
      <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <h2 className="font-heading text-2xl font-bold text-[#F8FAFC] md:text-3xl">
            Collaborate. Share. Succeed.
          </h2>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Connect with like-minded aspirants, mentors and experts.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-gradient-glow flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            >
              <UserPlus className="h-4 w-4" />
              Find Study Buddies
            </button>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[#E2E8F0] hover:border-[#8B5CF6]/30"
            >
              <Users className="h-4 w-4 text-[#A78BFA]" />
              Create Group
            </button>
          </div>
        </div>
        <NetworkIllustration />
      </div>
    </motion.div>
  );
}
