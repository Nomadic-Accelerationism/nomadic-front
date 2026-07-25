/**
 * World ID spike — typed adapters and allowlisted actions.
 * Non-production. No Prisma, UserProofs, CredentialClaim, or proof persistence.
 */

export const WORLD_SPIKE_NAMESPACE = "spikes/world" as const;

/** Allowlisted spike actions only — never production claim actions. */
export const WORLD_SPIKE_ACTIONS = [
  "spike_world_idkit_v1",
  "spike_identity_lisbon_v1",
  "spike_selfie_lisbon_v1",
] as const;

export type WorldSpikeAction = (typeof WORLD_SPIKE_ACTIONS)[number];

export type WorldSpikePreset = "identityCheck" | "selfieCheckLegacy";

export type WorldIdentityAttributeType =
  | "minimum_age"
  | "nationality"
  | "issuing_country"
  | "document_type"
  | "document_number"
  | "full_name";

export type WorldSpikeIdentityAttribute =
  | { type: "minimum_age"; value: number }
  | { type: "nationality"; value: string }
  | { type: "issuing_country"; value: string }
  | { type: "document_type"; value: "passport" | "eid" | "mnc" }
  | { type: "document_number"; value: string }
  | { type: "full_name"; value: string };

export type WorldSpikeRequestBody = {
  action: WorldSpikeAction;
  preset: WorldSpikePreset;
  /** Optional signal bound into Selfie / legacy proofs — enforce same value on verify later. */
  signal?: string;
  /** Identity Check attributes — ignored for selfie preset. */
  attributes?: WorldSpikeIdentityAttribute[];
};

export type WorldSpikeRpContext = {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
};

export type WorldSpikeRequestResponse =
  | {
      ok: true;
      execution: "ready";
      action: WorldSpikeAction;
      preset: WorldSpikePreset;
      app_id: string;
      rp_context: WorldSpikeRpContext;
      allow_legacy_proofs: boolean;
      environment: "production" | "staging" | "sandbox";
      /** Client hint only — never secrets. */
      clientHint: {
        identityCheckUsesAllowLegacyFalse: boolean;
        selfieRequiresAllowLegacyTrue: boolean;
        combineInOneRequest: "not_confirmed";
      };
    }
  | {
      ok: false;
      execution: "blocked";
      code: WorldSpikeBlockedCode;
      detail: string;
    };

export type WorldSpikeBlockedCode =
  | "SPIKE_DISABLED"
  | "MISSING_CREDENTIALS"
  | "ACTION_NOT_ALLOWLISTED"
  | "UNAUTHORIZED"
  | "INVALID_BODY"
  | "SIGNING_FAILED"
  | "VERIFY_BLOCKED"
  | "VERIFY_UPSTREAM_ERROR"
  | "PRODUCTION_CLAIM_FORBIDDEN";

/**
 * Sanitized verify summary — never includes raw proof arrays or full upstream body.
 */
export type WorldSpikeVerifySummary = {
  success: boolean;
  action?: string;
  protocol_version?: string;
  environment?: string;
  /** Present when portal / result exposes a nullifier — truncated in logs only; full value returned to caller for spike inspection. */
  nullifierPresent: boolean;
  nullifierFingerprint?: string;
  identity_attested?: boolean;
  user_presence_completed?: boolean;
  session_id_present: boolean;
  resultIdentifiers: string[];
  upstreamHttpStatus: number;
};

export type WorldSpikeVerifyResponse =
  | {
      ok: true;
      execution: "ready";
      persisted: false;
      summary: WorldSpikeVerifySummary;
      note: "Spike only — result was not stored; cannot mint credentials.";
    }
  | {
      ok: false;
      execution: "blocked" | "failed";
      code: WorldSpikeBlockedCode | "VERIFICATION_FAILED";
      detail: string;
      summary?: WorldSpikeVerifySummary;
      persisted: false;
    };

export function isWorldSpikeAction(value: unknown): value is WorldSpikeAction {
  return (
    typeof value === "string" &&
    (WORLD_SPIKE_ACTIONS as readonly string[]).includes(value)
  );
}

/** Reject anything that looks like a production Journey claim action. */
export function isForbiddenProductionAction(action: string): boolean {
  const lowered = action.toLowerCase();
  return (
    lowered.includes("claim") ||
    lowered.includes("credential") ||
    lowered === "apply_lisbon_house_v1" ||
    lowered.startsWith("lisbon_identity_v1")
  );
}

export function fingerprintNullifier(nullifier: string | undefined): string | undefined {
  if (!nullifier || typeof nullifier !== "string") return undefined;
  if (nullifier.length < 10) return "short";
  return `${nullifier.slice(0, 6)}…${nullifier.slice(-4)}`;
}

export type WorldSpikeEnv = {
  enabled: boolean;
  signingKeyHex: string | undefined;
  appId: string | undefined;
  rpId: string | undefined;
  environment: "production" | "staging" | "sandbox";
  missing: string[];
};

export function readWorldSpikeEnv(): WorldSpikeEnv {
  const enabled =
    process.env.WORLD_SPIKE_ENABLED === "1" ||
    process.env.WORLD_SPIKE_ENABLED === "true";

  const signingKeyHex = process.env.WORLD_SPIKE_RP_SIGNING_KEY?.trim() || undefined;
  const appId =
    process.env.NEXT_PUBLIC_WORLD_SPIKE_APP_ID?.trim() ||
    process.env.WORLD_SPIKE_APP_ID?.trim() ||
    undefined;
  const rpId = process.env.WORLD_SPIKE_RP_ID?.trim() || undefined;
  const environmentRaw = (process.env.WORLD_SPIKE_ENVIRONMENT || "sandbox").toLowerCase();
  const environment =
    environmentRaw === "production" || environmentRaw === "staging"
      ? environmentRaw
      : "sandbox";

  const missing: string[] = [];
  if (!signingKeyHex) missing.push("WORLD_SPIKE_RP_SIGNING_KEY");
  if (!appId) missing.push("WORLD_SPIKE_APP_ID or NEXT_PUBLIC_WORLD_SPIKE_APP_ID");
  if (!rpId) missing.push("WORLD_SPIKE_RP_ID");

  return { enabled, signingKeyHex, appId, rpId, environment, missing };
}
