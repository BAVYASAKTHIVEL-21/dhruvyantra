import { EXAM_CONFIG, type ExamType } from "./exam-config";
import { getTopicsForSubject } from "./syllabus";
import type { UserProfile } from "@/lib/profile/types";

export function getMentorWelcomeMessage(
  profile: Pick<UserProfile, "examType" | "weakSubjects" | "weakTopics">,
): string {
  const exam = profile.examType;
  if (!exam) {
    return "Hi! I'm your AI study mentor. Complete onboarding so I can tailor guidance to your exam.";
  }

  const cfg = EXAM_CONFIG[exam];
  const weak =
    profile.weakTopics.length > 0
      ? profile.weakTopics.slice(0, 2).join(" & ")
      : profile.weakSubjects.slice(0, 2).join(" & ") || cfg.subjects.join(" & ");

  if (exam === "JEE") {
    return `Hi! I'm your **JEE Mentor** — focused on ${cfg.mentorStyle}.\n\nI'll prioritize **${weak}** with ${cfg.focusAreas.join(", ")}.\nWhich syllabus topic should we tackle first?`;
  }

  return `Hi! I'm your **NEET Mentor** — focused on ${cfg.mentorStyle}.\n\nLet's strengthen **${weak}** through ${cfg.focusAreas.join(", ")}.\nWhere do you want to start in your syllabus?`;
}

export function getMentorQuickActions(exam: ExamType | null): string[] {
  if (exam === "JEE") {
    return [
      "Explain this JEE concept",
      "Break down this numerical",
      "Suggest a timed PYQ drill",
      "Plan advanced problem practice",
    ];
  }
  if (exam === "NEET") {
    return [
      "Explain from NCERT",
      "Help me memorize this topic",
      "Diagram practice plan",
      "Rapid revision strategy",
    ];
  }
  return ["Complete onboarding to unlock exam-specific guidance"];
}

export function getMentorRecommendedActions(
  profile: Pick<UserProfile, "examType" | "weakTopics" | "weakSubjects">,
): { id: string; label: string; done: boolean }[] {
  const exam = profile.examType;
  if (!exam) {
    return [{ id: "a0", label: "Complete onboarding to personalize mentor", done: false }];
  }

  const primarySubject = profile.weakSubjects[0] ?? EXAM_CONFIG[exam].subjects[0];
  const syllabusTopics = getTopicsForSubject(exam, primarySubject);
  const primaryTopic =
    profile.weakTopics.find((t) => syllabusTopics.includes(t)) ??
    profile.weakTopics[0] ??
    syllabusTopics[0] ??
    primarySubject;

  if (exam === "NEET") {
    return [
      { id: "a1", label: `NCERT revision: ${primaryTopic}`, done: false },
      { id: "a2", label: `Diagram practice: ${primarySubject}`, done: false },
      { id: "a3", label: "Rapid revision flashcards", done: false },
      { id: "a4", label: "Maintain daily revision streak", done: true },
    ];
  }

  return [
    { id: "a1", label: `Advanced PYQs: ${primaryTopic}`, done: false },
    { id: "a2", label: `Timed numericals: ${primarySubject}`, done: false },
    { id: "a3", label: "Full mock analysis", done: false },
    { id: "a4", label: "Maintain 7+ hr consistency", done: true },
  ];
}

export function getMentorContext(profile: UserProfile): {
  exam: ExamType | null;
  subjects: readonly string[];
  weakTopics: string[];
  focusAreas: readonly string[];
} {
  const exam = profile.examType;
  if (!exam) {
    return { exam: null, subjects: [], weakTopics: [], focusAreas: [] };
  }
  return {
    exam,
    subjects: EXAM_CONFIG[exam].subjects,
    weakTopics: profile.weakTopics,
    focusAreas: EXAM_CONFIG[exam].focusAreas,
  };
}
