/**
 * Sanitized auth error codes returned by `/api/auth/validate-otp`.
 * Safe for the browser — never includes DID tokens or stack traces.
 */

export type ValidateOtpErrorCode =
  | "MISSING_DID"
  | "MISSING_API_CONFIG"
  | "BACKEND_UNAVAILABLE"
  | "INVALID_SESSION"
  | "UNEXPECTED_ERROR";

export type ValidateOtpErrorBody = {
  error: string;
  code: ValidateOtpErrorCode;
  requestId?: string;
};

export const VALIDATE_OTP_TIMEOUT_MS = 15_000;

export function sanitizeValidateOtpError(
  code: ValidateOtpErrorCode,
  options?: { requestId?: string; message?: string }
): ValidateOtpErrorBody {
  const defaults: Record<ValidateOtpErrorCode, string> = {
    MISSING_DID: "Authorization token required",
    MISSING_API_CONFIG: "Nomadic authentication is temporarily unavailable.",
    BACKEND_UNAVAILABLE:
      "Your email was verified, but Nomadic could not start your Passport session. Please try again.",
    INVALID_SESSION: "Your verification session expired. Please sign in again.",
    UNEXPECTED_ERROR: "Something went wrong. Please try again.",
  };

  return {
    error: options?.message ?? defaults[code],
    code,
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };
}
