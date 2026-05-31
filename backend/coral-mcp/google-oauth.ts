import { createSign } from "node:crypto";
import { GOOGLE_CALENDAR_CONFIG, GOOGLE_DRIVE_CONFIG } from "./registry";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function googleRefreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  label: string;
}): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`${params.label} token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error(`${params.label} token refresh returned no access_token`);
  }
  return data.access_token;
}

export async function googleServiceAccountAccessToken(params: {
  email: string;
  privateKeyPem: string;
  scope: string;
  label: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: params.email,
      scope: params.scope,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = sign.sign(params.privateKeyPem);
  const jwt = `${unsigned}.${base64Url(signature)}`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`${params.label} service account auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error(`${params.label} service account auth returned no access_token`);
  }
  return data.access_token;
}

export function getGoogleCalendarOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} | null {
  const clientId = process.env[GOOGLE_CALENDAR_CONFIG.clientIdEnv]?.trim();
  const clientSecret = process.env[GOOGLE_CALENDAR_CONFIG.clientSecretEnv]?.trim();
  const refreshToken = process.env[GOOGLE_CALENDAR_CONFIG.refreshTokenEnv]?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function getGoogleDriveAuthMode(): "service_account" | "refresh_token" | null {
  const hasServiceAccount = Boolean(
    process.env[GOOGLE_DRIVE_CONFIG.serviceAccountEmailEnv]?.trim() &&
      process.env[GOOGLE_DRIVE_CONFIG.serviceAccountKeyEnv]?.trim(),
  );
  if (hasServiceAccount) return "service_account";

  const hasRefresh = Boolean(
    process.env[GOOGLE_DRIVE_CONFIG.refreshTokenEnv]?.trim() &&
      process.env[GOOGLE_DRIVE_CONFIG.clientIdEnv]?.trim() &&
      process.env[GOOGLE_DRIVE_CONFIG.clientSecretEnv]?.trim(),
  );
  if (hasRefresh) return "refresh_token";
  return null;
}

let cachedDriveToken: { value: string; expiresAt: number } | null = null;

export async function getGoogleDriveAccessToken(): Promise<string> {
  if (cachedDriveToken && cachedDriveToken.expiresAt > Date.now() + 60_000) {
    return cachedDriveToken.value;
  }

  const mode = getGoogleDriveAuthMode();
  if (!mode) {
    throw new Error("Google Drive auth not configured");
  }

  let value: string;
  if (mode === "service_account") {
    const email = process.env[GOOGLE_DRIVE_CONFIG.serviceAccountEmailEnv]!.trim();
    const rawKey = process.env[GOOGLE_DRIVE_CONFIG.serviceAccountKeyEnv] ?? "";
    value = await googleServiceAccountAccessToken({
      email,
      privateKeyPem: rawKey.replace(/\\n/g, "\n"),
      scope: GOOGLE_DRIVE_CONFIG.scope,
      label: "Drive",
    });
  } else {
    value = await googleRefreshAccessToken({
      clientId: process.env[GOOGLE_DRIVE_CONFIG.clientIdEnv]!.trim(),
      clientSecret: process.env[GOOGLE_DRIVE_CONFIG.clientSecretEnv]!.trim(),
      refreshToken: process.env[GOOGLE_DRIVE_CONFIG.refreshTokenEnv]!.trim(),
      label: "Drive",
    });
  }

  cachedDriveToken = { value, expiresAt: Date.now() + 55 * 60 * 1000 };
  return value;
}

export async function getGoogleCalendarAccessToken(): Promise<string> {
  const config = getGoogleCalendarOAuthConfig();
  if (!config) {
    throw new Error("Google Calendar OAuth is not configured");
  }
  return googleRefreshAccessToken({
    ...config,
    label: "Calendar",
  });
}
