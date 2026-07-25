import test from "node:test";
import assert from "node:assert/strict";
import {
  assertNoSensitiveLogKeys,
  buildWorldVerifyForwardBody,
  canMarkWorldUiVerified,
  formatWorldVerifyError,
  isBackendWorldVerified,
  simulateBffForward,
} from "./world-verify-contract-helpers.mjs";

const identityProtocol4 = {
  protocol_version: "4",
  environment: "staging",
  action: "lisbon_identity_v1",
  nonce: "nonce-identity-1",
  responses: [
    {
      identifier: "identity",
      nullifier: "0xabc123def4567890",
      proof: "SENSITIVE_PROOF_IDENTITY",
    },
  ],
};

const selfieProtocol30 = {
  protocol_version: "3.0",
  environment: "staging",
  action: "apply_lisbon_house_v1",
  nonce: "nonce-selfie-1",
  responses: [
    {
      identifier: "selfie",
      nullifier: "0xselfie99aabbcc",
      proof: "SENSITIVE_PROOF_SELFIE",
      legacy: true,
    },
  ],
};

test("Identity protocol 4 payload reaches backend under idkitResult unchanged", () => {
  const forwarded = simulateBffForward({
    action: "lisbon_identity_v1",
    completionResult: identityProtocol4,
  });
  assert.equal(forwarded.ok, true);
  assert.equal(forwarded.backendBody.action, "lisbon_identity_v1");
  assert.equal(forwarded.backendBody.idkitResult, identityProtocol4);
  assert.deepEqual(forwarded.backendBody.idkitResult, identityProtocol4);
  assert.equal(
    forwarded.backendBody.idkitResult.protocol_version,
    "4",
  );
  assert.equal(
    forwarded.backendBody.idkitResult.responses[0].nullifier,
    "0xabc123def4567890",
  );
  assert.equal("idkitResponse" in forwarded.backendBody, false);
});

test("Selfie protocol 3.0 legacy responses reaches backend unchanged", () => {
  const forwarded = simulateBffForward({
    action: "apply_lisbon_house_v1",
    completionResult: selfieProtocol30,
  });
  assert.equal(forwarded.ok, true);
  assert.equal(forwarded.backendBody.action, "apply_lisbon_house_v1");
  assert.equal(forwarded.backendBody.idkitResult, selfieProtocol30);
  assert.equal(
    forwarded.backendBody.idkitResult.protocol_version,
    "3.0",
  );
  assert.equal(forwarded.backendBody.idkitResult.responses.length, 1);
  assert.equal(forwarded.backendBody.idkitResult.responses[0].legacy, true);
  // Must not extract responses[0] or rename nullifier.
  assert.equal(
    forwarded.backendBody.idkitResult.responses[0].nullifier,
    "0xselfie99aabbcc",
  );
  assert.equal(
    "nullifier_hash" in forwarded.backendBody.idkitResult.responses[0],
    false,
  );
});

test("legacy idkitResponse-only body is rejected as missing idkitResult", () => {
  const prepared = buildWorldVerifyForwardBody({
    action: "lisbon_identity_v1",
    idkitResult: undefined,
  });
  assert.equal(prepared.ok, false);
  assert.equal(prepared.status, 400);
  assert.equal(prepared.body.category, "INVALID_IDKIT_PAYLOAD");
});

test("non-object idkitResult yields result_not_object", () => {
  const prepared = buildWorldVerifyForwardBody({
    action: "lisbon_identity_v1",
    idkitResult: "not-an-object",
  });
  assert.equal(prepared.ok, false);
  assert.equal(prepared.body.detail, "result_not_object");
});

test("400/503 never marks UI verified", () => {
  const successBody = {
    ok: true,
    verified: true,
    category: "WORLD_VERIFIED",
  };
  assert.equal(
    canMarkWorldUiVerified({
      httpStatus: 400,
      body: {
        ok: false,
        verified: false,
        category: "INVALID_IDKIT_PAYLOAD",
        detail: "result_not_object",
      },
      passportHasProof: false,
    }),
    false,
  );
  assert.equal(
    canMarkWorldUiVerified({
      httpStatus: 503,
      body: { ok: false, verified: false, category: "WORLD_DISABLED" },
      passportHasProof: false,
    }),
    false,
  );
  // Even if body somehow looks verified, non-2xx must not verify UI.
  assert.equal(
    canMarkWorldUiVerified({
      httpStatus: 400,
      body: successBody,
      passportHasProof: true,
    }),
    false,
  );
});

test("successful backend response refreshes Passport before verified UI", () => {
  // Observed production shape: ok:false even after WORLD_PROOF_PERSISTED.
  const body = {
    ok: false,
    verified: true,
    category: "WORLD_VERIFIED",
  };
  assert.equal(isBackendWorldVerified(body, 200), true);
  assert.equal(
    canMarkWorldUiVerified({
      httpStatus: 200,
      body,
      passportHasProof: false,
    }),
    false,
  );
  assert.equal(
    canMarkWorldUiVerified({
      httpStatus: 200,
      body,
      passportHasProof: true,
    }),
    true,
  );
});

test("production WORLD_VERIFIED with ok:false is success, not Failed WORLD_VERIFIED", () => {
  const body = {
    ok: false,
    verified: true,
    category: "WORLD_VERIFIED",
  };
  assert.equal(isBackendWorldVerified(body, 200), true);
  assert.equal(/WORLD_VERIFIED/.test(formatWorldVerifyError(body, 200)), false);
});

test("partial success without WORLD_VERIFIED does not mark verified", () => {
  assert.equal(
    isBackendWorldVerified(
      {
        ok: true,
        verified: true,
        category: "SOMETHING_ELSE",
      },
      200,
    ),
    false,
  );
  assert.equal(
    isBackendWorldVerified(
      {
        ok: true,
        verified: false,
        category: "WORLD_VERIFIED",
      },
      200,
    ),
    false,
  );
});

test("failure shows backend category/error", () => {
  const message = formatWorldVerifyError(
    {
      ok: false,
      verified: false,
      category: "INVALID_IDKIT_PAYLOAD",
      detail: "result_not_object",
    },
    400,
  );
  assert.equal(message, "INVALID_IDKIT_PAYLOAD: result_not_object");
  assert.equal(/failed_by_host_app/i.test(message), false);
});

test("no proof/nullifier is logged in safe meta", () => {
  const meta = {
    action: "lisbon_identity_v1",
    status: 400,
    ok: false,
    verified: false,
    category: "INVALID_IDKIT_PAYLOAD",
  };
  assert.doesNotThrow(() => assertNoSensitiveLogKeys(meta));
  assert.throws(() =>
    assertNoSensitiveLogKeys({
      ...meta,
      nullifier: "0xabc",
    }),
  );
});
