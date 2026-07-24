/**
 * World spike — RP context generation (server-only).
 * Execution blocked when credentials missing.
 */

import { signRequest } from "@worldcoin/idkit-core/signing";
import {
  isForbiddenProductionAction,
  isWorldSpikeAction,
  readWorldSpikeEnv,
  type WorldSpikePreset,
  type WorldSpikeRequestBody,
  type WorldSpikeRequestResponse,
} from "./types";
import { worldSpikeLogMeta } from "./sanitize";

export function buildWorldSpikeRequest(
  body: WorldSpikeRequestBody,
): WorldSpikeRequestResponse {
  const env = readWorldSpikeEnv();

  if (!env.enabled) {
    return {
      ok: false,
      execution: "blocked",
      code: "SPIKE_DISABLED",
      detail:
        "Set WORLD_SPIKE_ENABLED=true to run the World spike. Live verify remains off until credentials exist.",
    };
  }

  if (!isWorldSpikeAction(body.action) || isForbiddenProductionAction(body.action)) {
    return {
      ok: false,
      execution: "blocked",
      code: isForbiddenProductionAction(String(body.action))
        ? "PRODUCTION_CLAIM_FORBIDDEN"
        : "ACTION_NOT_ALLOWLISTED",
      detail:
        "Only allowlisted spike_* actions are permitted. Production claim/apply actions are rejected.",
    };
  }

  if (env.missing.length > 0) {
    worldSpikeLogMeta("request_blocked_missing_credentials", {
      missingCount: env.missing.length,
      // names only — never values
      missing: env.missing,
    });
    return {
      ok: false,
      execution: "blocked",
      code: "MISSING_CREDENTIALS",
      detail: `World spike credentials not configured (${env.missing.join(", ")}). Adapters are typed; execution blocked.`,
    };
  }

  const preset: WorldSpikePreset = body.preset;
  const allow_legacy_proofs = preset === "selfieCheckLegacy";

  try {
    const signed = signRequest({
      signingKeyHex: env.signingKeyHex!,
      action: body.action,
      ttl: 300,
    });

    worldSpikeLogMeta("rp_context_issued", {
      action: body.action,
      preset,
      environment: env.environment,
      expires_at: signed.expiresAt,
    });

    return {
      ok: true,
      execution: "ready",
      action: body.action,
      preset,
      app_id: env.appId!,
      rp_context: {
        rp_id: env.rpId!,
        nonce: signed.nonce,
        created_at: Number(signed.createdAt),
        expires_at: Number(signed.expiresAt),
        signature: signed.sig,
      },
      allow_legacy_proofs,
      environment: env.environment,
      clientHint: {
        identityCheckUsesAllowLegacyFalse: true,
        selfieRequiresAllowLegacyTrue: true,
        combineInOneRequest: "not_confirmed",
      },
    };
  } catch {
    worldSpikeLogMeta("signing_failed", { action: body.action });
    return {
      ok: false,
      execution: "blocked",
      code: "SIGNING_FAILED",
      detail: "RP signRequest failed. Check key format (32-byte hex) without logging the key.",
    };
  }
}
