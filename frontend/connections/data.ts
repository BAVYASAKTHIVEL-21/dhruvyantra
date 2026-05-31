export type ConnectionTab =
  | "discover"
  | "network"
  | "groups"
  | "communities"
  | "mentors"
  | "messages";

export const CONNECTION_TABS: { id: ConnectionTab; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "network", label: "My Network" },
  { id: "groups", label: "Study Groups" },
  { id: "communities", label: "Communities" },
  { id: "mentors", label: "Mentors" },
  { id: "messages", label: "Messages" },
];

export const STATS = [
  { id: "students", label: "Active Students", value: "1.2K+", icon: "users" as const },
  { id: "groups", label: "Study Groups", value: "156", icon: "groups" as const },
  { id: "mentors", label: "Expert Mentors", value: "23", icon: "mentor" as const },
  { id: "score", label: "Collaboration Score", value: "98%", icon: "score" as const },
];

export type StudentConnection = {
  id: string;
  name: string;
  exam: string;
  target: string;
  online: boolean;
  tags: string[];
};

export const RECOMMENDED_STUDENTS: StudentConnection[] = [
  {
    id: "s1",
    name: "Arnav Singh",
    exam: "JEE 2025 Aspirant",
    target: "IIT Delhi Target",
    online: true,
    tags: ["jee", "physics", "iit"],
  },
  {
    id: "s2",
    name: "Meera Joshi",
    exam: "NEET 2025 Aspirant",
    target: "AIIMS Target",
    online: true,
    tags: ["neet", "biology"],
  },
  {
    id: "s3",
    name: "Rohit Verma",
    exam: "JEE 2025 Aspirant",
    target: "IIT Bombay Target",
    online: false,
    tags: ["jee", "math"],
  },
  {
    id: "s4",
    name: "Ananya Gupta",
    exam: "JEE 2025 Aspirant",
    target: "IIT Kanpur Target",
    online: true,
    tags: ["jee", "chemistry"],
  },
  {
    id: "s5",
    name: "Sarthak Jain",
    exam: "JEE 2025 Aspirant",
    target: "IIT Madras Target",
    online: false,
    tags: ["jee", "mock"],
  },
];

export type StudyGroup = {
  id: string;
  name: string;
  members: number;
  activeNow: boolean;
  icon: "rocket" | "atom" | "flask" | "sigma" | "target";
  tags: string[];
};

export const STUDY_GROUPS: StudyGroup[] = [
  { id: "g1", name: "JEE Advanced 2025", members: 342, activeNow: true, icon: "rocket", tags: ["jee advanced"] },
  { id: "g2", name: "Physics Wallah (Unofficial)", members: 890, activeNow: true, icon: "atom", tags: ["physics"] },
  { id: "g3", name: "Organic Chemistry Hunters", members: 156, activeNow: true, icon: "flask", tags: ["organic", "chemistry"] },
  { id: "g4", name: "Maths Problem Solvers", members: 278, activeNow: false, icon: "sigma", tags: ["math"] },
  { id: "g5", name: "Mock Test Warriors", members: 412, activeNow: true, icon: "target", tags: ["mock", "jee"] },
];

export const COMMUNITIES = [
  { id: "c1", name: "JEE Aspirants 2025", members: "2.4K", icon: "jee" as const },
  { id: "c2", name: "NEET Aspirants 2025", members: "1.8K", icon: "neet" as const },
  { id: "c3", name: "Revision Circle 2025", members: "920", icon: "board" as const },
  { id: "c4", name: "Competitive Coders", members: "540", icon: "code" as const },
];

export const UPCOMING_SESSIONS = [
  {
    id: "u1",
    title: "Ask Me Anything (LIVE)",
    mentor: "Dr. Sharma",
    when: "Today, 8:00 PM",
    live: true,
  },
  {
    id: "u2",
    title: "Physics Doubt Session",
    mentor: "Prof. Mehta",
    when: "Tomorrow, 6:00 PM",
    live: false,
  },
  {
    id: "u3",
    title: "Organic Chemistry Q&A",
    mentor: "Ms. Patel",
    when: "Sat, 5:00 PM",
    live: false,
  },
];

export const RECENT_ACTIVITY = [
  { id: "a1", text: "Rohit Verma joined JEE Advanced group", time: "10m ago", type: "join" as const },
  { id: "a2", text: "Meera Joshi shared a note", time: "25m ago", type: "share" as const },
  { id: "a3", text: "Arnav Singh solved Physics doubt", time: "1h ago", type: "solve" as const },
  { id: "a4", text: "Ananya Gupta posted in Maths group", time: "2h ago", type: "post" as const },
];

export const COLLABORATION_IMPACT = {
  points: 840,
  trend: "+12% this week",
  sparkline: [620, 680, 710, 750, 780, 810, 840],
};
