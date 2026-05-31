/**
 * Google Drive Vault — Coral SQL only (reads + writes).
 */
export type { DriveFileItem } from "@backend/coral-mcp/google-drive-gateway";

import {
  getGoogleDriveSetupHint,
  isGoogleDriveConfigured,
  isGoogleDriveEnabled,
} from "@backend/coral-mcp/google-drive-gateway";
import { getDriveFileViaCoral, listDriveFilesViaCoral } from "@/lib/coral/google-drive-reads";
import { uploadDriveFileViaCoral } from "@/lib/coral/writes";

export {
  getGoogleDriveSetupHint,
  isGoogleDriveConfigured,
  isGoogleDriveEnabled,
};

export async function listDriveFolderFiles() {
  return listDriveFilesViaCoral();
}

export async function getDriveFileUrl(fileId: string) {
  const file = await getDriveFileViaCoral(fileId);
  if (!file) throw new Error(`Drive file not found: ${fileId}`);
  return file;
}

export async function uploadDriveFile(params: {
  title: string;
  mimeType: string;
  data: Buffer | Uint8Array;
}) {
  return uploadDriveFileViaCoral(params);
}

export async function fetchVaultFilesViaAgent() {
  return listDriveFolderFiles();
}

export async function uploadVaultFileViaAgent(params: {
  title: string;
  mimeType: string;
  data: Buffer | Uint8Array;
}) {
  return uploadDriveFileViaCoral(params);
}
