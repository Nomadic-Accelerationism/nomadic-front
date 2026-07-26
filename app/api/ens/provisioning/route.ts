import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { parseMintAdapterStatus } from "@/lib/passport/provision/parse";
import { isPassportRegistryConfigured } from "@/lib/passport/provisioning-gate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Capability probe for Create Passport.
 * Live source: backend GET /passport/mint-adapter (feature-gated).
 * Never exposes RPC keys, private keys, or stack traces.
 */
export async function GET() {
  const registryConfigured = isPassportRegistryConfigured();

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

    const adapter = parseMintAdapterStatus(body, response.ok);
    const mintAdapterAvailable = adapter.available;

    return NextResponse.json(
      {
        ok: true,
        registryConfigured,
        mintAdapterAvailable,
        canSelfServeCreate: registryConfigured && mintAdapterAvailable,
        message: mintAdapterAvailable
          ? "Passport creation is available."
          : "Passport creation is temporarily unavailable.",
        // Do not echo feature-flag / private-key reasons to the client UI.
        reason: mintAdapterAvailable
          ? null
          : "adapter_unavailable",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const unavailable =
      error instanceof NomadicApiConfigError || true;
    void unavailable;
    return NextResponse.json(
      {
        ok: true,
        registryConfigured,
        mintAdapterAvailable: false,
        canSelfServeCreate: false,
        message: "Passport creation is temporarily unavailable.",
        reason: "adapter_unavailable",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
