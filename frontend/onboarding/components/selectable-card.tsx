"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function SelectableCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`onboard-glass-card group relative w-full rounded-2xl p-5 text-left transition-all ${
        selected
          ? "border-[#8B5CF6] shadow-[0_0_32px_rgba(139,92,246,0.35)] ring-1 ring-[#8B5CF6]/60"
          : "border-white/[0.08] hover:border-white/20"
      } ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {selected && (
        <motion.span
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6] text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </motion.span>
      )}
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
          selected ? "bg-[#8B5CF6]/25 text-[#C4B5FD]" : "bg-white/[0.06] text-[#94A3B8]"
        }`}
      >
        {icon}
      </div>
      <p className="font-heading text-lg font-bold text-[#F8FAFC]">{title}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-[#94A3B8]">{subtitle}</p>
      )}
    </motion.button>
  );
}

export function SubjectChip({
  label,
  selected,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`onboard-glass-card relative flex flex-col items-center gap-2 rounded-xl p-4 transition-all ${
        selected
          ? "border-[#8B5CF6] shadow-[0_0_24px_rgba(139,92,246,0.3)] ring-1 ring-[#8B5CF6]/50"
          : "border-white/[0.06] hover:border-white/15"
      }`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6]">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      )}
      <span className={selected ? "text-[#C4B5FD]" : "text-[#64748B]"}>{icon}</span>
      <span className="text-center text-xs font-medium text-[#E2E8F0]">{label}</span>
    </motion.button>
  );
}
