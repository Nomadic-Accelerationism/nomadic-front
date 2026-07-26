"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { LISBON_HOUSE_JOURNEY } from "@/lib/journeys/lisbon-house";
import { PolicyDisclosure } from "@/components/journeys/PolicyDisclosure";

export function LisbonHouseJourneyScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useUser();
  const fixture = LISBON_HOUSE_JOURNEY;

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-[var(--nomadic-orange)]"
          aria-hidden
        />
        <span className="sr-only">Loading Journey</span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col pb-6">
      <Button
        asChild
        variant="quiet"
        className="mb-4 h-10 w-fit justify-start px-0 text-sm"
      >
        <Link href="/explore">← Back to Explore</Link>
      </Button>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-[var(--nomadic-radius-md)] border border-[var(--nomadic-border)] bg-[var(--nomadic-surface)]">
          <Image
            src={fixture.journey.imageSrc}
            alt=""
            fill
            className="object-contain p-2"
          />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--nomadic-muted)]">
            {fixture.community.name}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-display text-[var(--nomadic-ink)]">
            {fixture.journey.title}
          </h1>
        </div>
      </div>

      <dl className="surface-clay mb-6 space-y-3 px-4 py-4 text-sm">
        <div>
          <dt className="text-xs font-medium text-[var(--nomadic-muted)]">
            Location
          </dt>
          <dd className="mt-0.5 font-medium text-[var(--nomadic-ink)]">
            {fixture.journey.location}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[var(--nomadic-muted)]">
            Dates
          </dt>
          <dd className="mt-0.5 font-medium text-[var(--nomadic-ink)]">
            {fixture.journey.datesLabel}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[var(--nomadic-muted)]">
            Capacity
          </dt>
          <dd className="mt-0.5 font-medium text-[var(--nomadic-ink)]">
            {fixture.journey.capacity} places
            {fixture.journey.seatsRemaining != null
              ? ` · ${fixture.journey.seatsRemaining} remaining`
              : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[var(--nomadic-muted)]">
            Availability
          </dt>
          <dd className="mt-0.5 font-medium text-[var(--nomadic-ink)]">
            {fixture.journey.availabilityLabel}
          </dd>
        </div>
      </dl>

      <section className="mb-8 text-left">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--nomadic-muted)]">
          About this Journey
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--nomadic-ink)]">
          {fixture.journey.description}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--nomadic-muted)]">
          {fixture.community.summary}
        </p>
      </section>

      <PolicyDisclosure policy={fixture.policy} />

      <div className="mt-8 space-y-3">
        <Button asChild size="lg" className="w-full">
          <Link href={fixture.routes.apply}>
            Review application requirements
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="w-full">
          <Link href="/passport">Return to Passport</Link>
        </Button>
        <p className="text-center text-[11px] text-[var(--nomadic-muted)]">
          Data source: frontend fixture ({fixture.source}) — not a backend
          Journey row.
        </p>
      </div>
    </div>
  );
}
