import { NextResponse } from "next/server";
import { buildWorldRequest } from "@/lib/world/request";
import type { WorldRequestBody } from "@/lib/world/types";

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
      { ok: false, code: "UNAUTHORIZED", detail: "Authorization required" },
      { status: 401 }
    );
  }

  let body: WorldRequestBody;
  try {
    body = (await request.json()) as WorldRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_BODY", detail: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const result = buildWorldRequest(body);
  if (!result.ok) {
    const status =
      result.code === "MISSING_CREDENTIALS" || result.code === "WORLD_DISABLED"
        ? 503
        : result.code === "ACTION_NOT_ALLOWLISTED" ||
            result.code === "INVALID_BODY"
          ? 400
          : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
