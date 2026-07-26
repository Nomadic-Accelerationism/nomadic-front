/**
 * Read-only Explorer-r2 ENS credential text reads for the Passport product.
 * Never sends transactions. Reuses Stage 5A resolver + node constants.
 */

import {
  decodeAbiParameters,
  encodeFunctionData,
  namehash,
  parseAbi,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem";
import {
  STAGE5A_CREDENTIAL_NAME,
  STAGE5A_CREDENTIAL_NODE,
  STAGE5A_EXPECTED_SIGNER,
  STAGE5A_KEYS,
  STAGE5A_PASSPORT_NAME,
  STAGE5A_RESOLVER,
  ethCall,
} from "@/lib/ensv2/stage5a";

const resolverAbi = parseAbi([
  "function text(bytes32 node, string key) view returns (string)",
  "function addr(bytes32 node) view returns (address)",
]);

export const DEFAULT_LISBON_CREDENTIAL_NAME = STAGE5A_CREDENTIAL_NAME;
export const DEFAULT_PASSPORT_NAME = STAGE5A_PASSPORT_NAME;
export const PASSPORT_PUBLIC_WALLET = STAGE5A_EXPECTED_SIGNER;

export type EnsCredentialTexts = {
  status: string;
  issuedAt: string;
  expiresAt: string;
  metadata: string;
};

export type EnsCredentialStampState =
  | {
      ok: true;
      credentialName: string;
      texts: EnsCredentialTexts;
      title: string;
      eligibilityLabel: "Eligible";
      activityLabel: "Active";
      issuedBy: string;
      verifiedOnEns: true;
    }
  | {
      ok: false;
      credentialName: string;
      code:
        | "RESOLVER_UNAVAILABLE"
        | "CREDENTIAL_UNAVAILABLE"
        | "INVALID_NAME";
      message: string;
    };

export type PublicPassportPayload = {
  passportName: string | null;
  displayName: string;
  primaryWallet: `0x${string}` | null;
  stamps: Array<{
    title: string;
    eligibilityLabel: string;
    activityLabel: string;
    issuedBy: string;
    verifiedOnEns: boolean;
    credentialName: string;
  }>;
  verifiedOnEns: boolean;
};

const PII_KEYS = [
  "email",
  "nullifier",
  "nullifiers",
  "worldPayload",
  "document",
  "documentData",
  "country",
  "nationality",
  "didToken",
  "magic",
  "session",
] as const;

function normalizeCredentialName(name: string): string | null {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed || !trimmed.includes(".")) return null;
  if (trimmed.length > 200) return null;
  return trimmed;
}

export function credentialNodeForName(name: string): Hex | null {
  const normalized = normalizeCredentialName(name);
  if (!normalized) return null;
  if (normalized === STAGE5A_CREDENTIAL_NAME) {
    return STAGE5A_CREDENTIAL_NODE;
  }
  try {
    return namehash(normalized) as Hex;
  } catch {
    return null;
  }
}

async function readText(
  rpcUrl: string,
  node: Hex,
  key: (typeof STAGE5A_KEYS)[number]
): Promise<string> {
  const data = encodeFunctionData({
    abi: resolverAbi,
    functionName: "text",
    args: [node, key],
  });
  const result = await ethCall(rpcUrl, STAGE5A_RESOLVER, data);
  const [value] = decodeAbiParameters(parseAbiParameters("string"), result);
  return typeof value === "string" ? value : "";
}

async function readAddr(
  rpcUrl: string,
  node: Hex
): Promise<`0x${string}` | null> {
  try {
    const data = encodeFunctionData({
      abi: resolverAbi,
      functionName: "addr",
      args: [node],
    });
    const result = await ethCall(rpcUrl, STAGE5A_RESOLVER, data);
    const [value] = decodeAbiParameters(parseAbiParameters("address"), result);
    if (
      typeof value === "string" &&
      /^0x[a-fA-F0-9]{40}$/.test(value) &&
      value !== "0x0000000000000000000000000000000000000000"
    ) {
      return value as `0x${string}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Map successful ENS text reads to product stamp copy.
 * Eligibility only — never "accepted" / "attended" / "resident".
 */
export function mapCredentialTextsToStamp(
  credentialName: string,
  texts: EnsCredentialTexts
): Extract<EnsCredentialStampState, { ok: true }> | null {
  const hasSignal =
    Boolean(texts.metadata?.trim()) ||
    Boolean(texts.status?.trim()) ||
    Boolean(texts.issuedAt?.trim());
  if (!hasSignal) return null;

  return {
    ok: true,
    credentialName,
    texts,
    title: "Lisbon House",
    eligibilityLabel: "Eligible",
    activityLabel: "Active",
    issuedBy: "Nomadic Lisbon House",
    verifiedOnEns: true,
  };
}

export async function readLisbonCredentialStamp(
  rpcUrl: string,
  credentialName: string = DEFAULT_LISBON_CREDENTIAL_NAME
): Promise<EnsCredentialStampState> {
  const normalized = normalizeCredentialName(credentialName);
  if (!normalized) {
    return {
      ok: false,
      credentialName: credentialName || "",
      code: "INVALID_NAME",
      message: "Credential name is invalid.",
    };
  }

  const node = credentialNodeForName(normalized);
  if (!node) {
    return {
      ok: false,
      credentialName: normalized,
      code: "INVALID_NAME",
      message: "Credential name could not be hashed.",
    };
  }

  try {
    const [status, issuedAt, expiresAt, metadata] = await Promise.all([
      readText(rpcUrl, node, "com.nomadic.status"),
      readText(rpcUrl, node, "com.nomadic.issuedAt"),
      readText(rpcUrl, node, "com.nomadic.expiresAt"),
      readText(rpcUrl, node, "com.nomadic.metadata"),
    ]);

    const texts = { status, issuedAt, expiresAt, metadata };
    const mapped = mapCredentialTextsToStamp(normalized, texts);
    if (!mapped) {
      return {
        ok: false,
        credentialName: normalized,
        code: "CREDENTIAL_UNAVAILABLE",
        message: "Credential texts were empty on ENS.",
      };
    }
    return mapped;
  } catch {
    return {
      ok: false,
      credentialName: normalized,
      code: "RESOLVER_UNAVAILABLE",
      message: "ENS resolver could not be reached.",
    };
  }
}

function displayNameFromPassport(passportName: string | null): string {
  if (!passportName) return "Nomadic Passport";
  const label = passportName.split(".")[0] || "Nomadic";
  const pretty = label.charAt(0).toUpperCase() + label.slice(1);
  return `${pretty}’s Passport`;
}

/**
 * Build a public Passport payload from ENS reads only.
 * Never includes email, World payloads, nullifiers, or country.
 */
export async function buildPublicPassportFromEns(
  rpcUrl: string,
  identifier: string
): Promise<
  | { ok: true; passport: PublicPassportPayload }
  | { ok: false; code: string; message: string }
> {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, code: "INVALID_IDENTIFIER", message: "Missing identifier." };
  }

  let passportName: string | null = null;
  let credentialName: string | null = null;
  let primaryWallet: `0x${string}` | null = null;

  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    primaryWallet = trimmed as `0x${string}`;
    // Address-only public view: try known demo credential when wallet matches Victor.
    if (
      trimmed.toLowerCase() === STAGE5A_EXPECTED_SIGNER.toLowerCase()
    ) {
      passportName = STAGE5A_PASSPORT_NAME;
      credentialName = STAGE5A_CREDENTIAL_NAME;
    }
  } else if (trimmed.endsWith(".nomadic-passport.eth")) {
    passportName = trimmed.startsWith("lisbon-house.")
      ? trimmed.replace(/^lisbon-house\./, "")
      : trimmed;
    credentialName = trimmed.startsWith("lisbon-house.")
      ? trimmed
      : `lisbon-house.${trimmed}`;
  } else if (trimmed.includes(".")) {
    passportName = trimmed;
    credentialName = `lisbon-house.${trimmed}`;
  } else {
    return {
      ok: false,
      code: "INVALID_IDENTIFIER",
      message: "Identifier must be an ENS name or wallet address.",
    };
  }

  if (passportName && !primaryWallet) {
    try {
      const node = namehash(passportName) as Hex;
      primaryWallet = await readAddr(rpcUrl, node);
    } catch {
      primaryWallet = null;
    }
    // Known demo owner when addr() is unset but name matches Victor passport.
    if (
      !primaryWallet &&
      passportName === STAGE5A_PASSPORT_NAME
    ) {
      primaryWallet = STAGE5A_EXPECTED_SIGNER;
    }
  }

  const stamps: PublicPassportPayload["stamps"] = [];
  let verifiedOnEns = false;

  if (credentialName) {
    const stamp = await readLisbonCredentialStamp(rpcUrl, credentialName);
    if (stamp.ok) {
      verifiedOnEns = true;
      stamps.push({
        title: stamp.title,
        eligibilityLabel: stamp.eligibilityLabel,
        activityLabel: stamp.activityLabel,
        issuedBy: stamp.issuedBy,
        verifiedOnEns: true,
        credentialName: stamp.credentialName,
      });
    }
  }

  if (!passportName && !primaryWallet && stamps.length === 0) {
    return {
      ok: false,
      code: "PASSPORT_UNAVAILABLE",
      message: "Public Passport could not be resolved.",
    };
  }

  return {
    ok: true,
    passport: {
      passportName,
      displayName: displayNameFromPassport(passportName),
      primaryWallet,
      stamps,
      verifiedOnEns,
    },
  };
}

/** Strip any accidental PII keys from a public payload object. */
export function sanitizePublicPassportPayload(
  value: unknown
): PublicPassportPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  for (const key of PII_KEYS) {
    if (key in record) {
      delete record[key];
    }
  }

  const stampsRaw = Array.isArray(record.stamps) ? record.stamps : [];
  const stamps = stampsRaw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const s = item as Record<string, unknown>;
      return {
        title: typeof s.title === "string" ? s.title : "Community stamp",
        eligibilityLabel:
          typeof s.eligibilityLabel === "string" ? s.eligibilityLabel : "Eligible",
        activityLabel:
          typeof s.activityLabel === "string" ? s.activityLabel : "Active",
        issuedBy:
          typeof s.issuedBy === "string" ? s.issuedBy : "Nomadic",
        verifiedOnEns: Boolean(s.verifiedOnEns),
        credentialName:
          typeof s.credentialName === "string" ? s.credentialName : "",
      };
    });

  const wallet =
    typeof record.primaryWallet === "string" &&
    /^0x[a-fA-F0-9]{40}$/.test(record.primaryWallet)
      ? (record.primaryWallet as `0x${string}`)
      : null;

  return {
    passportName:
      typeof record.passportName === "string" ? record.passportName : null,
    displayName:
      typeof record.displayName === "string"
        ? record.displayName
        : "Nomadic Passport",
    primaryWallet: wallet,
    stamps,
    verifiedOnEns: Boolean(record.verifiedOnEns),
  };
}

export function publicPassportContainsPii(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const keys = collectKeys(value);
  const forbidden = new Set(
    PII_KEYS.map((k) => k.toLowerCase()).concat(["didtoken", "email"])
  );
  return keys.some((key) => forbidden.has(key.toLowerCase()));
}

function collectKeys(value: unknown, acc: string[] = []): string[] {
  if (!value || typeof value !== "object") return acc;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, acc);
    return acc;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    acc.push(key);
    collectKeys(child, acc);
  }
  return acc;
}

export const SEPOLIA_RPC_PROXY_PATH = "/api/ens/sepolia-rpc";

export function sepoliaRpcUrlForServer(): string {
  return (
    process.env.ENS_SEPOLIA_RPC_URL?.trim() ||
    "https://ethereum-sepolia-rpc.publicnode.com"
  );
}

export { STAGE5A_RESOLVER as PASSPORT_ENS_RESOLVER };
export type { Address };
