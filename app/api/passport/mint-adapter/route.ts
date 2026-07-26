import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { parseMintAdapterStatus } from "@/lib/passport/provision/parse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxies GET /passport/mint-adapter.
 * Strips internal reasons (feature flags, missing keys) from the client payload.
 */
export async function GET() {
  try {
    const url = getNomadicApiUrl("/passport/mint-adapter");
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const status = parseMintAdapterStatus(body, response.ok);
    if (status.available) {
      return NextResponse.json(
        {
          available: true,
          profile: status.profile,
          chainId: status.chainId,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        available: false,
        error: "MINT_ADAPTER_UNAVAILABLE",
        code: "MINT_ADAPTER_UNAVAILABLE",
        message: "Passport creation is temporarily unavailable.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    void error;
    if (error instanceof NomadicApiConfigError) {
      // fall through
    }
    return NextResponse.json(
      {
        available: false,
        error: "MINT_ADAPTER_UNAVAILABLE",
        code: "MINT_ADAPTER_UNAVAILABLE",
        message: "Passport creation is temporarily unavailable.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
