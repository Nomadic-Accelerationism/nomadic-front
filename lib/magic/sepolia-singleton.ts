/**
 * Working Magic singleton for Sepolia ENSv2 Stage ops.
 *
 * One custom-network instance:
 *   rpcUrl  = {origin}/api/ens/sepolia-rpc   ← Magic iframe
 *   upstream = ENS_SEPOLIA_RPC_URL (dRPC)    ← server-only
 *   chainId = 11155111
 *
 * Never use Magic built-in `network: "sepolia"` (changes the address set).
 * Never put ENS_SEPOLIA_RPC_URL / dRPC keys in NEXT_PUBLIC_* or the browser.
 * Preserves the mainnet-mapped Magic address used for Passport ownership.
 *
 * Magic Dashboard: Allowed Origins is not enough — also add this production
 * origin / custom RPC path to Magic CSP `connect-src`, or eth_sendTransaction
 * fails with [-32603] Failed to fetch while page fetch to the proxy works.
 *
 * Do not create a second Magic instance alongside this module in the same page.
 * Hard-refresh if a stale .magic-iframe from another rpcUrl exists.
 */

"use client";

import { Magic } from "magic-sdk";

const SEPOLIA_CHAIN_ID = 11155111;

/** Public Sepolia RPC — no API key (page reads / fallback only). */
export const PUBLIC_SEPOLIA_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";

let magicSingleton: Magic | null | undefined;

/**
 * Same-origin JSON-RPC proxy used by Magic eth_sendTransaction.
 * Absolute URL required so Magic's provider can resolve it.
 * Server forwards to ENS_SEPOLIA_RPC_URL (dRPC) — key never reaches the browser.
 */
export function getMagicSepoliaRpcUrl(): string {
  if (typeof window === "undefined") {
    return "/api/ens/sepolia-rpc";
  }
  return `${window.location.origin}/api/ens/sepolia-rpc`;
}

/** Alias for page-side proxy probes (same URL as Magic). */
export function getEnsSepoliaProxyUrl(): string {
  return getMagicSepoliaRpcUrl();
}

/** Browser reads that do not need the keyed dRPC endpoint. */
export function getPublicSepoliaRpcUrl(): string {
  return PUBLIC_SEPOLIA_RPC_URL;
}

/** @deprecated use getMagicSepoliaRpcUrl */
export function getSepoliaRpcUrl(): string {
  return getMagicSepoliaRpcUrl();
}

export function countMagicIframes(): number {
  if (typeof document === "undefined") return 0;
  return document.querySelectorAll("iframe.magic-iframe").length;
}

export function getSepoliaMagic(): Magic | null {
  if (typeof window === "undefined") return null;
  if (magicSingleton !== undefined) return magicSingleton;

  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY?.trim();
  if (!key) {
    magicSingleton = null;
    return null;
  }

  const iframes = countMagicIframes();
  if (iframes > 0) {
    console.warn(
      `[magic] ${iframes} existing magic-iframe(s) — hard-refresh if RPC fails`,
    );
  }

  magicSingleton = new Magic(key, {
    network: {
      rpcUrl: getMagicSepoliaRpcUrl(),
      chainId: SEPOLIA_CHAIN_ID,
    },
  });
  return magicSingleton;
}
