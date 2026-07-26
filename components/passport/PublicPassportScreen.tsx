"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Share2 } from "lucide-react";
import { MobileAppShell } from "@/components/shell/MobileAppShell";
import type { PublicPassportPayload } from "@/lib/ensv2/passport-credential-read";
import { truncateAddress } from "@/lib/wallet";

async function fetchPublicPassport(
  identifier: string
): Promise<
  | { ok: true; passport: PublicPassportPayload }
  | { ok: false; code: string; message: string }
> {
  const res = await fetch(
    `/api/passport/public/${encodeURIComponent(identifier)}`,
    { cache: "no-store" }
  );
  const body = (await res.json()) as
    | { ok: true; passport: PublicPassportPayload }
    | { ok: false; code: string; message: string };
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      code: !body.ok ? body.code : "PASSPORT_UNAVAILABLE",
      message: !body.ok ? body.message : "Passport unavailable.",
    };
  }
  return body;
}

export function PublicPassportScreen({ identifier }: { identifier: string }) {
  const query = useQuery({
    queryKey: ["passport", "public", identifier],
    queryFn: () => fetchPublicPassport(identifier),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Nomadic Passport", url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore cancel
    }
  };

  return (
    <MobileAppShell showNav={false} showHeader>
      {query.isLoading ? (
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
          role="status"
          data-state="passport-loading"
        >
          <Loader2
            className="h-7 w-7 animate-spin text-[var(--nomadic-orange)]"
            aria-hidden
          />
          <p className="text-sm text-[var(--nomadic-muted)]">
            Loading public Passport…
          </p>
        </div>
      ) : null}

      {query.data && !query.data.ok ? (
        <div
          className="rounded-[var(--nomadic-radius-md)] border border-[var(--nomadic-pending)]/25 bg-[var(--nomadic-pending-soft)] px-4 py-6"
          role="alert"
          data-state="passport-unavailable"
        >
          <p className="font-semibold text-[var(--nomadic-ink)]">
            Passport unavailable
          </p>
          <p className="mt-1 text-sm text-[var(--nomadic-muted)]">
            {query.data.message}
          </p>
        </div>
      ) : null}

      {query.data?.ok ? (
        <div className="space-y-5" data-public-passport>
          <header className="surface-cover px-4 py-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="font-display text-xl font-bold tracking-display text-[var(--nomadic-cover-cream)]">
                  {query.data.passport.displayName}
                </h1>
                {query.data.passport.passportName ? (
                  <p className="mt-1 break-all text-xs text-[var(--nomadic-cover-cream)]/65">
                    {query.data.passport.passportName}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex min-h-11 items-center gap-1 rounded-[var(--nomadic-radius-sm)] border border-[var(--nomadic-cover-cream)]/20 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--nomadic-cover-cream)]"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden />
                Share
              </button>
            </div>
            {query.data.passport.primaryWallet ? (
              <p className="mt-3 font-mono text-sm text-[var(--nomadic-cover-cream)]/85">
                {truncateAddress(query.data.passport.primaryWallet)}
              </p>
            ) : null}
            {query.data.passport.verifiedOnEns ? (
              <p className="badge-nomadic badge-nomadic-orange mt-3">
                Verified
              </p>
            ) : null}
          </header>

          <section aria-labelledby="public-stamps-heading">
            <h2
              id="public-stamps-heading"
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nomadic-muted)]"
            >
              Community stamps
            </h2>
            {query.data.passport.stamps.length === 0 ? (
              <p
                className="rounded-[var(--nomadic-radius-md)] border border-dashed border-[var(--nomadic-border)] px-3 py-4 text-xs text-[var(--nomadic-muted)]"
                data-state="credential-unavailable"
              >
                No published community stamps.
              </p>
            ) : (
              <ul className="space-y-3">
                {query.data.passport.stamps.map((stamp) => (
                  <li
                    key={stamp.credentialName || stamp.title}
                    className="surface-soft px-4 py-3"
                  >
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
                    </div>
                    <p className="mt-2 text-xs text-[var(--nomadic-ink)]">
                      Issued by {stamp.issuedBy}
                    </p>
                    {stamp.verifiedOnEns ? (
                      <p className="mt-1 text-[11px] text-[var(--nomadic-muted)]">
                        Verified
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
