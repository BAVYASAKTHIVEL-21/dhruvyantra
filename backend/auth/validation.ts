export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function userIdFromEmail(email: string): string {
  return normalizeEmail(email).replace(/[^a-z0-9@._-]/g, "_");
}

export function validateLoginInput(
  email: string,
  password: string,
): { ok: true; email: string } | { ok: false; errors: LoginFieldErrors } {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    errors.email = "Enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (password.length > 72) {
    errors.password = "Password must be at most 72 characters";
  } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Password must include at least one letter and one number";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, email: normalizeEmail(trimmedEmail) };
}
