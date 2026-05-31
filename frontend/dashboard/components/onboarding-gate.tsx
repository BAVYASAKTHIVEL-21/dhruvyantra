"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { fetchClientProfile } from "@/lib/profile/client";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const profile = await fetchClientProfile();
      if (cancelled) return;

      if (!profile) {
        router.replace("/");
        return;
      }
      if (!profile.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }
      setReady(true);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="dashboard-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[#8B5CF6]/30 ring-2 ring-[#8B5CF6]/50" />
      </div>
    );
  }

  return <>{children}</>;
}
