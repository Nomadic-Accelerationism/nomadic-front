import type {
  PassportMeErrorBody,
  PassportMeErrorCode,
} from "@/lib/passport/types";

export const PASSPORT_ME_TIMEOUT_MS = 15_000;

export function passportMeError(
  code: PassportMeErrorCode,
  options?: { requestId?: string; message?: string }
): PassportMeErrorBody {
  const messages: Record<PassportMeErrorCode, string> = {
    MISSING_SESSION: "Your session expired. Please sign in again.",
    INVALID_SESSION: "Your session expired. Please sign in again.",
    MISSING_API_CONFIG: "Your Passport could not be loaded right now.",
    BACKEND_UNAVAILABLE: "Your Passport could not be loaded right now.",
    PASSPORT_UNAVAILABLE: "Your Passport could not be loaded right now.",
    UNEXPECTED_ERROR: "Your Passport could not be loaded right now.",
  };

  return {
    error: code,
    message: options?.message ?? messages[code],
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };
}

export function statusForPassportError(code: PassportMeErrorCode): number {
  switch (code) {
    case "MISSING_SESSION":
    case "INVALID_SESSION":
      return 401;
    case "MISSING_API_CONFIG":
    case "UNEXPECTED_ERROR":
      return 500;
    case "BACKEND_UNAVAILABLE":
    case "PASSPORT_UNAVAILABLE":
      return 503;
    default:
      return 500;
  }
}

export function extractRequestId(headers: Headers, body?: unknown): string | undefined {
  const fromBody =
    body &&
    typeof body === "object" &&
    "requestId" in body &&
    typeof (body as { requestId?: unknown }).requestId === "string"
      ? (body as { requestId: string }).requestId.trim()
      : undefined;

  const fromHeaders =
    headers.get("x-request-id") ||
    headers.get("x-vercel-id") ||
    headers.get("cf-ray");

  return fromBody || fromHeaders?.trim() || undefined;
}

/**
 * Reads Bearer DID from the incoming BFF request.
 * Query/body wallet|email|userId are intentionally ignored.
 */
export function extractBearerDid(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export function mapBackendStatusToPassportError(
  status: number
): PassportMeErrorCode {
  if (status === 401 || status === 403) return "INVALID_SESSION";
  if (status === 503) return "PASSPORT_UNAVAILABLE";
  if (status >= 500) return "BACKEND_UNAVAILABLE";
  return "UNEXPECTED_ERROR";
}
