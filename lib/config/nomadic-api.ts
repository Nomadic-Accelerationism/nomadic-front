/**
 * Central Nomadic backend API configuration.
 *
 * Single source of truth for `NEXT_PUBLIC_NOMADIC_API_URL`.
 * Do not hardcode production URLs in components or route handlers.
 *
 * Production (Vercel): https://nomadic-back-roan.vercel.app
 */

export const NOMADIC_API_CONFIG_ERROR_CODE = "MISSING_API_CONFIG" as const;

export class NomadicApiConfigError extends Error {
  readonly code = NOMADIC_API_CONFIG_ERROR_CODE;

  constructor(message = "NEXT_PUBLIC_NOMADIC_API_URL is not configured") {
    super(message);
    this.name = "NomadicApiConfigError";
  }
}

/** True when a non-empty backend base URL is present. */
export function isNomadicApiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_NOMADIC_API_URL?.trim());
}

/**
 * Returns the normalized backend base URL (no trailing slash).
 * Throws {@link NomadicApiConfigError} when unset — never returns undefined.
 */
export function getNomadicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_NOMADIC_API_URL?.trim();
  if (!raw) {
    throw new NomadicApiConfigError();
  }
  return raw.replace(/\/+$/, "");
}

/**
 * Joins a path onto the configured backend base URL.
 * `path` may be with or without a leading slash.
 */
export function getNomadicApiUrl(path: string): string {
  const base = getNomadicApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Client-safe probe: returns the base URL or null when misconfigured.
 * Prefer {@link getNomadicApiBaseUrl} in server routes so missing config fails loudly.
 */
export function peekNomadicApiBaseUrl(): string | null {
  try {
    return getNomadicApiBaseUrl();
  } catch {
    return null;
  }
}
