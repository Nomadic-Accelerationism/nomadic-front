import test from "node:test";
import assert from "node:assert/strict";
import {
  fixtureCannotInventBackendState,
  getLisbonApplyReadiness,
  lisbonApplicationStatusLabel,
  lisbonCredentialDisplay,
  mergePassportProofs,
  passportProofStatusLabel,
} from "./passport-me-helpers.mjs";

test("Identity proof rendered from backend as Verified", () => {
  const merged = mergePassportProofs([
    {
      type: "WORLD_IDENTITY_CHECK",
      status: "VERIFIED",
      verifiedAt: "2026-07-25T12:00:00.000Z",
    },
  ]);
  const identity = merged.find((p) => p.id === "WORLD_IDENTITY_CHECK");
  assert.equal(identity.status, "completed");
  assert.equal(passportProofStatusLabel(identity.status), "Verified");
  assert.equal(identity.verifiedAt, "2026-07-25T12:00:00.000Z");
});

test("Selfie proof rendered from backend action key", () => {
  const merged = mergePassportProofs([
    { action: "apply_lisbon_house_v1", status: "VERIFIED" },
  ]);
  const selfie = merged.find((p) => p.id === "WORLD_SELFIE_CHECK");
  assert.equal(selfie.status, "completed");
  assert.equal(passportProofStatusLabel(selfie.status), "Verified");
});

test("normal UI labels never include nullifier wording", () => {
  const identity = mergePassportProofs([
    { type: "WORLD_IDENTITY_CHECK", status: "VERIFIED" },
  ])[0];
  const label = `${passportProofStatusLabel(identity.status)} with World`;
  assert.equal(label.includes("nullifier"), false);
  assert.equal(JSON.stringify(identity).includes("nullifier"), false);
});

test("Identity only keeps Apply disabled", () => {
  const readiness = getLisbonApplyReadiness([
    { type: "WORLD_IDENTITY_CHECK", status: "VERIFIED" },
  ]);
  assert.equal(readiness.identityVerified, true);
  assert.equal(readiness.selfieVerified, false);
  assert.equal(readiness.canSubmit, false);
});

test("both proofs enable Apply", () => {
  const readiness = getLisbonApplyReadiness([
    { type: "lisbon_identity_v1", status: "VERIFIED" },
    { type: "apply_lisbon_house_v1", status: "VERIFIED" },
  ]);
  assert.equal(readiness.canSubmit, true);
});

test("backend still rejects missing requirements (frontend readiness)", () => {
  const readiness = getLisbonApplyReadiness([]);
  assert.equal(readiness.canSubmit, false);
});

test("application SUBMITTED is not rendered as ACCEPTED", () => {
  assert.equal(
    lisbonApplicationStatusLabel("SUBMITTED"),
    "Application submitted",
  );
  assert.notEqual(lisbonApplicationStatusLabel("SUBMITTED"), "Accepted");
  assert.notEqual(lisbonApplicationStatusLabel("SUBMITTED"), "Approved");
});

test("credential display only after backend issuance key", () => {
  const display = lisbonCredentialDisplay({
    credentialKey: "NOMADIC_LISBON_HOUSE_ELIGIBLE",
    claimedAt: "2026-07-25T13:00:00.000Z",
  });
  assert.equal(display.title, "Lisbon House Eligibility");
  assert.equal(display.policyKey, "lisbon_house_policy_v1");
});

test("credential does not appear for empty credentials list", () => {
  const merged = mergePassportProofs([]);
  assert.equal(
    merged.every((p) => p.status === "not_completed"),
    true,
  );
  const display = lisbonCredentialDisplay(null);
  assert.notEqual(display.title, "Lisbon House Eligibility");
});

test("Journey fixture cannot invent proof/application/credential state", () => {
  const fixture = {
    source: "frontend-fixture",
    application: { state: "not_started" },
    proofs: {
      identityCheck: { status: "not_started" },
      selfieCheck: { status: "not_started" },
    },
  };
  assert.equal(fixtureCannotInventBackendState(fixture), true);
  assert.equal(
    fixtureCannotInventBackendState({
      source: "frontend-fixture",
      application: { state: "not_started", credentialIssued: true },
    }),
    false,
  );
});

test("repeated submission label stays submitted not accepted", () => {
  const first = lisbonApplicationStatusLabel("SUBMITTED");
  const second = lisbonApplicationStatusLabel("SUBMITTED");
  assert.equal(first, second);
  assert.equal(first, "Application submitted");
});
