/**
 * Self-service Passport creation gate.
 * Create stays closed unless every safety condition is met.
 * Never invent ensStatus ISSUED client-side.
 * Product copy must not mention chain/testnet jargon.
 */

import type { PassportAvailability } from "@/lib/ensv2/passport-availability";
import type { PassportEnsStatus, PassportIdentityStatus } from "@/lib/passport/types";

export type ProvisionBlockReason =
  | "NOT_AUTHENTICATED"
  | "ENS_ALREADY_ISSUED"
  | "WALLET_UNAVAILABLE"
  | "HANDLE_INVALID"
  | "HANDLE_CHECKING"
  | "HANDLE_TAKEN"
  | "HANDLE_RESERVED"
  | "HANDLE_UNCHECKED"
  | "AVAILABILITY_UNAVAILABLE"
  | "REGISTRY_NOT_CONFIGURED"
  | "MINT_ADAPTER_UNAVAILABLE";

export type ProvisioningGateInput = {
  isAuthenticated: boolean;
  ensStatus: PassportEnsStatus | null;
  identityStatus: PassportIdentityStatus | null;
  handleValid: boolean;
  availabilityStatus:
    | PassportAvailability["status"]
    | "idle"
    | "checking"
    | "empty"
    | null;
  registryConfigured: boolean;
  /** True only when a reviewed mint adapter is wired and allowed. */
  mintAdapterAvailable: boolean;
};

export type ProvisioningGateResult = {
  canCreate: boolean;
  reasons: ProvisionBlockReason[];
  message: string;
};

const REASON_MESSAGE: Record<ProvisionBlockReason, string> = {
  NOT_AUTHENTICATED: "Sign in to create your Passport.",
  ENS_ALREADY_ISSUED: "You already have a Nomadic Passport.",
  WALLET_UNAVAILABLE: "Your wallet is not ready yet.",
  HANDLE_INVALID: "Choose a valid Passport name.",
  HANDLE_CHECKING: "Checking if that name is free…",
  HANDLE_TAKEN: "That Passport name is already taken.",
  HANDLE_RESERVED: "That Passport name is reserved.",
  HANDLE_UNCHECKED: "Confirm your Passport name is available.",
  AVAILABILITY_UNAVAILABLE: "Name availability could not be verified.",
  REGISTRY_NOT_CONFIGURED: "Passport creation is temporarily unavailable.",
  MINT_ADAPTER_UNAVAILABLE: "Passport creation is temporarily unavailable.",
};

export function evaluateProvisioningGate(
  input: ProvisioningGateInput
): ProvisioningGateResult {
  const reasons: ProvisionBlockReason[] = [];

  if (!input.isAuthenticated) reasons.push("NOT_AUTHENTICATED");
  if (input.ensStatus === "ISSUED") reasons.push("ENS_ALREADY_ISSUED");
  if (input.identityStatus === "WALLET_UNAVAILABLE") {
    reasons.push("WALLET_UNAVAILABLE");
  }
  if (!input.handleValid) reasons.push("HANDLE_INVALID");

  if (input.availabilityStatus === "checking") {
    reasons.push("HANDLE_CHECKING");
  } else if (input.availabilityStatus === "taken") {
    reasons.push("HANDLE_TAKEN");
  } else if (input.availabilityStatus === "reserved") {
    reasons.push("HANDLE_RESERVED");
  } else if (input.availabilityStatus === "invalid") {
    reasons.push("HANDLE_INVALID");
  } else if (input.availabilityStatus === "unavailable") {
    reasons.push("AVAILABILITY_UNAVAILABLE");
  } else if (
    input.availabilityStatus === "idle" ||
    input.availabilityStatus === "empty" ||
    input.availabilityStatus == null
  ) {
    reasons.push("HANDLE_UNCHECKED");
  }

  if (!input.registryConfigured) reasons.push("REGISTRY_NOT_CONFIGURED");
  if (!input.mintAdapterAvailable) reasons.push("MINT_ADAPTER_UNAVAILABLE");

  const canCreate = reasons.length === 0;
  return {
    canCreate,
    reasons,
    message: canCreate
      ? "Ready to create your Nomadic Passport."
      : REASON_MESSAGE[reasons[0]],
  };
}

/**
 * Registry reads are pinned to Explorer-r2 Nomadic UserRegistry.
 */
export function isPassportRegistryConfigured(): boolean {
  return true;
}

/**
 * Sync fallback only — live readiness comes from GET /passport/mint-adapter.
 * Never hardcode true in the client; the backend feature gate is authoritative.
 */
export function isPassportMintAdapterAvailable(): boolean {
  return false;
}
