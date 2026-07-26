import { proxyPassportProvision } from "@/lib/passport/provision/bff-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(request: Request, { params }: Ctx) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const safeBody = {
    step: record.step,
    transactionHash: record.transactionHash,
  };

  const id = encodeURIComponent(params.id);
  return proxyPassportProvision(
    request,
    `/passport/provision/${id}/user-transaction`,
    { method: "POST", body: safeBody }
  );
}
