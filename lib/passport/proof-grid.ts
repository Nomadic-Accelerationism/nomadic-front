/**
 * Compact Passport identity proof grid.
 * Verified states come only from backend proof records — never invent success.
 */

import type { PassportProof } from "@/lib/passport/types";

export type ProofPrivacy = "Private" | "Public";

export type ProofGridStatus =
  | "incomplete"
  | "verified"
  | "failed"
  | "expired"
  | "unavailable"
  | "soon";

export type ProofGridItemId =
  | "unique_human"
  | "age_18"
  | "government_id"
  | "country"
  | "contributions"
  | "skills"
  | "references"
  | "attendance";

export type ProofGridItem = {
  id: ProofGridItemId;
  title: string;
  status: ProofGridStatus;
  statusLabel: string;
  privacy: ProofPrivacy;
  /** Placeholder proofs are not backed by live backend products yet. */
  placeholder: boolean;
};

const IDENTITY_MATCH_KEYS = new Set(
  [
    "WORLD_IDENTITY_CHECK",
    "IDENTITY_CHECK",
    "world_identity_check",
    "identity_check",
    "lisbon_identity_v1",
    "WORLD_IDENTITY",
  ].map((k) => k.toUpperCase())
);

function proofRecordKey(record: PassportProof): string | null {
  const raw = record.type || record.key || record.proofType || record.action;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function normalizeStatus(raw: string | undefined): ProofGridStatus | null {
  if (!raw) return null;
  const value = raw.trim().toUpperCase();
  if (
    value === "COMPLETED" ||
    value === "COMPLETE" ||
    value === "SUCCESS" ||
    value === "VERIFIED"
  ) {
    return "verified";
  }
  if (value === "FAILED" || value === "FAILURE" || value === "REJECTED") {
    return "failed";
  }
  if (value === "EXPIRED") return "expired";
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
    value === "NOT_STARTED" ||
    value === "INCOMPLETE"
  ) {
    return "incomplete";
  }
  return null;
}

function statusFromRecord(record: PassportProof): ProofGridStatus {
  const fromStatus = normalizeStatus(record.status);
  if (fromStatus) return fromStatus;
  if (record.expiredAt) return "expired";
  if (record.failedAt) return "failed";
  if (record.completedAt || record.verifiedAt) return "verified";
  return "verified";
}

function isCompletedIdentity(record: PassportProof | null): boolean {
  if (!record) return false;
  return statusFromRecord(record) === "verified";
}

function recordMeta(record: PassportProof | null): Record<string, unknown> {
  if (!record || typeof record !== "object") return {};
  const meta = (record as PassportProof & { metadata?: unknown }).metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

function stringField(
  record: PassportProof | null,
  keys: string[]
): string | null {
  if (!record) return null;
  const bag: Record<string, unknown> = {
    ...(record as unknown as Record<string, unknown>),
    ...recordMeta(record),
  };
  for (const key of keys) {
    const value = bag[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function boolField(record: PassportProof | null, keys: string[]): boolean {
  if (!record) return false;
  const bag: Record<string, unknown> = {
    ...(record as unknown as Record<string, unknown>),
    ...recordMeta(record),
  };
  for (const key of keys) {
    const value = bag[key];
    if (value === true) return true;
    if (typeof value === "string" && value.trim().toLowerCase() === "true") {
      return true;
    }
  }
  return false;
}

/** Orb only when the record explicitly proves Orb verification level. */
export function recordProvesOrb(record: PassportProof | null): boolean {
  if (!record || !isCompletedIdentity(record)) return false;
  if (boolField(record, ["orb", "orbVerified", "isOrb"])) return true;
  const level = stringField(record, [
    "verificationLevel",
    "verification_level",
    "worldVerificationLevel",
    "level",
  ]);
  if (!level) return false;
  const normalized = level.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "orb" || normalized === "orb_verification";
}

/** Document / Government ID only when backend explicitly confirms it. */
export function recordProvesGovernmentId(
  record: PassportProof | null
): boolean {
  if (!record || !isCompletedIdentity(record)) return false;
  if (
    boolField(record, [
      "documentVerified",
      "document_verified",
      "governmentId",
      "government_id",
      "nfcPassport",
    ])
  ) {
    return true;
  }
  const kind = stringField(record, [
    "documentType",
    "document_type",
    "idType",
    "credentialType",
  ]);
  if (!kind) return false;
  const normalized = kind.trim().toLowerCase();
  return (
    normalized.includes("document") ||
    normalized.includes("government") ||
    normalized.includes("passport") ||
    normalized.includes("nfc")
  );
}

/** Country attribute present (value never displayed — private by default). */
export function recordHasCountryAttribute(
  record: PassportProof | null
): boolean {
  if (!record || !isCompletedIdentity(record)) return false;
  if (boolField(record, ["hasCountry", "countryVerified", "country_present"])) {
    return true;
  }
  const country = stringField(record, [
    "country",
    "nationality",
    "issuing_country",
    "issuingCountry",
  ]);
  return Boolean(country);
}

function findIdentityRecord(
  backendProofs: PassportProof[] | undefined | null
): PassportProof | null {
  const records = Array.isArray(backendProofs) ? backendProofs : [];
  return (
    records.find((record) => {
      const key = proofRecordKey(record);
      return key ? IDENTITY_MATCH_KEYS.has(key.toUpperCase()) : false;
    }) ?? null
  );
}

export function proofGridStatusLabel(status: ProofGridStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    case "unavailable":
      return "Unavailable";
    case "soon":
      return "Soon";
    case "incomplete":
    default:
      return "Incomplete";
  }
}

/**
 * Build the Passport identity proof grid from backend records.
 * Selfie is intentionally excluded — it is an apply-flow gate, not a grid proof.
 */
export function buildPassportProofGrid(
  backendProofs: PassportProof[] | undefined | null
): ProofGridItem[] {
  const identity = findIdentityRecord(backendProofs);
  const identityStatus = identity ? statusFromRecord(identity) : "incomplete";

  const ageStatus: ProofGridStatus =
    identityStatus === "verified"
      ? "verified"
      : identityStatus === "failed" ||
          identityStatus === "expired" ||
          identityStatus === "unavailable"
        ? identityStatus
        : "incomplete";

  const uniqueHuman: ProofGridItem = {
    id: "unique_human",
    title: "Unique human",
    status: recordProvesOrb(identity) ? "verified" : "incomplete",
    statusLabel: recordProvesOrb(identity)
      ? proofGridStatusLabel("verified")
      : proofGridStatusLabel("incomplete"),
    privacy: "Private",
    placeholder: false,
  };

  const age18: ProofGridItem = {
    id: "age_18",
    title: "18+",
    status: ageStatus,
    statusLabel: proofGridStatusLabel(ageStatus),
    privacy: "Private",
    placeholder: false,
  };

  const govIdVerified = recordProvesGovernmentId(identity);
  const governmentId: ProofGridItem = {
    id: "government_id",
    title: "Government ID",
    status: govIdVerified ? "verified" : "incomplete",
    statusLabel: proofGridStatusLabel(
      govIdVerified ? "verified" : "incomplete"
    ),
    privacy: "Private",
    placeholder: false,
  };

  const countryPresent = recordHasCountryAttribute(identity);
  const country: ProofGridItem = {
    id: "country",
    title: "Country — Beta",
    status: countryPresent ? "verified" : "incomplete",
    statusLabel: proofGridStatusLabel(
      countryPresent ? "verified" : "incomplete"
    ),
    privacy: "Private",
    placeholder: false,
  };

  const placeholders: ProofGridItem[] = [
    {
      id: "contributions",
      title: "Contributions",
      status: "soon",
      statusLabel: "Soon",
      privacy: "Private",
      placeholder: true,
    },
    {
      id: "skills",
      title: "Skills",
      status: "soon",
      statusLabel: "Soon",
      privacy: "Private",
      placeholder: true,
    },
    {
      id: "references",
      title: "References",
      status: "soon",
      statusLabel: "Soon",
      privacy: "Private",
      placeholder: true,
    },
    {
      id: "attendance",
      title: "Attendance",
      status: "soon",
      statusLabel: "Soon",
      privacy: "Private",
      placeholder: true,
    },
  ];

  return [uniqueHuman, age18, governmentId, country, ...placeholders];
}
