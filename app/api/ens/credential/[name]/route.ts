import { NextResponse } from "next/server";
import {
  readLisbonCredentialStamp,
  sepoliaRpcUrlForServer,
} from "@/lib/ensv2/passport-credential-read";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { name: string } };

/**
 * Read-only ENS credential text proxy for Passport stamps.
 * Never executes transactions.
 */
export async function GET(_request: Request, context: RouteContext) {
  const raw = context.params?.name ?? "";
  let name = raw;
  try {
    name = decodeURIComponent(raw);
  } catch {
    name = raw;
  }

  const stamp = await readLisbonCredentialStamp(sepoliaRpcUrlForServer(), name);
  if (!stamp.ok) {
    const status =
      stamp.code === "INVALID_NAME"
        ? 400
        : stamp.code === "RESOLVER_UNAVAILABLE"
          ? 503
          : 404;
    return NextResponse.json(
      {
        ok: false as const,
        code: stamp.code,
        message: stamp.message,
        credentialName: stamp.credentialName,
      },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: true as const,
      credentialName: stamp.credentialName,
      title: stamp.title,
      eligibilityLabel: stamp.eligibilityLabel,
      activityLabel: stamp.activityLabel,
      issuedBy: stamp.issuedBy,
      verifiedOnEns: stamp.verifiedOnEns,
      texts: stamp.texts,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
