import { NextResponse } from "next/server";
import { resolvePassportDisplay } from "@/lib/spikes/ens/resolve";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/spikes/ens/resolve?q=<name-or-address>
 * Read-only ENS resolution spike. No minting, no registry writes.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json(
      { ok: false, detail: "Query param q is required." },
      { status: 400 },
    );
  }

  try {
    const result = await resolvePassportDisplay(q);
    return NextResponse.json({
      ok: true,
      spike: true,
      productionPassportDependency: false,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        detail: error instanceof Error ? error.message : "ENS resolve failed",
        spike: true,
      },
      { status: 502 },
    );
  }
}
