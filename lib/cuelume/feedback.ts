/**
 * Thin wrappers around Cuelume so product code stays readable.
 * Mapping (product):
 * - success → something good completed
 * - tick    → button / control click
 * - bloom   → negative / blocked / can't proceed
 */

import { play, type SoundName } from "cuelume";

export type CueName = Extract<SoundName, "success" | "tick" | "bloom">;

export function playCue(name: CueName): void {
  if (typeof window === "undefined") return;
  try {
    play(name);
  } catch {
    // Autoplay / Web Audio blocked — silent no-op.
  }
}

export function playSuccess(): void {
  playCue("success");
}

export function playTick(): void {
  playCue("tick");
}

/** Negative / blocked / can't-do feedback. */
export function playBloom(): void {
  playCue("bloom");
}
