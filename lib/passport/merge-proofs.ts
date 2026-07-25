import type { PassportProof } from "@/lib/passport/types";

/**
 * Frontend-known Passport proof products.
 * Completion comes only from backend `passport.proofs` records.
 */
export type SupportedPassportProofId =
  | "WORLD_IDENTITY_CHECK"
  | "WORLD_SELFIE_CHECK";

export type PassportProofUiStatus =
  | "not_completed"
  | "unavailable"
  | "completed"
  | "failed"
  | "expired";

export type SupportedPassportProofDefinition = {
  id: SupportedPassportProofId;
  title: string;
  description: string;
  /** Keys that may appear on backend proof records for this product. */
  matchKeys: string[];
};

export const SUPPORTED_PASSPORT_PROOFS: SupportedPassportProofDefinition[] = [
  {
    id: "WORLD_IDENTITY_CHECK",
    title: "World Identity Check",
    description:
      "Privately prove the minimum attributes required by a Journey without sharing the underlying identity data with Nomadic.",
    matchKeys: [
      "WORLD_IDENTITY_CHECK",
      "IDENTITY_CHECK",
      "world_identity_check",
      "identity_check",
      "lisbon_identity_v1",
      "WORLD_IDENTITY",
    ],
  },
  {
    id: "WORLD_SELFIE_CHECK",
    title: "World Selfie Check",
    description:
      "Confirm recent presence and protect a Journey application action.",
    matchKeys: [
      "WORLD_SELFIE_CHECK",
      "SELFIE_CHECK",
      "world_selfie_check",
      "selfie_check",
      "apply_lisbon_house_v1",
      "WORLD_SELFIE",
    ],
  },
];

export type MergedPassportProof = {
  id: SupportedPassportProofId;
  title: string;
  description: string;
  status: PassportProofUiStatus;
  verifiedAt: string | null;
  /** Present only when a backend record matched this product. */
  backendRecord: PassportProof | null;
};

function proofRecordKey(record: PassportProof): string | null {
  const raw = record.type || record.key || record.proofType || record.action;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function normalizeStatus(raw: string | undefined): PassportProofUiStatus | null {
  if (!raw) return null;
  const value = raw.trim().toUpperCase();
  if (
    value === "COMPLETED" ||
    value === "COMPLETE" ||
    value === "SUCCESS" ||
    value === "VERIFIED"
  ) {
    return "completed";
  }
  if (value === "FAILED" || value === "FAILURE" || value === "REJECTED") {
    return "failed";
  }
  if (value === "EXPIRED") {
    return "expired";
  }
  if (
    value === "UNAVAILABLE" ||
    value === "INTEGRATION_UNAVAILABLE" ||
    value === "NOT_AVAILABLE"
  ) {
    return "unavailable";
  }
  if (
    value === "NOT_COMPLETED" ||
    value === "PENDING" ||
    value === "NOT_STARTED"
  ) {
    return "not_completed";
  }
  return null;
}

function statusFromRecord(record: PassportProof): PassportProofUiStatus {
  const fromStatus = normalizeStatus(record.status);
  if (fromStatus) return fromStatus;
  if (record.expiredAt) return "expired";
  if (record.failedAt) return "failed";
  if (record.completedAt || record.verifiedAt) return "completed";
  // A bare matching record without status is treated as completed evidence.
  return "completed";
}

function verifiedAtFromRecord(record: PassportProof): string | null {
  if (typeof record.verifiedAt === "string" && record.verifiedAt.trim()) {
    return record.verifiedAt.trim();
  }
  if (typeof record.completedAt === "string" && record.completedAt.trim()) {
    return record.completedAt.trim();
  }
  return null;
}

/**
 * Merge supported proof product definitions with backend completion records.
 * Showing a proof card is not completion — only a matching backend record can be Verified.
 */
export function mergePassportProofs(
  backendProofs: PassportProof[] | undefined | null
): MergedPassportProof[] {
  const records = Array.isArray(backendProofs) ? backendProofs : [];

  return SUPPORTED_PASSPORT_PROOFS.map((definition) => {
    const matchKeys = new Set(
      definition.matchKeys.map((key) => key.toUpperCase())
    );
    const backendRecord =
      records.find((record) => {
        const key = proofRecordKey(record);
        return key ? matchKeys.has(key.toUpperCase()) : false;
      }) ?? null;

    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      status: backendRecord ? statusFromRecord(backendRecord) : "not_completed",
      verifiedAt: backendRecord ? verifiedAtFromRecord(backendRecord) : null,
      backendRecord,
    };
  });
}

export function isPassportProofVerified(
  proofs: PassportProof[] | undefined | null,
  id: SupportedPassportProofId
): boolean {
  const item = mergePassportProofs(proofs).find((row) => row.id === id);
  return item?.status === "completed";
}

export function passportProofStatusLabel(status: PassportProofUiStatus): string {
  switch (status) {
    case "not_completed":
      return "Not completed";
    case "unavailable":
      return "Unavailable";
    case "completed":
      return "Verified";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    default:
      return "Not completed";
  }
}

export function formatProofVerifiedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
