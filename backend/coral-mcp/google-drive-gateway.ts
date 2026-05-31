/**
 * Single gateway for all Google Drive HTTP traffic from DhruvYantra Vault.
 */
import { coralDebug } from "./coral-debug";
import { getGoogleDriveAccessToken, getGoogleDriveAuthMode } from "./google-oauth";
import { GOOGLE_DRIVE_CONFIG, type GoogleDriveGatewayOperation } from "./registry";

export type { GoogleDriveGatewayOperation };

export type DriveFileItem = {
  id: string;
  title: string;
  fileUrl: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
};

type DriveListResponse = {
  files?: {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    webContentLink?: string;
    size?: string;
    modifiedTime?: string;
  }[];
};

export function getGoogleDriveFolderId(): string | null {
  return process.env[GOOGLE_DRIVE_CONFIG.folderIdEnv]?.trim() || null;
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(getGoogleDriveFolderId() && getGoogleDriveAuthMode());
}

export function isGoogleDriveEnabled(): boolean {
  return process.env[GOOGLE_DRIVE_CONFIG.enabledEnv] === "true";
}

export function getGoogleDriveSetupHint(): string {
  const missing: string[] = [];
  if (!getGoogleDriveFolderId()) missing.push(GOOGLE_DRIVE_CONFIG.folderIdEnv);
  if (!getGoogleDriveAuthMode()) {
    missing.push(
      `${GOOGLE_DRIVE_CONFIG.serviceAccountEmailEnv} + ${GOOGLE_DRIVE_CONFIG.serviceAccountKeyEnv} (or ${GOOGLE_DRIVE_CONFIG.refreshTokenEnv})`,
    );
  }
  if (missing.length === 0) return "";
  return `Add to .env.local: ${missing.join(", ")}. Share the Drive folder with the service account email.`;
}

async function coralGoogleDriveRequest(
  operation: GoogleDriveGatewayOperation,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getGoogleDriveAccessToken();
  const method = (init.method ?? "GET").toUpperCase();

  const res = await fetch(`${GOOGLE_DRIVE_CONFIG.apiBaseUrl}${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(GOOGLE_DRIVE_CONFIG.timeoutMs),
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  coralDebug("coral/google-drive", `${method} ${operation} ${path}`);

  return res;
}

function fileUrlFromDrive(file: {
  id: string;
  webViewLink?: string;
  webContentLink?: string;
}): string {
  return file.webViewLink ?? file.webContentLink ?? `https://drive.google.com/file/d/${file.id}/view`;
}

function mapDriveFile(file: NonNullable<DriveListResponse["files"]>[number]): DriveFileItem {
  return {
    id: file.id,
    title: file.name,
    fileUrl: fileUrlFromDrive(file),
    mimeType: file.mimeType,
    size: file.size ? Number(file.size) : undefined,
    modifiedTime: file.modifiedTime,
  };
}

/** Probe connectivity — lists files in the configured Vault folder. */
export async function coralGoogleDriveProbe(): Promise<{
  ok: boolean;
  fileCount?: number;
  error?: string;
}> {
  if (!isGoogleDriveConfigured()) {
    return { ok: false, error: getGoogleDriveSetupHint() || "Drive not configured" };
  }

  try {
    const files = await coralGoogleDriveListFolderFiles();
    return { ok: true, fileCount: files.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function coralGoogleDriveListFolderFiles(): Promise<DriveFileItem[]> {
  const parentId = getGoogleDriveFolderId();
  if (!parentId) throw new Error(`${GOOGLE_DRIVE_CONFIG.folderIdEnv} is not set`);

  const q = encodeURIComponent(`'${parentId}' in parents and trashed = false`);
  const fields = encodeURIComponent(
    "files(id,name,mimeType,webViewLink,webContentLink,size,modifiedTime)",
  );

  const res = await coralGoogleDriveRequest(
    "drive.files.list",
    `/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  );

  if (!res.ok) {
    throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as DriveListResponse;
  return (data.files ?? []).map(mapDriveFile);
}

export async function coralGoogleDriveGetFile(fileId: string): Promise<DriveFileItem> {
  const parentId = getGoogleDriveFolderId();
  if (!parentId) throw new Error(`${GOOGLE_DRIVE_CONFIG.folderIdEnv} is not set`);

  const fields = encodeURIComponent(
    "id,name,mimeType,webViewLink,webContentLink,size,modifiedTime,parents",
  );

  const res = await coralGoogleDriveRequest(
    "drive.files.get",
    `/files/${fileId}?fields=${fields}&supportsAllDrives=true`,
  );

  if (!res.ok) {
    throw new Error(`Drive file fetch failed: ${res.status} ${await res.text()}`);
  }

  const file = (await res.json()) as {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    webContentLink?: string;
    size?: string;
    modifiedTime?: string;
    parents?: string[];
  };

  if (!file.parents?.includes(parentId)) {
    throw new Error("File is outside the configured Vault Drive folder");
  }

  return mapDriveFile(file);
}

export async function coralGoogleDriveUploadFile(params: {
  title: string;
  mimeType: string;
  data: Buffer | Uint8Array;
}): Promise<DriveFileItem> {
  const parentId = getGoogleDriveFolderId();
  if (!parentId) throw new Error(`${GOOGLE_DRIVE_CONFIG.folderIdEnv} is not set`);

  const token = await getGoogleDriveAccessToken();
  const boundary = `vault_${Date.now()}`;
  const metadata = JSON.stringify({
    name: params.title,
    parents: [parentId],
  });

  const bodyParts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`,
  ];

  const prefix = Buffer.from(bodyParts[0] + bodyParts[1], "utf8");
  const suffix = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const fileBuffer = Buffer.isBuffer(params.data) ? params.data : Buffer.from(params.data);
  const body = Buffer.concat([prefix, fileBuffer, suffix]);

  coralDebug("coral/google-drive", "POST drive.files.upload /files");

  const res = await fetch(
    `${GOOGLE_DRIVE_CONFIG.uploadBaseUrl}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,modifiedTime&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
      signal: AbortSignal.timeout(GOOGLE_DRIVE_CONFIG.timeoutMs),
    },
  );

  if (!res.ok) {
    throw new Error(`Drive upload failed: ${res.status} ${await res.text()}`);
  }

  const file = (await res.json()) as NonNullable<DriveListResponse["files"]>[number];
  return mapDriveFile(file);
}
