/**
 * Working Magic singleton for Sepolia ENSv2 Stage ops.
 *
 * One custom-network instance:
 *   rpcUrl = {origin}/api/ens/sepolia-rpc
 *   chainId = 11155111
 *
 * Never use Magic built-in `network: "sepolia"` (changes the address set).
 * Never put ENS_SEPOLIA_RPC_URL / dRPC keys in NEXT_PUBLIC_* or the browser.
 * Preserves the mainnet-mapped Magic address used for Passport ownership.
 *
 * Do not create a second Magic instance alongside this module in the same page.
 */

"use client";

import { Magic } from "magic-sdk";

const SEPOLIA_CHAIN_ID = 11155111;

/** Public read-only fallback — no API key. */
export const PUBLIC_SEPOLIA_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";

let magicSingleton: Magic | null | undefined;

/**
 * Same-origin JSON-RPC proxy used by Magic eth_sendTransaction / eth_call.
 * Absolute URL required so Magic's provider can resolve it.
 */
export function getMagicSepoliaRpcUrl(): string {
  if (typeof window === "undefined") {
    // SSR placeholder — Magic is client-only.
    return "/api/ens/sepolia-rpc";
  }
  return `${window.location.origin}/api/ens/sepolia-rpc`;
}

/** Browser reads that do not need the keyed dRPC endpoint. */
export function getPublicSepoliaRpcUrl(): string {
  return PUBLIC_SEPOLIA_RPC_URL;
}

/** @deprecated use getMagicSepoliaRpcUrl / getPublicSepoliaRpcUrl */
export function getSepoliaRpcUrl(): string {
  return getMagicSepoliaRpcUrl();
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
      rpcUrl: getMagicSepoliaRpcUrl(),
      chainId: SEPOLIA_CHAIN_ID,
    },
  });
  return magicSingleton;
}
