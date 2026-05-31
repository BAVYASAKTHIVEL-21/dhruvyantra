"use client";

import { Download, FileText, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { CONNECT_OPTIONS } from "../data";

const CONNECT_ICONS = {
  report: FileText,
  telegram: Send,
  summary: MessageCircle,
};

async function sendParentNotify(kind: string) {
  const res = await fetch("/api/parent-connect/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.hint
          ? `${data.error} — ${data.hint}`
          : data.error
        : "Could not send Telegram update",
    );
  }
}

export function StayConnectedCard({
  telegramConfigured,
}: {
  telegramConfigured?: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onTelegram = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await sendParentNotify("daily_summary");
      setStatus("Daily summary sent to Telegram.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  const onSummary = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await sendParentNotify("missed_tasks");
      setStatus("Parent alert sent (if any missed tasks).");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dash-glass-card rounded-2xl p-5">
      <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Stay Connected</h3>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {CONNECT_OPTIONS.map((opt) => {
          const Icon = CONNECT_ICONS[opt.icon];
          const onClick =
            opt.icon === "telegram"
              ? onTelegram
              : opt.icon === "summary"
                ? onSummary
                : undefined;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={busy && Boolean(onClick)}
              onClick={onClick}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:border-[#8B5CF6]/25 hover:bg-[#8B5CF6]/10 disabled:opacity-50"
            >
              <Icon className="h-5 w-5 text-[#A78BFA]" />
              <span className="text-center text-[10px] font-medium text-[#94A3B8]">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {status ? (
        <p className="mt-3 text-center text-[11px] text-[#94A3B8]">{status}</p>
      ) : telegramConfigured === false ? (
        <p className="mt-3 text-center text-[11px] text-[#FBBF24]">
          Add TELEGRAM_BOT_TOKEN and TELEGRAM_PARENT_CHAT_ID to enable updates.
        </p>
      ) : null}
      <button
        type="button"
        className="btn-gradient-glow mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
      >
        <Download className="h-4 w-4" />
        Download Weekly Report
      </button>
    </div>
  );
}
