/**
 * Production World ID helpers for Lisbon Journey apply.
 * RP signing key never leaves the server.
 */

export const WORLD_ACTIONS = [
  "lisbon_identity_v1",
  "apply_lisbon_house_v1",
] as const;

export type WorldAction = (typeof WORLD_ACTIONS)[number];

export type WorldPreset = "identityCheck" | "selfieCheckLegacy";

export type WorldEnvironment = "production" | "staging" | "sandbox";

export type WorldIdentityAttribute = {
  type: "minimum_age";
  value: number;
};

export type WorldRequestBody = {
  action: WorldAction;
  preset: WorldPreset;
  signal?: string;
  attributes?: WorldIdentityAttribute[];
};

export type WorldRpContext = {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
};

export type WorldBlockedCode =
  | "WORLD_DISABLED"
  | "MISSING_CREDENTIALS"
  | "ACTION_NOT_ALLOWLISTED"
  | "UNAUTHORIZED"
  | "INVALID_BODY"
  | "SIGNING_FAILED"
  | "VERIFY_UPSTREAM_ERROR"
  | "VERIFICATION_FAILED";

export type WorldVerifySummary = {
  success: boolean;
  action?: string;
  protocol_version?: string;
  environment?: string;
  nullifierPresent: boolean;
  nullifierFingerprint?: string;
  identity_attested?: boolean;
  user_presence_completed?: boolean;
  session_id_present: boolean;
  resultIdentifiers: string[];
  upstreamHttpStatus: number;
};

export type WorldRequestResponse =
  | {
      ok: true;
      action: WorldAction;
      preset: WorldPreset;
      app_id: string;
      rp_context: WorldRpContext;
      allow_legacy_proofs: boolean;
      environment: WorldEnvironment;
    }
  | {
      ok: false;
      code: WorldBlockedCode;
      detail: string;
    };

export type WorldVerifyResponse =
  | {
      ok: true;
      persisted: false;
      summary: WorldVerifySummary;
      note: string;
    }
  | {
      ok: false;
      code: WorldBlockedCode;
      detail: string;
      summary?: WorldVerifySummary;
      persisted: false;
    };

export function isWorldAction(value: unknown): value is WorldAction {
  return (
    typeof value === "string" &&
    (WORLD_ACTIONS as readonly string[]).includes(value)
  );
}

export function fingerprintNullifier(
  nullifier: string | undefined
): string | undefined {
  if (!nullifier || typeof nullifier !== "string") return undefined;
  if (nullifier.length < 10) return "short";
  return `${nullifier.slice(0, 6)}…${nullifier.slice(-4)}`;
}

export type WorldEnv = {
  enabled: boolean;
  signingKeyHex: string | undefined;
  appId: string | undefined;
  rpId: string | undefined;
  environment: WorldEnvironment;
  missing: string[];
};

/**
 * Server env for World. Public app id may come from NEXT_PUBLIC_*.
 * Prefer WORLD_* production names; fall back to WORLD_SPIKE_* during migration.
 */
export function readWorldEnv(): WorldEnv {
  const enabled =
    process.env.WORLD_ENABLED === "1" ||
    process.env.WORLD_ENABLED === "true" ||
    process.env.WORLD_SPIKE_ENABLED === "1" ||
    process.env.WORLD_SPIKE_ENABLED === "true";

  const signingKeyHex =
    process.env.WORLD_RP_SIGNING_KEY?.trim() ||
    process.env.WORLD_SPIKE_RP_SIGNING_KEY?.trim() ||
    undefined;

  const appId =
    process.env.NEXT_PUBLIC_WORLD_APP_ID?.trim() ||
    process.env.WORLD_APP_ID?.trim() ||
    process.env.NEXT_PUBLIC_WORLD_SPIKE_APP_ID?.trim() ||
    process.env.WORLD_SPIKE_APP_ID?.trim() ||
    undefined;

  const rpId =
    process.env.WORLD_RP_ID?.trim() ||
    process.env.WORLD_SPIKE_RP_ID?.trim() ||
    undefined;

  const environmentRaw = (
    process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT ||
    process.env.WORLD_ENVIRONMENT ||
    process.env.WORLD_SPIKE_ENVIRONMENT ||
    "production"
  ).toLowerCase();

  const environment: WorldEnvironment =
    environmentRaw === "staging" || environmentRaw === "sandbox"
      ? environmentRaw
      : "production";

  const missing: string[] = [];
  if (!signingKeyHex) missing.push("WORLD_RP_SIGNING_KEY");
  if (!appId) missing.push("NEXT_PUBLIC_WORLD_APP_ID");
  if (!rpId) missing.push("WORLD_RP_ID");

  return { enabled, signingKeyHex, appId, rpId, environment, missing };
}

export function isWorldConfiguredForClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WORLD_APP_ID?.trim());
}
