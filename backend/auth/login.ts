import {
  createLocalGoogleUser,
  createLocalUser,
  verifyLocalCredentials,
} from "./local";
import {
  NotionAccessError,
  createGoogleUserInNotion,
  createUserInNotion,
  findUserByEmail,
  isNotionAuthConfigured,
  touchLastLogin,
  verifyUserCredentials,
} from "./notion";
import { normalizeEmail, validateLoginInput } from "./validation";

export type AuthSuccess = {
  userId: string;
  email: string;
};

export type AuthFailure = {
  code:
    | "VALIDATION"
    | "NOT_CONFIGURED"
    | "NOTION_ACCESS"
    | "INVALID_CREDENTIALS"
    | "USER_EXISTS"
    | "SERVER";
  message: string;
  errors?: { email?: string; password?: string };
};

let localAuthWarned = false;

function warnLocalAuthFallback(): void {
  if (localAuthWarned) return;
  localAuthWarned = true;
  console.warn(
    "[auth] Notion users database is not accessible — using local dev auth at .local-auth/users.json. " +
      "Share your Users database with the DhruvYantra integration in Notion to use production auth.",
  );
}

function useLocalDevAuth(error: unknown): boolean {
  return error instanceof NotionAccessError && process.env.NODE_ENV === "development";
}

function notionAccessFailure(error: unknown): AuthFailure | null {
  if (error instanceof NotionAccessError) {
    return {
      code: "NOTION_ACCESS",
      message:
        "Notion users database not found. In Notion, open your Users database → ⋯ → Connections → add DhruvYantra.",
    };
  }
  return null;
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ ok: true; user: AuthSuccess } | { ok: false; error: AuthFailure }> {
  const validated = validateLoginInput(email, password);
  if (!validated.ok) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Fix the highlighted fields",
        errors: validated.errors,
      },
    };
  }

  if (!isNotionAuthConfigured()) {
    return {
      ok: false,
      error: {
        code: "NOT_CONFIGURED",
        message:
          "Sign-in is not available yet. Set NOTION_API_KEY and NOTION_USERS_DATABASE_ID in .env.local.",
      },
    };
  }

  try {
    const user = await verifyUserCredentials(validated.email, password);
    if (!user) {
      return {
        ok: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      };
    }

    void touchLastLogin(user.pageId).catch((e) => {
      console.warn("[auth] Failed to update lastLoginAt:", e);
    });

    return {
      ok: true,
      user: { userId: user.userId, email: user.email },
    };
  } catch (e) {
    if (useLocalDevAuth(e)) {
      warnLocalAuthFallback();
      const user = verifyLocalCredentials(validated.email, password);
      if (!user) {
        return {
          ok: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        };
      }
      return {
        ok: true,
        user: { userId: user.userId, email: user.email },
      };
    }
    const notionErr = notionAccessFailure(e);
    if (notionErr) {
      console.error("[auth] Notion login failed:", e);
      return { ok: false, error: notionErr };
    }
    console.error("[auth] Notion login failed:", e);
    return {
      ok: false,
      error: { code: "SERVER", message: "Sign-in failed. Try again in a moment." },
    };
  }
}

export async function authenticateGoogleUser(
  email: string,
): Promise<{ ok: true; user: AuthSuccess } | { ok: false; error: AuthFailure }> {
  const normalized = normalizeEmail(email.trim());
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Google account did not return a valid email" },
    };
  }

  if (!isNotionAuthConfigured()) {
    return {
      ok: false,
      error: {
        code: "NOT_CONFIGURED",
        message:
          "Sign-in is not available yet. Set NOTION_API_KEY and NOTION_USERS_DATABASE_ID in .env.local.",
      },
    };
  }

  try {
    let user = await findUserByEmail(normalized);
    if (!user) {
      user = await createGoogleUserInNotion(normalized);
    }

    void touchLastLogin(user.pageId).catch((e) => {
      console.warn("[auth] Failed to update lastLoginAt:", e);
    });

    return {
      ok: true,
      user: { userId: user.userId, email: user.email },
    };
  } catch (e) {
    if (useLocalDevAuth(e)) {
      warnLocalAuthFallback();
      const user = createLocalGoogleUser(normalized);
      return {
        ok: true,
        user: { userId: user.userId, email: user.email },
      };
    }
    const notionErr = notionAccessFailure(e);
    if (notionErr) {
      console.error("[auth] Google sign-in failed:", e);
      return { ok: false, error: notionErr };
    }
    console.error("[auth] Google sign-in failed:", e);
    return {
      ok: false,
      error: { code: "SERVER", message: "Google sign-in failed. Try again in a moment." },
    };
  }
}

export async function registerUser(
  email: string,
  password: string,
): Promise<{ ok: true; user: AuthSuccess } | { ok: false; error: AuthFailure }> {
  const validated = validateLoginInput(email, password);
  if (!validated.ok) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Fix the highlighted fields",
        errors: validated.errors,
      },
    };
  }

  if (!isNotionAuthConfigured()) {
    return {
      ok: false,
      error: {
        code: "NOT_CONFIGURED",
        message:
          "Registration is not available yet. Set NOTION_API_KEY and NOTION_USERS_DATABASE_ID in .env.local.",
      },
    };
  }

  try {
    const created = await createUserInNotion(validated.email, password);
    return {
      ok: true,
      user: { userId: created.userId, email: created.email },
    };
  } catch (e) {
    if (e instanceof Error && e.message === "USER_EXISTS") {
      return {
        ok: false,
        error: {
          code: "USER_EXISTS",
          message: "An account with this email already exists",
        },
      };
    }
    if (useLocalDevAuth(e)) {
      warnLocalAuthFallback();
      try {
        const created = createLocalUser(validated.email, password);
        return {
          ok: true,
          user: { userId: created.userId, email: created.email },
        };
      } catch (localErr) {
        if (localErr instanceof Error && localErr.message === "USER_EXISTS") {
          return {
            ok: false,
            error: {
              code: "USER_EXISTS",
              message: "An account with this email already exists",
            },
          };
        }
        throw localErr;
      }
    }
    const notionErr = notionAccessFailure(e);
    if (notionErr) {
      console.error("[auth] Notion register failed:", e);
      return { ok: false, error: notionErr };
    }
    console.error("[auth] Notion register failed:", e);
    return {
      ok: false,
      error: { code: "SERVER", message: "Could not create account. Try again in a moment." },
    };
  }
}
