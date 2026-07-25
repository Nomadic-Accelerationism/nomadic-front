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

function parseIdentityStatus(value: unknown): PassportIdentityStatus | null {
  return value === "READY" || value === "WALLET_UNAVAILABLE" ? value : null;
}

function parseEnsStatus(value: unknown): PassportEnsStatus | null {
  return value === "NOT_ISSUED" || value === "ISSUED" ? value : null;
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
  if (typeof value.status === "string") proof.status = value.status;
  if (value.completedAt === null || typeof value.completedAt === "string") {
    proof.completedAt = value.completedAt;
  }
  if (value.failedAt === null || typeof value.failedAt === "string") {
    proof.failedAt = value.failedAt;
  }
  if (value.expiredAt === null || typeof value.expiredAt === "string") {
    proof.expiredAt = value.expiredAt;
  }
  return proof;
}

function parseCredential(value: unknown): PassportCredential | null {
  if (!isRecord(value)) return null;
  if (typeof value.credentialKey !== "string" || !value.credentialKey.trim()) {
    return null;
  }
  const credential: PassportCredential = {
    credentialKey: value.credentialKey.trim(),
  };
  if (typeof value.displayName === "string") {
    credential.displayName = value.displayName;
  }
  if (typeof value.description === "string") {
    credential.description = value.description;
  }
  if (typeof value.claimedAt === "string") {
    credential.claimedAt = value.claimedAt;
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

/**
 * Validates the basic private Passport response shape before UI use.
 * Returns null when the payload cannot be trusted.
 */
export function parsePrivatePassportResponse(
  raw: unknown
): PrivatePassportResponse | null {
  if (!isRecord(raw) || !isRecord(raw.passport)) return null;

  const p = raw.passport;
  const identityStatus = parseIdentityStatus(p.identityStatus);
  const ensStatus = parseEnsStatus(p.ensStatus);
  const publicAddress = parsePublicAddress(p.publicAddress);

  if (!identityStatus || !ensStatus || publicAddress === undefined) {
    return null;
  }

  if (!Array.isArray(p.proofs) || !Array.isArray(p.credentials)) {
    return null;
  }

  const proofs: PassportProof[] = [];
  for (const item of p.proofs) {
    const proof = parseProof(item);
    if (!proof) return null;
    proofs.push(proof);
  }

  const credentials: PassportCredential[] = [];
  for (const item of p.credentials) {
    const credential = parseCredential(item);
    if (!credential) return null;
    credentials.push(credential);
  }

  const passport: PrivatePassport = {
    publicAddress,
    identityStatus,
    ensName:
      p.ensName === null
        ? null
        : typeof p.ensName === "string"
          ? p.ensName.trim() || null
          : null,
    ensStatus,
    proofs,
    credentials,
  };

  if (typeof p.userId === "string" && p.userId.trim()) {
    passport.userId = p.userId.trim();
  }

  if (Array.isArray(p.journeys)) {
    const journeys: PassportJourneyReference[] = [];
    for (const item of p.journeys) {
      const ref = parseJourneyRef(item);
      if (ref) journeys.push(ref);
    }
    passport.journeys = journeys;
  }

  // Consistency: READY requires a wallet; WALLET_UNAVAILABLE should not claim a wallet.
  if (identityStatus === "READY" && !publicAddress) return null;
  if (identityStatus === "WALLET_UNAVAILABLE" && publicAddress) {
    // Prefer explicit status; still accept wallet if backend sent both (defensive).
  }
  if (ensStatus === "ISSUED" && !passport.ensName) return null;
  if (ensStatus === "NOT_ISSUED") {
    passport.ensName = null;
  }

  return { passport };
}
