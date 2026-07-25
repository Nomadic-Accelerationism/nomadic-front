/**
 * Stage 3 namehash invariants + Stage 5A completion / resume protection checks.
 *
 * Run: npm run test:ensv2-stage3
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  decodeAbiParameters,
  encodeFunctionData,
  namehash,
  parseAbi,
  parseAbiParameters,
} from "viem";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const CORRECT_NODE =
  "0x6ad2126ebdb620e0dedc9df67cbb3256d7d948d91f24db92ab3ede1a419e7142";
const WRONG_NODE =
  "0x86ee08d08dc976a172e361396955cc752bd4328e943d606781a832ea0cc0b2fb";
const CREDENTIAL = "lisbon-house.victor.nomadic-passport.eth";
const DNS =
  "0x0c6c6973626f6e2d686f75736506766963746f72106e6f6d616469632d70617373706f72740365746800";
const COMPLETION_TX =
  "0x9bb61d2b31b38a28573dfd4cf970a661c38befe0002482f4b4d9a8504f69e801";
const RESOLVER = "0x467B72a46F578a47878137883Ce35c980393Bffe";
const ISSUER = "0x3505b68444Db0E71987090769e5283AfC0efBd62";
const METADATA_EXPECTED = "issuer-demo-stage4-verified";
const RESOURCES = {
  "com.nomadic.status":
    "0xd954aa9090964a494142c9cd106c869b0df05ee6c86eb57c545de1f1d8939c19",
  "com.nomadic.issuedAt":
    "0x81c5f13ac823df263546b5a7dd735e7e3801b6256b6b74566305bf87680eb761",
  "com.nomadic.expiresAt":
    "0xf96114844050d7564cac0a8ad2bcb518af9c140ff9a6e05c2249781210b2f1d8",
  "com.nomadic.metadata":
    "0x67e70b959565375779e17f67e5889af208bdd5d4e0f52917fce3870d09ec6cac",
};

const RPC =
  process.env.SEPOLIA_RPC_URL?.trim() ||
  "https://ethereum-sepolia-rpc.publicnode.com";

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}

test("Stage 3 credential namehash matches pinned node (not broken node)", () => {
  const hashed = namehash(CREDENTIAL);
  assert.equal(hashed, CORRECT_NODE);
  assert.notEqual(hashed, WRONG_NODE);
});

test("Stage 5A revoke bundle preserves Stage 3 DNS bytes + correct node", () => {
  const bundle = JSON.parse(
    readFileSync(join(root, "lib/ensv2/stage5a-revoke-bundle.json"), "utf8"),
  );
  assert.equal(bundle.credentialNode, CORRECT_NODE);
  assert.equal(bundle.credentialDns, DNS);
  assert.equal(bundle.completionTx, COMPLETION_TX);
  assert.ok(
    String(bundle.transaction.data).includes(DNS.slice(2)),
    "multicall calldata must embed Stage 3 DNS bytes",
  );
  assert.ok(
    !String(bundle.transaction.data).includes(WRONG_NODE.slice(2)),
    "must never target broken historical node",
  );
});

test("Stage 5A on-chain complete: issuer roles zero, metadata intact", async () => {
  const abi = parseAbi([
    "function roles(uint256 resource, address account) view returns (uint256)",
    "function text(bytes32 node, string key) view returns (string)",
  ]);

  for (const [key, resource] of Object.entries(RESOURCES)) {
    const data = encodeFunctionData({
      abi,
      functionName: "roles",
      args: [BigInt(resource), ISSUER],
    });
    const result = await rpc("eth_call", [{ to: RESOLVER, data }, "latest"]);
    assert.equal(
      BigInt(result),
      0n,
      `${key} issuer role must be 0 after Stage 5A`,
    );
  }

  const metaData = encodeFunctionData({
    abi,
    functionName: "text",
    args: [CORRECT_NODE, "com.nomadic.metadata"],
  });
  const metaRaw = await rpc("eth_call", [
    { to: RESOLVER, data: metaData },
    "latest",
  ]);
  const [metadata] = decodeAbiParameters(parseAbiParameters("string"), metaRaw);
  assert.equal(metadata, METADATA_EXPECTED);
});

test("Stage 5A completion tx succeeded on Sepolia", async () => {
  const receipt = await rpc("eth_getTransactionReceipt", [COMPLETION_TX]);
  assert.ok(receipt, "receipt missing");
  assert.equal(receipt.status, "0x1");
  assert.equal(
    String(receipt.to).toLowerCase(),
    RESOLVER.toLowerCase(),
  );
  assert.equal(
    String(receipt.from).toLowerCase(),
    "0xd114fa765ba4811219aae364c93ce8a81ad39b17",
  );
});
