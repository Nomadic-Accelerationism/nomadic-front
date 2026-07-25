import { NextResponse } from "next/server";
import { buildWorldSpikeRequest } from "@/lib/spikes/world/request";
import {
  isWorldSpikeAction,
  type WorldSpikePreset,
  type WorldSpikeRequestBody,
} from "@/lib/spikes/world/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requireBearer(request: Request): string | NextResponse {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || auth.length < 16) {
    return NextResponse.json(
      {
        ok: false,
        execution: "blocked",
        code: "UNAUTHORIZED",
        detail: "Bearer token required for World spike request.",
      },
      { status: 401 },
    );
  }
  return auth.slice("Bearer ".length);
}

export async function POST(request: Request) {
  const tokenOrError = requireBearer(request);
  if (tokenOrError instanceof NextResponse) return tokenOrError;

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
      },
      { status: 400 },
    );
  }

  const body = json as Partial<WorldSpikeRequestBody>;
  const preset = body.preset as WorldSpikePreset | undefined;

  if (!body.action || !isWorldSpikeAction(body.action)) {
    return NextResponse.json(
      {
        ok: false,
        execution: "blocked",
        code: "ACTION_NOT_ALLOWLISTED",
        detail: "action must be an allowlisted spike_* value.",
      },
      { status: 400 },
    );
  }

  if (preset !== "identityCheck" && preset !== "selfieCheckLegacy") {
    return NextResponse.json(
      {
        ok: false,
        execution: "blocked",
        code: "INVALID_BODY",
        detail: 'preset must be "identityCheck" or "selfieCheckLegacy".',
      },
      { status: 400 },
    );
  }

  const result = buildWorldSpikeRequest({
    action: body.action,
    preset,
    signal: typeof body.signal === "string" ? body.signal : undefined,
    attributes: Array.isArray(body.attributes) ? body.attributes : undefined,
  });

  const status = result.ok ? 200 : result.code === "MISSING_CREDENTIALS" || result.code === "SPIKE_DISABLED" ? 503 : 400;

  return NextResponse.json(result, { status });
}
