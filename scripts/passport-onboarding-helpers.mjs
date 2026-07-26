/**
 * Pure helpers mirrored for Node tests (kept in sync with lib/passport/handle.ts
 * and lib/passport/provisioning-gate.ts).
 */

export const PASSPORT_ENS_PARENT = "nomadic-passport.eth";
export const NOMADIC_PASSPORT_USER_REGISTRY =
  "0x8fB12e7Ab9B192503d7d02a43e0507c484e27280";

export const RESERVED_PASSPORT_HANDLES = new Set([
  "admin",
  "api",
  "app",
  "ens",
  "help",
  "issuer",
  "lisbon",
  "lisbon-house",
  "magic",
  "nomadic",
  "passport",
  "resolver",
  "root",
  "security",
  "support",
  "system",
  "test",
  "testing",
  "world",
  "www",
  "null",
  "undefined",
]);

export function normalizePassportHandle(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
}

export function passportNameFromLabel(label) {
  return `${label}.${PASSPORT_ENS_PARENT}`;
}

export function validatePassportHandle(raw) {
  const label = normalizePassportHandle(raw);

  if (!label) {
    return { ok: false, code: "EMPTY", message: "Choose a Passport name." };
  }
  if (label.length < 3) {
    return {
      ok: false,
      code: "TOO_SHORT",
      message: "Use at least 3 characters.",
    };
  }
  if (label.length > 20) {
    return {
      ok: false,
      code: "TOO_LONG",
      message: "Use at most 20 characters.",
    };
  }
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

/** Mint adapter remains closed until a reviewed server provisioner exists. */
export function isPassportMintAdapterAvailable() {
  return false;
}

export function isPassportRegistryConfigured() {
  return true;
}

export function getPassportProvisioningStatus() {
  const mintAdapterAvailable = isPassportMintAdapterAvailable();
  const registryConfigured = isPassportRegistryConfigured();
  return {
    mintAdapterAvailable,
    registryConfigured,
    onePassportPerWallet: true,
    reasonCode: mintAdapterAvailable
      ? "READY"
      : "BLOCKED_MISSING_MINT_ADAPTER",
    userMessage: mintAdapterAvailable
      ? "Ready to create your Passport."
      : "Passport creation is temporarily unavailable.",
  };
}
