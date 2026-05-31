"use client";

import { useProfile } from "@/hooks/useProfile";
import type { ChatMessage } from "../data";
import { AiAvatar } from "./ai-avatar";

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#E9D5FF]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const { profile } = useProfile();
  const initial = (profile?.name ?? "S").charAt(0).toUpperCase();

  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] px-4 py-3 text-sm leading-relaxed text-white shadow-[0_4px_24px_rgba(139,92,246,0.25)]">
            {message.content}
          </div>
          <p className="mt-1 text-right text-[10px] text-[#6B7A90]">{message.timestamp}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#38BDF8] to-[#8B5CF6] text-xs font-bold text-white">
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AiAvatar size="sm" />
      <div className="min-w-0 max-w-[90%] flex-1 sm:max-w-[85%]">
        <p className="mb-1 text-[11px] font-medium text-[#8B5CF6]">DhruvYantra AI</p>
        <div className="mentor-ai-bubble rounded-2xl rounded-bl-md border border-white/[0.08] px-4 py-3 text-sm leading-relaxed text-[#C4D4E8]">
          <p className="whitespace-pre-line">{renderContent(message.content)}</p>
          {message.plan ? (
            <ul className="mt-3 space-y-1.5 border-t border-white/[0.08] pt-3">
              {message.plan.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[#E2E8F0]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {message.actions ? (
            <div className="mt-4 border-t border-white/[0.08] pt-3">
              <p className="mb-2 text-xs text-[#94A3B8]">
                Shall I block Deep Focus time for this?
              </p>
              <div className="flex flex-wrap gap-2">
                {message.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      action.primary
                        ? "btn-gradient-glow text-white"
                        : "border border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <p className="mt-1 text-[10px] text-[#6B7A90]">{message.timestamp}</p>
      </div>
    </div>
  );
}
