"use client";

import { BadgeCheck } from "lucide-react";
import type { StudentConnection } from "../data";

export function RecommendedConnections({ students }: { students: StudentConnection[] }) {
  return (
    <section>
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">
        Recommended Connections
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <div
            key={student.id}
            className="dash-glass-card flex flex-col rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#38BDF8] text-sm font-bold text-white">
                  {student.name.charAt(0)}
                </div>
                {student.online ? (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111827] bg-[#22C55E]" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate font-heading text-sm font-bold text-[#F8FAFC]">
                    {student.name}
                  </p>
                  <BadgeCheck className="h-4 w-4 shrink-0 text-[#38BDF8]" />
                </div>
                <p className="text-[11px] text-[#6B7A90]">{student.exam}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-[#C4B5FD]">{student.target}</p>
            <button
              type="button"
              className="mt-4 w-full cursor-pointer rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 py-2 text-xs font-semibold text-[#E9D5FF] transition-colors hover:bg-[#8B5CF6]/25"
            >
              Connect
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
