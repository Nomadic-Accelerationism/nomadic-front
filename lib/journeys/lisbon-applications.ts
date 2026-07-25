/**
 * Lisbon House application client helpers.
 * Backend remains authoritative for submit / status / credential issuance.
 */

import type { PassportCredential, PassportJourneyReference, PassportProof } from "@/lib/passport/types";
import { isPassportProofVerified } from "@/lib/passport/merge-proofs";

export const LISBON_POLICY_KEY = "lisbon_house_policy_v1" as const;
export const LISBON_ELIGIBLE_CREDENTIAL_KEY =
  "NOMADIC_LISBON_HOUSE_ELIGIBLE" as const;

export type LisbonApplyUiState =
  | "ready"
  | "submitting"
  | "submitted"
  | "requirements_unsatisfied"
  | "session_expired"
  | "backend_unavailable"
  | "unexpected_error";

export type LisbonApplicationErrorCode =
  | "MISSING_SESSION"
  | "INVALID_SESSION"
  | "MISSING_API_CONFIG"
  | "POLICY_NOT_SATISFIED"
  | "ALREADY_APPLIED"
  | "BACKEND_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type LisbonApplicationPayload = {
  application: {
    status: string;
    policyKey?: string;
    journeyId?: string;
    submittedAt?: string;
  };
  credential?: PassportCredential | null;
};

export type LisbonApplyReadiness = {
  identityVerified: boolean;
  selfieVerified: boolean;
  canSubmit: boolean;
  missing: Array<"WORLD_IDENTITY_CHECK" | "WORLD_SELFIE_CHECK">;
};

export function getLisbonApplyReadiness(
  proofs: PassportProof[] | undefined | null
): LisbonApplyReadiness {
  const identityVerified = isPassportProofVerified(
    proofs,
    "WORLD_IDENTITY_CHECK"
  );
  const selfieVerified = isPassportProofVerified(proofs, "WORLD_SELFIE_CHECK");
  const missing: LisbonApplyReadiness["missing"] = [];
  if (!identityVerified) missing.push("WORLD_IDENTITY_CHECK");
  if (!selfieVerified) missing.push("WORLD_SELFIE_CHECK");
  return {
    identityVerified,
    selfieVerified,
    canSubmit: identityVerified && selfieVerified,
    missing,
  };
}

export function findLisbonEligibleCredential(
  credentials: PassportCredential[] | undefined | null
): PassportCredential | null {
  if (!Array.isArray(credentials)) return null;
  return (
    credentials.find(
      (c) =>
        c.credentialKey?.trim().toUpperCase() === LISBON_ELIGIBLE_CREDENTIAL_KEY
    ) ?? null
  );
}

export function findLisbonApplicationRef(
  journeys: PassportJourneyReference[] | undefined | null
): PassportJourneyReference | null {
  if (!Array.isArray(journeys) || journeys.length === 0) return null;

  const submitted = journeys.find((j) => {
    const status = (j.status || "").toUpperCase();
    return (
      status === "SUBMITTED" ||
      status === "PENDING" ||
      status === "APPLIED" ||
      status === "IN_REVIEW"
    );
  });
  if (submitted) return submitted;

  const byTitle = journeys.find((j) =>
    (j.title || "").toLowerCase().includes("lisbon")
  );
  return byTitle ?? journeys[0] ?? null;
}

export function isSubmittedApplicationStatus(status: string | undefined): boolean {
  if (!status) return false;
  const value = status.trim().toUpperCase();
  return (
    value === "SUBMITTED" ||
    value === "PENDING" ||
    value === "APPLIED" ||
    value === "IN_REVIEW"
  );
}

/** Never render SUBMITTED as Accepted / Resident / Approved. */
export function lisbonApplicationStatusLabel(status: string | undefined): string {
  if (!status) return "Unknown";
  const value = status.trim().toUpperCase();
  if (value === "SUBMITTED") return "Application submitted";
  if (value === "ACCEPTED" || value === "APPROVED" || value === "RESIDENT") {
    // Reserved for future backend statuses — do not invent from SUBMITTED.
    return value.charAt(0) + value.slice(1).toLowerCase();
  }
  return status;
}

export class LisbonApplicationClientError extends Error {
  readonly code: LisbonApplicationErrorCode;
  readonly status: number;
  readonly requestId?: string;

  constructor(
    code: LisbonApplicationErrorCode,
    status: number,
    options?: { message?: string; requestId?: string }
  ) {
    super(options?.message ?? code);
    this.name = "LisbonApplicationClientError";
    this.code = code;
    this.status = status;
    this.requestId = options?.requestId;
  }
}

export async function submitLisbonHouseApplication(
  didToken: string,
  init?: { signal?: AbortSignal }
): Promise<LisbonApplicationPayload> {
  const response = await fetch("/api/journeys/lisbon-house/applications", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${didToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // No wallet / email / userId / proof status — backend derives from DID + proofs.
    body: JSON.stringify({}),
    cache: "no-store",
    signal: init?.signal,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const body =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;

  if (!response.ok) {
    const code =
      (typeof body?.error === "string" &&
        (body.error as LisbonApplicationErrorCode)) ||
      "UNEXPECTED_ERROR";
    throw new LisbonApplicationClientError(code, response.status, {
      message: typeof body?.message === "string" ? body.message : undefined,
      requestId:
        typeof body?.requestId === "string" ? body.requestId : undefined,
    });
  }

  const applicationRaw = body?.application;
  if (!applicationRaw || typeof applicationRaw !== "object") {
    throw new LisbonApplicationClientError("UNEXPECTED_ERROR", 500, {
      message: "Invalid application response",
    });
  }

  const app = applicationRaw as Record<string, unknown>;
  const status = typeof app.status === "string" ? app.status : "";
  if (!status) {
    throw new LisbonApplicationClientError("UNEXPECTED_ERROR", 500, {
      message: "Application status missing",
    });
  }

  const credential =
    body?.credential && typeof body.credential === "object"
      ? (body.credential as PassportCredential)
      : null;

  return {
    application: {
      status,
      policyKey:
        typeof app.policyKey === "string"
          ? app.policyKey
          : typeof app.policyVersion === "string"
            ? app.policyVersion
            : LISBON_POLICY_KEY,
      journeyId:
        typeof app.journeyId === "string" ? app.journeyId : undefined,
      submittedAt:
        typeof app.submittedAt === "string"
          ? app.submittedAt
          : typeof app.createdAt === "string"
            ? app.createdAt
            : undefined,
    },
    credential,
  };
}
