import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import {
  extractBearerDid,
  extractRequestId,
  mapBackendStatusToPassportError,
  passportMeError,
  PASSPORT_ME_TIMEOUT_MS,
  statusForPassportError,
} from "@/lib/passport/errors";
import { parsePrivatePassportResponse } from "@/lib/passport/validate";
import type { PassportMeErrorCode } from "@/lib/passport/types";

function errorJson(
  code: PassportMeErrorCode,
  options?: { requestId?: string; message?: string }
) {
  return NextResponse.json(passportMeError(code, options), {
    status: statusForPassportError(code),
  });
}

/**
 * Private Passport BFF.
 *
 * Client supplies Magic DID via Authorization (from existing session architecture).
 * Owner is determined solely by the authenticated backend session — never by
 * wallet/email/userId query or body parameters.
 */
export async function GET(request: Request) {
  // Explicitly ignore owner-selection params from the browser.
  const url = new URL(request.url);
  void url.searchParams.get("wallet");
  void url.searchParams.get("email");
  void url.searchParams.get("userId");

  const didToken = extractBearerDid(request);
  if (!didToken) {
    return errorJson("MISSING_SESSION");
  }

  let backendUrl: string;
  try {
    backendUrl = getNomadicApiUrl("/passport/me");
  } catch (error) {
    if (error instanceof NomadicApiConfigError) {
      return errorJson("MISSING_API_CONFIG");
    }
    return errorJson("UNEXPECTED_ERROR");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PASSPORT_ME_TIMEOUT_MS);

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${didToken}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const requestId = extractRequestId(response.headers, data);

    if (!response.ok) {
      const code = mapBackendStatusToPassportError(response.status);
      return errorJson(code, { requestId });
    }

    const parsed = parsePrivatePassportResponse(data);
    if (!parsed) {
      console.error("passport/me: unexpected backend response shape");
      return errorJson("UNEXPECTED_ERROR", { requestId });
    }

    // Never echo Authorization / DID. Return only the validated Passport model.
    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    const aborted =
      error instanceof Error && error.name === "AbortError";
    console.error(
      "passport/me: backend request failed",
      aborted ? "timeout" : "network"
    );
    return errorJson("BACKEND_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}
