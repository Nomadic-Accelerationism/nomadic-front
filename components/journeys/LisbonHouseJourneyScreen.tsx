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
        <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
        <span className="sr-only">Loading Journey</span>
      </div>
    );
  }

  return (
    <div
      className="relative flex w-full flex-col items-center overflow-hidden"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to top, #fe7432 5%, #ffcfb8 40%, white 60%, white 100%)",
          backgroundSize: "100% 100%",
          backgroundPosition: "bottom",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-md flex-col px-6 pb-12 pt-6">
        <Button
          asChild
          variant="ghost"
          className="mb-4 h-10 w-fit justify-start px-0 text-sm text-gray-700"
        >
          <Link href="/passport">← Back to Passport</Link>
        </Button>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white">
            <Image
              src={fixture.journey.imageSrc}
              alt=""
              fill
              className="object-contain p-2"
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
              {fixture.community.name}
            </p>
            <h1 className="text-2xl font-bold text-black">
              {fixture.journey.title}
            </h1>
          </div>
        </div>

        <dl className="mb-6 space-y-3 rounded-2xl border border-black/10 bg-white/90 px-4 py-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-gray-500">Location</dt>
            <dd className="mt-0.5 font-medium text-black">
              {fixture.journey.location}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Dates</dt>
            <dd className="mt-0.5 font-medium text-black">
              {fixture.journey.datesLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Capacity</dt>
            <dd className="mt-0.5 font-medium text-black">
              {fixture.journey.capacity} places
              {fixture.journey.seatsRemaining != null
                ? ` · ${fixture.journey.seatsRemaining} remaining`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Availability</dt>
            <dd className="mt-0.5 font-medium text-black">
              {fixture.journey.availabilityLabel}
            </dd>
          </div>
        </dl>

        <section className="mb-8 text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            About this Journey
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            {fixture.journey.description}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            {fixture.community.summary}
          </p>
        </section>

        <PolicyDisclosure policy={fixture.policy} />

        <div className="mt-8 space-y-3">
          <Button
            asChild
            className="h-12 w-full rounded-xl bg-[#ff671e] text-base font-bold text-black hover:bg-orange-500"
          >
            <Link href={fixture.routes.apply}>Review application requirements</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl border-black/30 bg-white/80 text-base font-semibold"
          >
            <Link href="/passport">Return to Passport</Link>
          </Button>
          <p className="text-center text-[11px] text-gray-500">
            Data source: frontend fixture ({fixture.source}) — not a backend
            Journey row.
          </p>
        </div>
      </div>
    </div>
  );
}
