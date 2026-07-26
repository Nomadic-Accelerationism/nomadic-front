import { NextResponse } from "next/server";
import {
  buildPublicPassportFromEns,
  sanitizePublicPassportPayload,
  sepoliaRpcUrlForServer,
} from "@/lib/ensv2/passport-credential-read";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { identifier: string } };

/**
 * Public Passport — no auth.
 * Returns only display name, primary wallet, and published ENS stamps.
 */
export async function GET(_request: Request, context: RouteContext) {
  const raw = context.params?.identifier ?? "";
  let identifier = raw;
  try {
    identifier = decodeURIComponent(raw);
  } catch {
    identifier = raw;
  }

  const result = await buildPublicPassportFromEns(
    sepoliaRpcUrlForServer(),
    identifier
  );

  if (!result.ok) {
    const status =
      result.code === "INVALID_IDENTIFIER"
        ? 400
        : result.code === "PASSPORT_UNAVAILABLE"
          ? 404
          : 503;
    return NextResponse.json(
      { ok: false as const, code: result.code, message: result.message },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const sanitized = sanitizePublicPassportPayload(result.passport);
  if (!sanitized) {
    return NextResponse.json(
      {
        ok: false as const,
        code: "PASSPORT_UNAVAILABLE",
        message: "Public Passport could not be sanitized.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true as const, passport: sanitized },
    { headers: { "Cache-Control": "no-store" } }
  );
}
