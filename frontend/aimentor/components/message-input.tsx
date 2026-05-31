"use client";

import { Paperclip, Send } from "lucide-react";
import { useState } from "react";

export function MessageInput({ onSend }: { onSend?: (text: string) => void }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onSend?.(t);
    setValue("");
  };

  return (
    <div className="mentor-input-bar flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#111827]/80 px-3 py-2 backdrop-blur-xl">
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[#6B7A90] hover:bg-white/[0.06] hover:text-[#F8FAFC]"
        aria-label="Attach"
      >
        <Paperclip className="h-5 w-5" />
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Message AI Mentor…"
        className="min-w-0 flex-1 bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#6B7A90]"
      />
      <button
        type="button"
        onClick={submit}
        className="mentor-send-btn flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
