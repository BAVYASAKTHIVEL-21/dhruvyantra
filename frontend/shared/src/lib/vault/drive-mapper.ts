import type { DriveFileItem } from "@/lib/integrations/google-drive";
import type { VaultFile, VaultFileType, VaultSubject } from "../../../../vault/types";

function mimeToVaultType(mimeType: string): VaultFileType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("document") || mimeType.includes("word") || mimeType.includes("text")) {
    return "doc";
  }
  return "other";
}

function guessSubject(title: string): VaultSubject {
  const t = title.toLowerCase();
  if (/physics|mechanics|electro|thermo|optics/.test(t)) return "Physics";
  if (/chem|organic|inorganic/.test(t)) return "Chemistry";
  if (/math|calculus|algebra|vector|probability/.test(t)) return "Mathematics";
  if (/bio|genetics|physiology|ncert|cell/.test(t)) return "Biology";
  return "Mixed";
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatOpenedAt(modifiedTime?: string): string {
  if (!modifiedTime) return "Recently";
  const diffMs = Date.now() - new Date(modifiedTime).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(modifiedTime).toLocaleDateString();
}

export function driveFileToVaultFile(file: DriveFileItem): VaultFile {
  return {
    id: file.id,
    name: file.title,
    subject: guessSubject(file.title),
    type: mimeToVaultType(file.mimeType),
    size: formatSize(file.size),
    openedAt: formatOpenedAt(file.modifiedTime),
    tags: [],
    url: file.fileUrl,
    mimeType: file.mimeType,
  };
}

export function driveFilesToVaultFiles(files: DriveFileItem[]): VaultFile[] {
  return files.map(driveFileToVaultFile);
}
