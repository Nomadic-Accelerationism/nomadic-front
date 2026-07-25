/**
 * ENS spike — types for stable ENSv2-ready resolution.
 * Isolated from Passport production UI.
 */

export const ENS_UNIVERSAL_RESOLVER =
  "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe" as const;

/** Official readiness vectors from https://docs.ens.domains/web/ensv2-readiness/ */
export const ENS_READYNESS_VECTORS = {
  universalResolverProbe: {
    name: "ur.integration-tests.eth",
    expectedAddress: "0x2222222222222222222222222222222222222222",
    legacyWrongAddress: "0x1111111111111111111111111111111111111111",
  },
  ccipReadProbe: {
    name: "test.offchaindemo.eth",
    expectedAddress: "0x779981590E7Ccc0CFAe8040Ce7151324747cDb97",
  },
} as const;

export type EnsSpikeResolveKind =
  | "ens_name"
  | "eth_address"
  | "malformed"
  | "empty";

export type EnsSpikeForwardResult = {
  input: string;
  kind: EnsSpikeResolveKind;
  normalizedName?: string;
  address: `0x${string}` | null;
  error?: string;
};

export type EnsSpikeReverseResult = {
  address: `0x${string}`;
  primaryName: string | null;
  /** True when reverse name forward-resolves back to the same address. */
  bidirectionalMatch: boolean;
  error?: string;
};

export type EnsSpikeDisplayResult = {
  input: string;
  kind: EnsSpikeResolveKind;
  walletAddress: `0x${string}` | null;
  ensName: string | null;
  avatar: string | null;
  bidirectionalMatch: boolean;
  fallbackToWallet: boolean;
  errors: string[];
};
