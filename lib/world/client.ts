/**
 * Client-safe World constants for Lisbon apply / Passport CTAs.
 * No secrets — only public action names and presets.
 */

import type {
  WorldAction,
  WorldEnvironment,
  WorldPreset,
} from "@/lib/world/types";

export const WORLD_IDENTITY_ACTION: WorldAction = "lisbon_identity_v1";
export const WORLD_SELFIE_ACTION: WorldAction = "apply_lisbon_house_v1";

export const WORLD_IDENTITY_PRESET: WorldPreset = "identityCheck";
export const WORLD_SELFIE_PRESET: WorldPreset = "selfieCheckLegacy";

export const WORLD_IDENTITY_MINIMUM_AGE = 18;

export function isWorldPublicConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WORLD_APP_ID?.trim());
}

export function readPublicWorldAppId(): string {
  return process.env.NEXT_PUBLIC_WORLD_APP_ID?.trim() ?? "";
}

/**
 * IDKit `environment` for the widget.
 * Use `staging` for the World Developer Portal simulator.
 * Defaults to production when unset.
 */
export function readPublicWorldEnvironment(): WorldEnvironment {
  const raw = (
    process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT ||
    process.env.WORLD_ENVIRONMENT ||
    "production"
  )
    .trim()
    .toLowerCase();

  if (raw === "staging" || raw === "sandbox") return raw;
  return "production";
}
