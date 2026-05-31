"use client";

import { GraduationCap, Rocket, Users, Zap } from "lucide-react";
import { STATS } from "../data";

const ICONS = {
  users: Users,
  groups: Users,
  mentor: GraduationCap,
  score: Zap,
};

export function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STATS.map((stat) => {
        const Icon = ICONS[stat.icon];
        return (
          <div
            key={stat.id}
            className="dash-glass-card flex items-center gap-3 rounded-xl p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
              <Icon className="h-5 w-5 text-[#A78BFA]" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-[#F8FAFC]">{stat.value}</p>
              <p className="text-[11px] text-[#6B7A90]">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
