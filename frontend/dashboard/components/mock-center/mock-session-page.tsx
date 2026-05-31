"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, FileQuestion, Play, Target } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MockRecoveryResourcesList } from "./mock-recovery-resources-list";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { updatePlannerTask } from "@/lib/planner/client";
import { recoveryResourcesFromSubmission } from "@/lib/resources/mock-recovery";
import {
  fetchMockSessionQuestions,
  submitMockCenter,
} from "@/services/mock-center/mock-center-service";
import { outcomesFromAnswers, type MockSessionQuestion } from "@/services/mock-center/mock-questions";
import type { MockSubmissionRecord } from "@/types/mock-results";
import type { MockType } from "@/types/mock-results";

function parseMockType(value: string | null): MockType {
  if (value === "full" || value === "chapter" || value === "pyq") return value;
  return "full";
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MockSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();

  const mockType = parseMockType(searchParams.get("type"));
  const taskId = searchParams.get("taskId");
  const title = searchParams.get("title") ?? `${profile?.examType ?? "Exam"} Mock`;
  const durationMin = Number(searchParams.get("duration") ?? (profile?.examType === "NEET" ? 200 : 180));

  const totalSeconds = Math.max(durationMin, 1) * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<MockSessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MockSubmissionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (!running || result) return;
    const id = window.setInterval(() => {
      setElapsed((prev) => Math.min(prev + 1, totalSeconds));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, result, totalSeconds]);

  const subjectsLabel = useMemo(() => {
    if (profile?.examType === "NEET") return "Physics · Chemistry · Biology";
    if (profile?.examType === "JEE") return "Physics · Chemistry · Mathematics";
    return "Exam syllabus";
  }, [profile?.examType]);

  const beginMock = useCallback(async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const data = await fetchMockSessionQuestions(mockType);
      setQuestions(data.questions);
      setRunning(true);
      setCurrentIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load questions");
    } finally {
      setLoadingQuestions(false);
    }
  }, [mockType]);

  const selectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.questionId]: optionId }));
  };

  const skipQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const finishMock = useCallback(async () => {
    if (questions.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const questionResults = outcomesFromAnswers(questions, answers);
      const response = await submitMockCenter({
        mockType,
        title,
        plannerTaskId: taskId ?? undefined,
        useSeeded: false,
        questions: questionResults,
        durationMinutes: Math.ceil(elapsed / 60) || durationMin,
      });

      if (taskId) {
        await updatePlannerTask(taskId, "Completed");
      }

      setResult(response.submission);
      setRunning(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit mock");
    } finally {
      setSubmitting(false);
    }
  }, [questions, answers, mockType, title, taskId, elapsed, durationMin]);

  const weakTopic = result?.analysis.weakTopics[0];
  const recoveryResources = useMemo(
    () => (result ? recoveryResourcesFromSubmission(result) : []),
    [result],
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
            Mock Session
          </p>
          <h1 className="font-heading text-2xl font-bold text-[#F8FAFC] lg:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            {profile?.examType ?? "Exam"} pattern · {questions.length || "…"} questions ·{" "}
            {subjectsLabel}
          </p>
        </div>
        <Link
          href="/dashboard/mock-center"
          className="inline-flex items-center gap-2 text-sm text-[#A78BFA] hover:text-[#C4B5FD]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mock Center
        </Link>
      </motion.div>

      {!result ? (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="dash-glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border-[#8B5CF6]/20 p-4"
          >
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-[#C4B5FD]" />
              <span className="font-heading text-2xl font-bold tabular-nums text-[#F8FAFC]">
                {formatTimer(running ? elapsed : 0)}
              </span>
            </div>
            {running && questions.length > 0 ? (
              <p className="text-sm text-[#94A3B8]">
                Answered {answeredCount}/{questions.length} · Q{currentIndex + 1}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Clock className="h-4 w-4" />
                Planned · {durationMin} min
              </p>
            )}
          </motion.div>

          {!running ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="dash-glass-card rounded-2xl p-6 text-center md:p-8"
            >
              <p className="mx-auto max-w-lg text-sm text-[#6B7A90]">
                Start the mock to load exam-pattern MCQs from your syllabus and weak topics.
                Your answers drive weakness detection and recovery planning.
              </p>
              <Button
                type="button"
                className="btn-gradient-glow mt-6 h-11 cursor-pointer rounded-xl px-6"
                disabled={loadingQuestions}
                onClick={() => void beginMock()}
              >
                <Play className="mr-2 h-4 w-4" />
                {loadingQuestions ? "Loading questions…" : "Begin Mock"}
              </Button>
            </motion.div>
          ) : currentQuestion ? (
            <motion.div
              key={currentQuestion.questionId}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="dash-glass-card rounded-2xl p-5 md:p-6"
            >
              <motion.div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#8B5CF6]/20 px-2.5 py-1 text-[#C4B5FD]">
                  {currentQuestion.subject}
                </span>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[#94A3B8]">
                  {currentQuestion.topic}
                </span>
              </motion.div>
              <p className="text-base leading-relaxed text-[#F8FAFC] md:text-lg">
                {currentQuestion.stem}
              </p>
              <div className="mt-5 space-y-2">
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.questionId] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectOption(option.id)}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/15 text-[#F8FAFC]"
                          : "border-white/[0.08] bg-white/[0.03] text-[#E2E8F0] hover:border-[#8B5CF6]/25"
                      }`}
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold uppercase">
                        {option.id}
                      </span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer text-[#94A3B8]"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer border-white/10"
                    onClick={skipQuestion}
                  >
                    Skip
                  </Button>
                  {currentIndex < questions.length - 1 ? (
                    <Button
                      type="button"
                      className="btn-gradient-glow cursor-pointer"
                      onClick={() => setCurrentIndex((i) => i + 1)}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="btn-gradient-glow cursor-pointer"
                      disabled={submitting}
                      onClick={() => void finishMock()}
                    >
                      {submitting ? "Submitting…" : "Finish & Submit"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}

          {running && questions.length > 0 ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-[#8B5CF6]/30 text-[#E9D5FF]"
                disabled={submitting}
                onClick={() => void finishMock()}
              >
                {submitting ? "Submitting…" : "Finish & Submit Mock"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-glass-card space-y-5 rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3">
            <FileQuestion className="h-6 w-6 text-[#34D399]" />
            <h2 className="font-heading text-xl font-bold text-[#F8FAFC]">Mock submitted</h2>
          </div>
          <p className="text-sm text-[#94A3B8]">
            Overall accuracy:{" "}
            <span className="font-semibold text-[#34D399]">{result.analysis.overallAccuracy}%</span>
          </p>
          {weakTopic ? (
            <p className="text-sm text-[#E2E8F0]">
              Focus recovery on{" "}
              <span className="font-semibold text-[#F472B6]">{weakTopic.topic}</span> (
              {weakTopic.accuracy}% accuracy)
            </p>
          ) : null}
          {result.recoveryTaskIds.length > 0 ? (
            <p className="text-sm text-[#94A3B8]">
              {result.recoveryTaskIds.length} recovery task
              {result.recoveryTaskIds.length === 1 ? "" : "s"} added to your planner.
            </p>
          ) : null}
          <MockRecoveryResourcesList
            resources={recoveryResources}
            title="Open recovery materials"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 cursor-pointer rounded-xl border-[#8B5CF6]/30 px-6"
              onClick={() => router.push("/dashboard")}
            >
              View planner
            </Button>
            <Button
              type="button"
              className="btn-gradient-glow h-11 cursor-pointer rounded-xl px-6"
              onClick={() => router.push("/dashboard/mock-center")}
            >
              Return to Mock Center
            </Button>
          </div>
        </motion.div>
      )}

      {error ? <p className="mt-4 text-sm text-[#FCA5A5]">{error}</p> : null}
    </>
  );
}
