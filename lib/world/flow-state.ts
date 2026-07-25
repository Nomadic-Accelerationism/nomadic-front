/**
 * World check flow states for Lisbon Identity / Selfie.
 * Permanent VERIFIED comes only from backend Passport proofs.
 */

import type { SupportedPassportProofId } from "@/lib/passport/merge-proofs";
import {
  WORLD_IDENTITY_ACTION,
  WORLD_SELFIE_ACTION,
} from "@/lib/world/client";

export type WorldCheckKind = "identity" | "selfie";

export type WorldFlowPhase =
  | "IDLE"
  | "CONNECTING"
  | "AWAITING_USER"
  | "IDKIT_COMPLETED"
  | "VERIFYING_WITH_WORLD"
  | "PERSISTING"
  | "VERIFIED"
  | "FAILED"
  | "CANCELLED";

export const WORLD_FLOW_COPY = {
  connecting: "Connecting to World…",
  awaitingUser: "Waiting for World App…",
  idkitCompleted:
    "World App completed the check. Nomadic is verifying the result…",
  verifyingWithWorld: "Nomadic is verifying the result with World…",
  persisting: "Saving the verified check to your Passport…",
  verifiedWithWorld: "Verified with World",
  savedToPassport: "Saved to your Passport",
  verificationFailed:
    "World completed the connection, but Nomadic could not verify the result. Please try again.",
  persistenceFailed:
    "World verified the check, but Nomadic could not save it to your Passport. Please retry.",
  cancelled: "World App closed before verification finished.",
} as const;

export function proofIdForKind(
  kind: WorldCheckKind
): SupportedPassportProofId {
  return kind === "identity" ? "WORLD_IDENTITY_CHECK" : "WORLD_SELFIE_CHECK";
}

export function actionForKind(kind: WorldCheckKind): string {
  return kind === "identity" ? WORLD_IDENTITY_ACTION : WORLD_SELFIE_ACTION;
}

export function kindForAction(action: string | undefined): WorldCheckKind | null {
  if (action === WORLD_IDENTITY_ACTION || action === "lisbon_identity_v1") {
    return "identity";
  }
  if (action === WORLD_SELFIE_ACTION || action === "apply_lisbon_house_v1") {
    return "selfie";
  }
  return null;
}

/**
 * Whether Nomadic may show final Verified for a check.
 * Requires backend-persisted proof — not IDKit completion alone.
 */
export function canShowVerified(input: {
  phase: WorldFlowPhase;
  backendProofPresent: boolean;
}): boolean {
  return input.phase === "VERIFIED" && input.backendProofPresent;
}

/**
 * Decide next Nomadic UI phase after IDKit returns a result to handleVerify.
 */
export function phaseAfterIdkitCompletion(): WorldFlowPhase {
  return "IDKIT_COMPLETED";
}

export function userFacingPhaseMessage(phase: WorldFlowPhase): string | null {
  switch (phase) {
    case "CONNECTING":
      return WORLD_FLOW_COPY.connecting;
    case "AWAITING_USER":
      return WORLD_FLOW_COPY.awaitingUser;
    case "IDKIT_COMPLETED":
      return WORLD_FLOW_COPY.idkitCompleted;
    case "VERIFYING_WITH_WORLD":
      return WORLD_FLOW_COPY.verifyingWithWorld;
    case "PERSISTING":
      return WORLD_FLOW_COPY.persisting;
    case "VERIFIED":
      return WORLD_FLOW_COPY.verifiedWithWorld;
    case "CANCELLED":
      return WORLD_FLOW_COPY.cancelled;
    default:
      return null;
  }
}

/**
 * Pure decision used by handleVerify after BFF responds.
 * Throws semantics are represented as failed phases for tests.
 */
export function resolveVerifyOutcome(input: {
  httpOk: boolean;
  bodyOk: boolean;
  persisted: boolean;
  passportHasProof: boolean;
}):
  | { phase: "VERIFIED" }
  | {
      phase: "FAILED";
      reason: "verification_failed" | "persistence_failed";
      message: string;
    } {
  if (!input.httpOk || !input.bodyOk) {
    return {
      phase: "FAILED",
      reason: "verification_failed",
      message: WORLD_FLOW_COPY.verificationFailed,
    };
  }
  if (!input.persisted || !input.passportHasProof) {
    return {
      phase: "FAILED",
      reason: "persistence_failed",
      message: WORLD_FLOW_COPY.persistenceFailed,
    };
  }
  return { phase: "VERIFIED" };
}
