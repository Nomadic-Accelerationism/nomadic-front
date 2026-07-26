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
