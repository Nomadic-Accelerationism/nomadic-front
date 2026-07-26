/**
 * Explore card eligibility / application state from real Passport data only.
 * Never invent Eligible from fixture discovery copy.
 */

import type {
  PassportCredential,
  PassportJourneyReference,
} from "@/lib/passport/types";
import { LISBON_ELIGIBLE_CREDENTIAL_KEY } from "@/lib/journeys/lisbon-applications";

export type ExploreEligibilityState =
  | "unknown"
  | "not_applied"
  | "applied"
  | "eligible";

export function resolveLisbonExploreState(options: {
  credentials?: PassportCredential[] | null;
  journeys?: PassportJourneyReference[] | null;
}): ExploreEligibilityState {
  const credentials = Array.isArray(options.credentials)
    ? options.credentials
    : [];
  const hasEligible = credentials.some(
    (c) =>
      typeof c.credentialKey === "string" &&
      c.credentialKey.trim().toUpperCase() === LISBON_ELIGIBLE_CREDENTIAL_KEY
  );
  if (hasEligible) return "eligible";

  const journeys = Array.isArray(options.journeys) ? options.journeys : [];
  const hasApplication = journeys.some((j) => {
    const status = typeof j.status === "string" ? j.status.toUpperCase() : "";
    const id = `${j.journeyId ?? ""} ${j.id ?? ""} ${j.title ?? ""}`.toLowerCase();
    const looksLisbon = id.includes("lisbon");
    const submitted =
      status.includes("SUBMIT") ||
      status.includes("APPLIED") ||
      status.includes("PENDING") ||
      status.includes("ACTIVE");
    return looksLisbon && submitted;
  });
  if (hasApplication) return "applied";

  if (credentials.length || journeys.length) return "not_applied";
  return "unknown";
}

export function exploreEligibilityLabel(
  state: ExploreEligibilityState
): string {
  switch (state) {
    case "eligible":
      return "Eligible";
    case "applied":
      return "Application submitted";
    case "not_applied":
      return "Not applied";
    default:
      return "Check eligibility";
  }
}
