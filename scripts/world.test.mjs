import test from "node:test";
import assert from "node:assert/strict";
import {
  fingerprintNullifier,
  isActionPresetPair,
  isWorldAction,
  WORLD_ACTIONS,
} from "./world-helpers.mjs";

test("production World actions are allowlisted", () => {
  assert.deepEqual(WORLD_ACTIONS, [
    "lisbon_identity_v1",
    "apply_lisbon_house_v1",
  ]);
  assert.equal(isWorldAction("lisbon_identity_v1"), true);
  assert.equal(isWorldAction("spike_selfie_lisbon_v1"), false);
});

test("action/preset pairing matches Option B", () => {
  assert.equal(isActionPresetPair("lisbon_identity_v1", "identityCheck"), true);
  assert.equal(
    isActionPresetPair("apply_lisbon_house_v1", "selfieCheckLegacy"),
    true,
  );
  assert.equal(
    isActionPresetPair("lisbon_identity_v1", "selfieCheckLegacy"),
    false,
  );
});

test("nullifier fingerprint never returns the raw value", () => {
  const raw = "0xabcdef0123456789abcdef";
  const fp = fingerprintNullifier(raw);
  assert.ok(fp);
  assert.notEqual(fp, raw);
  assert.ok(fp.includes("…"));
});
