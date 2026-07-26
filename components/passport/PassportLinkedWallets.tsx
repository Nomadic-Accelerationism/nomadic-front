"use client";

import { truncateAddress } from "@/lib/wallet";

export type PassportLinkedWalletsProps = {
  publicAddress: `0x${string}` | null;
};

export function PassportLinkedWallets({
  publicAddress,
}: PassportLinkedWalletsProps) {
  const abbreviated = truncateAddress(publicAddress);

  return (
    <section aria-labelledby="passport-wallets-heading">
      <h2
        id="passport-wallets-heading"
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nomadic-muted)]"
      >
        Linked wallets
      </h2>
      <div className="surface-soft px-3 py-3">
        <p className="text-[11px] font-medium text-[var(--nomadic-muted)]">
          Primary wallet
        </p>
        {abbreviated && publicAddress ? (
          <p
            className="mt-1 font-mono text-sm font-semibold text-[var(--nomadic-ink)]"
            title={publicAddress}
            data-wallet="primary"
          >
            {abbreviated}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--nomadic-muted)]">
            Wallet unavailable
          </p>
        )}
        <button
          type="button"
          disabled
          className="btn-nomadic btn-nomadic-quiet mt-3 w-full !min-h-9 border-dashed text-xs opacity-70"
        >
          Add wallet · Soon
        </button>
      </div>
    </section>
  );
}
