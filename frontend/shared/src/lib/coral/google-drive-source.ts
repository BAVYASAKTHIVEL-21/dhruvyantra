import {
  CORAL_GOOGLE_DRIVE_SCHEMA,
} from "@backend/coral-mcp/registry";
import { getGoogleDriveFolderId } from "@backend/coral-mcp/google-drive-gateway";
import {
  executeGoogleCoralSql,
  GoogleCoralSqlError,
} from "@backend/coral-mcp/google-coral-sql";
import { sqlString } from "@backend/coral-mcp/coral-sql";

export type CoralDriveFileRow = {
  id: string;
  name?: string;
  mime_type?: string;
  web_view_link?: string;
  web_content_link?: string;
  size?: string;
  modified_time?: string;
};

function rowToCoralDriveFile(row: Record<string, unknown>): CoralDriveFileRow | null {
  if (typeof row.id !== "string") return null;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : undefined,
    mime_type: typeof row.mime_type === "string" ? row.mime_type : undefined,
    web_view_link: typeof row.web_view_link === "string" ? row.web_view_link : undefined,
    web_content_link:
      typeof row.web_content_link === "string" ? row.web_content_link : undefined,
    size: typeof row.size === "string" ? row.size : row.size != null ? String(row.size) : undefined,
    modified_time:
      typeof row.modified_time === "string"
        ? row.modified_time
        : row.modified_time instanceof Date
          ? row.modified_time.toISOString()
          : undefined,
  };
}

/** List Vault folder files via Coral SQL only. */
export async function fetchDriveFilesFromCoral(): Promise<CoralDriveFileRow[]> {
  const folderId = getGoogleDriveFolderId();
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured");
  }

  const sql = `SELECT id, name, mime_type, web_view_link, web_content_link, size, modified_time FROM ${CORAL_GOOGLE_DRIVE_SCHEMA}.files WHERE folder_id = ${sqlString(folderId)}`;
  let rows: Record<string, unknown>[];
  try {
    rows = await executeGoogleCoralSql("drive", sql, { allowEmpty: true });
  } catch (e) {
    if (e instanceof GoogleCoralSqlError) {
      const hint = e.message.includes("No column named")
        ? " Run: npm run setup:coral-google-drive"
        : "";
      throw new Error(`${e.message}${hint}`);
    }
    throw e;
  }

  const files: CoralDriveFileRow[] = [];
  for (const row of rows) {
    const mapped = rowToCoralDriveFile(row);
    if (mapped) files.push(mapped);
  }
  return files;
}
