"use client";

import { useMemo } from "react";
import { usePlanner } from "@/hooks/usePlanner";
import { useProfile } from "@/hooks/useProfile";
import {
  buildMentorAgentContext,
  serializeMentorContext,
  type MentorAgentContext,
} from "@/lib/personalization/mentor-context";

export function useMentorContext(): {
  context: MentorAgentContext | null;
  serialized: string | null;
  ready: boolean;
} {
  const { profile, isReady } = useProfile();
  const { plan } = usePlanner();

  const context = useMemo(() => {
    if (!profile) return null;
    return buildMentorAgentContext(profile, plan, []);
  }, [profile, plan]);

  const serialized = useMemo(
    () => (context ? serializeMentorContext(context) : null),
    [context],
  );

  return { context, serialized, ready: isReady && Boolean(context) };
}
