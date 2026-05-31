"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Atom,
  BookOpen,
  Calendar,
  FlaskConical,
  Leaf,
  Magnet,
  Moon,
  Stethoscope,
  Sun,
  Sunset,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  EXAM_CONFIG,
  filterSubjectsForExam,
  getExamSubjects,
  type ExamType,
} from "@/config/exam-config";
import {
  filterTopicsForExam,
  getTopicsForWeakSubjects,
  groupTopicsBySubject,
} from "@/config/syllabus";
import { DhruvYantraLogo } from "../shared/components/logo";
import { cacheProfileLocally, fetchClientProfile, saveClientProfile } from "@/lib/profile/client";
import { toProfileMe } from "@/lib/profile/me-types";
import type { ProductiveTime, UserProfile } from "@/lib/profile/types";
import { useProfileStore } from "@/store/profile-store";
import { DhruvStar } from "./components/dhruv-star";
import { HoursSlider } from "./components/hours-slider";
import { ProgressStepper } from "./components/progress-stepper";
import { SelectableCard, SubjectChip } from "./components/selectable-card";

type Phase = "welcome" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "success";

const TOTAL_STEPS = 7;

const SUBJECT_ICONS: Record<string, ReactNode> = {
  Physics: <Magnet className="h-5 w-5" />,
  Chemistry: <FlaskConical className="h-5 w-5" />,
  Mathematics: <BookOpen className="h-5 w-5" />,
  Biology: <Leaf className="h-5 w-5" />,
};

const YEARS = [2026, 2027, 2028];

const FEATURES = [
  { label: "AI Personalized Study Plan", icon: "✦" },
  { label: "Smart Resources", icon: "◈" },
  { label: "AI Mentor Support", icon: "◎" },
  { label: "Progress Tracking", icon: "▣" },
];

export function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [examType, setExamType] = useState<ExamType | null>(null);
  const [targetYear, setTargetYear] = useState<number | null>(null);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [dailyStudyHours, setDailyStudyHours] = useState(6);
  const [productiveTime, setProductiveTime] = useState<ProductiveTime | null>(null);
  const [parentValue, setParentValue] = useState("");

  useEffect(() => {
    async function init() {
      const profile = await fetchClientProfile();
      if (!profile) {
        router.replace("/");
        return;
      }
      if (profile.onboardingCompleted) {
        router.replace("/dashboard");
        return;
      }
      const exam = profile.examType;
      if (exam) setExamType(exam);
      if (profile.targetYear) setTargetYear(profile.targetYear);
      if (profile.weakSubjects?.length) {
        setWeakSubjects(exam ? filterSubjectsForExam(exam, profile.weakSubjects) : profile.weakSubjects);
      }
      if (profile.weakTopics?.length) {
        setWeakTopics(exam ? filterTopicsForExam(exam, profile.weakTopics) : profile.weakTopics);
      }
      if (profile.dailyStudyHours) setDailyStudyHours(profile.dailyStudyHours);
      if (profile.productiveTime) setProductiveTime(profile.productiveTime);
      if (profile.parentContact) {
        setParentValue(profile.parentContact.value);
      }
      setLoading(false);
    }
    void init();
  }, [router]);

  const examSubjects = useMemo(
    () => (examType ? getExamSubjects(examType) : []),
    [examType],
  );

  const topicGroups = useMemo(
    () => (examType ? groupTopicsBySubject(examType, weakSubjects) : []),
    [examType, weakSubjects],
  );

  const selectExam = (exam: ExamType) => {
    setExamType(exam);
    setWeakSubjects((prev) => filterSubjectsForExam(exam, prev));
    setWeakTopics((prev) => filterTopicsForExam(exam, prev));
  };

  const toggleSubject = (id: string) => {
    setWeakSubjects((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      if (examType) {
        const allowedTopics = new Set(getTopicsForWeakSubjects(examType, next));
        setWeakTopics((topics) => topics.filter((t) => allowedTopics.has(t)));
      }
      return next;
    });
  };

  const toggleTopic = (topic: string) => {
    setWeakTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const goNext = useCallback(() => {
    setPhase((p) => {
      if (p === "welcome") return 1;
      if (p === 7) return "success";
      if (typeof p === "number") return (p + 1) as Phase;
      return p;
    });
  }, []);

  const goBack = () => {
    setPhase((p) => {
      if (p === 1) return "welcome";
      if (p === "success") return 7;
      if (typeof p === "number" && p > 1) return (p - 1) as Phase;
      return p;
    });
  };

  const handleEnter = async () => {
    setSaving(true);
    try {
      const profile: Partial<UserProfile> = {
        examType,
        targetYear,
        weakSubjects,
        weakTopics,
        dailyStudyHours,
        productiveTime,
        parentContact: parentValue.trim()
          ? { channel: "telegram", value: parentValue.trim() }
          : null,
        onboardingCompleted: true,
      };
      const saved = await saveClientProfile(profile);
      cacheProfileLocally(saved);
      useProfileStore.getState().setProfile(toProfileMe(saved));
      router.push("/dashboard");
    } catch {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div className="onboard-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[#8B5CF6]/30 ring-2 ring-[#8B5CF6]/50" />
      </motion.div>
    );
  }

  const stepNum = typeof phase === "number" ? phase : null;
  const canContinue =
    phase === "welcome" ||
    (phase === 1 && examType) ||
    (phase === 2 && targetYear) ||
    (phase === 3 && weakSubjects.length > 0) ||
    (phase === 4 && weakTopics.length > 0) ||
    phase === 5 ||
    (phase === 6 && productiveTime) ||
    phase === 7 ||
    phase === "success";

  return (
    <motion.div className="onboard-bg relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <motion.div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#8B5CF6]/12 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#EC4899]/8 blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full bg-[#38BDF8]/6 blur-[90px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <DhruvYantraLogo compact />
        {stepNum && (
          <p className="text-xs text-[#64748B]">
            Step {stepNum} of {TOTAL_STEPS}
          </p>
        )}
      </header>

      {stepNum && (
        <div className="relative z-10 mb-8 px-4">
          <ProgressStepper current={stepNum} total={TOTAL_STEPS} />
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-32 pt-4 md:px-8">
        <AnimatePresence mode="wait">
          {phase === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center text-center"
            >
              <DhruvStar size="lg" />
              <h1 className="font-heading mt-10 text-3xl font-bold text-[#F8FAFC] md:text-4xl">
                Let&apos;s personalize your journey
              </h1>
              <p className="mt-4 max-w-md text-[#94A3B8]">
                A quick AI-powered setup tailored to <strong className="text-[#C4B5FD]">JEE</strong> or{" "}
                <strong className="text-[#C4B5FD]">NEET</strong> — subjects, syllabus, and focus areas
                that match your exam.
              </p>
            </motion.div>
          )}

          {phase === 1 && (
            <StepShell
              stepKey="step-1"
              title="Which exam are you preparing for?"
              subtitle="We'll show only the subjects and syllabus for your target."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectableCard
                  selected={examType === "JEE"}
                  onClick={() => selectExam("JEE")}
                  icon={<Atom className="h-6 w-6" />}
                  title="JEE"
                  subtitle="Engineering entrance"
                />
                <SelectableCard
                  selected={examType === "NEET"}
                  onClick={() => selectExam("NEET")}
                  icon={<Stethoscope className="h-6 w-6" />}
                  title="NEET"
                  subtitle="Medical entrance"
                />
              </div>
              {examType && (
                <p className="onboard-glass-card mt-6 rounded-xl p-4 text-center text-sm text-[#94A3B8]">
                  Focus areas for {examType}:{" "}
                  <span className="text-[#F8FAFC]">
                    {EXAM_CONFIG[examType].focusAreas.join(" · ")}
                  </span>
                </p>
              )}
            </StepShell>
          )}

          {phase === 2 && (
            <StepShell stepKey="step-2" title="When is your target exam?">
              <div className="grid gap-4 sm:grid-cols-3">
                {YEARS.map((y) => (
                  <SelectableCard
                    key={y}
                    selected={targetYear === y}
                    onClick={() => setTargetYear(y)}
                    icon={<Calendar className="h-6 w-6" />}
                    title={String(y)}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {phase === 3 && examType && (
            <StepShell
              stepKey="step-3"
              title={`Which ${examType} subjects need the most work?`}
              subtitle={`${examType} syllabus only — ${examSubjects.length} subjects for your exam.`}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {examSubjects.map((subject) => (
                  <SubjectChip
                    key={subject}
                    label={subject}
                    icon={SUBJECT_ICONS[subject]}
                    selected={weakSubjects.includes(subject)}
                    onClick={() => toggleSubject(subject)}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {phase === 4 && examType && (
            <StepShell
              stepKey="step-4"
              title="Which syllabus topics feel challenging?"
              subtitle={
                weakSubjects.length > 0
                  ? `${getTopicsForWeakSubjects(examType, weakSubjects).length} ${examType} syllabus topics from your selected subjects.`
                  : `${examType} syllabus topics appear after you pick subjects.`
              }
            >
              <div className="space-y-6">
                {topicGroups.map(({ subject, topics }) => (
                  <motion.div key={subject}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8B5CF6]">
                      {subject}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-all ${
                            weakTopics.includes(topic)
                              ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F8FAFC] shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                              : "border-white/10 bg-white/[0.04] text-[#94A3B8] hover:border-white/20"
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </StepShell>
          )}

          {phase === 5 && (
            <StepShell stepKey="step-5" title="How many hours can you study daily?">
              <HoursSlider value={dailyStudyHours} onChange={setDailyStudyHours} />
              <div className="onboard-glass-card mt-8 flex items-center gap-4 rounded-2xl p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/20 text-[#C4B5FD]">
                  ↗
                </div>
                <p className="text-sm text-[#94A3B8]">
                  Consistent{" "}
                  <span className="font-semibold text-[#F8FAFC]">{dailyStudyHours} hours</span> daily
                  for {examType ?? "your exam"}. You&apos;re in the top{" "}
                  {Math.max(12, 100 - dailyStudyHours * 7)}% of aspirants!
                </p>
              </div>
            </StepShell>
          )}

          {phase === 6 && (
            <StepShell stepKey="step-6" title="When are you most productive?">
              <div className="space-y-3">
                <SelectableCard
                  selected={productiveTime === "Morning"}
                  onClick={() => setProductiveTime("Morning")}
                  icon={<Sun className="h-6 w-6" />}
                  title="Morning"
                  subtitle="5 AM – 9 AM"
                  className="!p-4"
                />
                <SelectableCard
                  selected={productiveTime === "Evening"}
                  onClick={() => setProductiveTime("Evening")}
                  icon={<Sunset className="h-6 w-6" />}
                  title="Evening"
                  subtitle="4 PM – 9 PM"
                  className="!p-4"
                />
                <SelectableCard
                  selected={productiveTime === "Night"}
                  onClick={() => setProductiveTime("Night")}
                  icon={<Moon className="h-6 w-6" />}
                  title="Night"
                  subtitle="9 PM – 1 AM"
                  className="!p-4"
                />
              </div>
            </StepShell>
          )}

          {phase === 7 && (
            <StepShell
              stepKey="step-7"
              title="Add parent Telegram"
              subtitle="Optional — share your Telegram @username so parents can get progress updates."
            >
              <input
                type="text"
                value={parentValue}
                onChange={(e) => setParentValue(e.target.value)}
                placeholder="@username"
                className="onboard-input w-full"
              />
              <p className="onboard-glass-card mt-6 rounded-xl p-4 text-sm text-[#94A3B8]">
                This helps parents stay updated about your progress and important alerts.
              </p>
              <button
                type="button"
                onClick={goNext}
                className="mt-4 w-full text-center text-sm text-[#64748B] transition hover:text-[#94A3B8]"
              >
                Skip for now
              </button>
            </StepShell>
          )}

          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <DhruvStar size="lg" />
              <h1 className="font-heading mt-10 text-3xl font-bold text-[#F8FAFC] md:text-4xl">
                Your {examType ?? ""} journey is ready!
              </h1>
              <p className="mt-3 max-w-md text-[#94A3B8]">
                Planner, resources, and AI mentor are tuned for{" "}
                {weakTopics.length > 0 ? weakTopics.slice(0, 3).join(", ") : "your weak areas"}.
              </p>
              <div className="mt-10 grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
                {FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="onboard-glass-card flex flex-col items-center gap-2 rounded-xl p-3"
                  >
                    <span className="text-lg text-[#8B5CF6]">{f.icon}</span>
                    <span className="text-[10px] leading-tight text-[#94A3B8]">{f.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-8 flex items-center gap-2 text-xs text-[#64748B]">
                <span aria-hidden>🔒</span> Your data is secure and encrypted.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.06] bg-[#0B1020]/90 px-6 py-5 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          {phase !== "welcome" && phase !== "success" ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-[#94A3B8] transition hover:border-white/20 hover:text-[#F8FAFC]"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {phase === "success" ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleEnter()}
              className="btn-gradient-glow ml-auto flex h-12 min-w-[200px] items-center justify-center rounded-xl px-8 text-base font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Enter DhruvYantra →"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue}
              onClick={goNext}
              className="btn-gradient-glow ml-auto flex h-12 min-w-[160px] items-center justify-center rounded-xl px-8 text-base font-bold text-white disabled:opacity-40"
            >
              {phase === "welcome" ? "Start Setup Journey →" : "Continue →"}
            </button>
          )}
        </div>
        {phase === "welcome" && (
          <p className="mt-3 text-center text-xs text-[#64748B]">Takes less than 2 minutes.</p>
        )}
      </footer>
    </motion.div>
  );
}

function StepShell({
  stepKey,
  title,
  subtitle,
  children,
}: {
  stepKey: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="font-heading text-center text-2xl font-bold text-[#F8FAFC] md:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-center text-sm text-[#94A3B8]">{subtitle}</p>
      )}
      <div className="mt-10">{children}</div>
    </motion.div>
  );
}
