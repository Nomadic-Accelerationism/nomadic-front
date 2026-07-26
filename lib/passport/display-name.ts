/**
 * Derive Passport display labels from real ENS / wallet identity.
 * Never invent an ENS name that the backend did not issue.
 */

export function ensLabelFromName(ensName: string | null | undefined): string | null {
  if (typeof ensName !== "string") return null;
  const trimmed = ensName.trim().toLowerCase();
  if (!trimmed) return null;
  const label = trimmed.split(".")[0];
  return label || null;
}

export function passportBookTitle(
  ensName: string | null | undefined,
  fallback = "Nomadic Passport"
): string {
  const label = ensLabelFromName(ensName);
  if (!label) return fallback;
  const pretty = label.charAt(0).toUpperCase() + label.slice(1);
  return `${pretty}’s Passport`;
}

export function passportSharePath(ensName: string | null | undefined): string | null {
  if (typeof ensName !== "string") return null;
  const trimmed = ensName.trim().toLowerCase();
  if (!trimmed || !trimmed.includes(".")) return null;
  return `/p/${encodeURIComponent(trimmed)}`;
}

export function lisbonCredentialNameFromPassport(
  ensName: string | null | undefined
): string | null {
  if (typeof ensName !== "string") return null;
  const trimmed = ensName.trim().toLowerCase();
  if (!trimmed.endsWith(".nomadic-passport.eth")) return null;
  return `lisbon-house.${trimmed}`;
}
