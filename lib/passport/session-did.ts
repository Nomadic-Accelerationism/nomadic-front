/**
 * Resolve a Magic DID for authenticated BFF calls using the existing session architecture.
 *
 * Preference order:
 * 1. Fresh ID token from an active Magic client session (when available)
 * 2. DID stored after successful `/validaOTP` (existing AuthService / UserContext)
 *
 * Limitation: after a full browser refresh, Magic iframe session may not restore
 * even if localStorage still has a DID. Callers should treat backend 401 as
 * INVALID_SESSION and clear/redirect via existing logout — we do not invent
 * unsafe long-lived token persistence beyond what LoginUser already stores.
 *
 * Never log the DID.
 */

import { Magic } from "magic-sdk";

let magicSingleton: Magic | null | undefined;

function getMagicClient(): Magic | null {
  if (typeof window === "undefined") return null;
  if (magicSingleton !== undefined) return magicSingleton;

  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY?.trim();
  if (!key) {
    magicSingleton = null;
    return null;
  }

  try {
    magicSingleton = new Magic(key);
  } catch {
    magicSingleton = null;
  }
  return magicSingleton;
}

export async function resolveSessionDidToken(
  storedDidToken: string | null | undefined
): Promise<string | null> {
  const stored =
    typeof storedDidToken === "string" && storedDidToken.trim()
      ? storedDidToken.trim()
      : null;

  const magic = getMagicClient();
  if (magic) {
    try {
      const loggedIn = await magic.user.isLoggedIn();
      if (loggedIn) {
        const fresh = await magic.user.getIdToken();
        if (typeof fresh === "string" && fresh.trim()) {
          return fresh.trim();
        }
      }
    } catch {
      // Fall through to stored DID from Nomadic login session.
    }
  }

  return stored;
}
