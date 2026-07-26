import type {
  PassportProvisionStatus,
  ProductProvisionPhase,
  ProvisionStatusView,
} from "@/lib/passport/provision/types";

export function mapBackendStatusToProductPhase(
  status: PassportProvisionStatus | null | undefined
): ProductProvisionPhase {
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

export function productPhaseLabel(phase: ProductProvisionPhase): string {
  switch (phase) {
    case "preparing":
      return "Preparing your Passport";
    case "creating":
      return "Creating your Passport";
    case "confirming":
      return "Confirm ownership";
    case "verifying":
      return "Verifying your Passport";
    case "complete":
      return "Your Passport is ready";
    case "blocked":
    case "failed":
      return "Passport creation paused";
    case "insufficient_funds":
      return "Funding required";
    case "cancelled":
      return "Confirmation cancelled. You can continue when ready.";
    default:
      return "Preparing your Passport";
  }
}

export function confirmingStepLabel(
  provision: ProvisionStatusView | null
): string | null {
  if (!provision?.userSigningRequired || !provision.userTransactionPlan) {
    return null;
  }
  return provision.userTransactionPlan.step === "parent"
    ? "Step 1 of 2"
    : "Step 2 of 2";
}

export function confirmingActionLabel(
  provision: ProvisionStatusView | null
): string {
  if (provision?.userTransactionPlan?.step === "records") {
    return "Adding Passport details";
  }
  return "Confirm ownership";
}
