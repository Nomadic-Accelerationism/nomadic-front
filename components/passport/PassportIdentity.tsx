"use client";

import { truncateAddress } from "@/lib/wallet";

interface PassportIdentityProps {
  publicAddress: string;
}

export function PassportIdentity({ publicAddress }: PassportIdentityProps) {
  const truncated = truncateAddress(publicAddress);
  const hasWallet = Boolean(truncated);

  return (
    <section className="w-full text-center" aria-labelledby="passport-identity-heading">
      <p className="text-sm text-gray-600">Identity</p>
      <h2 id="passport-identity-heading" className="sr-only">
        Passport identity
      </h2>
      {hasWallet ? (
        <p
          className="mt-2 break-all font-mono text-lg font-semibold tracking-tight text-black"
          title={publicAddress.trim()}
        >
          {truncated}
        </p>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-gray-400 bg-white/70 px-4 py-5 text-left">
          <p className="text-base font-semibold text-black">Wallet unavailable</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Your Nomadic session is active, but no wallet address is connected
            yet. The public Passport identity layer needs a trusted wallet
            before ENS and sharing can work.
          </p>
        </div>
      )}
    </section>
  );
}
