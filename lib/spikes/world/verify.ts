/**
 * World spike — forward IDKit result to World verify endpoint.
 * Does not persist. Does not create claims.
 */

import {
  isForbiddenProductionAction,
  readWorldSpikeEnv,
  type WorldSpikeVerifyResponse,
} from "./types";
import { summarizeWorldVerifyPayload, worldSpikeLogMeta } from "./sanitize";

const VERIFY_BASE =
  process.env.WORLD_SPIKE_VERIFY_BASE_URL?.trim() ||
  "https://developer.world.org/api/v4/verify";

export async function verifyWorldSpikeResult(input: {
  action?: string;
  idkitResponse: unknown;
}): Promise<WorldSpikeVerifyResponse> {
  const env = readWorldSpikeEnv();

  if (!env.enabled) {
    return {
      ok: false,
      execution: "blocked",
      code: "SPIKE_DISABLED",
      detail: "WORLD_SPIKE_ENABLED is not true.",
      persisted: false,
    };
  }

  if (env.missing.length > 0 || !env.rpId) {
    return {
      ok: false,
      execution: "blocked",
      code: "MISSING_CREDENTIALS",
      detail: `Cannot call World verify without credentials (${env.missing.join(", ") || "WORLD_SPIKE_RP_ID"}).`,
      persisted: false,
    };
  }

  if (input.action && isForbiddenProductionAction(input.action)) {
    return {
      ok: false,
      execution: "blocked",
      code: "PRODUCTION_CLAIM_FORBIDDEN",
      detail: "Refusing to verify a production claim/apply action on spike routes.",
      persisted: false,
    };
  }

  if (input.idkitResponse === undefined || input.idkitResponse === null) {
    return {
      ok: false,
      execution: "blocked",
      code: "INVALID_BODY",
      detail: "idkitResponse is required.",
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
    worldSpikeLogMeta("verify_network_error", { action: input.action ?? null });
    return {
      ok: false,
      execution: "failed",
      code: "VERIFY_UPSTREAM_ERROR",
      detail: "Network error calling World verify endpoint.",
      persisted: false,
    };
  }

  const summary = summarizeWorldVerifyPayload(upstreamJson, upstreamHttpStatus);

  worldSpikeLogMeta("verify_completed", {
    action: input.action ?? summary.action ?? null,
    upstreamHttpStatus,
    success: summary.success,
    nullifierPresent: summary.nullifierPresent,
    identity_attested: summary.identity_attested ?? null,
    session_id_present: summary.session_id_present,
    // never log proofs or full body
  });

  if (!summary.success || upstreamHttpStatus >= 400) {
    return {
      ok: false,
      execution: "failed",
      code: "VERIFICATION_FAILED",
      detail: "World verification did not succeed. See sanitized summary.",
      summary,
      persisted: false,
    };
  }

  return {
    ok: true,
    execution: "ready",
    persisted: false,
    summary,
    note: "Spike only — result was not stored; cannot mint credentials.",
  };
}
