import type { DriveFileItem } from "@backend/coral-mcp/google-drive-gateway";
import { fetchDriveFilesFromCoral } from "./google-drive-source";
import { assertCoralEnabled } from "./query";

function fileUrlFromDrive(file: {
  id: string;
  web_view_link?: string;
  web_content_link?: string;
}): string {
  return (
    file.web_view_link ??
    file.web_content_link ??
    `https://drive.google.com/file/d/${file.id}/view`
  );
}

function mapCoralRowToDriveFile(row: {
  id: string;
  name?: string;
  mime_type?: string;
  web_view_link?: string;
  web_content_link?: string;
  size?: string;
  modified_time?: string;
}): DriveFileItem {
  return {
    id: row.id,
    title: row.name ?? "Untitled",
    fileUrl: fileUrlFromDrive(row),
    mimeType: row.mime_type ?? "application/octet-stream",
    size: row.size ? Number(row.size) : undefined,
    modifiedTime: row.modified_time,
  };
}

/** List Vault files via Coral SQL only. */
export async function listDriveFilesViaCoral(): Promise<DriveFileItem[]> {
  assertCoralEnabled();
  const rows = await fetchDriveFilesFromCoral();
  return rows.map(mapCoralRowToDriveFile);
}

export async function getDriveFileViaCoral(fileId: string): Promise<DriveFileItem | null> {
  const files = await listDriveFilesViaCoral();
  return files.find((f) => f.id === fileId) ?? null;
}
