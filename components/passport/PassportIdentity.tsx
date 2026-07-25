"use client";

import { truncateAddress } from "@/lib/wallet";

interface PassportIdentityProps {
  publicAddress: string;
}

export function PassportIdentity({ publicAddress }: PassportIdentityProps) {
  const truncated = truncateAddress(publicAddress);
  const hasWallet = Boolean(truncated);

  return (
    <section className="clay-surface clay-tone-sky w-full px-5 py-6 text-center" aria-labelledby="passport-identity-heading">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-clay-muted">Identity</p>
      <h2 id="passport-identity-heading" className="sr-only">
        Passport identity
      </h2>
      {hasWallet ? (
        <p
          className="mt-3 break-all font-mono text-lg font-bold tracking-tight text-clay-ink"
          title={publicAddress.trim()}
        >
          {truncated}
        </p>
      ) : (
        <div className="clay-surface clay-tone-white mt-4 rounded-[22px] border-none px-4 py-5 text-left">
          <p className="text-base font-bold text-clay-ink">Wallet unavailable</p>
          <p className="mt-2 text-sm leading-relaxed text-clay-muted">
            Your Nomadic session is active, but no wallet address is connected
            yet. The public Passport identity layer needs a trusted wallet
            before ENS and sharing can work.
          </p>
        </div>
      )}
    </section>
  );
}
