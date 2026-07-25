import type {
  PassportCredential,
  PassportEnsStatus,
  PassportIdentityStatus,
  PassportJourneyReference,
  PassportProof,
  PrivatePassport,
  PrivatePassportResponse,
} from "@/lib/passport/types";

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDefined(
  record: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (key in record && record[key] !== undefined) return record[key];
  }
  return undefined;
}

function parseIdentityStatus(value: unknown): PassportIdentityStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (
    normalized === "READY" ||
    normalized === "WALLET_READY" ||
    normalized === "AVAILABLE" ||
    normalized === "WALLET_AVAILABLE"
  ) {
    return "READY";
  }
  if (
    normalized === "WALLET_UNAVAILABLE" ||
    normalized === "UNAVAILABLE" ||
    normalized === "MISSING_WALLET" ||
    normalized === "NO_WALLET"
  ) {
    return "WALLET_UNAVAILABLE";
  }
  return null;
}

function parseEnsStatus(value: unknown): PassportEnsStatus | null {
  if (value === null) return "NOT_ISSUED";
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (
    normalized === "NOT_ISSUED" ||
    normalized === "NONE" ||
    normalized === "UNISSUED" ||
    normalized === "PENDING"
  ) {
    return "NOT_ISSUED";
  }
  if (normalized === "ISSUED" || normalized === "ACTIVE") {
    return "ISSUED";
  }
  return null;
}

function parsePublicAddress(value: unknown): `0x${string}` | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!ETH_ADDRESS_RE.test(trimmed)) return undefined;
  return trimmed as `0x${string}`;
}

function parseProof(value: unknown): PassportProof | null {
  if (!isRecord(value)) return null;
  const proof: PassportProof = {};
  if (typeof value.type === "string") proof.type = value.type;
  if (typeof value.key === "string") proof.key = value.key;
  if (typeof value.proofType === "string") proof.proofType = value.proofType;
  if (typeof value.action === "string") proof.action = value.action;
  if (typeof value.status === "string") proof.status = value.status;
  if (value.completedAt === null || typeof value.completedAt === "string") {
    proof.completedAt = value.completedAt;
  }
  const verifiedAt = firstDefined(value, ["verifiedAt", "verified_at"]);
  if (verifiedAt === null || typeof verifiedAt === "string") {
    proof.verifiedAt = verifiedAt as string | null;
  }
  if (value.failedAt === null || typeof value.failedAt === "string") {
    proof.failedAt = value.failedAt;
  }
  if (value.expiredAt === null || typeof value.expiredAt === "string") {
    proof.expiredAt = value.expiredAt;
  }
  // Accept empty/unknown proof objects as records (completion matching uses keys).
  return proof;
}

function parseCredential(value: unknown): PassportCredential | null {
  if (!isRecord(value)) return null;
  const rawKey = firstDefined(value, [
    "credentialKey",
    "key",
    "id",
    "type",
    "credential_key",
  ]);
  if (typeof rawKey !== "string" || !rawKey.trim()) return null;

  const credential: PassportCredential = {
    credentialKey: rawKey.trim(),
  };
  if (typeof value.displayName === "string") {
    credential.displayName = value.displayName;
  } else if (typeof value.name === "string") {
    credential.displayName = value.name;
  }
  if (typeof value.description === "string") {
    credential.description = value.description;
  }
  if (typeof value.claimedAt === "string") {
    credential.claimedAt = value.claimedAt;
  } else if (typeof value.issuedAt === "string") {
    credential.claimedAt = value.issuedAt;
  }
  if (typeof value.verificationProvider === "string") {
    credential.verificationProvider = value.verificationProvider;
  }
  if (isRecord(value.metadata)) {
    credential.metadata = value.metadata;
  }
  return credential;
}

function parseJourneyRef(value: unknown): PassportJourneyReference | null {
  if (!isRecord(value)) return null;
  const ref: PassportJourneyReference = {};
  if (typeof value.journeyId === "string") ref.journeyId = value.journeyId;
  if (typeof value.id === "string") ref.id = value.id;
  if (typeof value.status === "string") ref.status = value.status;
  if (typeof value.title === "string") ref.title = value.title;
  return Object.keys(ref).length > 0 ? ref : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Sanitize backend payload to a field-name/type map for diagnostics.
 * Never includes values (no wallet, email, DID, proofs payloads).
 */
export function describePassportPayloadShape(raw: unknown): {
  topLevelKeys: string[];
  passportKeys?: Record<string, string>;
  notes: string[];
} {
  const notes: string[] = [];
  if (!isRecord(raw)) {
    return {
      topLevelKeys: [],
      notes: [`root_type=${raw === null ? "null" : typeof raw}`],
    };
  }

  const topLevelKeys = Object.keys(raw).sort();
  const passportSource = isRecord(raw.passport)
    ? raw.passport
    : isRecord(raw.user)
      ? raw
      : raw;

  const passportKeys: Record<string, string> = {};
  if (isRecord(passportSource)) {
    for (const [key, value] of Object.entries(passportSource)) {
      if (Array.isArray(value)) {
        passportKeys[key] = `array(len=${value.length})`;
      } else if (value === null) {
        passportKeys[key] = "null";
      } else {
        passportKeys[key] = typeof value;
      }
    }
  } else {
    notes.push("no_object_source_for_passport_fields");
  }

  if (!("passport" in raw)) notes.push("missing_passport_wrapper");
  if (isRecord(raw.user)) notes.push("has_legacy_user_object");

  return { topLevelKeys, passportKeys, notes };
}

/**
 * Normalize deployed backend variants into the frontend PrivatePassport model.
 * Supports:
 * - `{ passport: {...} }` (preferred)
 * - legacy `{ user, credentials, applications|journeys, legacyProofs|proofs }`
 * - flat passport fields at the root
 */
export function normalizePrivatePassportPayload(
  raw: unknown
): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;

  if (isRecord(raw.passport)) {
    return raw.passport;
  }

  // Legacy / alternate aggregate: user + lists at root
  if (isRecord(raw.user) || "publicAddress" in raw || "wallet" in raw) {
    const user = isRecord(raw.user) ? raw.user : {};
    return {
      userId: firstDefined(user, ["id", "userId"]) ?? raw.userId,
      publicAddress: firstDefined(
        { ...raw, ...user },
        ["publicAddress", "wallet", "walletAddress", "address"]
      ),
      identityStatus: firstDefined(
        { ...raw, ...user },
        ["identityStatus", "identity_status", "status"]
      ),
      ensName: firstDefined(
        { ...raw, ...user },
        ["ensName", "ens_name", "ens"]
      ),
      ensStatus: firstDefined(
        { ...raw, ...user },
        ["ensStatus", "ens_status"]
      ),
      proofs: firstDefined(raw, ["proofs", "legacyProofs"]) ?? [],
      credentials: firstDefined(raw, ["credentials"]) ?? [],
      journeys: firstDefined(raw, ["journeys", "applications"]),
    };
  }

  return null;
}

/**
 * Validates / normalizes the private Passport response before UI use.
 * Returns null when the payload cannot be trusted.
 */
export function parsePrivatePassportResponse(
  raw: unknown
): PrivatePassportResponse | null {
  const source = normalizePrivatePassportPayload(raw);
  if (!source) return null;

  const publicAddress = parsePublicAddress(
    firstDefined(source, [
      "publicAddress",
      "wallet",
      "walletAddress",
      "address",
    ])
  );
  if (publicAddress === undefined) return null;

  let identityStatus = parseIdentityStatus(
    firstDefined(source, ["identityStatus", "identity_status"])
  );
  if (!identityStatus) {
    identityStatus = publicAddress ? "READY" : "WALLET_UNAVAILABLE";
  }

  const ensNameRaw = firstDefined(source, ["ensName", "ens_name", "ens"]);
  let ensName: string | null = null;
  if (ensNameRaw === null || ensNameRaw === undefined) {
    ensName = null;
  } else if (typeof ensNameRaw === "string") {
    ensName = ensNameRaw.trim() || null;
  } else if (isRecord(ensNameRaw) && typeof ensNameRaw.name === "string") {
    ensName = ensNameRaw.name.trim() || null;
  } else {
    return null;
  }

  let ensStatus = parseEnsStatus(
    firstDefined(source, ["ensStatus", "ens_status"])
  );
  if (!ensStatus) {
    ensStatus = ensName ? "ISSUED" : "NOT_ISSUED";
  }

  const proofs: PassportProof[] = [];
  for (const item of asArray(
    firstDefined(source, ["proofs", "legacyProofs"])
  )) {
    const proof = parseProof(item);
    if (!proof) return null;
    proofs.push(proof);
  }

  const credentials: PassportCredential[] = [];
  for (const item of asArray(firstDefined(source, ["credentials"]))) {
    const credential = parseCredential(item);
    if (!credential) return null;
    credentials.push(credential);
  }

  const passport: PrivatePassport = {
    publicAddress,
    identityStatus,
    ensName: ensStatus === "NOT_ISSUED" ? null : ensName,
    ensStatus,
    proofs,
    credentials,
  };

  const userId = firstDefined(source, ["userId", "id"]);
  if (typeof userId === "string" && userId.trim()) {
    passport.userId = userId.trim();
  }

  const journeysRaw = firstDefined(source, ["journeys", "applications"]);
  if (journeysRaw !== undefined) {
    const journeys: PassportJourneyReference[] = [];
    for (const item of asArray(journeysRaw)) {
      const ref = parseJourneyRef(item);
      if (ref) journeys.push(ref);
    }
    passport.journeys = journeys;
  }

  if (identityStatus === "READY" && !publicAddress) return null;
  if (ensStatus === "ISSUED" && !passport.ensName) return null;

  return { passport };
}
