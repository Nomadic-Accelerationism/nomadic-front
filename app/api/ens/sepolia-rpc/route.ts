import { NextResponse } from "next/server";
import { parseTransaction } from "viem";

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

function methodOf(body: unknown): string | null {
  if (Array.isArray(body)) return "batch";
  if (
    body &&
    typeof body === "object" &&
    typeof (body as { method?: unknown }).method === "string"
  ) {
    return (body as { method: string }).method;
  }
  return null;
}

function idOf(body: unknown): unknown {
  if (body && typeof body === "object" && !Array.isArray(body) && "id" in body) {
    return (body as { id: unknown }).id;
  }
  return null;
}

/** Safe summary only — never log raw tx bytes / secrets. */
function summarizeSendRaw(body: unknown): Record<string, unknown> {
  try {
    const params =
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      Array.isArray((body as { params?: unknown }).params)
        ? (body as { params: unknown[] }).params
        : null;
    const raw = params?.[0];
    if (typeof raw !== "string" || !raw.startsWith("0x")) {
      return { rawKind: typeof raw };
    }
    const tx = parseTransaction(raw as `0x${string}`);
    return {
      chainId: tx.chainId ?? null,
      nonce: tx.nonce ?? null,
      to: tx.to ?? null,
      type: tx.type ?? null,
      hasData: Boolean(tx.data && tx.data !== "0x"),
      gas: tx.gas?.toString() ?? null,
    };
  } catch (err) {
    return {
      parseError: err instanceof Error ? err.message : "parse_failed",
    };
  }
}

function logProxyResult(
  method: string | null,
  body: unknown,
  json: unknown,
  meta: { status: number; keyed: boolean },
) {
  const errMsg =
    json &&
    typeof json === "object" &&
    !Array.isArray(json) &&
    (json as { error?: { message?: unknown } }).error &&
    typeof (json as { error: { message?: unknown } }).error.message === "string"
      ? (json as { error: { message: string } }).error.message
      : null;
  const hasResult =
    json &&
    typeof json === "object" &&
    !Array.isArray(json) &&
    "result" in json &&
    (json as { result: unknown }).result != null;

  if (method === "eth_sendRawTransaction") {
    console.info("[ens/sepolia-rpc] sendRawTransaction", {
      ...meta,
      ...summarizeSendRaw(body),
      ok: hasResult && !errMsg,
      error: errMsg,
      resultPrefix:
        hasResult &&
        typeof (json as { result: unknown }).result === "string"
          ? String((json as { result: string }).result).slice(0, 12)
          : null,
    });
    return;
  }

  console.info("[ens/sepolia-rpc] proxied", {
    ...meta,
    method,
    error: errMsg,
  });
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
  const usingKeyed = Boolean(process.env.ENS_SEPOLIA_RPC_URL?.trim());
  const target = upstreamUrl();

  // Magic occasionally POSTs empty or text/plain JSON; never 4xx those.
  const rawText = await request.text();
  if (!rawText.trim()) {
    console.info("[ens/sepolia-rpc] empty_body", { keyed: usingKeyed });
    return jsonRpc(
      { jsonrpc: "2.0", id: null, result: null },
      request,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawText);
  } catch {
    console.info("[ens/sepolia-rpc] parse_error", {
      keyed: usingKeyed,
      len: rawText.length,
      prefix: rawText.slice(0, 32),
    });
    return jsonRpc(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      request,
    );
  }

  const method = methodOf(body);
  const id = idOf(body);

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

    logProxyResult(method, body, json, {
      status: upstream.status,
      keyed: usingKeyed,
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
