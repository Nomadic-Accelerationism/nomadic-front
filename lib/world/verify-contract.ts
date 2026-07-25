/**
 * Shared World verify contract helpers (client + server safe).
 * No network, no secrets, no payload logging.
 */

export type WorldVerifyForwardBody = {
  action: string;
  idkitResult: unknown;
};

export type WorldBackendVerifyJson = {
  ok?: boolean;
  verified?: boolean;
  category?: string;
  detail?: string;
  code?: string;
  message?: string;
  error?: string;
  persisted?: boolean;
  verifiedAt?: string;
  [key: string]: unknown;
};

/**
 * Build the exact client→BFF→backend body. Never reshapes idkitResult.
 */
export function buildWorldVerifyForwardBody(input: {
  action: unknown;
  idkitResult: unknown;
}):
  | { ok: true; body: WorldVerifyForwardBody }
  | { ok: false; status: number; body: WorldBackendVerifyJson } {
  if (typeof input.action !== "string" || !input.action.trim()) {
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

  if (input.idkitResult === undefined || input.idkitResult === null) {
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

  if (
    typeof input.idkitResult !== "object" ||
    Array.isArray(input.idkitResult)
  ) {
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
      action: input.action.trim(),
      // Preserve complete IDKit completion object unchanged.
      idkitResult: input.idkitResult,
    },
  };
}

/**
 * True when Nomadic backend confirms World verification.
 *
 * Production backend returns (observed):
 *   { verified: true, category: "WORLD_VERIFIED", ok: false } with HTTP 200
 * after WORLD_PROOF_PERSISTED — so do NOT require `ok === true`.
 */
export function isBackendWorldVerified(
  body: WorldBackendVerifyJson | null | undefined,
  httpStatus?: number
): boolean {
  if (httpStatus !== undefined && (httpStatus < 200 || httpStatus >= 300)) {
    return false;
  }
  if (!body) return false;
  if (body.verified === false) return false;
  return (
    body.verified === true && body.category === "WORLD_VERIFIED"
  );
}

/**
 * User-facing error from backend (prefer category + detail).
 * Never surface a bare WORLD_VERIFIED success category as a failure label.
 */
export function formatWorldVerifyError(
  body: WorldBackendVerifyJson | null | undefined,
  status: number
): string {
  if (isBackendWorldVerified(body, status)) {
    return "World verified, but the Passport UI could not confirm the proof yet.";
  }

  const category =
    (typeof body?.category === "string" && body.category) ||
    (typeof body?.code === "string" && body.code) ||
    null;
  const detail =
    (typeof body?.detail === "string" && body.detail) ||
    (typeof body?.message === "string" && body.message) ||
    (typeof body?.error === "string" && body.error) ||
    null;

  // Success category alone without verified:true is incomplete, not a user error code.
  if (category === "WORLD_VERIFIED" && !detail) {
    return `World verify response incomplete (${status})`;
  }

  if (category && detail) return `${category}: ${detail}`;
  if (detail) return detail;
  if (category) return category;
  return `World verify failed (${status})`;
}

/**
 * Whether Nomadic UI may show Verified after a verify response + Passport check.
 */
export function canMarkWorldUiVerified(input: {
  httpStatus: number;
  body: WorldBackendVerifyJson | null | undefined;
  passportHasProof: boolean;
}): boolean {
  if (input.httpStatus === 400 || input.httpStatus === 503) return false;
  if (!input.httpStatus || input.httpStatus >= 400) return false;
  return (
    isBackendWorldVerified(input.body, input.httpStatus) &&
    input.passportHasProof
  );
}
