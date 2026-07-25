import test from "node:test";
import assert from "node:assert/strict";
import {
  WORLD_FLOW_COPY,
  WORLD_IDENTITY_ACTION,
  WORLD_SELFIE_ACTION,
  actionForKind,
  canShowVerified,
  kindForAction,
  phaseAfterIdkitCompletion,
  proofIdForKind,
  resolveVerifyOutcome,
  selfieCheckConfig,
  simulateHandleVerifyGate,
} from "./world-flow-helpers.mjs";
import { isActionPresetPair } from "./world-helpers.mjs";

test("IDKit completion alone does not show verified", () => {
  assert.equal(phaseAfterIdkitCompletion(), "IDKIT_COMPLETED");
  assert.equal(
    canShowVerified({ phase: "IDKIT_COMPLETED", backendProofPresent: false }),
    false,
  );
  const gate = simulateHandleVerifyGate({
    idkitCompleted: true,
    verifyHttpOk: false,
    verifyBodyOk: false,
    persisted: false,
    passportProofs: [],
    kind: "identity",
  });
  assert.equal(gate.showVerified, false);
  assert.notEqual(gate.phase, "VERIFIED");
});

test("backend verification failure shows verification failure copy", () => {
  const outcome = resolveVerifyOutcome({
    httpOk: false,
    bodyOk: false,
    persisted: false,
    passportHasProof: false,
  });
  assert.equal(outcome.phase, "FAILED");
  assert.equal(outcome.reason, "verification_failed");
  assert.equal(outcome.message, WORLD_FLOW_COPY.verificationFailed);

  const gate = simulateHandleVerifyGate({
    idkitCompleted: true,
    verifyHttpOk: false,
    verifyBodyOk: false,
    persisted: false,
    passportProofs: [],
    kind: "selfie",
  });
  assert.equal(gate.showVerified, false);
  assert.match(gate.message, /could not verify the result/i);
});

test("backend persistence failure shows synchronization failure copy", () => {
  const outcome = resolveVerifyOutcome({
    httpOk: true,
    bodyOk: true,
    persisted: false,
    passportHasProof: false,
  });
  assert.equal(outcome.phase, "FAILED");
  assert.equal(outcome.reason, "persistence_failed");
  assert.equal(outcome.message, WORLD_FLOW_COPY.persistenceFailed);

  const cryptoOkButNoPassport = resolveVerifyOutcome({
    httpOk: true,
    bodyOk: true,
    persisted: true,
    passportHasProof: false,
  });
  assert.equal(cryptoOkButNoPassport.phase, "FAILED");
  assert.equal(cryptoOkButNoPassport.reason, "persistence_failed");
});

test("successful Identity proof appears only after Passport refetch", () => {
  const before = simulateHandleVerifyGate({
    idkitCompleted: true,
    verifyHttpOk: true,
    verifyBodyOk: true,
    persisted: true,
    passportProofs: [],
    kind: "identity",
  });
  assert.equal(before.showVerified, false);
  assert.equal(before.phase, "FAILED");

  const after = simulateHandleVerifyGate({
    idkitCompleted: true,
    verifyHttpOk: true,
    verifyBodyOk: true,
    persisted: true,
    passportProofs: [{ type: "WORLD_IDENTITY_CHECK", status: "COMPLETED" }],
    kind: "identity",
  });
  assert.equal(after.phase, "VERIFIED");
  assert.equal(after.showVerified, true);
  assert.equal(after.action, WORLD_IDENTITY_ACTION);
  assert.equal(after.proofId, "WORLD_IDENTITY_CHECK");
  assert.equal(proofIdForKind("identity"), "WORLD_IDENTITY_CHECK");
});

test("successful Selfie proof appears only after Passport refetch", () => {
  const after = simulateHandleVerifyGate({
    idkitCompleted: true,
    verifyHttpOk: true,
    verifyBodyOk: true,
    persisted: true,
    passportProofs: [
      { type: "WORLD_IDENTITY_CHECK", status: "COMPLETED" },
      { type: "WORLD_SELFIE_CHECK", status: "COMPLETED" },
    ],
    kind: "selfie",
  });
  assert.equal(after.phase, "VERIFIED");
  assert.equal(after.showVerified, true);
  assert.equal(after.action, WORLD_SELFIE_ACTION);
  assert.equal(after.proofId, "WORLD_SELFIE_CHECK");
});

test("refresh retains both proofs via action→proof mapping", () => {
  assert.equal(kindForAction("lisbon_identity_v1"), "identity");
  assert.equal(kindForAction("apply_lisbon_house_v1"), "selfie");
  assert.equal(actionForKind("identity"), "lisbon_identity_v1");
  assert.equal(actionForKind("selfie"), "apply_lisbon_house_v1");

  const retainedIdentity = canShowVerified({
    phase: "VERIFIED",
    backendProofPresent: true,
  });
  const retainedSelfie = canShowVerified({
    phase: "VERIFIED",
    backendProofPresent: true,
  });
  assert.equal(retainedIdentity, true);
  assert.equal(retainedSelfie, true);

  // Without backend proofs, refresh must not keep a local verified illusion.
  assert.equal(
    canShowVerified({ phase: "VERIFIED", backendProofPresent: false }),
    false,
  );
});

test("Selfie uses correct action and selfieCheckLegacy preset", () => {
  const cfg = selfieCheckConfig();
  assert.equal(cfg.preset, "selfieCheckLegacy");
  assert.equal(cfg.allow_legacy_proofs, true);
  assert.equal(cfg.action, "apply_lisbon_house_v1");
  assert.equal(cfg.environment, "staging");
  assert.equal(
    isActionPresetPair(cfg.action, cfg.preset),
    true,
  );
  assert.equal(
    isActionPresetPair("lisbon_identity_v1", "selfieCheckLegacy"),
    false,
  );
});

test("user-facing verified copy does not use Congratulations and has no nullifier", () => {
  const blob = [
    WORLD_FLOW_COPY.idkitCompleted,
    WORLD_FLOW_COPY.verifiedWithWorld,
    WORLD_FLOW_COPY.savedToPassport,
    WORLD_FLOW_COPY.verificationFailed,
    WORLD_FLOW_COPY.persistenceFailed,
  ].join(" ");

  assert.equal(/congratulations/i.test(blob), false);
  assert.equal(/nullifier/i.test(blob), false);
  assert.match(WORLD_FLOW_COPY.verifiedWithWorld, /Verified with World/);
  assert.match(WORLD_FLOW_COPY.savedToPassport, /Saved to your Passport/);
});
