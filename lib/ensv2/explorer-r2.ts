/**
 * Pinned Explorer-r2 (explorer-v1-r2) deployment constants.
 * Source: nomadic-contracts addresses/sepolia.ensv2.explorer-v1-r2.json
 * Server-side reads only — never surface these addresses in product UI.
 */

import type { Address } from "viem";

export const EXPLORER_R2_CHAIN_ID = 11155111;

export const EXPLORER_R2_NOMADIC_USER_REGISTRY =
  "0x8fB12e7Ab9B192503d7d02a43e0507c484e27280" as Address;

export const EXPLORER_R2_PLATFORM_OWNER =
  "0xca490deA7D7D79Bac4537D5Fe68fF10cd9c7EbEd" as Address;

export const EXPLORER_R2_TOP_UNIVERSAL_RESOLVER =
  "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe" as Address;

export const EXPLORER_R2_PARENT_LABEL = "nomadic-passport";
export const EXPLORER_R2_PARENT_NAME = "nomadic-passport.eth";

/** Exact operational subset from contracts IENSv2R2Registry. */
export const IENSV2_R2_REGISTRY_ABI = [
  "function findOwner(string label) view returns (address)",
  "function findExpiry(string label) view returns (uint64)",
  "function findTokenId(string label) view returns (uint256)",
  "function getSubregistry(string label) view returns (address)",
  "function getResolver(string label) view returns (address)",
  "function ownerOf(uint256 tokenId) view returns (address)",
] as const;
