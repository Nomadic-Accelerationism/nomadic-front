/**
 * Pure Passport helpers for node:test (no Next runtime).
 * Keep in sync with lib/passport/* TypeScript sources.
 */

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseIdentityStatus(value) {
  return value === "READY" || value === "WALLET_UNAVAILABLE" ? value : null;
}

function parseEnsStatus(value) {
  return value === "NOT_ISSUED" || value === "ISSUED" ? value : null;
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
  const proof = {};
  if (typeof value.type === "string") proof.type = value.type;
  if (typeof value.key === "string") proof.key = value.key;
  if (typeof value.proofType === "string") proof.proofType = value.proofType;
  if (typeof value.status === "string") proof.status = value.status;
  if (value.completedAt === null || typeof value.completedAt === "string") {
    proof.completedAt = value.completedAt;
  }
  return proof;
}

function parseCredential(value) {
  if (!isRecord(value)) return null;
  if (typeof value.credentialKey !== "string" || !value.credentialKey.trim()) {
    return null;
  }
  return {
    credentialKey: value.credentialKey.trim(),
    displayName:
      typeof value.displayName === "string" ? value.displayName : undefined,
  };
}

export function parsePrivatePassportResponse(raw) {
  if (!isRecord(raw) || !isRecord(raw.passport)) return null;
  const p = raw.passport;
  const identityStatus = parseIdentityStatus(p.identityStatus);
  const ensStatus = parseEnsStatus(p.ensStatus);
  const publicAddress = parsePublicAddress(p.publicAddress);
  if (!identityStatus || !ensStatus || publicAddress === undefined) return null;
  if (!Array.isArray(p.proofs) || !Array.isArray(p.credentials)) return null;

  const proofs = [];
  for (const item of p.proofs) {
    const proof = parseProof(item);
    if (!proof) return null;
    proofs.push(proof);
  }

  const credentials = [];
  for (const item of p.credentials) {
    const credential = parseCredential(item);
    if (!credential) return null;
    credentials.push(credential);
  }

  if (identityStatus === "READY" && !publicAddress) return null;
  if (ensStatus === "ISSUED" && !(typeof p.ensName === "string" && p.ensName.trim())) {
    return null;
  }

  return {
    passport: {
      publicAddress,
      identityStatus,
      ensName:
        ensStatus === "NOT_ISSUED"
          ? null
          : typeof p.ensName === "string"
            ? p.ensName.trim() || null
            : null,
      ensStatus,
      proofs,
      credentials,
      journeys: Array.isArray(p.journeys) ? p.journeys : undefined,
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
    matchKeys: ["WORLD_IDENTITY_CHECK", "IDENTITY_CHECK"],
  },
  {
    id: "WORLD_SELFIE_CHECK",
    title: "World Selfie Check",
    matchKeys: ["WORLD_SELFIE_CHECK", "SELFIE_CHECK"],
  },
];

function proofRecordKey(record) {
  const raw = record.type || record.key || record.proofType;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function statusFromRecord(record) {
  const value = (record.status || "").trim().toUpperCase();
  if (["COMPLETED", "COMPLETE", "SUCCESS", "VERIFIED"].includes(value)) {
    return "completed";
  }
  if (["FAILED", "FAILURE", "REJECTED"].includes(value)) return "failed";
  if (value === "EXPIRED") return "expired";
  if (record.completedAt) return "completed";
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
      backendRecord,
    };
  });
}
