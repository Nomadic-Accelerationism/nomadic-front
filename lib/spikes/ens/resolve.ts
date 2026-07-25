/**
 * ENS spike — forward / reverse / avatar / display helpers.
 * Never depends on experimental ENSv2 registry writes.
 */

import { getAddress, isAddress } from "viem";
import { normalize } from "viem/ens";
import {
  getAddressRecord,
  getName,
  getTextRecord,
} from "@ensdomains/ensjs/public";
import { createEnsSpikeClient, type EnsSpikePublicClient } from "./client";
import type {
  EnsSpikeDisplayResult,
  EnsSpikeForwardResult,
  EnsSpikeResolveKind,
  EnsSpikeReverseResult,
} from "./types";

/** ENS docs: treat any dot-separated string as a potential name (DNS + .eth). */
export function classifyEnsInput(input: string): EnsSpikeResolveKind {
  const trimmed = input.trim();
  if (!trimmed) return "empty";
  if (isAddress(trimmed)) return "eth_address";
  if (trimmed.includes(".") && trimmed.length > 2) return "ens_name";
  return "malformed";
}

export async function resolveForward(
  input: string,
  client: EnsSpikePublicClient = createEnsSpikeClient(),
): Promise<EnsSpikeForwardResult> {
  const kind = classifyEnsInput(input);
  if (kind === "empty" || kind === "malformed") {
    return { input, kind, address: null, error: `Input classified as ${kind}` };
  }
  if (kind === "eth_address") {
    return {
      input,
      kind,
      address: getAddress(input.trim()) as `0x${string}`,
    };
  }

  try {
    const normalizedName = normalize(input.trim());
    const record = await getAddressRecord(client, { name: normalizedName });
    return {
      input,
      kind,
      normalizedName,
      address: (record?.value as `0x${string}` | undefined) ?? null,
    };
  } catch (error) {
    return {
      input,
      kind,
      address: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function resolveReverseVerified(
  address: `0x${string}`,
  client: EnsSpikePublicClient = createEnsSpikeClient(),
): Promise<EnsSpikeReverseResult> {
  try {
    const checksum = getAddress(address) as `0x${string}`;
    const primary = await getName(client, { address: checksum });
    const primaryName = primary?.name ?? null;
    if (!primaryName) {
      return {
        address: checksum,
        primaryName: null,
        bidirectionalMatch: false,
      };
    }

    // Prefer library match flag when present; still re-check forward.
    const forward = await resolveForward(primaryName, client);
    const bidirectionalMatch =
      Boolean(primary?.match) &&
      Boolean(forward.address) &&
      getAddress(forward.address!) === checksum;

    return {
      address: checksum,
      primaryName,
      bidirectionalMatch,
    };
  } catch (error) {
    return {
      address: getAddress(address) as `0x${string}`,
      primaryName: null,
      bidirectionalMatch: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function resolveAvatar(
  name: string,
  client: EnsSpikePublicClient = createEnsSpikeClient(),
): Promise<string | null> {
  try {
    const value = await getTextRecord(client, {
      name: normalize(name),
      key: "avatar",
    });
    return value ?? null;
  } catch {
    return null;
  }
}

/**
 * Display helper for Passport spike:
 * - ENS name → wallet (fallback null → caller shows unresolved)
 * - wallet → verified primary name + avatar when bidirectional
 */
export async function resolvePassportDisplay(
  input: string,
  client: EnsSpikePublicClient = createEnsSpikeClient(),
): Promise<EnsSpikeDisplayResult> {
  const errors: string[] = [];
  const kind = classifyEnsInput(input);

  if (kind === "empty" || kind === "malformed") {
    return {
      input,
      kind,
      walletAddress: null,
      ensName: null,
      avatar: null,
      bidirectionalMatch: false,
      fallbackToWallet: false,
      errors: [`Input classified as ${kind}`],
    };
  }

  if (kind === "eth_address") {
    const walletAddress = getAddress(input.trim()) as `0x${string}`;
    const reverse = await resolveReverseVerified(walletAddress, client);
    if (reverse.error) errors.push(reverse.error);
    const avatar = reverse.primaryName
      ? await resolveAvatar(reverse.primaryName, client)
      : null;
    return {
      input,
      kind,
      walletAddress,
      ensName: reverse.bidirectionalMatch ? reverse.primaryName : null,
      avatar: reverse.bidirectionalMatch ? avatar : null,
      bidirectionalMatch: reverse.bidirectionalMatch,
      fallbackToWallet: true,
      errors,
    };
  }

  const forward = await resolveForward(input, client);
  if (forward.error) errors.push(forward.error);
  if (!forward.address) {
    return {
      input,
      kind,
      walletAddress: null,
      ensName: forward.normalizedName ?? input.trim(),
      avatar: null,
      bidirectionalMatch: false,
      fallbackToWallet: false,
      errors: errors.length ? errors : ["Name did not resolve to an address"],
    };
  }

  const reverse = await resolveReverseVerified(forward.address, client);
  if (reverse.error) errors.push(reverse.error);
  const ensName = forward.normalizedName ?? normalize(input.trim());
  const avatar = await resolveAvatar(ensName, client);

  return {
    input,
    kind,
    walletAddress: forward.address,
    ensName,
    avatar,
    bidirectionalMatch: reverse.bidirectionalMatch,
    fallbackToWallet: true,
    errors,
  };
}
