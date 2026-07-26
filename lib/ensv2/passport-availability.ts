/**
 * Live Passport label availability against Explorer-r2 Nomadic UserRegistry.
 * Uses IENSv2R2Registry.findOwner(label) — never invents ownership.
 * Never sends transactions. Never returns secrets.
 */

import {
  decodeAbiParameters,
  encodeFunctionData,
  parseAbi,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem";
import { ethCall } from "@/lib/ensv2/stage5a";
import {
  EXPLORER_R2_NOMADIC_USER_REGISTRY,
  IENSV2_R2_REGISTRY_ABI,
} from "@/lib/ensv2/explorer-r2";
import {
  passportNameFromLabel,
  validatePassportHandle,
} from "@/lib/passport/handle";

const registryAbi = parseAbi([...IENSV2_R2_REGISTRY_ABI]);

export type PassportAvailability =
  | { status: "available"; name: string; label: string }
  | { status: "taken"; name: string; label: string; owner: `0x${string}` }
  | { status: "reserved"; name: string; label: string; reason: string }
  | { status: "invalid"; reason: string; label?: string; name?: string }
  | { status: "unavailable"; reason: string; label?: string; name?: string };

const ZERO = "0x0000000000000000000000000000000000000000";

async function findRegistryOwner(
  rpcUrl: string,
  label: string
): Promise<`0x${string}` | null> {
  const data = encodeFunctionData({
    abi: registryAbi,
    functionName: "findOwner",
    args: [label],
  });
  const result = await ethCall(
    rpcUrl,
    EXPLORER_R2_NOMADIC_USER_REGISTRY as Address,
    data
  );
  const [value] = decodeAbiParameters(parseAbiParameters("address"), result);
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return null;
  }
  if (value.toLowerCase() === ZERO) return null;
  return value as `0x${string}`;
}

/**
 * Check whether a Passport label is free on the live Nomadic UserRegistry.
 */
export async function checkPassportHandleAvailability(
  rpcUrl: string,
  rawLabel: string
): Promise<PassportAvailability> {
  const validated = validatePassportHandle(rawLabel);
  if (!validated.ok) {
    if (validated.code === "RESERVED") {
      const label = rawLabel.trim().toLowerCase();
      return {
        status: "reserved",
        label,
        name: passportNameFromLabel(label || "reserved"),
        reason: validated.message,
      };
    }
    return {
      status: "invalid",
      reason: validated.message,
      label: rawLabel.trim().toLowerCase() || undefined,
    };
  }

  const { label, passportName } = validated;

  try {
    const owner = await findRegistryOwner(rpcUrl, label);
    if (owner) {
      return {
        status: "taken",
        label,
        name: passportName,
        owner,
      };
    }

    return {
      status: "available",
      label,
      name: passportName,
    };
  } catch {
    return {
      status: "unavailable",
      reason: "Name availability could not be checked right now.",
      label,
      name: passportName,
    };
  }
}

/** Map availability to Input visualState from UI pass 1.5. */
export function availabilityToInputState(
  status: PassportAvailability["status"] | "idle" | "checking" | "empty"
):
  | "default"
  | "focused"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "disabled" {
  switch (status) {
    case "checking":
      return "checking";
    case "available":
      return "available";
    case "taken":
    case "reserved":
      return "taken";
    case "invalid":
      return "invalid";
    case "unavailable":
      return "invalid";
    default:
      return "default";
  }
}
