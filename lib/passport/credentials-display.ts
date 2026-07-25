import type { PassportCredential } from "@/lib/passport/types";
import {
  LISBON_ELIGIBLE_CREDENTIAL_KEY,
  LISBON_POLICY_KEY,
} from "@/lib/journeys/lisbon-applications";

export type CredentialDisplayModel = {
  credentialKey: string;
  title: string;
  description: string;
  statusLabel: string;
  policyKey: string | null;
  issuedAt: string | null;
  journeyLabel: string | null;
  ensStatusLabel: string;
  showEnsChild: boolean;
};

function metadataString(
  metadata: Record<string, unknown> | undefined,
  keys: string[]
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Map backend credentials to Passport UI models.
 * ENS child names are never invented.
 */
export function toCredentialDisplayModel(
  credential: PassportCredential,
  options?: { ensName?: string | null; ensStatus?: string | null }
): CredentialDisplayModel {
  const key = credential.credentialKey.trim().toUpperCase();
  const isLisbonEligible = key === LISBON_ELIGIBLE_CREDENTIAL_KEY;

  const policyKey =
    metadataString(credential.metadata, [
      "policyKey",
      "policyVersion",
      "policy_key",
    ]) || (isLisbonEligible ? LISBON_POLICY_KEY : null);

  const journeyLabel =
    metadataString(credential.metadata, [
      "journeyTitle",
      "journeyName",
      "journey",
    ]) || (isLisbonEligible ? "Nomadic Lisbon House" : null);

  const ensIssued =
    options?.ensStatus === "ISSUED" && Boolean(options.ensName);

  return {
    credentialKey: credential.credentialKey,
    title: isLisbonEligible
      ? "Lisbon House Eligibility"
      : credential.displayName || credential.credentialKey,
    description: isLisbonEligible
      ? "Confirms that this Passport satisfied the eligibility policy for Nomadic Lisbon House."
      : credential.description ||
        "Credential issued by a Nomadic community.",
    statusLabel: "Active",
    policyKey,
    issuedAt: credential.claimedAt ?? null,
    journeyLabel,
    ensStatusLabel: ensIssued
      ? `ENS: ${options?.ensName}`
      : "ENS: not issued",
    showEnsChild: ensIssued,
  };
}
