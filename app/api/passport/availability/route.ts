import { NextResponse } from "next/server";
import { checkPassportHandleAvailability } from "@/lib/ensv2/passport-availability";
import { sepoliaRpcUrlForServer } from "@/lib/ensv2/passport-credential-read";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Simple per-IP throttle for availability probes (in-memory, best-effort). */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 60;

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous"
  );
}

function throttled(request: Request): boolean {
  const key = clientKey(request);
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  row.count += 1;
  return row.count > MAX_HITS;
}

/**
 * Live Passport name availability (product API).
 * Never returns RPC URLs, stack traces, or secrets.
 */
export async function GET(request: Request) {
  if (throttled(request)) {
    return NextResponse.json(
      {
        status: "unavailable" as const,
        reason: "Too many availability checks. Please wait a moment.",
      },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  const url = new URL(request.url);
  const label = url.searchParams.get("label") ?? "";

  const result = await checkPassportHandleAvailability(
    sepoliaRpcUrlForServer(),
    label
  );

  const status =
    result.status === "invalid"
      ? 400
      : result.status === "unavailable"
        ? 503
        : 200;

  // Strip owner address from public product response — keep taken/available only.
  if (result.status === "taken") {
    return NextResponse.json(
      {
        status: "taken" as const,
        name: result.name,
        label: result.label,
      },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
