import {
  isDhruvyantraStoreReady,
  readMockSubmissions,
  rewriteMockSubmissions,
} from "@/lib/coral/dhruvyantra-store";
import { isCoralEnabled } from "@/lib/coral/config";
import type { MockSubmissionRecord } from "@/types/mock-results";

export async function shouldUseMockCenterCoral(): Promise<boolean> {
  return isCoralEnabled() && (await isDhruvyantraStoreReady());
}

function recordFromRow(row: Record<string, unknown>): MockSubmissionRecord | null {
  const raw = row.record_json;
  if (raw && typeof raw === "object" && raw !== null) {
    return raw as MockSubmissionRecord;
  }
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as MockSubmissionRecord;
    } catch {
      return null;
    }
  }
  return null;
}

export async function loadMockSubmissionsFromCoral(
  userId: string,
): Promise<MockSubmissionRecord[]> {
  const rows = await readMockSubmissions(userId);
  const records: MockSubmissionRecord[] = [];
  for (const row of rows) {
    const parsed = recordFromRow(row);
    if (parsed?.id) records.push(parsed);
  }
  return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function saveMockSubmissionToCoral(
  userId: string,
  record: MockSubmissionRecord,
): Promise<void> {
  const existing = await loadMockSubmissionsFromCoral(userId);
  const withoutDup = existing.filter((s) => s.id !== record.id);
  const next = [record, ...withoutDup].slice(0, 40);
  await rewriteMockSubmissions(
    userId,
    next.map((r) => ({
      submittedAt: r.submittedAt,
      record: r as unknown as Record<string, unknown>,
    })),
  );
}
