import { NextResponse } from "next/server";
import { verifyWorldSpikeResult } from "@/lib/spikes/world/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requireBearer(request: Request): true | NextResponse {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || auth.length < 16) {
    return NextResponse.json(
      {
        ok: false,
        execution: "blocked",
        code: "UNAUTHORIZED",
        detail: "Bearer token required for World spike verify.",
        persisted: false,
      },
      { status: 401 },
    );
  }
  return true;
}

/**
 * POST /api/spikes/world/verify
 * Forwards idkitResponse unchanged to World /v4/verify/{rp_id}.
 * Never persists proofs or creates credentials.
 */
export async function POST(request: Request) {
  const auth = requireBearer(request);
  if (auth instanceof NextResponse) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        execution: "blocked",
        code: "INVALID_BODY",
        detail: "JSON body required.",
        persisted: false,
      },
      { status: 400 },
    );
  }

  const body = json as { action?: string; idkitResponse?: unknown };
  const result = await verifyWorldSpikeResult({
    action: typeof body.action === "string" ? body.action : undefined,
    idkitResponse: body.idkitResponse,
  });

  const status = result.ok
    ? 200
    : result.code === "MISSING_CREDENTIALS" || result.code === "SPIKE_DISABLED"
      ? 503
      : result.code === "VERIFICATION_FAILED" || result.code === "VERIFY_UPSTREAM_ERROR"
        ? 400
        : 400;

  return NextResponse.json(result, { status });
}
