import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function coralBinFromEnv(env?: Record<string, string>): string {
  return env?.CORAL_BIN?.trim() || process.env.CORAL_BIN?.trim() || "coral";
}

export function coralSourceDir(sourceName: string): string {
  const home = process.env.CORAL_HOME ?? join(homedir(), ".config/coral");
  const workspace = process.env.CORAL_WORKSPACE ?? "default";
  return join(home, "workspaces", workspace, "sources", sourceName);
}

/** Sync manifest + secrets, then `coral source add --file` (imported source). */
export function installImportedCoralSource(options: {
  sourceName: string;
  manifestPath: string;
  secretsLines?: string[];
  runEnv?: Record<string, string>;
}): boolean {
  const { sourceName, manifestPath, secretsLines, runEnv } = options;
  if (!existsSync(manifestPath)) {
    console.error(`  ✗ missing manifest: ${manifestPath}`);
    return false;
  }

  const coralBin = coralBinFromEnv(runEnv);
  const dir = coralSourceDir(sourceName);
  mkdirSync(dir, { recursive: true });
  copyFileSync(manifestPath, join(dir, "manifest.yaml"));
  if (secretsLines?.length) {
    writeFileSync(join(dir, "secrets.env"), `${secretsLines.join("\n")}\n`, "utf8");
  }

  const env = { ...process.env, ...runEnv };
  try {
    execSync(`${coralBin} source remove ${sourceName}`, { stdio: "pipe", env });
  } catch {
    // not installed
  }

  try {
    execSync(`${coralBin} source add --file ${JSON.stringify(manifestPath)}`, {
      stdio: "inherit",
      env,
    });
    console.log(`  ✓ ${sourceName} (imported)`);
    return true;
  } catch {
    console.warn(`  ✗ ${sourceName} — run: coral source add --file ${manifestPath}`);
    return false;
  }
}

/** Bundled Coral sources (e.g. notion). */
export function installBundledCoralSource(
  sourceName: string,
  runEnv?: Record<string, string>,
): boolean {
  const coralBin = coralBinFromEnv(runEnv);
  const env = { ...process.env, ...runEnv };
  try {
    execSync(`${coralBin} source remove ${sourceName}`, { stdio: "pipe", env });
  } catch {
    // not installed
  }
  try {
    execSync(`${coralBin} source add ${sourceName}`, { stdio: "inherit", env });
    console.log(`  ✓ ${sourceName} (bundled)`);
    return true;
  } catch {
    console.warn(`  ✗ ${sourceName} — run: coral source add ${sourceName}`);
    return false;
  }
}
