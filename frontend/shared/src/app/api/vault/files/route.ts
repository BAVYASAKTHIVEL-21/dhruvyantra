import { NextResponse } from "next/server";
import {
  getDriveFileUrl,
  getGoogleDriveSetupHint,
  isGoogleDriveConfigured,
  listDriveFolderFiles,
  uploadDriveFile,
} from "@/lib/integrations/google-drive";
import { getSessionUserId } from "@/lib/profile/server";
import { driveFilesToVaultFiles, driveFileToVaultFile } from "@/lib/vault/drive-mapper";

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGoogleDriveConfigured()) {
      return NextResponse.json({
        files: [],
        configured: false,
        setupHint: getGoogleDriveSetupHint(),
      });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (fileId) {
      const file = await getDriveFileUrl(fileId);
      return NextResponse.json({ file: driveFileToVaultFile(file), configured: true });
    }

    const files = await listDriveFolderFiles();
    return NextResponse.json({ files: driveFilesToVaultFiles(files), configured: true });
  } catch (e) {
    console.error("[api/vault/files GET]", e);
    return NextResponse.json({ error: "Failed to load vault files" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGoogleDriveConfigured()) {
      return NextResponse.json(
        { error: getGoogleDriveSetupHint() || "Google Drive Vault is not configured" },
        { status: 503 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadDriveFile({
      title: file.name,
      mimeType: file.type || "application/octet-stream",
      data: buffer,
    });

    return NextResponse.json({ file: driveFileToVaultFile(uploaded) });
  } catch (e) {
    console.error("[api/vault/files POST]", e);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
