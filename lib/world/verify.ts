/**
 * Production World verify BFF — forward IDKit completion to Nomadic backend.
 *
 * Does NOT call World /api/v4/verify.
 * Does NOT reshape idkitResult (Identity protocol 4 or Selfie protocol 3.0).
 * Proxies backend HTTP status + JSON body unchanged (no FE field remapping).
 */

import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { worldLogMeta } from "@/lib/world/sanitize";
import {
  buildWorldVerifyForwardBody,
  type WorldBackendVerifyJson,
  type WorldVerifyForwardBody,
} from "@/lib/world/verify-contract";

export type {
  WorldBackendVerifyJson,
  WorldVerifyForwardBody,
} from "@/lib/world/verify-contract";
export {
  buildWorldVerifyForwardBody,
  canMarkWorldUiVerified,
  formatWorldVerifyError,
  isBackendWorldVerified,
} from "@/lib/world/verify-contract";

const BACKEND_VERIFY_TIMEOUT_MS = 20_000;

export type WorldVerifyProxyResult = {
  status: number;
  body: WorldBackendVerifyJson;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Proxy POST {BACKEND_URL}/world/verify with Magic DID.
 * Returns backend status + JSON as-is. Never logs proofs/nullifiers/payload.
 */
export async function proxyWorldVerifyToBackend(input: {
  action: string;
  idkitResult: unknown;
  didToken: string;
}): Promise<WorldVerifyProxyResult> {
  let backendUrl: string;
  try {
    backendUrl = getNomadicApiUrl("/world/verify");
  } catch (error) {
    if (error instanceof NomadicApiConfigError) {
      worldLogMeta("verify_proxy_missing_api", {
        action: input.action,
      });
      return {
        status: 503,
        body: {
          ok: false,
          verified: false,
          category: "MISSING_API_CONFIG",
          detail: "NEXT_PUBLIC_NOMADIC_API_URL is not configured.",
        },
      };
    }
    throw error;
  }

  const forward = buildWorldVerifyForwardBody({
    action: input.action,
    idkitResult: input.idkitResult,
  });
  if (!forward.ok) {
    return { status: forward.status, body: forward.body };
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
      // Exact contract: { action, idkitResult } — no reshape.
      body: JSON.stringify(forward.body),
      signal: controller.signal,
      cache: "no-store",
    });

    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    const body = asRecord(json) ?? {
      ok: false,
      verified: false,
      category: "VERIFY_UPSTREAM_ERROR",
      detail: "Empty or non-JSON backend verify response.",
    };

    // Safe meta only — never proofs, nullifiers, or full payload.
    worldLogMeta("verify_proxy_response", {
      action: input.action,
      status: response.status,
      ok: body.ok === true,
      verified: body.verified === true,
      category: typeof body.category === "string" ? body.category : null,
    });

    return {
      status: response.status,
      body: body as WorldBackendVerifyJson,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    worldLogMeta("verify_proxy_network_error", {
      action: input.action,
      aborted,
    });
    return {
      status: 502,
      body: {
        ok: false,
        verified: false,
        category: "VERIFY_UPSTREAM_ERROR",
        detail: aborted
          ? "Backend World verify timed out."
          : "Network error calling Nomadic World verify.",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
