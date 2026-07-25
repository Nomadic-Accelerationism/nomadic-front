/**
 * Client-safe World constants for Lisbon apply / Passport CTAs.
 * No secrets — only public action names and presets.
 */

import type { WorldAction, WorldPreset } from "@/lib/world/types";

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

export function readPublicWorldEnvironment(): string {
  return process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT?.trim() || "production";
}
