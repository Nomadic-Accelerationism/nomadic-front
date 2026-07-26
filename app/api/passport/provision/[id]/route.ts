import { proxyPassportProvision } from "@/lib/passport/provision/bff-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(request: Request, { params }: Ctx) {
  const id = encodeURIComponent(params.id);
  return proxyPassportProvision(request, `/passport/provision/${id}`);
}
