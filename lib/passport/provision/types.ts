/**
 * Exact frontend models matching nomadic-back passport provisioner
 * (lisboa2026 — routes/passportProvision + statusView + featureGate).
 */

export type PassportProvisionStatus =
  | "REQUESTED"
  | "RESERVED"
  | "PLATFORM_STEP_PENDING"
  | "PLATFORM_STEP_SUBMITTED"
  | "PLATFORM_READY"
  | "AWAITING_USER_PARENT"
  | "USER_PARENT_SUBMITTED"
  | "AWAITING_USER_RECORDS"
  | "USER_RECORDS_SUBMITTED"
  | "VERIFYING"
  | "ISSUED"
  | "BLOCKED"
  | "FAILED";

export type PassportPlatformStep =
  | "DEPLOY_REGISTRY"
  | "DEPLOY_RESOLVER"
  | "REGISTER"
  | "DONE";

export type UserTxStep = "parent" | "records";

export type UserTransactionPlan = {
  step: UserTxStep;
  stepLabel: string;
  to: `0x${string}`;
  data: `0x${string}`;
  value: `0x${string}`;
  postconditions: string[];
};

export type ProvisionStatusView = {
  id: string;
  passportName: string;
  label: string;
  status: PassportProvisionStatus;
  platformStep: PassportPlatformStep;
  passportRegistry: string | null;
  passportResolver: string | null;
  platformTransactionHashes: {
    registry: string | null;
    resolver: string | null;
    register: string | null;
  };
  userTransactionHashes: {
    parent: string | null;
    records: string | null;
  };
  nextAction: string;
  userSigningRequired: boolean;
  userTransactionPlan: UserTransactionPlan | null;
  errorCode: string | null;
  errorDetail: string | null;
  issuedAt: string | null;
};

export type MintAdapterStatus =
  | {
      available: true;
      profile?: string;
      chainId?: number;
    }
  | {
      available: false;
      /** @deprecated Backend may still emit reason; BFF strips it. Do not render. */
      reason?: string;
      code?: string;
      error?: string;
      message?: string;
    };

/** Product-facing phases — not every backend enum. */
export type ProductProvisionPhase =
  | "idle"
  | "preparing"
  | "creating"
  | "confirming"
  | "verifying"
  | "complete"
  | "blocked"
  | "failed"
  | "insufficient_funds"
  | "cancelled";

export type SafeResumeRecord = {
  provisioningId: string;
  idempotencyKey: string;
  passportName: string;
  label: string;
};

export type ProvisionApiError = {
  error: string;
  code: string;
  message?: string;
  reason?: string;
};
