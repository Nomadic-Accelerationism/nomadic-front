import { signRequest } from "@worldcoin/idkit-core/signing";
import { worldLogMeta } from "@/lib/world/sanitize";
import {
  isWorldAction,
  readWorldEnv,
  type WorldPreset,
  type WorldRequestBody,
  type WorldRequestResponse,
} from "@/lib/world/types";

export function buildWorldRequest(
  body: WorldRequestBody
): WorldRequestResponse {
  const env = readWorldEnv();

  if (!env.enabled) {
    return {
      ok: false,
      code: "WORLD_DISABLED",
      detail:
        "World verification is not enabled. Set WORLD_ENABLED=true on the server.",
    };
  }

  if (!isWorldAction(body.action)) {
    return {
      ok: false,
      code: "ACTION_NOT_ALLOWLISTED",
      detail: "Action is not allowlisted for Nomadic Lisbon World checks.",
    };
  }

  if (env.missing.length > 0) {
    worldLogMeta("request_blocked_missing_credentials", {
      missing: env.missing,
    });
    return {
      ok: false,
      code: "MISSING_CREDENTIALS",
      detail: `World credentials not configured (${env.missing.join(", ")}).`,
    };
  }

  const preset: WorldPreset = body.preset;
  if (
    (body.action === "lisbon_identity_v1" && preset !== "identityCheck") ||
    (body.action === "apply_lisbon_house_v1" && preset !== "selfieCheckLegacy")
  ) {
    return {
      ok: false,
      code: "INVALID_BODY",
      detail: "Action/preset mismatch for Lisbon World flow.",
    };
  }

  const allow_legacy_proofs = preset === "selfieCheckLegacy";

  try {
    const signed = signRequest({
      signingKeyHex: env.signingKeyHex!,
      action: body.action,
      ttl: 300,
    });

    worldLogMeta("rp_context_issued", {
      action: body.action,
      preset,
      environment: env.environment,
      expires_at: signed.expiresAt,
    });

    return {
      ok: true,
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
    };
  } catch {
    worldLogMeta("signing_failed", { action: body.action });
    return {
      ok: false,
      code: "SIGNING_FAILED",
      detail: "RP signRequest failed. Check WORLD_RP_SIGNING_KEY format.",
    };
  }
}
