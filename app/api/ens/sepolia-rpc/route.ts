import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_FALLBACK = "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Same-origin Sepolia JSON-RPC proxy for Magic custom network.
 *
 * Server uses ENS_SEPOLIA_RPC_URL (never NEXT_PUBLIC_*).
 * Browser/Magic must call this route — never the keyed dRPC URL.
 */
function upstreamUrl(): string {
  return process.env.ENS_SEPOLIA_RPC_URL?.trim() || PUBLIC_FALLBACK;
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400, headers: corsHeaders() },
    );
  }

  const target = upstreamUrl();
  const usingKeyed = Boolean(process.env.ENS_SEPOLIA_RPC_URL?.trim());

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
      });
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Upstream returned non-JSON",
          },
        },
        { status: 502, headers: corsHeaders() },
      );
    }

    // Do not log request body, proofs, or the upstream URL (may contain key).
    console.info("[ens/sepolia-rpc] proxied", {
      status: upstream.status,
      keyed: usingKeyed,
      method:
        body &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        typeof (body as { method?: unknown }).method === "string"
          ? (body as { method: string }).method
          : Array.isArray(body)
            ? "batch"
            : null,
    });

    return NextResponse.json(json, {
      status: upstream.ok ? 200 : upstream.status,
      headers: corsHeaders(),
    });
  } catch {
    console.info("[ens/sepolia-rpc] upstream_network_error", {
      keyed: usingKeyed,
    });
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Failed to reach Sepolia RPC upstream",
        },
      },
      { status: 502, headers: corsHeaders() },
    );
  }
}
