/**
 * Mirrors lib/world/flow-state.ts for node:test (no TS import).
 * Keep in sync with the TypeScript module.
 */

export const WORLD_IDENTITY_ACTION = "lisbon_identity_v1";
export const WORLD_SELFIE_ACTION = "apply_lisbon_house_v1";

export const WORLD_FLOW_COPY = {
  idkitCompleted:
    "World App completed the check. Nomadic is verifying the result…",
  verifiedWithWorld: "Verified with World",
  savedToPassport: "Saved to your Passport",
  verificationFailed:
    "World completed the connection, but Nomadic could not verify the result. Please try again.",
  persistenceFailed:
    "World verified the check, but Nomadic could not save it to your Passport. Please retry.",
};

export function proofIdForKind(kind) {
  return kind === "identity" ? "WORLD_IDENTITY_CHECK" : "WORLD_SELFIE_CHECK";
}

export function actionForKind(kind) {
  return kind === "identity" ? WORLD_IDENTITY_ACTION : WORLD_SELFIE_ACTION;
}

export function kindForAction(action) {
  if (action === WORLD_IDENTITY_ACTION || action === "lisbon_identity_v1") {
    return "identity";
  }
  if (action === WORLD_SELFIE_ACTION || action === "apply_lisbon_house_v1") {
    return "selfie";
  }
  return null;
}

export function canShowVerified({ phase, backendProofPresent }) {
  return phase === "VERIFIED" && backendProofPresent === true;
}

/**
 * IDKit completion alone never yields VERIFIED.
 */
export function phaseAfterIdkitCompletion() {
  return "IDKIT_COMPLETED";
}

export function resolveVerifyOutcome({
  httpOk,
  bodyOk,
  persisted,
  passportHasProof,
}) {
  if (!httpOk || !bodyOk) {
    return {
      phase: "FAILED",
      reason: "verification_failed",
      message: WORLD_FLOW_COPY.verificationFailed,
    };
  }
  if (!persisted || !passportHasProof) {
    return {
      phase: "FAILED",
      reason: "persistence_failed",
      message: WORLD_FLOW_COPY.persistenceFailed,
    };
  }
  return { phase: "VERIFIED" };
}

/**
 * Selfie Option B config expected by the product.
 */
export function selfieCheckConfig() {
  return {
    preset: "selfieCheckLegacy",
    allow_legacy_proofs: true,
    action: WORLD_SELFIE_ACTION,
    environment: "staging",
  };
}

export function isPassportProofPresent(proofs, proofId) {
  if (!Array.isArray(proofs)) return false;
  return proofs.some((p) => {
    const key = String(p.type || p.key || p.proofType || p.action || "")
      .trim()
      .toUpperCase();
    if (proofId === "WORLD_IDENTITY_CHECK") {
      return (
        key === "WORLD_IDENTITY_CHECK" ||
        key.includes("IDENTITY") ||
        key === "LISBON_IDENTITY_V1"
      );
    }
    return (
      key === "WORLD_SELFIE_CHECK" ||
      key.includes("SELFIE") ||
      key === "APPLY_LISBON_HOUSE_V1"
    );
  });
}

/**
 * Simulate the handleVerify gate used by WorldVerificationPanel.
 * Returns the UI phase + copy; never treats IDKit-only completion as VERIFIED.
 */
export function simulateHandleVerifyGate({
  idkitCompleted,
  verifyHttpOk,
  verifyBodyOk,
  persisted,
  passportProofs,
  kind,
}) {
  if (!idkitCompleted) {
    return { phase: "AWAITING_USER", showVerified: false };
  }

  const afterIdkit = phaseAfterIdkitCompletion();
  if (afterIdkit !== "IDKIT_COMPLETED") {
    return { phase: afterIdkit, showVerified: false };
  }

  const proofId = proofIdForKind(kind);
  const passportHasProof = isPassportProofPresent(passportProofs, proofId);
  const outcome = resolveVerifyOutcome({
    httpOk: verifyHttpOk,
    bodyOk: verifyBodyOk,
    persisted,
    passportHasProof,
  });

  return {
    phase: outcome.phase,
    reason: outcome.reason ?? null,
    message: outcome.message ?? WORLD_FLOW_COPY.verifiedWithWorld,
    showVerified: canShowVerified({
      phase: outcome.phase,
      backendProofPresent: passportHasProof,
    }),
    action: actionForKind(kind),
    proofId,
  };
}
