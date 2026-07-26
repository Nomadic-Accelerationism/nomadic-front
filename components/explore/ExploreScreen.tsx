"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Users } from "lucide-react";
import { MobileAppShell } from "@/components/shell/MobileAppShell";
import { useUser } from "@/contexts/UserContext";
import { usePrivatePassport } from "@/hooks/usePrivatePassport";
import { LISBON_HOUSE_JOURNEY } from "@/lib/journeys/lisbon-house";
import {
  exploreEligibilityLabel,
  resolveLisbonExploreState,
} from "@/lib/passport/explore-state";

export function ExploreScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useUser();
  const { passport, isLoading } = usePrivatePassport();
  const fixture = LISBON_HOUSE_JOURNEY;

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <MobileAppShell showNav={false}>
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
          role="status"
        >
          <Loader2
            className="h-7 w-7 animate-spin text-[var(--nomadic-orange)]"
            aria-hidden
          />
          <p className="text-sm text-[var(--nomadic-muted)]">Loading…</p>
        </div>
      </MobileAppShell>
    );
  }

  const eligibility = resolveLisbonExploreState({
    credentials: passport?.credentials,
    journeys: passport?.journeys,
  });
  const eligibilityLabel = isLoading
    ? "Checking…"
    : exploreEligibilityLabel(eligibility);

  return (
    <MobileAppShell>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-display text-[28px] font-bold leading-[1.15] tracking-display text-[var(--nomadic-ink)]">
            Where next?
          </h1>
        </header>

        <section aria-labelledby="explore-event-heading" className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nomadic-muted)]">
            Active event
          </p>
          <h2
            id="explore-event-heading"
            className="font-display text-lg font-bold tracking-display text-[var(--nomadic-ink)]"
          >
            ETHGlobal Lisbon
          </h2>
        </section>

        <section aria-labelledby="explore-journey-heading">
          <article
            id="explore-journey-heading"
            className="surface-clay-strong overflow-hidden"
            data-journey="nomadic-lisbon-house"
          >
            <div className="bg-[var(--nomadic-ink)] px-4 py-3.5">
              <h3 className="text-base font-bold text-[var(--nomadic-cover-cream)]">
                Nomadic Lisbon House
              </h3>
              <p className="mt-0.5 text-xs text-[var(--nomadic-cover-cream)]/70">
                hacker house
              </p>
            </div>
            <div className="space-y-2.5 px-4 py-3.5 text-[13px] text-[var(--nomadic-ink)]">
              <p className="flex items-center gap-1.5 text-[var(--nomadic-muted)]">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Lisbon
              </p>
              <p className="text-[var(--nomadic-muted)]">
                {fixture.journey.datesLabel}
              </p>
              <p className="flex items-center gap-1.5 text-[var(--nomadic-muted)]">
                <Users className="h-3.5 w-3.5" aria-hidden />
                Capacity {fixture.journey.capacity}
                {fixture.journey.seatsRemaining != null
                  ? ` · ${fixture.journey.seatsRemaining} open`
                  : ""}
              </p>
              <p
                className="text-xs font-semibold text-[var(--nomadic-ink)]"
                data-eligibility={eligibility}
              >
                {eligibilityLabel}
              </p>
            </div>
            <div className="px-4 pb-4">
              <Link
                href={fixture.routes.detail}
                className="btn-nomadic btn-nomadic-primary w-full"
              >
                View Journey
              </Link>
            </div>
          </article>
        </section>

        <p className="rounded-[var(--nomadic-radius-sm)] border border-dashed border-[var(--nomadic-border)] px-3 py-3 text-center text-xs text-[var(--nomadic-muted)]">
          More Journeys will appear for upcoming hackathons.
        </p>
      </div>
    </MobileAppShell>
  );
}
