"use client";

import { useEffect, useMemo } from "react";
import type { ExamType } from "@/config/exam-config";
import type { ProfileMe } from "@/lib/profile/me-types";
import { MOCK_CENTER_REFRESH_EVENT } from "@/lib/mock-center/events";
import { useProfileStore } from "@/store/profile-store";

export function useProfile() {
  const profile = useProfileStore((s) => s.profile);
  const loading = useProfileStore((s) => s.loading);
  const error = useProfileStore((s) => s.error);
  const hydrated = useProfileStore((s) => s.hydrated);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const clearProfile = useProfileStore((s) => s.clearProfile);

  const examType = profile?.examType ?? null;

  useEffect(() => {
    const onMockSubmitted = () => {
      void refreshProfile();
    };
    window.addEventListener(MOCK_CENTER_REFRESH_EVENT, onMockSubmitted);
    return () => window.removeEventListener(MOCK_CENTER_REFRESH_EVENT, onMockSubmitted);
  }, [refreshProfile]);

  return useMemo(
    () => ({
      profile,
      loading,
      error,
      hydrated,
      examType,
      isJee: examType === "JEE",
      isNeet: examType === "NEET",
      isReady: hydrated && !loading && Boolean(profile),
      refreshProfile,
      updateProfile,
      clearProfile,
    }),
    [
      profile,
      loading,
      error,
      hydrated,
      examType,
      refreshProfile,
      updateProfile,
      clearProfile,
    ],
  );
}

export function useProfileOrThrow(): ProfileMe & { examType: ExamType } {
  const { profile } = useProfile();
  if (!profile?.examType) {
    throw new Error("Profile not loaded or exam not set");
  }
  return profile as ProfileMe & { examType: ExamType };
}
