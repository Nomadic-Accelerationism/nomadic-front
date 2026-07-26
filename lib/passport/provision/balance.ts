/**
 * Pre-flight Sepolia ETH balance check before Magic-owned txs.
 * Uses the public read RPC — never exposes keyed RPC URLs.
 */

import { getPublicSepoliaRpcUrl } from "@/lib/magic/sepolia-singleton";

/** Conservative floor for two user txs (parent + records) on Sepolia. */
export const MIN_USER_PROVISION_WEI = BigInt("3000000000000000"); // 0.003 ETH

export type BalanceCheck =
  | { ok: true; balanceWei: bigint }
  | { ok: false; balanceWei: bigint; message: string };

export async function checkProvisionWalletBalance(
  address: `0x${string}`
): Promise<BalanceCheck> {
  try {
    const res = await fetch(getPublicSepoliaRpcUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
      cache: "no-store",
    });
    const body = (await res.json()) as { result?: string };
    if (typeof body.result !== "string" || !body.result.startsWith("0x")) {
      return {
        ok: false,
        balanceWei: BigInt(0),
        message:
          "Your test wallet needs a small amount of Sepolia ETH to create the Passport.",
      };
    }
    const balanceWei = BigInt(body.result);
    if (balanceWei < MIN_USER_PROVISION_WEI) {
      return {
        ok: false,
        balanceWei,
        message:
          "Your test wallet needs a small amount of Sepolia ETH to create the Passport.",
      };
    }
    return { ok: true, balanceWei };
  } catch {
    return {
      ok: false,
      balanceWei: BigInt(0),
      message:
        "Your test wallet needs a small amount of Sepolia ETH to create the Passport.",
    };
  }
}

export function formatWeiEth(wei: bigint, digits = 4): string {
  const base = BigInt("1000000000000000000");
  const whole = wei / base;
  const frac = wei % base;
  const fracStr = frac.toString().padStart(18, "0").slice(0, digits);
  return `${whole.toString()}.${fracStr}`;
}
