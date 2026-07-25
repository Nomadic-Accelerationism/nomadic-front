/**
 * Mirrors lib/world allowlist + preset pairing for node:test.
 * Keep in sync with lib/world/types.ts + lib/world/request.ts.
 */

export const WORLD_ACTIONS = [
  "lisbon_identity_v1",
  "apply_lisbon_house_v1",
];

export function isWorldAction(value) {
  return typeof value === "string" && WORLD_ACTIONS.includes(value);
}

export function isActionPresetPair(action, preset) {
  if (action === "lisbon_identity_v1") return preset === "identityCheck";
  if (action === "apply_lisbon_house_v1") return preset === "selfieCheckLegacy";
  return false;
}

export function fingerprintNullifier(nullifier) {
  if (!nullifier || typeof nullifier !== "string") return undefined;
  if (nullifier.length < 10) return "short";
  return `${nullifier.slice(0, 6)}…${nullifier.slice(-4)}`;
}
