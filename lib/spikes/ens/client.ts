/**
 * ENS spike — Mainnet public client with ENSjs contracts (canonical Universal Resolver).
 */

import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { addEnsContracts } from "@ensdomains/ensjs";
import { ENS_UNIVERSAL_RESOLVER } from "./types";

export type EnsSpikePublicClient = PublicClient & {
  chain: ReturnType<typeof addEnsContracts<typeof mainnet>>;
};

export function createEnsSpikeClient(
  rpcUrl = process.env.ENS_SPIKE_RPC_URL ||
    process.env.NEXT_PUBLIC_ENS_SPIKE_RPC_URL ||
    "https://ethereum.publicnode.com",
): EnsSpikePublicClient {
  const chain = addEnsContracts(mainnet);
  const ur = chain.contracts?.ensUniversalResolver?.address;
  if (
    ur &&
    ur.toLowerCase() !== ENS_UNIVERSAL_RESOLVER.toLowerCase()
  ) {
    throw new Error(
      `Unexpected Universal Resolver ${ur}; expected ${ENS_UNIVERSAL_RESOLVER}`,
    );
  }

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  }) as EnsSpikePublicClient;
}
