import { NextResponse } from "next/server";
import {
  buildWorldVerifyForwardBody,
  proxyWorldVerifyToBackend,
} from "@/lib/world/verify";

function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

/**
 * Client → BFF: { action, idkitResult }
 * BFF → Express: same body + Authorization: Bearer <didToken>
 * Proxies backend status + JSON unchanged. Does not call World portal.
 */
export async function POST(request: Request) {
  const did = extractBearer(request);
  if (!did) {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        category: "UNAUTHORIZED",
        detail: "Authorization required",
      },
      { status: 401 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        category: "INVALID_BODY",
        detail: "Invalid JSON body",
      },
      { status: 400 }
    );
  }

  const record =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;

  if (!record) {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        category: "INVALID_BODY",
        detail: "Body must be a JSON object",
      },
      { status: 400 }
    );
  }

  // Contract field is idkitResult. Reject legacy idkitResponse-only bodies so
  // we never silently forward a missing completion object.
  const idkitResult = record.idkitResult;
  const prepared = buildWorldVerifyForwardBody({
    action: record.action,
    idkitResult,
  });

  if (!prepared.ok) {
    return NextResponse.json(prepared.body, { status: prepared.status });
  }

  const proxied = await proxyWorldVerifyToBackend({
    action: prepared.body.action,
    idkitResult: prepared.body.idkitResult,
    didToken: did,
  });

  return NextResponse.json(proxied.body, { status: proxied.status });
}
