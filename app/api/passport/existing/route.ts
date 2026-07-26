import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { sepoliaRpcUrlForServer } from "@/lib/ensv2/passport-credential-read";
import {
  existingPassportFromBackend,
  existingPassportFromRegistryOwner,
} from "@/lib/passport/existing-passport";
import { extractBearerDid } from "@/lib/passport/errors";
import { parsePrivatePassportResponse } from "@/lib/passport/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Resolve whether the authenticated session already has a Nomadic Passport.
 * Prefer backend mapping; fall back to verified registry ownership for the
 * known demo label when applicable.
 */
export async function GET(request: Request) {
  const didToken = extractBearerDid(request);
  if (!didToken) {
    return NextResponse.json(
      { found: false, reason: "Sign in required." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const backendUrl = getNomadicApiUrl("/passport/me");
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${didToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.ok) {
      const parsed = parsePrivatePassportResponse(data);
      if (parsed) {
        const fromBackend = existingPassportFromBackend(parsed.passport);
        if (fromBackend.found) {
          return NextResponse.json(fromBackend, {
            headers: { "Cache-Control": "no-store" },
          });
        }

        const fromRegistry = await existingPassportFromRegistryOwner(
          sepoliaRpcUrlForServer(),
          parsed.passport.publicAddress
        );
        return NextResponse.json(fromRegistry, {
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    return NextResponse.json(
      {
        found: false,
        reason: "Could not resolve an existing Passport for this session.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof NomadicApiConfigError) {
      return NextResponse.json(
        { found: false, reason: "Nomadic session API is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { found: false, reason: "Could not resolve an existing Passport." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
