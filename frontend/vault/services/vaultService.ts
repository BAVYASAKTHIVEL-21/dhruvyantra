/**
 * Vault data layer — Google Drive folder via /api/vault/files.
 *
 * Future: Frontend → Vault Agent → Coral MCP → Drive API
 */

import {
  AI_ORGANIZATION,
  AI_SUMMARIES,
  FOLDERS,
  QUICK_ACCESS,
  QUICK_REVISION,
  RECENT_ACTIVITY,
  RECENT_FILES,
  STORAGE,
  STORAGE_BREAKDOWN,
} from "../data/vault";
import type { VaultFile } from "../types";

export type VaultFilesResponse = {
  files: VaultFile[];
  configured: boolean;
  setupHint?: string;
};

export async function fetchVaultFiles(): Promise<VaultFilesResponse> {
  const res = await fetch("/api/vault/files", { cache: "no-store" });
  if (res.status === 401) {
    return { files: [], configured: false };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load vault files");
  }
  return res.json();
}

export async function uploadVaultFile(file: File): Promise<VaultFile> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/vault/files", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload file");
  }
  const data = (await res.json()) as { file: VaultFile };
  return data.file;
}

export async function getAllFiles(): Promise<VaultFile[]> {
  const data = await fetchVaultFiles();
  if (data.configured && data.files.length > 0) return data.files;
  return RECENT_FILES;
}

export function searchVault(query: string, files: VaultFile[]): VaultFile[] {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter((f) =>
    [f.name, f.subject, ...f.tags].join(" ").toLowerCase().includes(q),
  );
}

export function getFolders() {
  return FOLDERS;
}

export function getAiSummaries() {
  return AI_SUMMARIES;
}

export function getQuickRevision() {
  return QUICK_REVISION;
}

export function getStorage() {
  return STORAGE;
}

export function getStorageBreakdown() {
  return STORAGE_BREAKDOWN;
}

export function getQuickAccess() {
  return QUICK_ACCESS;
}

export function getRecentActivity() {
  return RECENT_ACTIVITY;
}

export function getAiOrganization() {
  return AI_ORGANIZATION;
}
