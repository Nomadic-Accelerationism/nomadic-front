/**
 * Working Magic singleton for Sepolia ENSv2 Stage ops.
 *
 * One custom-network instance → Sepolia RPC → chainId 11155111.
 * Preserves the mainnet-mapped Magic address used for Passport ownership.
 *
 * Do not create a second Magic instance alongside this module in the same page.
 */

"use client";

import { Magic } from "magic-sdk";

const SEPOLIA_CHAIN_ID = 11155111;

let magicSingleton: Magic | null | undefined;

export function getSepoliaRpcUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_ENS_SEPOLIA_RPC_URL?.trim() ||
    "https://sepolia.drpc.org"
  );
}

export function getSepoliaMagic(): Magic | null {
  if (typeof window === "undefined") return null;
  if (magicSingleton !== undefined) return magicSingleton;

  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY?.trim();
  if (!key) {
    magicSingleton = null;
    return null;
  }

  magicSingleton = new Magic(key, {
    network: {
      rpcUrl: getSepoliaRpcUrl(),
      chainId: SEPOLIA_CHAIN_ID,
    },
  });
  return magicSingleton;
}
