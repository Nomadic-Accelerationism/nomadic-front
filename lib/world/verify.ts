/**
 * Production World verify — forward to Nomadic backend for World verify + persist.
 * Falls back to direct World portal verify (no persist) if backend path is unavailable.
 */

import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { summarizeWorldVerifyPayload, worldLogMeta } from "@/lib/world/sanitize";
import {
  readWorldEnv,
  type WorldBlockedCode,
  type WorldVerifyResponse,
  type WorldVerifySummary,
} from "@/lib/world/types";

const VERIFY_BASE =
  process.env.WORLD_VERIFY_BASE_URL?.trim() ||
  process.env.WORLD_SPIKE_VERIFY_BASE_URL?.trim() ||
  "https://developer.world.org/api/v4/verify";

const BACKEND_VERIFY_TIMEOUT_MS = 20_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function mapBackendFailure(
  status: number,
  body: Record<string, unknown> | null
): Extract<WorldVerifyResponse, { ok: false }> {
  const detail =
    (typeof body?.detail === "string" && body.detail) ||
    (typeof body?.message === "string" && body.message) ||
    (typeof body?.error === "string" && body.error) ||
    "Backend World verify failed.";

  let code: WorldBlockedCode = "VERIFY_UPSTREAM_ERROR";
  if (status === 401 || status === 403) code = "UNAUTHORIZED";
  else if (status === 400) code = "INVALID_BODY";
  else if (status === 422) code = "VERIFICATION_FAILED";
  else if (status === 503) code = "WORLD_DISABLED";

  return {
    ok: false,
    code,
    detail,
    persisted: false,
    summary:
      body?.summary && typeof body.summary === "object"
        ? (body.summary as WorldVerifySummary)
        : undefined,
  };
}

function normalizeBackendSuccess(
  body: Record<string, unknown>,
  upstreamHttpStatus: number
): WorldVerifyResponse {
  const summaryFromBody = asRecord(body.summary);
  const baseSummary = summarizeWorldVerifyPayload(
    summaryFromBody ?? body,
    upstreamHttpStatus
  );

  const explicitFail =
    body.ok === false ||
    body.success === false ||
    baseSummary.success === false;

  if (explicitFail && body.ok !== true && body.success !== true) {
    return {
      ok: false,
      code: "VERIFICATION_FAILED",
      detail: "World verification did not succeed.",
      summary: baseSummary,
      persisted: false,
    };
  }

  // Backend path exists to persist; treat successful 2xx as persisted unless explicitly false.
  const didPersist = body.persisted !== false;

  const verifiedAt =
    (typeof body.verifiedAt === "string" && body.verifiedAt) ||
    (typeof body.verified_at === "string" && body.verified_at) ||
    (typeof summaryFromBody?.verifiedAt === "string"
      ? String(summaryFromBody.verifiedAt)
      : undefined) ||
    new Date().toISOString();

  return {
    ok: true,
    persisted: didPersist,
    summary: {
      ...baseSummary,
      success: true,
      verifiedAt,
    },
    note: didPersist
      ? "Verified with World and saved to your Passport proofs."
      : "Verified with World, but Nomadic could not persist the proof yet.",
    verifiedAt,
  };
}

async function verifyViaNomadicBackend(input: {
  action?: string;
  idkitResponse: unknown;
  didToken: string;
}): Promise<WorldVerifyResponse | null> {
  let backendUrl: string;
  try {
    backendUrl = getNomadicApiUrl("/world/verify");
  } catch (error) {
    if (error instanceof NomadicApiConfigError) return null;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    BACKEND_VERIFY_TIMEOUT_MS
  );

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.didToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: input.action,
        idkitResponse: input.idkitResponse,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }
    const body = asRecord(json);

    worldLogMeta("backend_verify_response", {
      action: input.action ?? null,
      status: response.status,
      ok: body?.ok === true || body?.success === true,
      persisted: body?.persisted ?? null,
    });

    if (!response.ok) {
      // 404 → route missing; allow portal fallback.
      if (response.status === 404) return null;
      return mapBackendFailure(response.status, body);
    }

    if (!body) {
      return {
        ok: false,
        code: "VERIFY_UPSTREAM_ERROR",
        detail: "Empty backend verify response.",
        persisted: false,
      };
    }

    return normalizeBackendSuccess(body, response.status);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    worldLogMeta("backend_verify_network_error", {
      action: input.action ?? null,
      aborted,
    });
    // Network/timeout → try portal fallback so IDKit UX is not bricked.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyViaWorldPortal(input: {
  action?: string;
  idkitResponse: unknown;
}): Promise<WorldVerifyResponse> {
  const env = readWorldEnv();

  if (!env.enabled) {
    return {
      ok: false,
      code: "WORLD_DISABLED",
      detail: "WORLD_ENABLED is not true.",
      persisted: false,
    };
  }

  if (env.missing.length > 0 || !env.rpId) {
    return {
      ok: false,
      code: "MISSING_CREDENTIALS",
      detail: `Cannot call World verify without credentials (${env.missing.join(", ") || "WORLD_RP_ID"}).`,
      persisted: false,
    };
  }

  let upstreamHttpStatus = 0;
  let upstreamJson: unknown;

  try {
    const response = await fetch(`${VERIFY_BASE}/${env.rpId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input.idkitResponse),
    });
    upstreamHttpStatus = response.status;
    const text = await response.text();
    try {
      upstreamJson = text ? JSON.parse(text) : {};
    } catch {
      upstreamJson = { parse_error: true };
    }
  } catch {
    worldLogMeta("verify_network_error", { action: input.action ?? null });
    return {
      ok: false,
      code: "VERIFY_UPSTREAM_ERROR",
      detail: "Network error calling World verify endpoint.",
      persisted: false,
    };
  }

  const summary = summarizeWorldVerifyPayload(upstreamJson, upstreamHttpStatus);

  worldLogMeta("verify_completed_portal_fallback", {
    action: input.action ?? summary.action ?? null,
    upstreamHttpStatus,
    success: summary.success,
    nullifierPresent: summary.nullifierPresent,
  });

  if (!summary.success || upstreamHttpStatus >= 400) {
    return {
      ok: false,
      code: "VERIFICATION_FAILED",
      detail: "World verification did not succeed.",
      summary,
      persisted: false,
    };
  }

  return {
    ok: true,
    persisted: false,
    summary,
    note:
      "Verified with World, but Nomadic could not persist the proof yet. Retry or refresh Passport.",
  };
}

/**
 * Verify IDKit result. Prefer Nomadic backend (verify + persist).
 * Does not log DID or raw World payloads.
 */
export async function verifyWorldResult(input: {
  action?: string;
  idkitResponse: unknown;
  didToken: string;
}): Promise<WorldVerifyResponse> {
  if (input.idkitResponse === undefined || input.idkitResponse === null) {
    return {
      ok: false,
      code: "INVALID_BODY",
      detail: "idkitResponse is required.",
      persisted: false,
    };
  }

  const viaBackend = await verifyViaNomadicBackend(input);
  if (viaBackend) return viaBackend;

  return verifyViaWorldPortal({
    action: input.action,
    idkitResponse: input.idkitResponse,
  });
}
