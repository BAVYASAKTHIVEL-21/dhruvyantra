"use client";

import { motion } from "framer-motion";
import { RESOURCE_TYPE_FILTERS } from "../services/resourceService";
import type { ResourceFilter } from "../types";

export function ResourceFilterTabs({
  active,
  onChange,
}: {
  active: ResourceFilter;
  onChange: (filter: ResourceFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {RESOURCE_TYPE_FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={`relative cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === filter
              ? "text-[#F8FAFC]"
              : "text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#E2E8F0]"
          }`}
        >
          {active === filter ? (
            <motion.span
              layoutId="resourceFilterPill"
              className="focus-tab-active absolute inset-0 rounded-full"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          ) : null}
          <span className="relative z-10">{filter}</span>
        </button>
      ))}
    </div>
  );
}
