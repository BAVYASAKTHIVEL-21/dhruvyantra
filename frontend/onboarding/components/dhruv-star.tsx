"use client";

import { motion } from "framer-motion";

export function DhruvStar({ size = "lg" }: { size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-40 w-40 md:h-52 md:w-52" : "h-28 w-28";

  return (
    <div className={`relative mx-auto ${dim}`}>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full bg-[#8B5CF6]/25 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto h-8 w-32 rounded-full bg-[#8B5CF6]/20 blur-xl" />

      <motion.svg
        viewBox="0 0 120 120"
        className="relative z-10 h-full w-full drop-shadow-[0_0_40px_rgba(139,92,246,0.6)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <defs>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d="M60 8L72 44L108 60L72 76L60 112L48 76L12 60L48 44Z"
          fill="url(#starGrad)"
          filter="url(#starGlow)"
          animate={{ rotate: [0, 2, 0, -2, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "60px 60px" }}
        />
      </motion.svg>

      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#38BDF8]/80"
          style={{
            left: `${20 + (i * 13) % 60}%`,
            top: `${15 + (i * 17) % 50}%`,
          }}
          animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -8, 0] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
