/**
 * Pure helpers mirrored for Node tests (provision integration Pass 2.5B).
 */

export function mapBackendStatusToProductPhase(status) {
  switch (status) {
    case "REQUESTED":
    case "RESERVED":
      return "preparing";
    case "PLATFORM_STEP_PENDING":
    case "PLATFORM_STEP_SUBMITTED":
      return "creating";
    case "PLATFORM_READY":
    case "AWAITING_USER_PARENT":
    case "AWAITING_USER_RECORDS":
      return "confirming";
    case "USER_PARENT_SUBMITTED":
    case "USER_RECORDS_SUBMITTED":
    case "VERIFYING":
      return "verifying";
    case "ISSUED":
      return "complete";
    case "BLOCKED":
      return "blocked";
    case "FAILED":
      return "failed";
    default:
      return "idle";
  }
}

export function productMessageForProvisionError(code) {
  const map = {
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
  };
  return map[code] || "Something went wrong. Please try again.";
}

export function parseMintAdapterStatus(body, httpOk) {
  if (httpOk && body && body.available === true) {
    return { available: true, profile: body.profile, chainId: body.chainId };
  }
  return {
    available: false,
    reason: body?.reason,
    code: body?.code || "MINT_ADAPTER_UNAVAILABLE",
  };
}

export function parseUserPlan(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.step !== "parent" && raw.step !== "records") return null;
  if (typeof raw.to !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(raw.to)) {
    return null;
  }
  if (typeof raw.data !== "string" || !raw.data.startsWith("0x")) return null;
  return {
    step: raw.step,
    to: raw.to,
    data: raw.data,
    value: typeof raw.value === "string" ? raw.value : "0x0",
  };
}

export function needsPlatformAdvance(provision) {
  return (
    provision.nextAction === "platform_advance" &&
    provision.status !== "ISSUED" &&
    provision.status !== "FAILED" &&
    provision.status !== "BLOCKED"
  );
}

/** Simulate mutex: concurrent advance attempts — only first runs. */
export function createPlatformAdvanceGuard() {
  let inFlight = false;
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    async advance(fn) {
      if (inFlight) return { skipped: true };
      inFlight = true;
      calls += 1;
      try {
        return { skipped: false, result: await fn() };
      } finally {
        inFlight = false;
      }
    },
  };
}
