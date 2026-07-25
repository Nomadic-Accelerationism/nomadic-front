import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { extractBearerDid, extractRequestId } from "@/lib/passport/errors";
import {
  LISBON_ELIGIBLE_CREDENTIAL_KEY,
  LISBON_POLICY_KEY,
  type LisbonApplicationErrorCode,
} from "@/lib/journeys/lisbon-applications";

const TIMEOUT_MS = 20_000;

function errorJson(
  code: LisbonApplicationErrorCode,
  status: number,
  options?: { requestId?: string; message?: string }
) {
  const messages: Record<LisbonApplicationErrorCode, string> = {
    MISSING_SESSION: "Your session expired. Please sign in again.",
    INVALID_SESSION: "Your session expired. Please sign in again.",
    MISSING_API_CONFIG: "Application service is not configured.",
    POLICY_NOT_SATISFIED:
      "Requirements are no longer satisfied. Complete Identity and Selfie checks.",
    ALREADY_APPLIED: "Your application was already submitted.",
    BACKEND_UNAVAILABLE: "Backend unavailable. Please try again shortly.",
    UNEXPECTED_ERROR: "Unexpected error submitting your application.",
  };

  return NextResponse.json(
    {
      error: code,
      message: options?.message ?? messages[code],
      ...(options?.requestId ? { requestId: options.requestId } : {}),
    },
    { status }
  );
}

function mapBackendStatus(status: number): {
  code: LisbonApplicationErrorCode;
  http: number;
} {
  if (status === 401 || status === 403) {
    return { code: "INVALID_SESSION", http: 401 };
  }
  if (status === 409) {
    return { code: "ALREADY_APPLIED", http: 409 };
  }
  if (status === 400 || status === 422) {
    return { code: "POLICY_NOT_SATISFIED", http: 400 };
  }
  if (status === 503 || status >= 500) {
    return { code: "BACKEND_UNAVAILABLE", http: 503 };
  }
  return { code: "UNEXPECTED_ERROR", http: 500 };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeApplicationResponse(raw: unknown): {
  application: {
    status: string;
    policyKey?: string;
    journeyId?: string;
    submittedAt?: string;
  };
  credential?: Record<string, unknown> | null;
} | null {
  const body = asRecord(raw);
  if (!body) return null;

  const application =
    asRecord(body.application) ||
    asRecord(body.journeyApplication) ||
    (typeof body.status === "string" ? body : null);

  if (!application || typeof application.status !== "string") return null;

  let credential =
    asRecord(body.credential) ||
    asRecord(body.eligibilityCredential) ||
    null;

  if (!credential && Array.isArray(body.credentials)) {
    credential =
      body.credentials
        .map((item) => asRecord(item))
        .find((item) => {
          const key =
            item &&
            (item.credentialKey || item.key || item.type || item.id);
          return (
            typeof key === "string" &&
            key.trim().toUpperCase() === LISBON_ELIGIBLE_CREDENTIAL_KEY
          );
        }) || null;
  }

  return {
    application: {
      status: application.status,
      policyKey:
        typeof application.policyKey === "string"
          ? application.policyKey
          : typeof application.policyVersion === "string"
            ? application.policyVersion
            : LISBON_POLICY_KEY,
      journeyId:
        typeof application.journeyId === "string"
          ? application.journeyId
          : typeof application.id === "string"
            ? application.id
            : undefined,
      submittedAt:
        typeof application.submittedAt === "string"
          ? application.submittedAt
          : typeof application.createdAt === "string"
            ? application.createdAt
            : undefined,
    },
    credential,
  };
}

/**
 * Lisbon House application BFF.
 * Auth via Magic DID only — never accepts wallet/email/userId/proof status from client.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  void url.searchParams.get("wallet");
  void url.searchParams.get("email");
  void url.searchParams.get("userId");

  const didToken = extractBearerDid(request);
  if (!didToken) {
    return errorJson("MISSING_SESSION", 401);
  }

  let backendUrl: string;
  try {
    backendUrl = getNomadicApiUrl("/journeys/lisbon-house/applications");
  } catch (error) {
    if (error instanceof NomadicApiConfigError) {
      return errorJson("MISSING_API_CONFIG", 500);
    }
    return errorJson("UNEXPECTED_ERROR", 500);
  }

  // Ignore any client-supplied owner / proof fields.
  try {
    await request.json();
  } catch {
    // empty body is fine
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${didToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
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
      const mapped = mapBackendStatus(response.status);
      const body = asRecord(data);
      const backendCode =
        typeof body?.error === "string" ? body.error.toUpperCase() : "";
      let code = mapped.code;
      if (
        backendCode.includes("POLICY") ||
        backendCode.includes("REQUIREMENT") ||
        backendCode.includes("PROOF")
      ) {
        code = "POLICY_NOT_SATISFIED";
      }
      if (backendCode.includes("ALREADY") || response.status === 409) {
        code = "ALREADY_APPLIED";
      }
      console.error("lisbon-applications: backend error", {
        status: response.status,
        code,
      });
      return errorJson(code, mapped.http, { requestId });
    }

    const normalized = normalizeApplicationResponse(data);
    if (!normalized) {
      console.error("lisbon-applications: unexpected response shape");
      return errorJson("UNEXPECTED_ERROR", 500, { requestId });
    }

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error(
      "lisbon-applications: backend request failed",
      aborted ? "timeout" : "network"
    );
    return errorJson("BACKEND_UNAVAILABLE", 503);
  } finally {
    clearTimeout(timeout);
  }
}
