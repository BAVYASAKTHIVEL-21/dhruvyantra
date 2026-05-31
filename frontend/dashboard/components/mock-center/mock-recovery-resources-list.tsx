"use client";

import { motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { MockRecoveryResourceRow } from "@/types/mock-center";

type Props = {
  resources: MockRecoveryResourceRow[];
  title?: string;
  compact?: boolean;
};

export function MockRecoveryResourcesList({
  resources,
  title = "Recovery materials",
  compact = false,
}: Props) {
  if (resources.length === 0) return null;

  return (
    <motion.div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="flex items-center gap-2 text-sm font-semibold text-[#E2E8F0]">
        <BookOpen className="h-4 w-4 text-[#A78BFA]" />
        {title}
      </p>
      <ul className="space-y-2">
        {resources.map((rec, i) => (
          <motion.li
            key={rec.resourceId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={rec.href}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#F8FAFC]">{rec.title}</p>
                <p className="mt-0.5 text-xs text-[#6B7A90]">
                  {rec.type} · {rec.subject} · {rec.topic}
                </p>
                {!compact ? (
                  <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                    {rec.reason.replace(/\*\*/g, "")}
                  </p>
                ) : null}
              </div>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#A78BFA]" />
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
