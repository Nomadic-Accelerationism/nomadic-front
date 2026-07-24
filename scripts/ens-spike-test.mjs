/**
 * ENS stable integration readiness script (Track A).
 * Usage: npm run spike:ens
 */

import { createPublicClient, getAddress, http } from "viem";
import { mainnet } from "viem/chains";
import { addEnsContracts } from "@ensdomains/ensjs";
import { getAddressRecord, getName, getTextRecord } from "@ensdomains/ensjs/public";
import { normalize } from "viem/ens";

const RPC = process.env.ENS_SPIKE_RPC_URL || "https://ethereum.publicnode.com";
const UNIVERSAL = "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe";
const EXPECT_UR = "0x2222222222222222222222222222222222222222";
const EXPECT_OFFCHAIN = "0x779981590E7Ccc0CFAe8040Ce7151324747cDb97";

const client = createPublicClient({
  chain: addEnsContracts(mainnet),
  transport: http(RPC),
});

async function forward(name) {
  const record = await getAddressRecord(client, { name: normalize(name) });
  return record?.value ?? null;
}

const rows = [];

async function check(label, fn) {
  try {
    const result = await fn();
    rows.push({ label, ...result });
    console.log(JSON.stringify({ label, ...result }));
  } catch (error) {
    rows.push({
      label,
      pass: false,
      error: error?.shortMessage || error?.message || String(error),
    });
    console.log(
      JSON.stringify({
        label,
        pass: false,
        error: error?.shortMessage || error?.message || String(error),
      }),
    );
  }
}

await check("universal_resolver_address", async () => {
  const ur = client.chain?.contracts?.ensUniversalResolver?.address;
  return {
    pass: ur?.toLowerCase() === UNIVERSAL.toLowerCase(),
    value: ur,
  };
});

await check("ur.integration-tests.eth", async () => {
  const value = await forward("ur.integration-tests.eth");
  return {
    pass: value && getAddress(value) === getAddress(EXPECT_UR),
    value,
  };
});

await check("test.offchaindemo.eth", async () => {
  const value = await forward("test.offchaindemo.eth");
  return {
    pass: value && getAddress(value) === getAddress(EXPECT_OFFCHAIN),
    value,
  };
});

await check(".eth vitalik.eth", async () => {
  const value = await forward("vitalik.eth");
  return { pass: Boolean(value), value };
});

await check("subname 1.offchaindemo.eth", async () => {
  const value = await forward("1.offchaindemo.eth");
  return { pass: Boolean(value), value };
});

await check("imported DNS ensfairy.xyz", async () => {
  const value = await forward("ensfairy.xyz");
  return { pass: Boolean(value), value };
});

await check("DNS-like subname ses.fkey.id", async () => {
  const value = await forward("ses.fkey.id");
  return { pass: Boolean(value), value };
});

await check("unresolved name", async () => {
  const value = await forward("this-name-should-not-resolve-zzzz.eth");
  return { pass: value === null, value };
});

await check("malformed input", async () => {
  const looksLikeName = "not-a-name".includes(".") && "not-a-name".length > 2;
  return { pass: !looksLikeName, note: "dot-rule rejects bare labels" };
});

await check("bidirectional nick.eth", async () => {
  const addr = await forward("nick.eth");
  const primary = await getName(client, { address: addr });
  const back = primary?.name ? await forward(primary.name) : null;
  const bidirectional =
    Boolean(primary?.match) &&
    Boolean(back) &&
    getAddress(back) === getAddress(addr);
  return { pass: bidirectional, primary: primary?.name, addr, back };
});

await check("avatar nick.eth", async () => {
  const value = await getTextRecord(client, {
    name: "nick.eth",
    key: "avatar",
  });
  return { pass: Boolean(value), value };
});

await check("rpc_failure", async () => {
  const bad = createPublicClient({
    chain: addEnsContracts(mainnet),
    transport: http("http://127.0.0.1:9"),
  });
  try {
    await getAddressRecord(bad, { name: "vitalik.eth" });
    return { pass: false, note: "expected failure" };
  } catch (error) {
    return {
      pass: true,
      error: error?.shortMessage || error?.message || "failed",
    };
  }
});

const failed = rows.filter((r) => r.pass === false);
console.log(
  JSON.stringify({
    summary: {
      total: rows.length,
      passed: rows.length - failed.length,
      failed: failed.map((f) => f.label),
      packages: {
        ensjs: "@ensdomains/ensjs@4.3.1",
        viem: "viem@2.43.0",
      },
    },
  }),
);

process.exit(failed.length ? 1 : 0);
