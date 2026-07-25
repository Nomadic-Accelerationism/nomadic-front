import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import {
  sanitizeValidateOtpError,
  VALIDATE_OTP_TIMEOUT_MS,
  type ValidateOtpErrorCode,
} from "@/lib/auth/validate-otp-errors";

function errorResponse(
  code: ValidateOtpErrorCode,
  status: number,
  options?: { requestId?: string; message?: string }
) {
  return NextResponse.json(sanitizeValidateOtpError(code, options), { status });
}

function extractRequestId(headers: Headers): string | undefined {
  const value =
    headers.get("x-request-id") ||
    headers.get("x-vercel-id") ||
    headers.get("cf-ray");
  return value?.trim() || undefined;
}

export async function POST(request: Request) {
  let didToken: unknown;
  let email: unknown;

  try {
    const body = await request.json();
    didToken = body?.didToken;
    email = body?.email;
  } catch {
    return errorResponse("UNEXPECTED_ERROR", 400, {
      message: "Invalid request body",
    });
  }

  if (typeof didToken !== "string" || !didToken.trim()) {
    return errorResponse("MISSING_DID", 401);
  }

  let backendUrl: string;
  try {
    backendUrl = getNomadicApiUrl("/validaOTP");
  } catch (error) {
    if (error instanceof NomadicApiConfigError) {
      return errorResponse("MISSING_API_CONFIG", 503);
    }
    return errorResponse("UNEXPECTED_ERROR", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VALIDATE_OTP_TIMEOUT_MS);

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${didToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: typeof email === "string" ? email : undefined,
      }),
      signal: controller.signal,
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const bodyRequestId =
      data &&
      typeof data === "object" &&
      "requestId" in data &&
      typeof (data as { requestId?: unknown }).requestId === "string"
        ? (data as { requestId: string }).requestId.trim()
        : undefined;
    const requestId = bodyRequestId || extractRequestId(response.headers);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return errorResponse("INVALID_SESSION", response.status, { requestId });
      }
      if (response.status >= 500) {
        return errorResponse("BACKEND_UNAVAILABLE", 502, { requestId });
      }
      // Auth-related client errors from backend without leaking raw payloads
      return errorResponse("INVALID_SESSION", response.status, { requestId });
    }

    // Preserve successful backend payload (metadata) for the client session.
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === "AbortError") ||
      (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError");

    // Network / timeout — never log DID token
    console.error(
      "validate-otp: backend request failed",
      aborted ? "timeout" : "network"
    );

    return errorResponse("BACKEND_UNAVAILABLE", 502);
  } finally {
    clearTimeout(timeout);
  }
}
