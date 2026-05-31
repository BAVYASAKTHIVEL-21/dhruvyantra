"use client";

import { Suspense } from "react";
import { LeftStoryPanel } from "./left-story-panel";
import { RightLoginPanel } from "./right-login-panel";

export function LoginPage() {
  return (
    <main className="login-page-bg flex min-h-screen w-full flex-col lg:min-h-[100dvh] lg:flex-row lg:items-stretch">
      <LeftStoryPanel />
      <Suspense fallback={null}>
        <RightLoginPanel />
      </Suspense>
    </main>
  );
}
