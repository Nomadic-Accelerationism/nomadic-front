import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { label: string } };

/**
 * Compat redirect to product availability API.
 * Prefer GET /api/passport/availability?label=
 */
export async function GET(request: Request, context: RouteContext) {
  const raw = context.params?.label ?? "";
  let label = raw;
  try {
    label = decodeURIComponent(raw);
  } catch {
    label = raw;
  }
  const url = new URL(request.url);
  const target = new URL("/api/passport/availability", url.origin);
  target.searchParams.set("label", label);
  return NextResponse.redirect(target, 307);
}
