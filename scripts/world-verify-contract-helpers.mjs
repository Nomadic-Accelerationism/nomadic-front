/**
 * Mirrors lib/world/verify-contract.ts for node:test.
 */

export function buildWorldVerifyForwardBody({ action, idkitResult }) {
  if (typeof action !== "string" || !action.trim()) {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        verified: false,
        category: "INVALID_BODY",
        detail: "action is required.",
      },
    };
  }

  if (idkitResult === undefined || idkitResult === null) {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        verified: false,
        category: "INVALID_IDKIT_PAYLOAD",
        detail: "idkitResult is required.",
      },
    };
  }

  if (typeof idkitResult !== "object" || Array.isArray(idkitResult)) {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        verified: false,
        category: "INVALID_IDKIT_PAYLOAD",
        detail: "result_not_object",
      },
    };
  }

  return {
    ok: true,
    body: {
      action: action.trim(),
      idkitResult,
    },
  };
}

export function isBackendWorldVerified(body) {
  return (
    body?.ok === true &&
    body?.verified === true &&
    body?.category === "WORLD_VERIFIED"
  );
}

export function formatWorldVerifyError(body, status) {
  const category = body?.category || body?.code || null;
  const detail = body?.detail || body?.message || body?.error || null;
  if (category && detail) return `${category}: ${detail}`;
  if (detail) return detail;
  if (category) return category;
  return `World verify failed (${status})`;
}

export function canMarkWorldUiVerified({
  httpStatus,
  body,
  passportHasProof,
}) {
  if (httpStatus === 400 || httpStatus === 503) return false;
  if (!httpStatus || httpStatus >= 400) return false;
  return isBackendWorldVerified(body) && passportHasProof === true;
}

/** Simulate BFF forward JSON — must keep idkitResult reference equality via deep clone check. */
export function simulateBffForward({ action, completionResult }) {
  const prepared = buildWorldVerifyForwardBody({
    action,
    idkitResult: completionResult,
  });
  if (!prepared.ok) return prepared;
  // Same shape the BFF posts to Express.
  return {
    ok: true,
    backendBody: {
      action: prepared.body.action,
      idkitResult: prepared.body.idkitResult,
    },
  };
}

export function assertNoSensitiveLogKeys(meta) {
  const banned = [
    "nullifier",
    "nullifier_hash",
    "proof",
    "idkitResult",
    "payload",
    "responses",
  ];
  const keys = Object.keys(meta || {});
  for (const key of keys) {
    if (banned.includes(key)) {
      throw new Error(`Sensitive key logged: ${key}`);
    }
  }
  const blob = JSON.stringify(meta);
  if (/nullifier/i.test(blob)) {
    throw new Error("nullifier appears in log meta");
  }
}
