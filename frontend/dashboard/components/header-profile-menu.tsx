"use client";

import { LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardLogout } from "../lib/use-dashboard-logout";

export function HeaderProfileMenu() {
  const { profile } = useProfile();
  const { logout, loggingOut } = useDashboardLogout();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const name = profile?.name ?? "Student";
  const role = profile?.role ?? "Aspirant";
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#38BDF8] to-[#8B5CF6] text-sm font-bold text-white ring-2 ring-white/10 transition-transform hover:ring-[#8B5CF6]/40 active:scale-95"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F172A]/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-md"
        >
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-[#F8FAFC]">{name}</p>
            <p className="text-xs text-[#94A3B8]">{role}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#94A3B8] transition-colors hover:bg-white/[0.06] hover:text-[#F8FAFC] disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
