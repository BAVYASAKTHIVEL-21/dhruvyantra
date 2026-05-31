import { EXAM_CONFIG, type ExamType } from "@/config/exam-config";
import { getTopicsForSubject } from "@/config/syllabus";
import type { ProfileMe } from "@/lib/profile/me-types";

export type WeakTopicStat = { name: string; percent: number; subject: string };

export type RevisionItem = {
  when: string;
  topic: string;
  priority: string;
  tone: "purple" | "blue" | "muted";
};

export type ExamFocusModule = {
  id: string;
  title: string;
  description: string;
  tag: string;
};

const WEAKNESS_BASE = 58;

export function buildWeakTopicStats(profile: ProfileMe): WeakTopicStat[] {
  const topics =
    profile.weakTopics.length > 0
      ? profile.weakTopics
      : profile.weakSubjects.flatMap((s) =>
          profile.examType ? [...getTopicsForSubject(profile.examType, s)].slice(0, 1) : [],
        );

  return topics.slice(0, 4).map((name, i) => ({
    name,
    subject: findSubjectForTopic(profile, name),
    percent: Math.max(28, WEAKNESS_BASE - i * 8 - (profile.dailyStudyHours > 6 ? 5 : 0)),
  }));
}

function findSubjectForTopic(profile: ProfileMe, topic: string): string {
  if (!profile.examType) return "General";
  for (const subject of profile.weakSubjects) {
    if (getTopicsForSubject(profile.examType, subject).includes(topic)) return subject;
  }
  return profile.weakSubjects[0] ?? EXAM_CONFIG[profile.examType].subjects[0];
}

export function buildRevisionSchedule(profile: ProfileMe): RevisionItem[] {
  const topics =
    profile.weakTopics.length > 0
      ? profile.weakTopics
      : profile.weakSubjects.map((s) => `${s} fundamentals`);

  const whenLabels = ["Tomorrow", "+3 Days", "+7 Days", "+10 Days"];
  const priorities = ["High Priority", "Medium", "High Priority", "Low"];
  const tones: RevisionItem["tone"][] = ["purple", "blue", "purple", "muted"];

  return topics.slice(0, 4).map((topic, i) => ({
    when: whenLabels[i] ?? `+${(i + 1) * 3} Days`,
    topic,
    priority: priorities[i] ?? "Medium",
    tone: tones[i] ?? "muted",
  }));
}

export function buildExamFocusModules(profile: ProfileMe): ExamFocusModule[] {
  if (profile.examType === "NEET") {
    return [
      {
        id: "bio-revision",
        title: "Biology Revision",
        description: "NCERT cycles for your weak biology topics.",
        tag: profile.weakSubjects.includes("Biology") ? "Priority" : "Suggested",
      },
      {
        id: "ncert-tracker",
        title: "NCERT Tracker",
        description: "Line-by-line NCERT progress for Chemistry & Biology.",
        tag: "NCERT",
      },
      {
        id: "diagram-practice",
        title: "Diagram Practice",
        description: "Labeling drills for physiology and ecology diagrams.",
        tag: "Visual",
      },
      {
        id: "rapid-revision",
        title: "Rapid Revision",
        description: `${profile.dailyStudyHours}h/day flash recall sessions.`,
        tag: profile.productiveTime ?? "Flexible",
      },
    ];
  }

  if (profile.examType === "JEE") {
    return [
      {
        id: "math-widgets",
        title: "Mathematics Focus",
        description: "Calculus, algebra, and coordinate drills from your syllabus.",
        tag: profile.weakSubjects.includes("Mathematics") ? "Priority" : "Core",
      },
      {
        id: "advanced-pyqs",
        title: "Advanced PYQs",
        description: "High-yield previous year sets for weak topics.",
        tag: "PYQs",
      },
      {
        id: "problem-solving",
        title: "Problem Solving",
        description: "Mixed numerical practice across PCM.",
        tag: "Practice",
      },
      {
        id: "timed-modules",
        title: "Timed Practice",
        description: `Scheduled around your ${profile.productiveTime?.toLowerCase() ?? "peak"} hours.`,
        tag: "Timed",
      },
    ];
  }

  return [];
}

export function buildMentorInsight(profile: ProfileMe): { quote: string; action: string } {
  const exam = profile.examType;
  const weak = profile.weakTopics[0] ?? profile.weakSubjects[0] ?? "your syllabus";

  if (exam === "JEE") {
    return {
      quote: `Your ${exam} plan prioritizes **${weak}** — focus on timed numericals and advanced PYQs today.`,
      action: "Let's sharpen problem-solving speed together.",
    };
  }
  if (exam === "NEET") {
    return {
      quote: `Your ${exam} plan prioritizes **${weak}** — NCERT revision and diagram recall will give quick gains.`,
      action: "Let's build a rapid revision loop for today.",
    };
  }

  return {
    quote: "Complete onboarding so I can personalize insights to your exam journey.",
    action: "Finish setup to unlock AI mentor mode.",
  };
}

export function greetingForProfile(profile: ProfileMe | null): string {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const name = profile?.name ?? "Student";
  return `${time}, ${name}`;
}

export function dashboardSubtitle(profile: ProfileMe | null): string {
  if (!profile?.examType) {
    return "Ready to continue your preparation journey?";
  }
  const weak = profile.weakTopics.slice(0, 2).join(" & ") || profile.weakSubjects.join(" & ");
  const rank = profile.targetRank ? ` · Target: ${profile.targetRank}` : "";
  return `${profile.examType} mode · Focus: ${weak}${rank}`;
}

export function weeklyStatsForProfile(profile: ProfileMe) {
  const hours = profile.dailyStudyHours * 5;
  return [
    { label: "Study Hours", value: `${hours.toFixed(1)} hrs`, change: "+12%" },
    {
      label: profile.examType === "JEE" ? "Numericals Solved" : "Topics Revised",
      value: profile.examType === "JEE" ? "1,248" : "86",
      change: "+18%",
    },
    { label: "Accuracy", value: profile.examType === "JEE" ? "78%" : "82%", change: "+8%" },
  ];
}

export function resourcesHeroCopy(profile: ProfileMe | null) {
  if (!profile?.examType) {
    return {
      eyebrow: "AI-curated library",
      title: "Your Learning Library",
      subtitle: "Notes, PYQs, books, and videos — complete onboarding to personalize picks.",
    };
  }
  const weak = profile.weakTopics[0] ?? profile.weakSubjects[0] ?? "your weak areas";
  return {
    eyebrow: `${profile.examType} personalized library`,
    title: `Resources for ${weak}`,
    subtitle:
      profile.examType === "JEE"
        ? "PYQs, DPPs, and advanced sheets prioritized for your weak syllabus topics."
        : "NCERT notes, revision sheets, and biology diagrams matched to your weak topics.",
  };
}

export type MentorContextPayload = {
  examType: ExamType | null;
  weakSubjects: string[];
  weakTopics: string[];
  dailyStudyHours: number;
  productiveTime: string | null;
  focusAreas: readonly string[];
  syllabusSubjects: readonly string[];
};

export function buildMentorContext(profile: ProfileMe): MentorContextPayload {
  const exam = profile.examType;
  return {
    examType: exam,
    weakSubjects: profile.weakSubjects,
    weakTopics: profile.weakTopics,
    dailyStudyHours: profile.dailyStudyHours,
    productiveTime: profile.productiveTime,
    focusAreas: exam ? EXAM_CONFIG[exam].focusAreas : [],
    syllabusSubjects: exam ? EXAM_CONFIG[exam].subjects : [],
  };
}
