import { createChatCompletion, isOpenRouterConfigured, streamChatCompletion } from "@/lib/llm/openrouter";
import { buildMentorIntelligenceContext } from "@/lib/mentor/context";
import { buildMentorMessages } from "@/lib/mentor/prompt";
import type { UserProfile } from "@/lib/profile/types";
import type {
  MentorChatRequest,
  MentorChatResponse,
  MentorIntelligenceContext,
  MentorMode,
} from "@/types/mentor";

const DEFAULT_MODE: MentorMode = "study";

function normalizeMode(mode?: string): MentorMode {
  if (mode === "concept" || mode === "strategy" || mode === "motivation" || mode === "study") {
    return mode;
  }
  return DEFAULT_MODE;
}

export async function runMentorChat(
  profile: UserProfile,
  request: MentorChatRequest,
): Promise<MentorChatResponse> {
  const mode = normalizeMode(request.mode);
  const intent = request.intent ?? "chat";
  const history = request.history ?? [];

  if (intent === "chat" && !request.message?.trim()) {
    throw new Error("Message is required");
  }

  const context = await buildMentorIntelligenceContext(profile);
  const messages = buildMentorMessages(
    context,
    mode,
    history,
    request.message,
    intent,
  );

  const result = await createChatCompletion({ messages });

  if (!result.content) {
    throw new Error("Empty response from mentor model");
  }

  return {
    reply: result.content,
    mode,
    model: result.model,
  };
}

/** Streaming path for future SSE clients — returns upstream OpenRouter stream. */
export async function runMentorChatStream(
  profile: UserProfile,
  request: MentorChatRequest,
): Promise<Response> {
  const mode = normalizeMode(request.mode);
  const intent = request.intent ?? "chat";
  const history = request.history ?? [];

  if (intent === "chat" && !request.message?.trim()) {
    throw new Error("Message is required");
  }

  const context = await buildMentorIntelligenceContext(profile);
  const messages = buildMentorMessages(
    context,
    mode,
    history,
    request.message,
    intent,
  );

  return streamChatCompletion({ messages });
}

export function mentorServiceStatus(): { configured: boolean } {
  return { configured: isOpenRouterConfigured() };
}

export type { MentorIntelligenceContext };
