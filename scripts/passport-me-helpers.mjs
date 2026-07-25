/**
 * Pure Passport helpers for node:test (mirrors lib/passport/validate.ts).
 */

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDefined(record, keys) {
  for (const key of keys) {
    if (key in record && record[key] !== undefined) return record[key];
  }
  return undefined;
}

function parseIdentityStatus(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["READY", "WALLET_READY", "AVAILABLE", "WALLET_AVAILABLE"].includes(normalized)) {
    return "READY";
  }
  if (
    ["WALLET_UNAVAILABLE", "UNAVAILABLE", "MISSING_WALLET", "NO_WALLET"].includes(
      normalized
    )
  ) {
    return "WALLET_UNAVAILABLE";
  }
  return null;
}

function parseEnsStatus(value) {
  if (value === null) return "NOT_ISSUED";
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["NOT_ISSUED", "NONE", "UNISSUED", "PENDING"].includes(normalized)) {
    return "NOT_ISSUED";
  }
  if (["ISSUED", "ACTIVE"].includes(normalized)) return "ISSUED";
  return null;
}

function parsePublicAddress(value) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!ETH_ADDRESS_RE.test(trimmed)) return undefined;
  return trimmed;
}

function parseProof(value) {
  if (!isRecord(value)) return null;
  return {
    type: typeof value.type === "string" ? value.type : undefined,
    key: typeof value.key === "string" ? value.key : undefined,
    status: typeof value.status === "string" ? value.status : undefined,
    completedAt:
      value.completedAt === null || typeof value.completedAt === "string"
        ? value.completedAt
        : undefined,
  };
}

function parseCredential(value) {
  if (!isRecord(value)) return null;
  const rawKey = firstDefined(value, [
    "credentialKey",
    "key",
    "id",
    "type",
    "credential_key",
  ]);
  if (typeof rawKey !== "string" || !rawKey.trim()) return null;
  return {
    credentialKey: rawKey.trim(),
    displayName:
      typeof value.displayName === "string"
        ? value.displayName
        : typeof value.name === "string"
          ? value.name
          : undefined,
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePrivatePassportPayload(raw) {
  if (!isRecord(raw)) return null;
  if (isRecord(raw.passport)) return raw.passport;
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
      ensName: firstDefined({ ...raw, ...user }, ["ensName", "ens_name", "ens"]),
      ensStatus: firstDefined({ ...raw, ...user }, ["ensStatus", "ens_status"]),
      proofs: firstDefined(raw, ["proofs", "legacyProofs"]) ?? [],
      credentials: firstDefined(raw, ["credentials"]) ?? [],
      journeys: firstDefined(raw, ["journeys", "applications"]),
    };
  }
  return null;
}

export function parsePrivatePassportResponse(raw) {
  const source = normalizePrivatePassportPayload(raw);
  if (!source) return null;

  const publicAddress = parsePublicAddress(
    firstDefined(source, ["publicAddress", "wallet", "walletAddress", "address"])
  );
  if (publicAddress === undefined) return null;

  let identityStatus = parseIdentityStatus(
    firstDefined(source, ["identityStatus", "identity_status"])
  );
  if (!identityStatus) {
    identityStatus = publicAddress ? "READY" : "WALLET_UNAVAILABLE";
  }

  const ensNameRaw = firstDefined(source, ["ensName", "ens_name", "ens"]);
  let ensName = null;
  if (ensNameRaw === null || ensNameRaw === undefined) ensName = null;
  else if (typeof ensNameRaw === "string") ensName = ensNameRaw.trim() || null;
  else return null;

  let ensStatus = parseEnsStatus(firstDefined(source, ["ensStatus", "ens_status"]));
  if (!ensStatus) ensStatus = ensName ? "ISSUED" : "NOT_ISSUED";

  const proofs = [];
  for (const item of asArray(firstDefined(source, ["proofs", "legacyProofs"]))) {
    const proof = parseProof(item);
    if (!proof) return null;
    proofs.push(proof);
  }

  const credentials = [];
  for (const item of asArray(firstDefined(source, ["credentials"]))) {
    const credential = parseCredential(item);
    if (!credential) return null;
    credentials.push(credential);
  }

  if (identityStatus === "READY" && !publicAddress) return null;
  if (ensStatus === "ISSUED" && !ensName) return null;

  return {
    passport: {
      publicAddress,
      identityStatus,
      ensName: ensStatus === "NOT_ISSUED" ? null : ensName,
      ensStatus,
      proofs,
      credentials,
      journeys: Array.isArray(firstDefined(source, ["journeys", "applications"]))
        ? firstDefined(source, ["journeys", "applications"])
        : undefined,
    },
  };
}

export function extractBearerDid(authorizationHeader) {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token || null;
}

export function mapBackendStatusToPassportError(status) {
  if (status === 401 || status === 403) return "INVALID_SESSION";
  if (status === 503) return "PASSPORT_UNAVAILABLE";
  if (status >= 500) return "BACKEND_UNAVAILABLE";
  return "UNEXPECTED_ERROR";
}

export function passportMeError(code) {
  return { error: code };
}

const SUPPORTED = [
  {
    id: "WORLD_IDENTITY_CHECK",
    title: "World Identity Check",
    matchKeys: [
      "WORLD_IDENTITY_CHECK",
      "IDENTITY_CHECK",
      "lisbon_identity_v1",
    ],
  },
  {
    id: "WORLD_SELFIE_CHECK",
    title: "World Selfie Check",
    matchKeys: [
      "WORLD_SELFIE_CHECK",
      "SELFIE_CHECK",
      "apply_lisbon_house_v1",
    ],
  },
];

function proofRecordKey(record) {
  const raw = record.type || record.key || record.proofType || record.action;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function statusFromRecord(record) {
  const value = (record.status || "").trim().toUpperCase();
  if (["COMPLETED", "COMPLETE", "SUCCESS", "VERIFIED"].includes(value)) {
    return "completed";
  }
  if (["FAILED", "FAILURE", "REJECTED"].includes(value)) return "failed";
  if (value === "EXPIRED") return "expired";
  if (record.completedAt || record.verifiedAt) return "completed";
  return "completed";
}

export function mergePassportProofs(backendProofs) {
  const records = Array.isArray(backendProofs) ? backendProofs : [];
  return SUPPORTED.map((definition) => {
    const matchKeys = new Set(definition.matchKeys.map((k) => k.toUpperCase()));
    const backendRecord =
      records.find((record) => {
        const key = proofRecordKey(record);
        return key ? matchKeys.has(key.toUpperCase()) : false;
      }) ?? null;
    return {
      id: definition.id,
      title: definition.title,
      status: backendRecord ? statusFromRecord(backendRecord) : "not_completed",
      verifiedAt: backendRecord?.verifiedAt || backendRecord?.completedAt || null,
      backendRecord,
    };
  });
}

export function passportProofStatusLabel(status) {
  if (status === "completed") return "Verified";
  if (status === "failed") return "Failed";
  if (status === "expired") return "Expired";
  if (status === "unavailable") return "Unavailable";
  return "Not completed";
}

export function getLisbonApplyReadiness(proofs) {
  const merged = mergePassportProofs(proofs);
  const identityProofOnPassport =
    merged.find((p) => p.id === "WORLD_IDENTITY_CHECK")?.status === "completed";
  const selfieProofOnPassport =
    merged.find((p) => p.id === "WORLD_SELFIE_CHECK")?.status === "completed";
  return {
    identityProofOnPassport,
    selfieProofOnPassport,
    canSubmit: identityProofOnPassport && selfieProofOnPassport,
  };
}

export function lisbonApplicationStatusLabel(status) {
  if (!status) return "Unknown";
  const value = String(status).trim().toUpperCase();
  if (value === "SUBMITTED") return "Application submitted";
  return status;
}

export function lisbonCredentialDisplay(credential) {
  const key = String(credential?.credentialKey || "").toUpperCase();
  if (key !== "NOMADIC_LISBON_HOUSE_ELIGIBLE") {
    return {
      title: credential?.displayName || credential?.credentialKey || "Credential",
    };
  }
  return {
    title: "Lisbon House Eligibility",
    description:
      "Confirms that this Passport satisfied the eligibility policy for Nomadic Lisbon House.",
    policyKey: "lisbon_house_policy_v1",
  };
}

/** Fixture must never invent proof/application/credential authority. */
export function fixtureCannotInventBackendState(fixture) {
  return (
    fixture?.source === "frontend-fixture" &&
    fixture?.application?.state === "not_started" &&
    !fixture?.application?.credentialIssued &&
    !fixture?.proofs?.identityCheck?.backendVerified
  );
}
