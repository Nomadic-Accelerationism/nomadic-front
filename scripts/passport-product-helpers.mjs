/**
 * Pure helpers mirroring lib/passport/proof-grid, display-name, explore-state,
 * ui-state, shell constants, and public passport sanitization for node:test.
 */

export const MOBILE_APP_MAX_WIDTH_PX = 430;

export const PRODUCT_NAV_ROUTES = [
  { id: "explore", label: "Explore", href: "/explore" },
  { id: "passport", label: "Passport", href: "/passport" },
];

export const HIDDEN_FROM_NAV_ROUTES = [
  "/testing/ensv2-stage5a",
  "/testing/lisbon-feedback",
  "/spikes/world",
  "/user-proofs",
  "/hacker-journeys",
  "/nacc-tokens",
  "/generate-single-use-id",
];

export function togglePassportBookState(current) {
  return current === "closed" ? "open" : "closed";
}

export function isPassportBookOpen(state) {
  return state === "open";
}

export function passportBookTitle(ensName, fallback = "Nomadic Passport") {
  if (typeof ensName !== "string" || !ensName.trim()) return fallback;
  const label = ensName.trim().toLowerCase().split(".")[0];
  if (!label) return fallback;
  const pretty = label.charAt(0).toUpperCase() + label.slice(1);
  return `${pretty}’s Passport`;
}

export function passportSharePath(ensName) {
  if (typeof ensName !== "string") return null;
  const trimmed = ensName.trim().toLowerCase();
  if (!trimmed || !trimmed.includes(".")) return null;
  return `/p/${encodeURIComponent(trimmed)}`;
}

const IDENTITY_MATCH_KEYS = new Set(
  [
    "WORLD_IDENTITY_CHECK",
    "IDENTITY_CHECK",
    "lisbon_identity_v1",
    "WORLD_IDENTITY",
  ].map((k) => k.toUpperCase())
);

function proofRecordKey(record) {
  const raw = record.type || record.key || record.proofType || record.action;
  if (typeof raw !== "string") return null;
  return raw.trim() || null;
}

function normalizeStatus(raw) {
  if (!raw) return null;
  const value = String(raw).trim().toUpperCase();
  if (["COMPLETED", "COMPLETE", "SUCCESS", "VERIFIED"].includes(value)) {
    return "verified";
  }
  if (["FAILED", "FAILURE", "REJECTED"].includes(value)) return "failed";
  if (value === "EXPIRED") return "expired";
  if (["UNAVAILABLE", "INTEGRATION_UNAVAILABLE", "NOT_AVAILABLE"].includes(value)) {
    return "unavailable";
  }
  if (["NOT_COMPLETED", "PENDING", "NOT_STARTED", "INCOMPLETE"].includes(value)) {
    return "incomplete";
  }
  return null;
}

function statusFromRecord(record) {
  const fromStatus = normalizeStatus(record.status);
  if (fromStatus) return fromStatus;
  if (record.expiredAt) return "expired";
  if (record.failedAt) return "failed";
  if (record.completedAt || record.verifiedAt) return "verified";
  return "verified";
}

function isCompletedIdentity(record) {
  return Boolean(record) && statusFromRecord(record) === "verified";
}

function recordMeta(record) {
  if (!record || typeof record.metadata !== "object" || !record.metadata) {
    return {};
  }
  return record.metadata;
}

function stringField(record, keys) {
  if (!record) return null;
  const bag = { ...record, ...recordMeta(record) };
  for (const key of keys) {
    const value = bag[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function boolField(record, keys) {
  if (!record) return false;
  const bag = { ...record, ...recordMeta(record) };
  for (const key of keys) {
    const value = bag[key];
    if (value === true) return true;
    if (typeof value === "string" && value.trim().toLowerCase() === "true") {
      return true;
    }
  }
  return false;
}

export function recordProvesOrb(record) {
  if (!isCompletedIdentity(record)) return false;
  if (boolField(record, ["orb", "orbVerified", "isOrb"])) return true;
  const level = stringField(record, [
    "verificationLevel",
    "verification_level",
    "level",
  ]);
  if (!level) return false;
  const normalized = level.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "orb" || normalized === "orb_verification";
}

export function recordProvesGovernmentId(record) {
  if (!isCompletedIdentity(record)) return false;
  if (
    boolField(record, [
      "documentVerified",
      "document_verified",
      "governmentId",
      "government_id",
    ])
  ) {
    return true;
  }
  const kind = stringField(record, ["documentType", "document_type", "idType"]);
  if (!kind) return false;
  const normalized = kind.trim().toLowerCase();
  return (
    normalized.includes("document") ||
    normalized.includes("government") ||
    normalized.includes("passport")
  );
}

export function recordHasCountryAttribute(record) {
  if (!isCompletedIdentity(record)) return false;
  if (boolField(record, ["hasCountry", "countryVerified"])) return true;
  return Boolean(
    stringField(record, ["country", "nationality", "issuing_country"])
  );
}

function findIdentityRecord(backendProofs) {
  const records = Array.isArray(backendProofs) ? backendProofs : [];
  return (
    records.find((record) => {
      const key = proofRecordKey(record);
      return key ? IDENTITY_MATCH_KEYS.has(key.toUpperCase()) : false;
    }) ?? null
  );
}

export function buildPassportProofGrid(backendProofs) {
  const identity = findIdentityRecord(backendProofs);
  const identityStatus = identity ? statusFromRecord(identity) : "incomplete";
  const ageStatus =
    identityStatus === "verified"
      ? "verified"
      : ["failed", "expired", "unavailable"].includes(identityStatus)
        ? identityStatus
        : "incomplete";

  const unique = recordProvesOrb(identity);
  const gov = recordProvesGovernmentId(identity);
  const country = recordHasCountryAttribute(identity);

  return [
    {
      id: "unique_human",
      title: "Unique human",
      status: unique ? "verified" : "incomplete",
      privacy: "Private",
      placeholder: false,
    },
    {
      id: "age_18",
      title: "18+",
      status: ageStatus,
      privacy: "Private",
      placeholder: false,
    },
    {
      id: "government_id",
      title: "Government ID",
      status: gov ? "verified" : "incomplete",
      privacy: "Private",
      placeholder: false,
    },
    {
      id: "country",
      title: "Country — Beta",
      status: country ? "verified" : "incomplete",
      privacy: "Private",
      placeholder: false,
    },
    {
      id: "contributions",
      title: "Contributions",
      status: "soon",
      privacy: "Private",
      placeholder: true,
    },
    {
      id: "skills",
      title: "Skills",
      status: "soon",
      privacy: "Private",
      placeholder: true,
    },
    {
      id: "references",
      title: "References",
      status: "soon",
      privacy: "Private",
      placeholder: true,
    },
    {
      id: "attendance",
      title: "Attendance",
      status: "soon",
      privacy: "Private",
      placeholder: true,
    },
  ];
}

export function mapCredentialTextsToStamp(credentialName, texts) {
  const hasSignal =
    Boolean(texts.metadata?.trim()) ||
    Boolean(texts.status?.trim()) ||
    Boolean(texts.issuedAt?.trim());
  if (!hasSignal) return null;
  return {
    ok: true,
    credentialName,
    title: "Lisbon House",
    eligibilityLabel: "Eligible",
    activityLabel: "Active",
    issuedBy: "Nomadic Lisbon House",
    verifiedOnEns: true,
  };
}

export function ensFailureStamp(credentialName, code) {
  return {
    ok: false,
    credentialName,
    code,
    message:
      code === "RESOLVER_UNAVAILABLE"
        ? "ENS resolver could not be reached."
        : "Credential unavailable.",
  };
}

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
];

export function sanitizePublicPassportPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = { ...value };
  for (const key of PII_KEYS) {
    delete record[key];
  }
  const stampsRaw = Array.isArray(record.stamps) ? record.stamps : [];
  return {
    passportName:
      typeof record.passportName === "string" ? record.passportName : null,
    displayName:
      typeof record.displayName === "string"
        ? record.displayName
        : "Nomadic Passport",
    primaryWallet:
      typeof record.primaryWallet === "string" ? record.primaryWallet : null,
    stamps: stampsRaw,
    verifiedOnEns: Boolean(record.verifiedOnEns),
  };
}

export function publicPassportContainsPii(value) {
  if (!value || typeof value !== "object") return false;
  const keys = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      keys.push(k);
      walk(v);
    }
  };
  walk(value);
  const forbidden = new Set(
    PII_KEYS.map((k) => k.toLowerCase()).concat(["didtoken", "email"])
  );
  return keys.some((k) => forbidden.has(k.toLowerCase()));
}

export function resolveLisbonExploreState({ credentials, journeys }) {
  const creds = Array.isArray(credentials) ? credentials : [];
  const hasEligible = creds.some(
    (c) =>
      typeof c.credentialKey === "string" &&
      c.credentialKey.trim().toUpperCase() === "NOMADIC_LISBON_HOUSE_ELIGIBLE"
  );
  if (hasEligible) return "eligible";
  const refs = Array.isArray(journeys) ? journeys : [];
  const hasApplication = refs.some((j) => {
    const status = typeof j.status === "string" ? j.status.toUpperCase() : "";
    const id = `${j.journeyId ?? ""} ${j.id ?? ""} ${j.title ?? ""}`.toLowerCase();
    return (
      id.includes("lisbon") &&
      (status.includes("SUBMIT") ||
        status.includes("APPLIED") ||
        status.includes("PENDING"))
    );
  });
  if (hasApplication) return "applied";
  if (creds.length || refs.length) return "not_applied";
  return "unknown";
}

export function productNavHrefs() {
  return PRODUCT_NAV_ROUTES.map((r) => r.href);
}

export function isHiddenFromNav(path) {
  return HIDDEN_FROM_NAV_ROUTES.includes(path);
}

export function stampUsesForbiddenCopy(stamp) {
  if (!stamp || !stamp.ok) return false;
  const blob = `${stamp.title} ${stamp.eligibilityLabel} ${stamp.activityLabel} ${stamp.issuedBy}`.toLowerCase();
  return ["accepted", "attended", "resident", "completed", "identity verified"].some(
    (word) => blob.includes(word)
  );
}
