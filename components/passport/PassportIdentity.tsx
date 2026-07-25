"use client";

import { truncateAddress } from "@/lib/wallet";
import type {
  PassportEnsStatus,
  PassportIdentityStatus,
} from "@/lib/passport/types";

export type PassportIdentityProps = {
  publicAddress: `0x${string}` | null;
  identityStatus: PassportIdentityStatus;
  ensName: string | null;
  ensStatus: PassportEnsStatus;
};

export function PassportIdentity({
  publicAddress,
  identityStatus,
  ensName,
  ensStatus,
}: PassportIdentityProps) {
  const truncated =
    publicAddress && identityStatus === "READY"
      ? truncateAddress(publicAddress)
      : null;
  const hasWallet = Boolean(truncated);
  const hasEnsIssued =
    ensStatus === "ISSUED" &&
    typeof ensName === "string" &&
    ensName.trim().length > 0;

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
          {hasEnsIssued ? (
            <p className="mt-1 break-all text-base font-semibold text-black">
              {ensName!.trim()}
            </p>
          ) : hasWallet ? (
            <p className="mt-1 font-mono text-base font-semibold text-black">
              {truncated}
            </p>
          ) : (
            <p className="mt-1 text-base font-semibold text-black">
              Passport account active
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500">Wallet</p>
          {hasWallet && publicAddress ? (
            <p
              className="mt-1 break-all font-mono text-sm text-gray-800"
              title={publicAddress}
            >
              {truncated}
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              Your Nomadic account is active, but a Passport wallet could not be
              resolved.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500">ENS Passport</p>
          {hasEnsIssued ? (
            <p className="mt-1 break-all text-sm font-medium text-black">
              {ensName!.trim()}
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm font-medium text-gray-800">
                Not issued yet
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Your Passport will receive an ENS identity during the issuance
                step.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
