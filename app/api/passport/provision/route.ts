import { proxyPassportProvision } from "@/lib/passport/provision/bff-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Never forward client-supplied wallet/owner fields.
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const safeBody = {
    label: record.label,
    idempotencyKey: record.idempotencyKey,
  };

  return proxyPassportProvision(request, "/passport/provision", {
    method: "POST",
    body: safeBody,
  });
}
