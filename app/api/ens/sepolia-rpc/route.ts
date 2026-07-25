import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_FALLBACK = "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Same-origin Sepolia JSON-RPC proxy for Magic custom network.
 *
 * Server uses ENS_SEPOLIA_RPC_URL (never NEXT_PUBLIC_*).
 * Browser/Magic must call this route — never the keyed dRPC URL.
 *
 * Magic's iframe (auth.magic.link) cross-origin fetches this endpoint, so CORS
 * must allow arbitrary request headers and we always return HTTP 200 with a
 * JSON-RPC body (nodes do the same; non-200 can surface as "Failed to fetch").
 */
function upstreamUrl(): string {
  return process.env.ENS_SEPOLIA_RPC_URL?.trim() || PUBLIC_FALLBACK;
}

function corsHeaders(request?: Request): HeadersInit {
  const requested = request?.headers.get("access-control-request-headers");
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      requested?.trim() ||
      "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
  };
}

function jsonRpc(
  body: unknown,
  request?: Request,
  status = 200,
): NextResponse {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/** Cheap reachability check used by the Stage 5A page before Magic send. */
export async function GET(request: Request) {
  return jsonRpc(
    {
      ok: true,
      chainId: 11155111,
      keyed: Boolean(process.env.ENS_SEPOLIA_RPC_URL?.trim()),
    },
    request,
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonRpc(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      request,
    );
  }

  const target = upstreamUrl();
  const usingKeyed = Boolean(process.env.ENS_SEPOLIA_RPC_URL?.trim());
  const method =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof (body as { method?: unknown }).method === "string"
      ? (body as { method: string }).method
      : Array.isArray(body)
        ? "batch"
        : null;
  const id =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "id" in body
      ? (body as { id: unknown }).id
      : null;

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      console.info("[ens/sepolia-rpc] upstream_non_json", {
        status: upstream.status,
        keyed: usingKeyed,
        method,
      });
      return jsonRpc(
        {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: "Upstream returned non-JSON",
          },
        },
        request,
      );
    }

    // Do not log request body, proofs, or the upstream URL (may contain key).
    console.info("[ens/sepolia-rpc] proxied", {
      status: upstream.status,
      keyed: usingKeyed,
      method,
    });

    // Always HTTP 200 for JSON-RPC payloads so Magic's fetch does not treat
    // upstream 4xx/5xx as a transport failure ("Failed to fetch").
    return jsonRpc(json ?? { jsonrpc: "2.0", id, result: null }, request);
  } catch {
    console.info("[ens/sepolia-rpc] upstream_network_error", {
      keyed: usingKeyed,
      method,
    });
    return jsonRpc(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: "Failed to reach Sepolia RPC upstream",
        },
      },
      request,
    );
  }
}
