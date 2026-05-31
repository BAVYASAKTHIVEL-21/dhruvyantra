import { cookies } from "next/headers";
import { addDays, isoDate } from "@/lib/mission-control/dates";
import {
  loadMockSubmissionsFromCoral,
  saveMockSubmissionToCoral,
  shouldUseMockCenterCoral,
} from "./coral-persistence";
import type { MockSubmissionRecord, MockTopicPerformance } from "@/types/mock-results";

export const MOCK_CENTER_COOKIE = "dhruvyantra_mock_center";

export type MockCenterStore = {
  userId: string;
  submissions: MockSubmissionRecord[];
};

function encodeStore(store: MockCenterStore): string {
  return Buffer.from(JSON.stringify(store), "utf8").toString("base64url");
}

function decodeStore(raw: string): MockCenterStore | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as MockCenterStore;
    if (!parsed?.userId || !Array.isArray(parsed.submissions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readStore(userId: string): Promise<MockCenterStore> {
  const jar = await cookies();
  const raw = jar.get(MOCK_CENTER_COOKIE)?.value;
  if (!raw) return { userId, submissions: [] };
  const decoded = decodeStore(raw);
  if (!decoded || decoded.userId !== userId) return { userId, submissions: [] };
  return decoded;
}

async function writeStore(store: MockCenterStore): Promise<void> {
  const jar = await cookies();
  jar.set(MOCK_CENTER_COOKIE, encodeStore(store), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function getMockSubmissions(userId: string): Promise<MockSubmissionRecord[]> {
  if (await shouldUseMockCenterCoral()) {
    return loadMockSubmissionsFromCoral(userId);
  }
  const store = await readStore(userId);
  return [...store.submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function saveMockSubmission(
  userId: string,
  record: MockSubmissionRecord,
): Promise<void> {
  if (await shouldUseMockCenterCoral()) {
    await saveMockSubmissionToCoral(userId, record);
    return;
  }
  const store = await readStore(userId);
  const withoutDup = store.submissions.filter((s) => s.id !== record.id);
  store.submissions = [record, ...withoutDup].slice(0, 40);
  await writeStore(store);
}

export async function getLatestMockSubmission(
  userId: string,
): Promise<MockSubmissionRecord | null> {
  const submissions = await getMockSubmissions(userId);
  return submissions[0] ?? null;
}

/** Aggregate topic performances from recent mock submissions for the weakness engine. */
export async function getMockTopicPerformances(
  userId: string,
  windowDays = 90,
): Promise<MockTopicPerformance[]> {
  const today = isoDate();
  const start = addDays(today, -(windowDays - 1));
  const submissions = await getMockSubmissions(userId);
  const recent = submissions.filter((s) => s.submittedAt.slice(0, 10) >= start);

  const byTopic = new Map<string, MockTopicPerformance>();

  for (const submission of recent) {
    for (const row of submission.analysis.topicAccuracy) {
      const key = `${row.subject}::${row.topic}`;
      const existing = byTopic.get(key);
      if (!existing) {
        byTopic.set(key, { ...row });
        continue;
      }
      const total = existing.total + row.total;
      const correct = existing.correct + row.correct;
      const incorrect = existing.incorrect + row.incorrect;
      const skipped = existing.skipped + row.skipped;
      byTopic.set(key, {
        topic: row.topic,
        subject: row.subject,
        total,
        correct,
        incorrect,
        skipped,
        accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
      });
    }
  }

  return [...byTopic.values()].sort((a, b) => a.accuracy - b.accuracy);
}
