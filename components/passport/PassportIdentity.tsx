"use client";

import { truncateAddress } from "@/lib/wallet";

interface PassportIdentityProps {
  publicAddress: string;
  /** Display name when available (e.g. future Passport ENS). Never invent one. */
  displayIdentity?: string | null;
}

export function PassportIdentity({
  publicAddress,
  displayIdentity = null,
}: PassportIdentityProps) {
  const truncated = truncateAddress(publicAddress);
  const hasWallet = Boolean(truncated);
  const hasEnsPassport =
    typeof displayIdentity === "string" &&
    displayIdentity.trim().length > 0 &&
    displayIdentity.includes(".");

  return (
    <section className="w-full text-left" aria-labelledby="passport-identity-heading">
      <h2
        id="passport-identity-heading"
        className="text-sm font-semibold uppercase tracking-wide text-gray-700"
      >
        Identity
      </h2>

      <div className="mt-3 space-y-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-4">
        <div>
          <p className="text-xs font-medium text-gray-500">Display identity</p>
          {hasEnsPassport ? (
            <p className="mt-1 break-all text-base font-semibold text-black">
              {displayIdentity!.trim()}
            </p>
          ) : (
            <p className="mt-1 text-base font-semibold text-black">
              {hasWallet ? truncated : "Session active"}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500">Wallet</p>
          {hasWallet ? (
            <p
              className="mt-1 break-all font-mono text-sm text-gray-800"
              title={publicAddress.trim()}
            >
              {truncated}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-600">
              No wallet address is bound to this session yet.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500">ENS Passport</p>
          {hasEnsPassport ? (
            <p className="mt-1 break-all text-sm font-medium text-black">
              {displayIdentity!.trim()}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-700">ENS Passport not issued yet</p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Product identity will use a Sepolia Passport name when issuance is
            available. Nomadic will not show a name as owned until it is issued.
          </p>
        </div>
      </div>
    </section>
  );
}
