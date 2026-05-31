import type { MentorChatRequest, MentorChatResponse } from "@/types/mentor";

export async function fetchMentorWelcome(mode: MentorChatRequest["mode"] = "study"): Promise<MentorChatResponse> {
  const res = await fetch("/api/mentor/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: "welcome", mode }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load mentor welcome");
  }

  return res.json();
}

export async function sendMentorMessage(
  message: string,
  history: MentorChatRequest["history"] = [],
  mode: MentorChatRequest["mode"] = "study",
): Promise<MentorChatResponse> {
  const res = await fetch("/api/mentor/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "chat",
      message,
      history,
      mode,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to send mentor message");
  }

  return res.json();
}
