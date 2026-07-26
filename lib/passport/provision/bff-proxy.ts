import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { extractBearerDid } from "@/lib/passport/errors";

const TIMEOUT_MS = 45_000;

export async function proxyPassportProvision(
  request: Request,
  backendPath: string,
  init?: {
    method?: string;
    body?: unknown;
    requireAuth?: boolean;
  }
): Promise<NextResponse> {
  const requireAuth = init?.requireAuth !== false;
  const didToken = extractBearerDid(request);

  if (requireAuth && !didToken) {
    return NextResponse.json(
      {
        error: "MISSING_SESSION",
        code: "MISSING_SESSION",
        message: "Sign in to continue.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let backendUrl: string;
  try {
    backendUrl = getNomadicApiUrl(backendPath);
  } catch (error) {
    if (error instanceof NomadicApiConfigError) {
      return NextResponse.json(
        {
          error: "MINT_ADAPTER_UNAVAILABLE",
          code: "MINT_ADAPTER_UNAVAILABLE",
          message: "Passport creation is temporarily unavailable.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      {
        error: "internal_error",
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (didToken) headers.Authorization = `Bearer ${didToken}`;
    if (init?.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(backendUrl, {
      method: init?.method ?? "GET",
      headers,
      body:
        init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    // Never forward internal adapter readiness reasons to the browser.
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const row = { ...(data as Record<string, unknown>) };
      delete row.reason;
      const code =
        typeof row.code === "string"
          ? row.code
          : typeof row.error === "string"
            ? row.error
            : "";
      const message =
        typeof row.message === "string" ? row.message.trim() : "";
      const internal =
        /^(FEATURE_DISABLED|MISSING_PLATFORM_KEY|PLATFORM_SIGNER_MISMATCH|MISSING_SEPOLIA_RPC|ARTIFACTS_NOT_LOADED)$/i;
      if (
        code === "MINT_ADAPTER_UNAVAILABLE" ||
        internal.test(code) ||
        internal.test(message)
      ) {
        row.error = "MINT_ADAPTER_UNAVAILABLE";
        row.code = "MINT_ADAPTER_UNAVAILABLE";
        row.message = "Passport creation is temporarily unavailable.";
      }
      data = row;
    }

    return NextResponse.json(data ?? { error: "empty_response" }, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error: "RPC_UNAVAILABLE",
        code: "RPC_UNAVAILABLE",
        message: "We couldn’t reach Passport creation. Try again shortly.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    clearTimeout(timeout);
  }
}
