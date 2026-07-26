/**
 * Passport handle (label) validation for onboarding.
 * Product name: {label}.nomadic-passport.eth
 *
 * Frontend is at least as restrictive as nomadic-back
 * `RESERVED_PASSPORT_LABELS` (backend remains authoritative).
 */

export const PASSPORT_ENS_PARENT = "nomadic-passport.eth";

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;

/**
 * Canonical reserved labels aligned with backend reservedLabels.ts,
 * plus a few extra FE-only blocks (resolver, security, testing).
 */
export const RESERVED_PASSPORT_HANDLES = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "community",
  "credential",
  "credentials",
  "dao",
  "docs",
  "ens",
  "eth",
  "help",
  "house",
  "issuer",
  "journey",
  "journeys",
  "lab",
  "lisbon",
  "lisbon-house",
  "login",
  "magic",
  "moderator",
  "nomadic",
  "nomadic-passport",
  "null",
  "official",
  "operator",
  "owner",
  "passport",
  "platform",
  "proof",
  "proofs",
  "public",
  "resolver",
  "root",
  "security",
  "status",
  "support",
  "system",
  "test",
  "testing",
  "undefined",
  "www",
  "world",
]);

export type HandleValidation =
  | { ok: true; label: string; passportName: string }
  | {
      ok: false;
      code: "EMPTY" | "TOO_SHORT" | "TOO_LONG" | "INVALID_CHARS" | "RESERVED";
      message: string;
    };

export function normalizePassportHandle(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@+/, "");
}

export function passportNameFromLabel(label: string): string {
  return `${label}.${PASSPORT_ENS_PARENT}`;
}

/**
 * Validate a user-entered Passport handle (label only).
 */
export function validatePassportHandle(raw: string): HandleValidation {
  const label = normalizePassportHandle(raw);

  if (!label) {
    return {
      ok: false,
      code: "EMPTY",
      message: "Choose a Passport name.",
    };
  }

  if (label.length < HANDLE_MIN_LENGTH) {
    return {
      ok: false,
      code: "TOO_SHORT",
      message: `Use at least ${HANDLE_MIN_LENGTH} characters.`,
    };
  }

  if (label.length > HANDLE_MAX_LENGTH) {
    return {
      ok: false,
      code: "TOO_LONG",
      message: `Use at most ${HANDLE_MAX_LENGTH} characters.`,
    };
  }

  // a-z, 0-9, hyphen; no leading/trailing hyphen; no consecutive hyphens; no dots/unicode
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(label)) {
    return {
      ok: false,
      code: "INVALID_CHARS",
      message: "Use lowercase letters, numbers, and single hyphens.",
    };
  }

  if (RESERVED_PASSPORT_HANDLES.has(label)) {
    return {
      ok: false,
      code: "RESERVED",
      message: "That Passport name is reserved.",
    };
  }

  return {
    ok: true,
    label,
    passportName: passportNameFromLabel(label),
  };
}

export function displayLabelFromHandle(label: string): string {
  if (!label) return "your-name";
  return label;
}
