import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OAUTH_GOOGLE_MARKER } from "./oauth";
import { hashPassword, verifyPassword } from "./password";
import { normalizeEmail, userIdFromEmail } from "./validation";

type LocalUser = {
  userId: string;
  email: string;
  passwordHash: string;
  authProvider: "email" | "google";
  createdAt: string;
};

function storePath(): string {
  return path.join(process.cwd(), ".local-auth", "users.json");
}

function readStore(): LocalUser[] {
  const file = storePath();
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf8")) as LocalUser[];
  } catch {
    return [];
  }
}

function writeStore(users: LocalUser[]): void {
  const file = storePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(users, null, 2), "utf8");
}

export function findLocalUser(email: string): LocalUser | null {
  const normalized = normalizeEmail(email);
  return readStore().find((u) => u.email === normalized) ?? null;
}

export function createLocalUser(email: string, password: string): LocalUser {
  const normalized = normalizeEmail(email);
  const users = readStore();
  if (users.some((u) => u.email === normalized)) {
    throw new Error("USER_EXISTS");
  }

  const user: LocalUser = {
    userId: userIdFromEmail(normalized),
    email: normalized,
    passwordHash: hashPassword(password),
    authProvider: "email",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeStore(users);
  return user;
}

export function createLocalGoogleUser(email: string): LocalUser {
  const normalized = normalizeEmail(email);
  const existing = findLocalUser(normalized);
  if (existing) return existing;

  const users = readStore();
  const user: LocalUser = {
    userId: userIdFromEmail(normalized),
    email: normalized,
    passwordHash: OAUTH_GOOGLE_MARKER,
    authProvider: "google",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeStore(users);
  return user;
}

export function verifyLocalCredentials(email: string, password: string): LocalUser | null {
  const user = findLocalUser(email);
  if (!user) return null;
  if (user.passwordHash === OAUTH_GOOGLE_MARKER) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}
