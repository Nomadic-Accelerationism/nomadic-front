"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const truncated =
    publicAddress && identityStatus === "READY"
      ? truncateAddress(publicAddress)
      : null;
  const hasWallet = Boolean(truncated);
  const hasEnsIssued =
    ensStatus === "ISSUED" &&
    typeof ensName === "string" &&
    ensName.trim().length > 0;

  const handleCopyAddress = useCallback(async () => {
    if (!publicAddress) return;
    try {
      await navigator.clipboard.writeText(publicAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [publicAddress]);

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
            <div className="mt-1 flex items-center gap-2">
              <p
                className="min-w-0 flex-1 break-all font-mono text-sm text-gray-800"
                title={publicAddress}
              >
                {truncated}
              </p>
              <button
                type="button"
                onClick={() => void handleCopyAddress()}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff671e]/focus-visible:ring-offset-2 ${
                  copied ? "text-emerald-700" : "text-gray-700"
                }`}
                aria-label={
                  copied
                    ? "Wallet address copied"
                    : "Copy Magic wallet address"
                }
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              Your Nomadic account is active, but a Passport wallet could not be
              resolved.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500">Passport name</p>
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
                Choose your Passport name to finish setting up.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
