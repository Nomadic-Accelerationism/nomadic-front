import type { ProvisionApiError } from "@/lib/passport/provision/types";

/** Safe product copy for backend provisioner error codes. */
const PRODUCT_MESSAGES: Record<string, string> = {
  INVALID_LABEL: "Choose a valid Passport name.",
  RESERVED_LABEL: "That Passport name is reserved.",
  LABEL_TAKEN: "That Passport name is no longer available.",
  PASSPORT_ALREADY_EXISTS: "This wallet already has a Passport.",
  PROVISIONING_ALREADY_ACTIVE:
    "Passport creation is already in progress for this wallet.",
  MINT_ADAPTER_UNAVAILABLE: "Passport creation is temporarily unavailable.",
  FEATURE_DISABLED: "Passport creation is temporarily unavailable.",
  RPC_UNAVAILABLE: "We couldn’t verify the transaction yet. Try again shortly.",
  INSUFFICIENT_PLATFORM_BALANCE:
    "Passport creation is temporarily unavailable.",
  PLATFORM_TX_REVERTED: "We couldn’t finish creating your Passport. Try again.",
  USER_TX_INVALID: "We couldn’t verify the transaction yet. Try again shortly.",
  USER_TX_REVERTED: "Confirmation didn’t go through. You can try again.",
  POSTCONDITION_FAILED:
    "We couldn’t verify your Passport yet. Try again shortly.",
  WALLET_UNAVAILABLE: "Your wallet is not ready yet.",
  NOT_FOUND: "That Passport creation session was not found.",
  FORBIDDEN: "You can’t continue this Passport creation session.",
  CONFLICT: "This creation attempt conflicts with an earlier one.",
  INVALID_IDEMPOTENCY_KEY: "Something went wrong. Please try again.",
  INVALID_TRANSACTION_HASH: "We couldn’t verify the transaction yet.",
  LOCK_HELD: "Still working on your Passport…",
  database_unavailable: "Passport creation is temporarily unavailable.",
  internal_error: "Something went wrong. Please try again.",
};

const INTERNAL_REASON_RE =
  /^(FEATURE_DISABLED|MISSING_PLATFORM_KEY|PLATFORM_SIGNER_MISMATCH|MISSING_SEPOLIA_RPC|ARTIFACTS_NOT_LOADED|USE_PROVISION_FLOW)$/i;

/**
 * Map backend codes to product copy.
 * Never surface internal readiness reasons (FEATURE_DISABLED, missing keys, etc.).
 */
export function productMessageForProvisionError(
  code: string | null | undefined,
  fallback = "Something went wrong. Please try again."
): string {
  const safeFallback =
    typeof fallback === "string" && INTERNAL_REASON_RE.test(fallback.trim())
      ? "Passport creation is temporarily unavailable."
      : fallback;
  if (!code) return safeFallback;
  if (INTERNAL_REASON_RE.test(code)) {
    return "Passport creation is temporarily unavailable.";
  }
  return PRODUCT_MESSAGES[code] ?? safeFallback;
}

export function parseProvisionApiError(body: unknown): ProvisionApiError | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const code =
    typeof record.code === "string"
      ? record.code
      : typeof record.error === "string"
        ? record.error
        : null;
  if (!code) return null;
  return {
    error: typeof record.error === "string" ? record.error : code,
    code,
    message: typeof record.message === "string" ? record.message : undefined,
    reason: typeof record.reason === "string" ? record.reason : undefined,
  };
}
