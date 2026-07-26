/**
 * Frontend contract for authenticated `GET /passport/me`.
 * Adapt only to fields the backend returns — do not invent product state.
 */

export type PassportIdentityStatus = "READY" | "WALLET_UNAVAILABLE";

export type PassportEnsStatus = "NOT_ISSUED" | "ISSUED";

/** Backend completion record for a Passport proof (source of truth). */
export type PassportProof = {
  /** Stable proof product key when present (e.g. WORLD_IDENTITY_CHECK). */
  type?: string;
  key?: string;
  proofType?: string;
  action?: string;
  status?: string;
  completedAt?: string | null;
  verifiedAt?: string | null;
  failedAt?: string | null;
  expiredAt?: string | null;
  /** Optional World/backend attributes — never invent these client-side. */
  verificationLevel?: string;
  metadata?: Record<string, unknown>;
  documentVerified?: boolean;
  country?: string;
  nationality?: string;
  orb?: boolean;
};

/** Backend-issued credential record (source of truth). */
export type PassportCredential = {
  credentialKey: string;
  displayName?: string;
  description?: string;
  claimedAt?: string;
  verificationProvider?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Backend Passport journey references (user-associated), if returned.
 * Distinct from frontend Journey discovery fixtures.
 */
export type PassportJourneyReference = {
  journeyId?: string;
  id?: string;
  status?: string;
  title?: string;
};

export type PrivatePassport = {
  userId?: string;
  publicAddress: `0x${string}` | null;
  identityStatus: PassportIdentityStatus;
  ensName: string | null;
  ensStatus: PassportEnsStatus;
  proofs: PassportProof[];
  credentials: PassportCredential[];
  journeys?: PassportJourneyReference[];
};

export type PrivatePassportResponse = {
  passport: PrivatePassport;
};

export type PassportMeErrorCode =
  | "MISSING_SESSION"
  | "INVALID_SESSION"
  | "MISSING_API_CONFIG"
  | "BACKEND_UNAVAILABLE"
  | "PASSPORT_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type PassportPayloadShapeHint = {
  topLevelKeys: string[];
  passportKeys?: Record<string, string>;
  notes: string[];
};

export type PassportMeErrorBody = {
  error: PassportMeErrorCode;
  requestId?: string;
  message?: string;
  /** Sanitized field-name/type map when the backend body failed validation. */
  shape?: PassportPayloadShapeHint;
};
