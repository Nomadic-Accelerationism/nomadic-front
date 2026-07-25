/**
 * Lightweight wallet display helpers for Passport UI.
 * Does not perform ENS resolution or ownership checks.
 */

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function isPlausibleEthAddress(value: unknown): value is string {
  return typeof value === 'string' && ETH_ADDRESS_RE.test(value.trim());
}

/**
 * Returns a truncated address for display, or null when the value is empty/malformed.
 * Never invents or "fixes" invalid addresses.
 */
export function truncateAddress(
  value: unknown,
  options: { leading?: number; trailing?: number } = {}
): string | null {
  if (typeof value !== 'string') return null;
  const address = value.trim();
  if (!address) return null;
  if (!isPlausibleEthAddress(address)) return null;

  const leading = options.leading ?? 6;
  const trailing = options.trailing ?? 4;
  if (address.length <= leading + trailing) return address;
  return `${address.slice(0, leading)}…${address.slice(-trailing)}`;
}
