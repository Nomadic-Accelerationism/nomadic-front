/**
 * User-owned Magic eth_sendTransaction for provisioner plans.
 * Uses the existing Sepolia custom-network singleton only.
 */

import {
  countMagicIframes,
  getSepoliaMagic,
} from "@/lib/magic/sepolia-singleton";
import type { UserTransactionPlan } from "@/lib/passport/provision/types";

export type MagicSendResult =
  | { ok: true; hash: `0x${string}` }
  | { ok: false; code: "REJECTED" | "MISMATCH" | "INVALID_PLAN" | "MAGIC_UNAVAILABLE" | "FAILED"; message: string };

function isTxHash(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

export async function sendUserProvisionTransaction(params: {
  expectedFrom: `0x${string}`;
  plan: UserTransactionPlan;
}): Promise<MagicSendResult> {
  const magic = getSepoliaMagic();
  if (!magic) {
    return {
      ok: false,
      code: "MAGIC_UNAVAILABLE",
      message: "Sign-in is not ready yet.",
    };
  }

  const iframes = countMagicIframes();
  if (iframes > 1) {
    return {
      ok: false,
      code: "FAILED",
      message: "Please refresh the page and try again.",
    };
  }

  const { plan, expectedFrom } = params;
  if (
    !plan.to ||
    !plan.data ||
    !plan.value ||
    !/^0x[a-fA-F0-9]{40}$/.test(plan.to) ||
    !/^0x[a-fA-F0-9]*$/.test(plan.data)
  ) {
    return {
      ok: false,
      code: "INVALID_PLAN",
      message: "Passport creation details are incomplete.",
    };
  }

  let info: { publicAddress?: string | null };
  try {
    info = await magic.user.getInfo();
  } catch {
    return {
      ok: false,
      code: "MAGIC_UNAVAILABLE",
      message: "Sign-in is not ready yet.",
    };
  }

  const from =
    typeof info.publicAddress === "string" ? info.publicAddress : null;
  if (!from || from.toLowerCase() !== expectedFrom.toLowerCase()) {
    return {
      ok: false,
      code: "MISMATCH",
      message: "Signed-in wallet does not match this Passport session.",
    };
  }

  try {
    const provider = magic.rpcProvider as {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
    };

    const hash = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to: plan.to,
          data: plan.data,
          value: plan.value,
        },
      ],
    });

    if (!isTxHash(hash)) {
      return {
        ok: false,
        code: "FAILED",
        message: "We couldn’t verify the transaction yet. Try again shortly.",
      };
    }

    return { ok: true, hash };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "";
    if (
      message.includes("reject") ||
      message.includes("denied") ||
      message.includes("user closed") ||
      message.includes("user denied")
    ) {
      return {
        ok: false,
        code: "REJECTED",
        message: "Confirmation cancelled. You can continue when ready.",
      };
    }
    return {
      ok: false,
      code: "FAILED",
      message: "Confirmation didn’t go through. You can try again.",
    };
  }
}
