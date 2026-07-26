import { NextResponse } from "next/server";
import {
  getNomadicApiUrl,
  NomadicApiConfigError,
} from "@/lib/config/nomadic-api";
import { checkPassportHandleAvailability } from "@/lib/ensv2/passport-availability";
import { sepoliaRpcUrlForServer } from "@/lib/ensv2/passport-credential-read";
import {
  existingPassportFromBackend,
  existingPassportFromRegistryOwner,
} from "@/lib/passport/existing-passport";
import { extractBearerDid } from "@/lib/passport/errors";
import { validatePassportHandle } from "@/lib/passport/handle";
import {
  evaluateProvisioningGate,
  isPassportMintAdapterAvailable,
  isPassportRegistryConfigured,
} from "@/lib/passport/provisioning-gate";
import { parsePrivatePassportResponse } from "@/lib/passport/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Self-service Passport create endpoint.
 * Always rechecks live registry + one-Passport-per-wallet before any future mint.
 * Currently refuses — no platform private key / mint adapter in this repo.
 * Never returns fake success.
 */
export async function POST(request: Request) {
  const didToken = extractBearerDid(request);
  if (!didToken) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING_SESSION",
        message: "Sign in to create your Passport.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: { label?: unknown } = {};
  try {
    body = (await request.json()) as { label?: unknown };
  } catch {
    body = {};
  }

  const rawLabel = typeof body.label === "string" ? body.label : "";
  const validated = validatePassportHandle(rawLabel);
  if (!validated.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "HANDLE_INVALID",
        message: validated.message,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // One Passport per wallet — recheck before any mint path opens.
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
    if (response.ok) {
      const data = await response.json().catch(() => null);
      const parsed = parsePrivatePassportResponse(data);
      if (parsed) {
        const fromBackend = existingPassportFromBackend(parsed.passport);
        if (fromBackend.found) {
          return NextResponse.json(
            {
              ok: false,
              code: "PASSPORT_ALREADY_EXISTS",
              message: "You already have a Nomadic Passport.",
              name: fromBackend.passportName,
            },
            { status: 409, headers: { "Cache-Control": "no-store" } }
          );
        }
        const fromRegistry = await existingPassportFromRegistryOwner(
          sepoliaRpcUrlForServer(),
          parsed.passport.publicAddress
        );
        if (fromRegistry.found) {
          return NextResponse.json(
            {
              ok: false,
              code: "PASSPORT_ALREADY_EXISTS",
              message: "You already have a Nomadic Passport.",
              name: fromRegistry.passportName,
            },
            { status: 409, headers: { "Cache-Control": "no-store" } }
          );
        }
      }
    }
  } catch (error) {
    if (!(error instanceof NomadicApiConfigError)) {
      // Soft-fail into availability/gate — mint still closed.
    }
  }

  // Creation-time recheck — never trust a stale green UI state.
  const availability = await checkPassportHandleAvailability(
    sepoliaRpcUrlForServer(),
    validated.label
  );

  const gate = evaluateProvisioningGate({
    isAuthenticated: true,
    ensStatus: "NOT_ISSUED",
    identityStatus: "READY",
    handleValid: true,
    availabilityStatus: availability.status,
    registryConfigured: isPassportRegistryConfigured(),
    mintAdapterAvailable: isPassportMintAdapterAvailable(),
  });

  if (!gate.canCreate) {
    return NextResponse.json(
      {
        ok: false,
        code: "PROVISIONING_UNAVAILABLE",
        reasons: gate.reasons,
        message: gate.message,
        name: validated.passportName,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      code: "PROVISIONING_UNAVAILABLE",
      message: "Passport creation is not available yet.",
      name: validated.passportName,
    },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}
