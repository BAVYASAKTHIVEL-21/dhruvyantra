"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { getMentorQuickActions } from "@/config/mentor-config";
import { useProfile } from "@/hooks/useProfile";
import { fetchMentorWelcome, sendMentorMessage } from "@/services/mentor/mentor-chat-service";
import type { MentorMode } from "@/types/mentor";
import type { ChatMessage } from "../data";
import { ChatMessageBubble } from "./chat-message";
import { MessageInput } from "./message-input";
import { QuickActions } from "./quick-actions";

function timestampLabel() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function toHistory(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));
}

export function ChatWorkspace({ mode = "study" }: { mode?: MentorMode }) {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quickActions, setQuickActions] = useState(getMentorQuickActions(null));
  const [loadingWelcome, setLoadingWelcome] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setQuickActions(getMentorQuickActions(profile.examType));
  }, [profile]);

  const loadWelcome = useCallback(async () => {
    if (!profile) return;
    setLoadingWelcome(true);
    setError(null);
    try {
      const { reply } = await fetchMentorWelcome(mode);
      setMessages([
        {
          id: "welcome",
          role: "ai",
          content: reply,
          timestamp: timestampLabel(),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach AI Mentor");
      setMessages([]);
    } finally {
      setLoadingWelcome(false);
    }
  }, [profile, mode]);

  useEffect(() => {
    void loadWelcome();
  }, [loadWelcome]);

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: timestampLabel(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setError(null);

    try {
      const history = toHistory(messages);
      const { reply } = await sendMentorMessage(text, history, mode);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "ai",
          content: reply,
          timestamp: timestampLabel(),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach AI Mentor");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div className="mentor-chat flex min-h-[520px] flex-col rounded-2xl border border-white/[0.08] bg-[#111827]/40 lg:min-h-[calc(100vh-280px)]">
      {profile?.examType ? (
        <motion.div className="border-b border-white/[0.06] px-4 py-2 text-center text-xs text-[#8B5CF6]">
          {profile.examType} Mentor mode · weak focus:{" "}
          {profile.weakTopics[0] ?? profile.weakSubjects[0] ?? "syllabus"}
        </motion.div>
      ) : null}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
        {loadingWelcome && messages.length === 0 ? (
          <p className="text-sm text-[#6B7A90]">Connecting to your AI mentor…</p>
        ) : null}
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ChatMessageBubble message={msg} />
          </motion.div>
        ))}
        {sending ? (
          <p className="text-xs text-[#6B7A90]">DhruvYantra AI is thinking…</p>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-[#F87171]/30 bg-[#F87171]/10 px-3 py-2 text-xs text-[#FCA5A5]">
            {error}
            <button
              type="button"
              onClick={() => void loadWelcome()}
              className="ml-2 cursor-pointer underline"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <QuickActions actions={quickActions} onSelect={(text) => void handleSend(text)} />
        <div className="mt-3">
          <MessageInput onSend={(text) => void handleSend(text)} />
        </div>
      </div>
    </motion.div>
  );
}
