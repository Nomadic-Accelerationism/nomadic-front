/**
 * Working Magic singleton for Sepolia ENSv2 Stage ops.
 *
 * Magic iframe (auth.magic.link) must call a CORS-friendly public Sepolia RPC
 * directly — Vercel same-origin proxy probes work from the page, but Magic's
 * provider often fails with [-32603] Failed to fetch before any proxy request
 * is observed.
 *
 *   Magic rpcUrl  = https://ethereum-sepolia-rpc.publicnode.com  (no API key)
 *   chainId       = 11155111
 *   Page probes   = {origin}/api/ens/sepolia-rpc  (keyed dRPC server-side)
 *
 * Never use Magic built-in `network: "sepolia"` (changes the address set).
 * Never put ENS_SEPOLIA_RPC_URL / dRPC keys in NEXT_PUBLIC_* or the browser.
 * Preserves the mainnet-mapped Magic address used for Passport ownership.
 *
 * Do not create a second Magic instance alongside this module in the same page.
 * Hard-refresh if a stale .magic-iframe from another network config exists.
 */

"use client";

import { Magic } from "magic-sdk";

const SEPOLIA_CHAIN_ID = 11155111;

/** Public Sepolia RPC — no API key; CORS-friendly for Magic's iframe. */
export const PUBLIC_SEPOLIA_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";

let magicSingleton: Magic | null | undefined;

/**
 * RPC URL baked into the Magic custom network (iframe).
 * Must be absolute and reachable cross-origin from auth.magic.link.
 */
export function getMagicSepoliaRpcUrl(): string {
  return PUBLIC_SEPOLIA_RPC_URL;
}

/**
 * Same-origin keyed proxy for page-side probes / receipt polling.
 * Server uses ENS_SEPOLIA_RPC_URL; browser never sees the key.
 */
export function getEnsSepoliaProxyUrl(): string {
  if (typeof window === "undefined") {
    return "/api/ens/sepolia-rpc";
  }
  return `${window.location.origin}/api/ens/sepolia-rpc`;
}

/** Browser reads that do not need the keyed dRPC endpoint. */
export function getPublicSepoliaRpcUrl(): string {
  return PUBLIC_SEPOLIA_RPC_URL;
}

/** @deprecated use getMagicSepoliaRpcUrl / getEnsSepoliaProxyUrl */
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
    // Stale iframe from a prior Magic(network) config will break RPC.
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
