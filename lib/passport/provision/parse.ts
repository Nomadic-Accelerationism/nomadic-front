import type {
  MintAdapterStatus,
  PassportPlatformStep,
  PassportProvisionStatus,
  ProvisionStatusView,
  UserTransactionPlan,
  UserTxStep,
} from "@/lib/passport/provision/types";

const STATUSES = new Set<PassportProvisionStatus>([
  "REQUESTED",
  "RESERVED",
  "PLATFORM_STEP_PENDING",
  "PLATFORM_STEP_SUBMITTED",
  "PLATFORM_READY",
  "AWAITING_USER_PARENT",
  "USER_PARENT_SUBMITTED",
  "AWAITING_USER_RECORDS",
  "USER_RECORDS_SUBMITTED",
  "VERIFYING",
  "ISSUED",
  "BLOCKED",
  "FAILED",
]);

const PLATFORM_STEPS = new Set<PassportPlatformStep>([
  "DEPLOY_REGISTRY",
  "DEPLOY_RESOLVER",
  "REGISTER",
  "DONE",
]);

function isHexAddress(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isHexData(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]*$/.test(value);
}

function parseUserPlan(raw: unknown): UserTransactionPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const step = row.step;
  if (step !== "parent" && step !== "records") return null;
  if (!isHexAddress(row.to) || !isHexData(row.data)) return null;
  const value =
    typeof row.value === "string" && isHexData(row.value) ? row.value : "0x0";
  const postconditions = Array.isArray(row.postconditions)
    ? row.postconditions.filter((x): x is string => typeof x === "string")
    : [];
  return {
    step: step as UserTxStep,
    stepLabel:
      typeof row.stepLabel === "string" ? row.stepLabel : String(step),
    to: row.to,
    data: row.data,
    value,
    postconditions,
  };
}

export function parseProvisionStatusView(
  raw: unknown
): ProvisionStatusView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || !row.id) return null;
  if (typeof row.passportName !== "string") return null;
  if (typeof row.label !== "string") return null;
  if (typeof row.status !== "string" || !STATUSES.has(row.status as PassportProvisionStatus)) {
    return null;
  }
  if (
    typeof row.platformStep !== "string" ||
    !PLATFORM_STEPS.has(row.platformStep as PassportPlatformStep)
  ) {
    return null;
  }

  const platformHashes =
    row.platformTransactionHashes &&
    typeof row.platformTransactionHashes === "object"
      ? (row.platformTransactionHashes as Record<string, unknown>)
      : {};
  const userHashes =
    row.userTransactionHashes && typeof row.userTransactionHashes === "object"
      ? (row.userTransactionHashes as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    passportName: row.passportName,
    label: row.label,
    status: row.status as PassportProvisionStatus,
    platformStep: row.platformStep as PassportPlatformStep,
    passportRegistry:
      typeof row.passportRegistry === "string" ? row.passportRegistry : null,
    passportResolver:
      typeof row.passportResolver === "string" ? row.passportResolver : null,
    platformTransactionHashes: {
      registry:
        typeof platformHashes.registry === "string"
          ? platformHashes.registry
          : null,
      resolver:
        typeof platformHashes.resolver === "string"
          ? platformHashes.resolver
          : null,
      register:
        typeof platformHashes.register === "string"
          ? platformHashes.register
          : null,
    },
    userTransactionHashes: {
      parent:
        typeof userHashes.parent === "string" ? userHashes.parent : null,
      records:
        typeof userHashes.records === "string" ? userHashes.records : null,
    },
    nextAction: typeof row.nextAction === "string" ? row.nextAction : "none",
    userSigningRequired: Boolean(row.userSigningRequired),
    userTransactionPlan: parseUserPlan(row.userTransactionPlan),
    errorCode: typeof row.errorCode === "string" ? row.errorCode : null,
    errorDetail: typeof row.errorDetail === "string" ? row.errorDetail : null,
    issuedAt: typeof row.issuedAt === "string" ? row.issuedAt : null,
  };
}

export function parseMintAdapterStatus(
  body: unknown,
  httpOk: boolean
): MintAdapterStatus {
  if (httpOk && body && typeof body === "object") {
    const row = body as Record<string, unknown>;
    if (row.available === true) {
      return {
        available: true,
        profile: typeof row.profile === "string" ? row.profile : undefined,
        chainId: typeof row.chainId === "number" ? row.chainId : undefined,
      };
    }
  }

  const row =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    available: false,
    reason: typeof row.reason === "string" ? row.reason : undefined,
    code: typeof row.code === "string" ? row.code : "MINT_ADAPTER_UNAVAILABLE",
    error:
      typeof row.error === "string" ? row.error : "MINT_ADAPTER_UNAVAILABLE",
  };
}
