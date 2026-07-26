/**
 * Production World verify.
 *
 * 1) Verify with World Developer Portal (source of cryptographic truth — proven working).
 * 2) Best-effort persist via Nomadic backend `/world/verify`.
 *
 * Persist failures must not fail IDKit (`failed_by_host_app`). UI handles sync separately.
 */

import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { summarizeWorldVerifyPayload, worldLogMeta } from "@/lib/world/sanitize";
import {
  readWorldEnv,
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

  worldLogMeta("verify_completed", {
    action: input.action ?? summary.action ?? null,
    upstreamHttpStatus,
    success: summary.success,
    nullifierPresent: summary.nullifierPresent,
    identity_attested: summary.identity_attested ?? null,
    session_id_present: summary.session_id_present,
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

  const verifiedAt = new Date().toISOString();
  return {
    ok: true,
    persisted: false,
    summary: { ...summary, success: true, verifiedAt },
    note: "Verified with World.",
    verifiedAt,
  };
}

/**
 * Ask Nomadic backend to persist a proof already verified with World.
 * Never throws into the IDKit path — returns persisted boolean only.
 */
async function persistViaNomadicBackend(input: {
  action?: string;
  idkitResponse: unknown;
  didToken: string;
  summary: WorldVerifySummary;
}): Promise<{ persisted: boolean; verifiedAt?: string }> {
  let backendUrl: string;
  try {
    backendUrl = getNomadicApiUrl("/world/verify");
  } catch (error) {
    if (error instanceof NomadicApiConfigError) {
      worldLogMeta("persist_skipped_missing_api", {
        action: input.action ?? null,
      });
      return { persisted: false };
    }
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
      // Forward IDKit payload as-is; include action for allowlist routing.
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

    worldLogMeta("backend_persist_response", {
      action: input.action ?? null,
      status: response.status,
      ok: body?.ok === true || body?.success === true,
      persisted: body?.persisted ?? null,
    });

    if (!response.ok) {
      return { persisted: false };
    }

    const verifiedAt =
      (typeof body?.verifiedAt === "string" && body.verifiedAt) ||
      (typeof body?.verified_at === "string" && body.verified_at) ||
      input.summary.verifiedAt;

    // Treat 2xx as persisted unless backend explicitly says otherwise.
    const persisted = body?.persisted !== false;
    return { persisted, verifiedAt };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    worldLogMeta("backend_persist_network_error", {
      action: input.action ?? null,
      aborted,
    });
    return { persisted: false };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verify IDKit result with World, then best-effort persist on Nomadic.
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

  const portal = await verifyViaWorldPortal({
    action: input.action,
    idkitResponse: input.idkitResponse,
  });

  if (!portal.ok) return portal;

  const persist = await persistViaNomadicBackend({
    action: input.action,
    idkitResponse: input.idkitResponse,
    didToken: input.didToken,
    summary: portal.summary,
  });

  const verifiedAt = persist.verifiedAt || portal.verifiedAt;

  return {
    ok: true,
    persisted: persist.persisted,
    summary: {
      ...portal.summary,
      verifiedAt,
    },
    verifiedAt,
    note: persist.persisted
      ? "Verified with World and saved to your Passport proofs."
      : "Verified with World, but Nomadic could not persist the proof yet. Retry Passport sync or refresh.",
  };
}
