/** Closed/open Passport booklet UI state helpers (pure, testable). */

export type PassportBookState = "closed" | "open";

export function togglePassportBookState(
  current: PassportBookState
): PassportBookState {
  return current === "closed" ? "open" : "closed";
}

export function isPassportBookOpen(state: PassportBookState): boolean {
  return state === "open";
}
