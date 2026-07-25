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
        "clay-surface clay-tone-mint w-full rounded-[28px] border-none p-5 text-left",
        !claimAvailable && "opacity-80",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-tight">{CREDENTIAL_NAME}</h3>
        <span className="clay-chip shrink-0 bg-clay-white px-3 py-1 text-xs font-bold text-clay-muted">
          Not claimed
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-clay-muted">
        {CREDENTIAL_DESCRIPTION}
      </p>
      {claimAvailable ? (
        <Button
          asChild
          variant="clayPrimary"
          size="clay"
          className="mt-5 w-full"
        >
          <Link href="/credentials/lisbon-2026">View credential</Link>
        </Button>
      ) : (
        <Button
          type="button"
          disabled
          variant="claySecondary"
          size="clay"
          className="mt-5 w-full"
        >
          Wallet required
        </Button>
      )}
    </article>
  );
}
