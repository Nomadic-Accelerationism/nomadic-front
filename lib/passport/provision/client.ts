import { parseProvisionApiError } from "@/lib/passport/provision/errors";
import {
  parseMintAdapterStatus,
  parseProvisionStatusView,
} from "@/lib/passport/provision/parse";
import type {
  MintAdapterStatus,
  ProvisionStatusView,
  UserTxStep,
} from "@/lib/passport/provision/types";

export class ProvisionClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly reason?: string;

  constructor(
    code: string,
    status: number,
    message: string,
    reason?: string
  ) {
    super(message);
    this.name = "ProvisionClientError";
    this.code = code;
    this.status = status;
    this.reason = reason;
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function throwIfError(res: Response, body: unknown): void {
  if (res.ok) return;
  const parsed = parseProvisionApiError(body);
  throw new ProvisionClientError(
    parsed?.code ?? "internal_error",
    res.status,
    parsed?.message ?? "Something went wrong. Please try again.",
    parsed?.reason
  );
}

export async function fetchMintAdapterStatus(): Promise<MintAdapterStatus> {
  const res = await fetch("/api/passport/mint-adapter", { cache: "no-store" });
  const body = await readJson(res);
  return parseMintAdapterStatus(body, res.ok);
}

export async function startProvision(
  didToken: string,
  input: { label: string; idempotencyKey: string }
): Promise<ProvisionStatusView> {
  const res = await fetch("/api/passport/provision", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${didToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      label: input.label,
      idempotencyKey: input.idempotencyKey,
    }),
    cache: "no-store",
  });
  const body = await readJson(res);
  throwIfError(res, body);
  const provision = parseProvisionStatusView(
    body && typeof body === "object"
      ? (body as { provision?: unknown }).provision
      : null
  );
  if (!provision) {
    throw new ProvisionClientError(
      "internal_error",
      500,
      "Invalid provision response."
    );
  }
  return provision;
}

export async function getProvision(
  didToken: string,
  id: string
): Promise<ProvisionStatusView> {
  const res = await fetch(`/api/passport/provision/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${didToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const body = await readJson(res);
  throwIfError(res, body);
  const provision = parseProvisionStatusView(
    body && typeof body === "object"
      ? (body as { provision?: unknown }).provision
      : null
  );
  if (!provision) {
    throw new ProvisionClientError(
      "internal_error",
      500,
      "Invalid provision response."
    );
  }
  return provision;
}

export async function advancePlatform(
  didToken: string,
  id: string
): Promise<ProvisionStatusView> {
  const res = await fetch(
    `/api/passport/provision/${encodeURIComponent(id)}/platform/advance`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${didToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
      cache: "no-store",
    }
  );
  const body = await readJson(res);
  throwIfError(res, body);
  const provision = parseProvisionStatusView(
    body && typeof body === "object"
      ? (body as { provision?: unknown }).provision
      : null
  );
  if (!provision) {
    throw new ProvisionClientError(
      "internal_error",
      500,
      "Invalid provision response."
    );
  }
  return provision;
}

export async function submitUserTx(
  didToken: string,
  id: string,
  input: { step: UserTxStep; transactionHash: string }
): Promise<ProvisionStatusView> {
  const res = await fetch(
    `/api/passport/provision/${encodeURIComponent(id)}/user-transaction`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${didToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    }
  );
  const body = await readJson(res);
  throwIfError(res, body);
  const provision = parseProvisionStatusView(
    body && typeof body === "object"
      ? (body as { provision?: unknown }).provision
      : null
  );
  if (!provision) {
    throw new ProvisionClientError(
      "internal_error",
      500,
      "Invalid provision response."
    );
  }
  return provision;
}
