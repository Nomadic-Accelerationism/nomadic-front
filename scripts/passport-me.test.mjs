import assert from "node:assert/strict";
import test from "node:test";
import {
  extractBearerDid,
  mapBackendStatusToPassportError,
  mergePassportProofs,
  parsePrivatePassportResponse,
  passportMeError,
} from "./passport-me-helpers.mjs";

const SYNTHETIC_WALLET = "0x1111111111111111111111111111111111111111";

test("parse: accepts ready wallet passport with empty proofs/credentials", () => {
  const parsed = parsePrivatePassportResponse({
    passport: {
      publicAddress: SYNTHETIC_WALLET,
      identityStatus: "READY",
      ensName: null,
      ensStatus: "NOT_ISSUED",
      proofs: [],
      credentials: [],
      journeys: [],
    },
  });
  assert.ok(parsed);
  assert.equal(parsed.passport.publicAddress, SYNTHETIC_WALLET);
  assert.equal(parsed.passport.identityStatus, "READY");
  assert.equal(parsed.passport.ensStatus, "NOT_ISSUED");
  assert.equal(parsed.passport.ensName, null);
  assert.deepEqual(parsed.passport.proofs, []);
  assert.deepEqual(parsed.passport.credentials, []);
});

test("parse: accepts WALLET_UNAVAILABLE with null address", () => {
  const parsed = parsePrivatePassportResponse({
    passport: {
      publicAddress: null,
      identityStatus: "WALLET_UNAVAILABLE",
      ensName: null,
      ensStatus: "NOT_ISSUED",
      proofs: [],
      credentials: [],
    },
  });
  assert.ok(parsed);
  assert.equal(parsed.passport.publicAddress, null);
  assert.equal(parsed.passport.identityStatus, "WALLET_UNAVAILABLE");
});

test("parse: rejects READY without wallet", () => {
  assert.equal(
    parsePrivatePassportResponse({
      passport: {
        publicAddress: null,
        identityStatus: "READY",
        ensName: null,
        ensStatus: "NOT_ISSUED",
        proofs: [],
        credentials: [],
      },
    }),
    null
  );
});

test("parse: rejects invented ens ownership without ISSUED + name", () => {
  assert.equal(
    parsePrivatePassportResponse({
      passport: {
        publicAddress: SYNTHETIC_WALLET,
        identityStatus: "READY",
        ensName: null,
        ensStatus: "ISSUED",
        proofs: [],
        credentials: [],
      },
    }),
    null
  );
});

test("parse: accepts one backend credential", () => {
  const parsed = parsePrivatePassportResponse({
    passport: {
      publicAddress: SYNTHETIC_WALLET,
      identityStatus: "READY",
      ensName: null,
      ensStatus: "NOT_ISSUED",
      proofs: [],
      credentials: [
        {
          credentialKey: "NOMADIC_LISBON_HOUSE_ELIGIBLE",
          displayName: "Nomadic Lisbon House — Eligible",
        },
      ],
    },
  });
  assert.ok(parsed);
  assert.equal(parsed.passport.credentials.length, 1);
  assert.equal(
    parsed.passport.credentials[0].credentialKey,
    "NOMADIC_LISBON_HOUSE_ELIGIBLE"
  );
});

test("parse: DID / auth fields must not appear as passport owner selectors", () => {
  const parsed = parsePrivatePassportResponse({
    passport: {
      publicAddress: SYNTHETIC_WALLET,
      identityStatus: "READY",
      ensName: null,
      ensStatus: "NOT_ISSUED",
      proofs: [],
      credentials: [],
    },
    didToken: "should-be-ignored-by-parser",
  });
  assert.ok(parsed);
  assert.equal("didToken" in parsed, false);
  assert.equal("didToken" in parsed.passport, false);
});

test("BFF helper: missing Authorization → null DID", () => {
  assert.equal(extractBearerDid(null), null);
  assert.equal(extractBearerDid(""), null);
  assert.equal(extractBearerDid("Basic abc"), null);
});

test("BFF helper: extracts Bearer DID", () => {
  assert.equal(extractBearerDid("Bearer synth.did.token"), "synth.did.token");
});

test("BFF helper: maps backend statuses", () => {
  assert.equal(mapBackendStatusToPassportError(401), "INVALID_SESSION");
  assert.equal(mapBackendStatusToPassportError(503), "PASSPORT_UNAVAILABLE");
  assert.equal(mapBackendStatusToPassportError(502), "BACKEND_UNAVAILABLE");
  assert.equal(mapBackendStatusToPassportError(400), "UNEXPECTED_ERROR");
});

test("BFF helper: error body uses stable codes (no stack)", () => {
  const body = passportMeError("BACKEND_UNAVAILABLE");
  assert.deepEqual(body, { error: "BACKEND_UNAVAILABLE" });
  assert.equal("stack" in body, false);
});

test("proofs: empty backend → not completed for both supported products", () => {
  const merged = mergePassportProofs([]);
  assert.equal(merged.length, 2);
  assert.ok(merged.every((item) => item.status === "not_completed"));
  assert.ok(merged.every((item) => item.backendRecord === null));
});

test("proofs: one completed Identity Check from backend", () => {
  const merged = mergePassportProofs([
    { type: "WORLD_IDENTITY_CHECK", status: "COMPLETED" },
  ]);
  const identity = merged.find((item) => item.id === "WORLD_IDENTITY_CHECK");
  const selfie = merged.find((item) => item.id === "WORLD_SELFIE_CHECK");
  assert.equal(identity.status, "completed");
  assert.equal(selfie.status, "not_completed");
});

test("fixture boundary: empty backend journeys must not invent credentials", () => {
  const parsed = parsePrivatePassportResponse({
    passport: {
      publicAddress: SYNTHETIC_WALLET,
      identityStatus: "READY",
      ensName: null,
      ensStatus: "NOT_ISSUED",
      proofs: [],
      credentials: [],
      journeys: [],
    },
  });
  assert.ok(parsed);
  assert.deepEqual(parsed.passport.credentials, []);
  assert.deepEqual(parsed.passport.journeys, []);
});
