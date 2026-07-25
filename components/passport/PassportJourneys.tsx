"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LISBON_HOUSE_JOURNEY } from "@/lib/journeys/lisbon-house";

export function PassportJourneys() {
  const fixture = LISBON_HOUSE_JOURNEY;

  return (
    <section aria-labelledby="passport-journeys-heading" className="w-full">
      <h2
        id="passport-journeys-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700"
      >
        Hacker houses &amp; Journeys
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        Discover communities and temporary Journeys you can apply to from your
        Passport.
      </p>

      <article className="overflow-hidden rounded-2xl border border-black/10 bg-white/90">
        <div className="flex gap-4 p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-orange-50">
            <Image
              src={fixture.journey.imageSrc}
              alt=""
              fill
              className="object-contain p-2"
            />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {fixture.community.name}
            </p>
            <h3 className="mt-1 text-base font-bold text-black">
              {fixture.journey.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {fixture.journey.location} · {fixture.journey.datesLabel}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Policy: {fixture.policy.displayName}
            </p>
          </div>
        </div>
        <div className="border-t border-black/5 px-4 py-3">
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-[#ff671e] text-sm font-bold text-black hover:bg-orange-500"
          >
            <Link href={fixture.routes.detail}>View Journey</Link>
          </Button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Frontend seed · replace with Journey API later
          </p>
        </div>
      </article>
    </section>
  );
}
