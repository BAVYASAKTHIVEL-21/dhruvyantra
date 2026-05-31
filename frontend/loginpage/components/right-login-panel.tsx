"use client";

import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  establishSession,
  registerAccount,
  type AuthErrorPayload,
} from "@/lib/profile/client";
import { DhruvYantraLogo } from "../../shared/components/logo";
import { messageForAuthError } from "./auth-error-messages";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function getAuthPayload(err: unknown): AuthErrorPayload | null {
  if (err && typeof err === "object" && "payload" in err) {
    return (err as { payload?: AuthErrorPayload }).payload ?? null;
  }
  return null;
}

export function RightLoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("auth_error");
    const msg = messageForAuthError(code);
    if (msg) {
      setFormError(msg);
      setAuthLoading(false);
    }
    if (code) {
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  function handleGoogleSignIn() {
    setFormError(null);
    setAuthLoading(true);
    window.location.href = "/api/auth/google";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setAuthLoading(true);

    try {
      const { redirect } =
        mode === "signup"
          ? await registerAccount(email, password)
          : await establishSession(email, password);
      router.push(redirect);
    } catch (err) {
      const payload = getAuthPayload(err);
      if (payload?.errors) setFieldErrors(payload.errors);
      const byCode = payload?.code ? messageForAuthError(payload.code) : null;
      setFormError(
        byCode ??
          payload?.error ??
          (err instanceof Error ? err.message : "Something went wrong"),
      );
      setAuthLoading(false);
    }
  }

  return (
    <div className="relative flex w-full min-h-[min(100dvh,920px)] items-center justify-center px-6 py-10 sm:px-8 lg:min-h-screen lg:min-w-0 lg:flex-1 lg:basis-[40%] lg:px-12 lg:py-8 xl:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#8B5CF6]/14 blur-[110px]" />
        <div className="absolute bottom-1/4 left-1/3 h-48 w-48 rounded-full bg-[#EC4899]/6 blur-[90px]" />
      </div>

      <motion.div
        className="relative mx-auto flex w-full max-w-[480px] flex-col justify-center py-4 lg:max-w-[440px] xl:max-w-[480px]"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="mb-6 text-center lg:mb-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <h1 className="font-heading text-[1.75rem] font-bold leading-[1.15] tracking-tight text-[#F8FAFC] sm:text-[1.95rem] md:text-[2.15rem] lg:text-[2.35rem] lg:leading-[1.12]">
            Every great result starts with the{" "}
            <span className="text-gradient-ref">right direction.</span>
          </h1>
        </motion.div>

        <div className="login-glass-card w-full rounded-[32px] px-9 py-11 sm:px-11 sm:py-12 md:px-12 md:py-14">
          <div className="mb-10 flex justify-center">
            <DhruvYantraLogo compact />
          </div>

          <div className="text-center">
            <h2 className="font-heading text-[1.65rem] font-bold tracking-tight text-[#F8FAFC] sm:text-2xl">
              {mode === "signin" ? "Welcome" : "Create your account"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A8B4C4] md:text-[15px]">
              {mode === "signin"
                ? "Let's continue your journey towards success."
                : "Start your JEE / NEET prep with DhruvYantra."}
            </p>
          </div>

          <form className="mt-10 space-y-5" onSubmit={(e) => void handleSubmit(e)}>
            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {formError}
              </p>
            )}

            <button
              type="button"
              disabled={authLoading}
              onClick={handleGoogleSignIn}
              className="login-google-btn flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.05] text-[#F8FAFC] transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GoogleIcon />
              <span className="font-medium">Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-xs text-[#6B7A90]">or</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-xs font-medium text-[#A8B4C4]">
                Email
              </Label>
              <div className="login-input-wrap relative rounded-xl">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A90]" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!fieldErrors.email}
                  className="login-input-field h-12 rounded-xl pl-11"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-300">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-xs font-medium text-[#A8B4C4]">
                Password
              </Label>
              <div className="login-input-wrap relative rounded-xl">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A90]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!fieldErrors.password}
                  className="login-input-field h-12 rounded-xl pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7A90] transition-colors hover:text-[#B8C5D6]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-xs text-red-300">{fieldErrors.password}</p>
              ) : (
                <p className="text-xs text-[#6B7A90]">
                  At least 8 characters with a letter and a number
                </p>
              )}
            </div>

            {mode === "signin" && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    className="border-white/25 data-[state=checked]:border-[#8B5CF6] data-[state=checked]:bg-[#8B5CF6]"
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm font-normal text-[#A8B4C4]"
                  >
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-sm font-medium text-[#A78BFA] transition-colors hover:text-[#C4B5FD]"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <motion.div whileHover={{ scale: 1.012 }} whileTap={{ scale: 0.99 }}>
              <button
                type="submit"
                disabled={authLoading}
                className="btn-gradient-glow flex h-[52px] w-full cursor-pointer items-center justify-center rounded-xl text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authLoading
                  ? mode === "signup"
                    ? "Creating account…"
                    : "Signing in…"
                  : mode === "signup"
                    ? "Create Account"
                    : "Sign In"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </button>
            </motion.div>
          </form>

          <p className="mt-10 text-center text-sm text-[#6B7A90]">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setFormError(null);
                    setFieldErrors({});
                  }}
                  className="cursor-pointer font-medium text-[#A78BFA] transition-colors hover:text-[#C4B5FD] hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setFormError(null);
                    setFieldErrors({});
                  }}
                  className="cursor-pointer font-medium text-[#A78BFA] transition-colors hover:text-[#C4B5FD] hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
