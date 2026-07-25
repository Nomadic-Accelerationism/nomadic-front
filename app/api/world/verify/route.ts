import { NextResponse } from "next/server";
import { verifyWorldResult } from "@/lib/world/verify";

function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function POST(request: Request) {
  const did = extractBearer(request);
  if (!did) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        detail: "Authorization required",
        persisted: false,
      },
      { status: 401 }
    );
  }

  let body: { action?: string; idkitResponse?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_BODY",
        detail: "Invalid JSON body",
        persisted: false,
      },
      { status: 400 }
    );
  }

  const result = await verifyWorldResult({
    action: body.action,
    idkitResponse: body.idkitResponse,
    didToken: did,
  });

  if (!result.ok) {
    const status =
      result.code === "UNAUTHORIZED"
        ? 401
        : result.code === "MISSING_CREDENTIALS" ||
            result.code === "WORLD_DISABLED"
          ? 503
          : result.code === "INVALID_BODY"
            ? 400
            : result.code === "VERIFICATION_FAILED"
              ? 422
              : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
