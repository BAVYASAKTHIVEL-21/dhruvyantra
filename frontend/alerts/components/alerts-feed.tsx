"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { AlertItem } from "../data";
import { getOlderCount } from "../services/alertsService";
import { AlertCard } from "./alert-card";

function AlertGroup({
  label,
  alerts,
}: {
  label: string;
  alerts: AlertItem[];
}) {
  if (alerts.length === 0) return null;
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B7A90]">
        {label}
      </h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <AlertCard alert={alert} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function AlertsFeed({ alerts }: { alerts: AlertItem[] }) {
  const [olderOpen, setOlderOpen] = useState(false);
  const today = alerts.filter((a) => a.group === "today");
  const yesterday = alerts.filter((a) => a.group === "yesterday");

  return (
    <div className="space-y-8">
      <AlertGroup label="Today" alerts={today} />
      <AlertGroup label="Yesterday" alerts={yesterday} />

      <section>
        <button
          type="button"
          onClick={() => setOlderOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-[#94A3B8] hover:border-[#8B5CF6]/20 hover:text-[#E2E8F0]"
        >
          <span>Older Alerts ({getOlderCount()})</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${olderOpen ? "rotate-180" : ""}`}
          />
        </button>
        {olderOpen ? (
          <p className="mt-3 text-center text-xs text-[#6B7A90]">
            Older alerts load from your archive — connect backend to view all.
          </p>
        ) : null}
      </section>
    </div>
  );
}
