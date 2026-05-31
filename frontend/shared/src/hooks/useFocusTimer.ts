"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusMode, PersistedFocusSession } from "@/types/focus";
import {
  applyRunningElapsed,
  clearLocalFocusSession,
  fetchFocusSessionFromApi,
  loadLocalFocusSession,
  pickNewerSession,
  saveLocalFocusSession,
  sessionsMatchTopic,
  syncFocusSessionToApi,
} from "@/services/focus/focus-session-service";
import {
  notifyFocusStreakRefresh,
  loadLocalFocusHistory,
  recordFocusCompletion,
} from "@/services/focus/focus-history-service";
import { isoDate } from "@/lib/mission-control/dates";

export type FocusSessionMeta = {
  topic: string;
  subject: string;
  target: string;
  estimated: string;
  startTime: string;
  durationSeconds?: number;
};

export type FocusTimerSnapshot = {
  mode: FocusMode;
  cycle: number;
  isBreak: boolean;
  running: boolean;
  seconds: number;
  phaseTotalSeconds: number;
  workSeconds: number;
  elapsedSeconds: number;
  sessionId: string;
  startedAt: string;
};

type UseFocusTimerOptions = {
  mode: FocusMode;
  meta: FocusSessionMeta;
  workSeconds: number;
  phaseTotalSeconds: number;
  breakSeconds?: number;
  totalCycles: number;
  onModeRestored?: (mode: FocusMode) => void;
};

function createSessionId(): string {
  return `focus_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function buildPersisted(
  snapshot: FocusTimerSnapshot,
  meta: FocusSessionMeta,
  status: PersistedFocusSession["status"],
): PersistedFocusSession {
  const now = new Date().toISOString();
  return {
    id: snapshot.sessionId,
    mode: snapshot.mode,
    status,
    cycle: snapshot.cycle,
    isBreak: snapshot.isBreak,
    secondsRemaining: snapshot.seconds,
    phaseTotalSeconds: snapshot.phaseTotalSeconds,
    workSeconds: snapshot.workSeconds,
    topic: meta.topic,
    subject: meta.subject,
    target: meta.target,
    estimated: meta.estimated,
    startTime: meta.startTime,
    elapsedSeconds: snapshot.elapsedSeconds,
    startedAt: snapshot.startedAt,
    updatedAt: now,
  };
}

export function useFocusTimer({
  mode,
  meta,
  workSeconds,
  phaseTotalSeconds,
  breakSeconds,
  totalCycles,
  onModeRestored,
}: UseFocusTimerOptions) {
  const [cycle, setCycle] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(workSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId, setSessionId] = useState(createSessionId);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [hydrated, setHydrated] = useState(false);

  const skipModeResetRef = useRef(true);
  const pendingRestoreModeRef = useRef<FocusMode | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPersistedRef = useRef<PersistedFocusSession | null>(null);
  const completedRef = useRef(false);
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const currentPhaseTotal = isBreak ? (breakSeconds ?? workSeconds) : phaseTotalSeconds;

  const getSnapshot = useCallback((): FocusTimerSnapshot => {
    return {
      mode,
      cycle,
      isBreak,
      running,
      seconds,
      phaseTotalSeconds: currentPhaseTotal,
      workSeconds,
      elapsedSeconds,
      sessionId,
      startedAt,
    };
  }, [
    mode,
    cycle,
    isBreak,
    running,
    seconds,
    currentPhaseTotal,
    workSeconds,
    elapsedSeconds,
    sessionId,
    startedAt,
  ]);

  const persistLocal = useCallback(
    (snapshot: FocusTimerSnapshot, status: PersistedFocusSession["status"]) => {
      const persisted = buildPersisted(snapshot, metaRef.current, status);
      latestPersistedRef.current = persisted;
      saveLocalFocusSession(persisted);
      return persisted;
    },
    [],
  );

  const flushApiSync = useCallback(async () => {
    const persisted = latestPersistedRef.current;
    if (!persisted) return;
    try {
      await syncFocusSessionToApi(persisted);
    } catch (e) {
      console.warn("[useFocusTimer] API sync failed:", e);
    }
  }, []);

  const scheduleApiSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      void flushApiSync();
    }, 5000);
  }, [flushApiSync]);

  const persist = useCallback(
    (snapshot: FocusTimerSnapshot, status: PersistedFocusSession["status"], syncNow = false) => {
      persistLocal(snapshot, status);
      if (syncNow) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        void flushApiSync();
        return;
      }
      scheduleApiSync();
    },
    [persistLocal, flushApiSync, scheduleApiSync],
  );

  const clearPersistence = useCallback(async () => {
    clearLocalFocusSession();
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    try {
      await syncFocusSessionToApi(null);
    } catch (e) {
      console.warn("[useFocusTimer] clear sync failed:", e);
    }
  }, []);

  // Hydrate from localStorage + API on mount (or when topic/subject identity changes)
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      skipModeResetRef.current = true;
      setHydrated(false);

      const local = loadLocalFocusSession();
      let remote: PersistedFocusSession | null = null;
      try {
        remote = await fetchFocusSessionFromApi();
      } catch (e) {
        console.warn("[useFocusTimer] API fetch failed:", e);
      }

      if (cancelled) return;

      let merged = pickNewerSession(local, remote);
      if (merged && !sessionsMatchTopic(merged, meta.topic, meta.subject)) {
        merged = null;
      }

      if (merged) {
        const restored = applyRunningElapsed(merged);
        saveLocalFocusSession(restored);
        pendingRestoreModeRef.current = restored.mode;
        const alreadyCompleted =
          loadLocalFocusHistory().some((s) => s.id === restored.id) ||
          (restored.secondsRemaining === 0 &&
            restored.cycle >= totalCycles &&
            restored.status !== "running");
        completedRef.current = alreadyCompleted;
        setSessionId(restored.id);
        setStartedAt(restored.startedAt);
        setCycle(restored.cycle);
        setIsBreak(restored.isBreak);
        setSeconds(restored.secondsRemaining);
        setElapsedSeconds(restored.elapsedSeconds);
        setRunning(restored.status === "running");
        onModeRestored?.(restored.mode);
      } else {
        completedRef.current = false;
        setSessionId(createSessionId());
        setStartedAt(new Date().toISOString());
        setCycle(1);
        setIsBreak(false);
        setRunning(false);
        setSeconds(workSeconds);
        setElapsedSeconds(0);
      }

      setHydrated(true);
      requestAnimationFrame(() => {
        skipModeResetRef.current = false;
      });
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [meta.topic, meta.subject, onModeRestored, workSeconds, totalCycles]);

  // Reset timer when mode changes (after hydration), unless restoring same mode
  useEffect(() => {
    if (!hydrated || skipModeResetRef.current) return;

    if (pendingRestoreModeRef.current) {
      if (mode !== pendingRestoreModeRef.current) return;
      pendingRestoreModeRef.current = null;
    }

    const local = loadLocalFocusSession();
    if (local && local.mode === mode && sessionsMatchTopic(local, meta.topic, meta.subject)) {
      return;
    }

    setCycle(1);
    setIsBreak(false);
    setRunning(false);
    setSeconds(workSeconds);
    setElapsedSeconds(0);
    setSessionId(createSessionId());
    setStartedAt(new Date().toISOString());
    void clearPersistence();
  }, [mode, hydrated, workSeconds, meta.topic, meta.subject, clearPersistence]);

  // Save to localStorage on every tick (silent, no API spam)
  useEffect(() => {
    if (!hydrated) return;
    const status: PersistedFocusSession["status"] = running ? "running" : "paused";
    persistLocal(getSnapshot(), status);
  }, [hydrated, running, cycle, isBreak, seconds, elapsedSeconds, mode, getSnapshot, persistLocal]);

  // Debounced API sync only when session metadata changes — not every second
  useEffect(() => {
    if (!hydrated) return;
    const status: PersistedFocusSession["status"] = running ? "running" : "paused";
    persistLocal(getSnapshot(), status);
    scheduleApiSync();
  }, [hydrated, running, cycle, isBreak, mode, getSnapshot, persistLocal, scheduleApiSync]);

  // Tick while running
  useEffect(() => {
    if (!running || !hydrated || seconds <= 0) return;
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
      setElapsedSeconds((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, hydrated, seconds]);

  // Phase / cycle transitions when timer hits zero
  useEffect(() => {
    if (!hydrated || seconds > 0 || !running) return;

    if (mode === "pomodoro" && breakSeconds) {
      if (!isBreak) {
        if (cycle < totalCycles) {
          setIsBreak(true);
          setSeconds(breakSeconds);
        } else {
          setRunning(false);
        }
        return;
      }
      if (cycle < totalCycles) {
        setIsBreak(false);
        setCycle((c) => c + 1);
        setSeconds(workSeconds);
      } else {
        setRunning(false);
      }
      return;
    }

    if (mode === "flow" && cycle < totalCycles) {
      setCycle((c) => c + 1);
      setSeconds(workSeconds);
      return;
    }

    if (mode === "focus" && cycle < totalCycles) {
      setCycle((c) => c + 1);
      setSeconds(workSeconds);
      return;
    }

    setRunning(false);
  }, [
    seconds,
    running,
    mode,
    isBreak,
    cycle,
    breakSeconds,
    totalCycles,
    workSeconds,
    hydrated,
  ]);

  // Record completed focus session when all cycles finish
  useEffect(() => {
    if (!hydrated || running || seconds > 0) return;
    if (cycle < totalCycles) return;
    if (mode === "pomodoro" && isBreak) return;
    if (completedRef.current) return;
    if (loadLocalFocusHistory().some((s) => s.id === sessionId)) {
      completedRef.current = true;
      return;
    }

    completedRef.current = true;
    const completedAt = new Date().toISOString();

    void recordFocusCompletion({
      id: sessionId,
      completedAt,
      date: isoDate(),
      mode,
      topic: metaRef.current.topic,
      subject: metaRef.current.subject,
      elapsedSeconds,
    }).then(() => {
      notifyFocusStreakRefresh();
      latestPersistedRef.current = null;
      void clearPersistence();
    });
  }, [
    hydrated,
    running,
    seconds,
    cycle,
    totalCycles,
    mode,
    isBreak,
    sessionId,
    elapsedSeconds,
    clearPersistence,
  ]);

  const toggleRunning = useCallback(() => {
    setRunning((wasRunning) => {
      const next = !wasRunning;
      const status: PersistedFocusSession["status"] = next ? "running" : "paused";
      requestAnimationFrame(() => {
        persist({ ...getSnapshot(), running: next }, status, true);
      });
      return next;
    });
  }, [getSnapshot, persist]);

  const resetAll = useCallback(() => {
    completedRef.current = false;
    setRunning(false);
    setCycle(1);
    setIsBreak(false);
    setSeconds(workSeconds);
    setElapsedSeconds(0);
    setSessionId(createSessionId());
    setStartedAt(new Date().toISOString());
    latestPersistedRef.current = null;
    void clearPersistence();
  }, [workSeconds, clearPersistence]);

  useEffect(() => {
    const onHide = () => {
      if (latestPersistedRef.current) {
        void flushApiSync();
      }
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    return () => {
      window.removeEventListener("pagehide", onHide);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [flushApiSync]);

  return {
    cycle,
    isBreak,
    running,
    seconds,
    elapsedSeconds,
    hydrated,
    toggleRunning,
    resetAll,
  };
}
