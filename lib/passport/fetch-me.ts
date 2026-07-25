import { parsePrivatePassportResponse } from "@/lib/passport/validate";
import type {
  PassportMeErrorBody,
  PassportMeErrorCode,
  PrivatePassportResponse,
} from "@/lib/passport/types";

export class PassportMeClientError extends Error {
  readonly code: PassportMeErrorCode;
  readonly requestId?: string;
  readonly status: number;

  constructor(
    code: PassportMeErrorCode,
    status: number,
    options?: { requestId?: string; message?: string }
  ) {
    super(options?.message ?? code);
    this.name = "PassportMeClientError";
    this.code = code;
    this.status = status;
    this.requestId = options?.requestId;
  }
}

function isErrorBody(value: unknown): value is PassportMeErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

/**
 * Client → Next.js BFF `GET /api/passport/me`.
 * Pass the Magic DID in Authorization; never send wallet/email/userId.
 */
export async function fetchPrivatePassport(
  didToken: string,
  init?: { signal?: AbortSignal }
): Promise<PrivatePassportResponse> {
  const response = await fetch("/api/passport/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${didToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: init?.signal,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const body = isErrorBody(data) ? data : null;
    const code = (body?.error as PassportMeErrorCode) || "UNEXPECTED_ERROR";
    throw new PassportMeClientError(code, response.status, {
      requestId: body?.requestId,
      message: body?.message,
    });
  }

  const parsed = parsePrivatePassportResponse(data);
  if (!parsed) {
    throw new PassportMeClientError("UNEXPECTED_ERROR", 500, {
      message: "Invalid Passport response",
    });
  }

  return parsed;
}
