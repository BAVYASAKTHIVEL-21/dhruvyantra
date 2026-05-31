"use client";

import { Atom, FlaskConical, Rocket, Sigma, Target } from "lucide-react";
import type { StudyGroup } from "../data";

const GROUP_ICONS = {
  rocket: Rocket,
  atom: Atom,
  flask: FlaskConical,
  sigma: Sigma,
  target: Target,
};

export function StudyGroupsSection({ groups }: { groups: StudyGroup[] }) {
  return (
    <section>
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">
        Popular Study Groups
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const Icon = GROUP_ICONS[group.icon];
          return (
            <div
              key={group.id}
              className="connections-group-card rounded-2xl border border-[#8B5CF6]/15 p-5 transition-all hover:-translate-y-0.5 hover:border-[#8B5CF6]/35 hover:shadow-[0_0_28px_rgba(139,92,246,0.12)]"
            >
              <div className="connections-group-icon flex h-14 w-14 items-center justify-center rounded-xl">
                <Icon className="h-7 w-7 text-[#C4B5FD]" />
              </div>
              <p className="mt-3 font-heading text-sm font-bold text-[#F8FAFC]">
                {group.name}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6B7A90]">
                <span>{group.members} members</span>
                {group.activeNow ? (
                  <span className="flex items-center gap-1 text-[#34D399]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                    Active now
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="btn-gradient-glow mt-4 w-full cursor-pointer rounded-xl py-2 text-xs font-semibold text-white"
              >
                Join Group
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
