/**
 * Stage 5A — Magic-signed atomic revoke of Lisbon House issuer text roles.
 * Calldata uses the exact DNS-encoded credential name from Stage 3 Group 5.
 */

import {
  decodeAbiParameters,
  encodeFunctionData,
  parseAbi,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem";
import bundleJson from "@/lib/ensv2/stage5a-revoke-bundle.json";

export const STAGE5A_CHAIN_ID = 11155111;
export const STAGE5A_RESOLVER =
  "0x467B72a46F578a47878137883Ce35c980393Bffe" as Address;
export const STAGE5A_ISSUER =
  "0x3505b68444Db0E71987090769e5283AfC0efBd62" as Address;
export const STAGE5A_EXPECTED_SIGNER =
  "0xd114FA765bA4811219AAe364c93CE8A81Ad39B17" as Address;
export const STAGE5A_CREDENTIAL_NODE =
  "0x6ad2126ebdb620e0dedc9df67cbb3256d7d948d91f24db92ab3ede1a419e7142" as Hex;
export const STAGE5A_METADATA_VALUE = "issuer-demo-stage4-verified";

export const STAGE5A_KEYS = [
  "com.nomadic.status",
  "com.nomadic.issuedAt",
  "com.nomadic.expiresAt",
  "com.nomadic.metadata",
] as const;

/** Resource IDs from ENSV2_STAGE3_FINAL_REPORT.md — do not recompute. */
export const STAGE5A_RESOURCES: Record<(typeof STAGE5A_KEYS)[number], Hex> = {
  "com.nomadic.status":
    "0xd954aa9090964a494142c9cd106c869b0df05ee6c86eb57c545de1f1d8939c19",
  "com.nomadic.issuedAt":
    "0x81c5f13ac823df263546b5a7dd735e7e3801b6256b6b74566305bf87680eb761",
  "com.nomadic.expiresAt":
    "0xf96114844050d7564cac0a8ad2bcb518af9c140ff9a6e05c2249781210b2f1d8",
  "com.nomadic.metadata":
    "0x67e70b959565375779e17f67e5889af208bdd5d4e0f52917fce3870d09ec6cac",
};

const resolverAbi = parseAbi([
  "function roles(uint256 resource, address account) view returns (uint256)",
  "function text(bytes32 node, string key) view returns (string)",
]);

export type Stage5ABundle = typeof bundleJson;

export function getStage5ABundle(): Stage5ABundle {
  return bundleJson;
}

export function getStage5ARevokeTx(): {
  to: Address;
  data: Hex;
  value: Hex;
} {
  const tx = bundleJson.transaction;
  return {
    to: tx.to as Address,
    data: tx.data as Hex,
    value: "0x0",
  };
}

export async function ethCall(
  rpcUrl: string,
  to: Address,
  data: Hex,
): Promise<Hex> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const json = (await res.json()) as { result?: Hex; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  if (!json.result) throw new Error("Empty eth_call result");
  return json.result;
}

export async function readIssuerTextRole(
  rpcUrl: string,
  key: (typeof STAGE5A_KEYS)[number],
): Promise<bigint> {
  const data = encodeFunctionData({
    abi: resolverAbi,
    functionName: "roles",
    args: [BigInt(STAGE5A_RESOURCES[key]), STAGE5A_ISSUER],
  });
  const result = await ethCall(rpcUrl, STAGE5A_RESOLVER, data);
  return BigInt(result);
}

export async function readCredentialMetadata(rpcUrl: string): Promise<string> {
  const data = encodeFunctionData({
    abi: resolverAbi,
    functionName: "text",
    args: [STAGE5A_CREDENTIAL_NODE, "com.nomadic.metadata"],
  });
  const result = await ethCall(rpcUrl, STAGE5A_RESOLVER, data);
  const [value] = decodeAbiParameters(parseAbiParameters("string"), result);
  return value;
}

export type Stage5APreflight = {
  roles: Record<(typeof STAGE5A_KEYS)[number], string>;
  metadata: string;
  readyToRevoke: boolean;
  alreadyRevoked: boolean;
  metadataIntact: boolean;
};

export async function runStage5APreflight(
  rpcUrl: string,
): Promise<Stage5APreflight> {
  const roles = {} as Record<(typeof STAGE5A_KEYS)[number], string>;
  let allZero = true;
  let allSetText = true;
  for (const key of STAGE5A_KEYS) {
    const role = await readIssuerTextRole(rpcUrl, key);
    roles[key] = `0x${role.toString(16)}`;
    if (role !== BigInt(0)) allZero = false;
    if (role !== BigInt(0x10)) allSetText = false;
  }
  const metadata = await readCredentialMetadata(rpcUrl);
  return {
    roles,
    metadata,
    readyToRevoke: allSetText && metadata === STAGE5A_METADATA_VALUE,
    alreadyRevoked: allZero,
    metadataIntact: metadata === STAGE5A_METADATA_VALUE,
  };
}
