/**
 * Resolve a Magic DID for authenticated BFF calls using the existing session architecture.
 *
 * Preference order:
 * 1. Fresh ID token from an active Magic client session (when available)
 * 2. DID stored after successful `/validaOTP` (existing AuthService / UserContext)
 *
 * Uses the shared Sepolia Magic singleton only — never constructs a second
 * Magic client here. A default-network instance on /start races the provision
 * sender and trips the multi-iframe guard before eth_sendTransaction opens.
 *
 * Limitation: after a full browser refresh, Magic iframe session may not restore
 * even if localStorage still has a DID. Callers should treat backend 401 as
 * INVALID_SESSION and clear/redirect via existing logout — we do not invent
 * unsafe long-lived token persistence beyond what LoginUser already stores.
 *
 * Never log the DID.
 */

import { getSepoliaMagic } from "@/lib/magic/sepolia-singleton";

export async function resolveSessionDidToken(
  storedDidToken: string | null | undefined
): Promise<string | null> {
  const stored =
    typeof storedDidToken === "string" && storedDidToken.trim()
      ? storedDidToken.trim()
      : null;

  const magic = getSepoliaMagic();
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
