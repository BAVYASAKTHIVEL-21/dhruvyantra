"use client";

import { motion } from "framer-motion";

export function HoursSlider({
  value,
  onChange,
  min = 2,
  max = 12,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const circumference = 2 * Math.PI * 88;
  const offset = circumference - (pct / 100) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-56 w-56 md:h-64 md:w-64">
        <svg className="h-full w-full -rotate-[135deg]" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          <motion.circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="url(#hoursGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeDashoffset={offset}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.35 }}
          />
          <defs>
            <linearGradient id="hoursGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            key={value}
            className="font-heading text-4xl font-bold text-[#F8FAFC] md:text-5xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {value}
          </motion.span>
          <span className="mt-1 text-sm text-[#94A3B8]">Hours per day</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="onboard-range mt-6 w-full max-w-xs"
        aria-label="Daily study hours"
      />

      <div className="mt-2 flex w-full max-w-xs justify-between text-xs text-[#64748B]">
        <span>{min} hrs</span>
        <span>{max} hrs</span>
      </div>
    </div>
  );
}
