/**
 * Safe client resume for Passport provisioning.
 * Never stores DID, Magic secrets, signed txs, or RPC keys.
 */

import type { SafeResumeRecord } from "@/lib/passport/provision/types";

const STORAGE_KEY = "nomadic.passport.provision.resume.v1";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readProvisionResume(): SafeResumeRecord | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SafeResumeRecord>;
    if (
      typeof parsed.provisioningId !== "string" ||
      typeof parsed.idempotencyKey !== "string" ||
      typeof parsed.passportName !== "string" ||
      typeof parsed.label !== "string"
    ) {
      return null;
    }
    return {
      provisioningId: parsed.provisioningId,
      idempotencyKey: parsed.idempotencyKey,
      passportName: parsed.passportName,
      label: parsed.label,
    };
  } catch {
    return null;
  }
}

export function writeProvisionResume(record: SafeResumeRecord): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota / private mode — resume still works via explicit ID if present.
  }
}

export function clearProvisionResume(): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Extremely rare fallback — still UUID-shaped enough for backend UUID_RE.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
