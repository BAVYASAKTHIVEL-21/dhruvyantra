"use client";

import { useCallback, useEffect, useState } from "react";
import type { FocusStreakSnapshot } from "@/types/focus";
import { computeFocusStreak } from "@/lib/focus/streak";
import {
  FOCUS_STREAK_REFRESH_EVENT,
  fetchFocusStreak,
  loadLocalFocusHistory,
} from "@/services/focus/focus-history-service";

const EMPTY_STREAK: FocusStreakSnapshot = {
  current: 0,
  longest: 0,
  studiedToday: false,
  weeklyCompletedCount: 0,
  weekDays: [],
};

export function useFocusStreak() {
  const [streak, setStreak] = useState<FocusStreakSnapshot>(() =>
    typeof window !== "undefined"
      ? computeFocusStreak(loadLocalFocusHistory())
      : EMPTY_STREAK,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFocusStreak();
      setStreak(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load streak");
      setStreak(computeFocusStreak(loadLocalFocusHistory()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener(FOCUS_STREAK_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(FOCUS_STREAK_REFRESH_EVENT, onRefresh);
  }, [refresh]);

  return { streak, loading, error, refresh };
}

export function focusStreakMessage(streak: FocusStreakSnapshot, name?: string): string {
  const firstName = name?.split(" ")[0] ?? "Aspirant";
  if (streak.current === 0) {
    return streak.studiedToday
      ? "Great start today — finish a full session to lock in your streak."
      : "Complete a focus session today to start your streak.";
  }
  if (streak.current < 4) {
    return `Building momentum, ${firstName} — ${streak.current} day${streak.current === 1 ? "" : "s"} strong.`;
  }
  return `Keep it up, ${firstName}! You're on a ${streak.current}-day focus streak.`;
}
