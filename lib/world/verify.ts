import { summarizeWorldVerifyPayload, worldLogMeta } from "@/lib/world/sanitize";
import { readWorldEnv, type WorldVerifyResponse } from "@/lib/world/types";

const VERIFY_BASE =
  process.env.WORLD_VERIFY_BASE_URL?.trim() ||
  process.env.WORLD_SPIKE_VERIFY_BASE_URL?.trim() ||
  "https://developer.world.org/api/v4/verify";

/**
 * Forward IDKit result as-is to World verify. Do not mutate the payload.
 * Does not persist proofs to Passport — backend VerificationSession is later.
 */
export async function verifyWorldResult(input: {
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

  if (input.idkitResponse === undefined || input.idkitResponse === null) {
    return {
      ok: false,
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

  return {
    ok: true,
    persisted: false,
    summary,
    note:
      "Verified with World. Nomadic has not yet persisted a Passport proof record — Journey application wiring comes next.",
  };
}
