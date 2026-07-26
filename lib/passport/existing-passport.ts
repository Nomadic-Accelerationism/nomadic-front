/**
 * Resolve an already-issued Nomadic Passport for an authenticated wallet.
 *
 * Priority:
 * 1. Backend `/passport/me` mapping (ensStatus ISSUED + ensName)
 * 2. Live registry ownership check for the known demo label when the wallet
 *    is the onchain owner (not a UI hardcode — verified via findOwner)
 *
 * Global reverse lookup by arbitrary wallet is not supported by current
 * Explorer-r2 contracts; Nomadic account mapping is the product source of truth.
 */

import {
  decodeAbiParameters,
  encodeFunctionData,
  parseAbi,
  parseAbiParameters,
  type Address,
} from "viem";
import {
  EXPLORER_R2_NOMADIC_USER_REGISTRY,
  IENSV2_R2_REGISTRY_ABI,
} from "@/lib/ensv2/explorer-r2";
import { ethCall, STAGE5A_EXPECTED_SIGNER } from "@/lib/ensv2/stage5a";
import { passportNameFromLabel } from "@/lib/passport/handle";
import type { PrivatePassport } from "@/lib/passport/types";

const registryAbi = parseAbi([...IENSV2_R2_REGISTRY_ABI]);

export type ExistingPassportResolution =
  | {
      found: true;
      passportName: string;
      source: "backend" | "registry_owner";
    }
  | { found: false; reason: string };

export function existingPassportFromBackend(
  passport: PrivatePassport | null | undefined
): ExistingPassportResolution {
  if (
    passport?.ensStatus === "ISSUED" &&
    typeof passport.ensName === "string" &&
    passport.ensName.trim().length > 0
  ) {
    return {
      found: true,
      passportName: passport.ensName.trim().toLowerCase(),
      source: "backend",
    };
  }
  return {
    found: false,
    reason: "Backend Passport has no issued name yet.",
  };
}

/**
 * Verified onchain ownership for the known demo Passport label when the
 * authenticated wallet matches the live registry owner.
 */
export async function existingPassportFromRegistryOwner(
  rpcUrl: string,
  wallet: `0x${string}` | null | undefined
): Promise<ExistingPassportResolution> {
  if (!wallet) {
    return { found: false, reason: "Wallet unavailable." };
  }

  // Only probe the known demo label when the wallet matches the historical
  // Magic owner — avoids inventing reverse-index scans we do not have.
  if (wallet.toLowerCase() !== STAGE5A_EXPECTED_SIGNER.toLowerCase()) {
    return {
      found: false,
      reason:
        "No global wallet→Passport reverse index; use Nomadic account mapping.",
    };
  }

  try {
    const data = encodeFunctionData({
      abi: registryAbi,
      functionName: "findOwner",
      args: ["victor"],
    });
    const result = await ethCall(
      rpcUrl,
      EXPLORER_R2_NOMADIC_USER_REGISTRY as Address,
      data
    );
    const [owner] = decodeAbiParameters(parseAbiParameters("address"), result);
    if (
      typeof owner === "string" &&
      owner.toLowerCase() === wallet.toLowerCase()
    ) {
      return {
        found: true,
        passportName: passportNameFromLabel("victor"),
        source: "registry_owner",
      };
    }
  } catch {
    // fall through
  }

  return {
    found: false,
    reason: "Registry ownership could not confirm an existing Passport.",
  };
}
