"use client";

import { Loader2 } from "lucide-react";
import { useEnsCredentialStamp } from "@/hooks/useEnsCredentialStamp";

export type PassportCommunityStampsProps = {
  ensName: string | null;
};

export function PassportCommunityStamps({
  ensName,
}: PassportCommunityStampsProps) {
  const { stamp, isLoading, refetch } = useEnsCredentialStamp(ensName);

  return (
    <section aria-labelledby="passport-stamps-heading">
      <h2
        id="passport-stamps-heading"
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nomadic-muted)]"
      >
        Community stamps
      </h2>

      {isLoading ? (
        <div
          className="surface-soft flex items-center gap-2 px-3 py-4 text-xs text-[var(--nomadic-muted)]"
          role="status"
          data-state="ens-loading"
        >
          <Loader2
            className="h-4 w-4 animate-spin text-[var(--nomadic-orange)]"
            aria-hidden
          />
          Loading credential…
        </div>
      ) : null}

      {!isLoading && stamp?.ok ? (
        <article
          className="surface-clay relative overflow-hidden px-4 py-3.5"
          data-stamp="lisbon-house"
          data-verified-on-ens="true"
        >
          <div
            className="pointer-events-none absolute -right-2 -top-2 h-14 w-14 rounded-full border border-[var(--nomadic-orange)]/35"
            aria-hidden
          />
          <p className="text-sm font-bold text-[var(--nomadic-ink)]">
            {stamp.title}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="badge-nomadic badge-nomadic-ink">
              {stamp.eligibilityLabel}
            </span>
            <span className="badge-nomadic badge-nomadic-orange">
              {stamp.activityLabel}
            </span>
            <span className="badge-nomadic badge-nomadic-neutral">Public</span>
          </div>
          <p className="mt-2 text-xs text-[var(--nomadic-ink)]">
            Issued by {stamp.issuedBy}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[var(--nomadic-muted)]">
            Verified
          </p>
        </article>
      ) : null}

      {!isLoading && stamp && !stamp.ok ? (
        <div
          className="rounded-[var(--nomadic-radius-md)] border border-[var(--nomadic-pending)]/25 bg-[var(--nomadic-pending-soft)] px-3 py-3 text-xs text-[var(--nomadic-ink)]"
          role="alert"
          data-state="ens-unavailable"
          data-code={stamp.code}
        >
          <p className="font-semibold">
            {stamp.code === "RESOLVER_UNAVAILABLE"
              ? "Resolver unavailable"
              : "Credential unavailable"}
          </p>
          <p className="mt-1 text-[var(--nomadic-muted)]">{stamp.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-[11px] font-semibold text-[var(--nomadic-orange-deep)] underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}
    </section>
  );
}
