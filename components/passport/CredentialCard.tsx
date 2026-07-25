"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CREDENTIAL_NAME = "Nomadic Lisbon 2026";
const CREDENTIAL_DESCRIPTION =
  "A World Selfie Check–verified credential claimed through Nomadic during ETHGlobal Lisbon 2026.";

interface CredentialCardProps {
  /** When false, the CTA is disabled and the card shows an unavailable state. */
  claimAvailable?: boolean;
  className?: string;
}

export function CredentialCard({
  claimAvailable = true,
  className,
}: CredentialCardProps) {
  return (
    <article
      className={cn(
        "w-full rounded-2xl border border-black/80 bg-white p-5 text-left shadow-sm",
        !claimAvailable && "opacity-80",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-tight">{CREDENTIAL_NAME}</h3>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          Not claimed
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        {CREDENTIAL_DESCRIPTION}
      </p>
      {claimAvailable ? (
        <Button
          asChild
          className="mt-5 h-12 w-full rounded-xl bg-[#ff671e] text-base font-bold text-black hover:bg-orange-500"
        >
          <Link href="/credentials/lisbon-2026">View credential</Link>
        </Button>
      ) : (
        <Button
          type="button"
          disabled
          className="mt-5 h-12 w-full rounded-xl bg-gray-200 text-base font-bold text-gray-500"
        >
          Wallet required
        </Button>
      )}
    </article>
  );
}
