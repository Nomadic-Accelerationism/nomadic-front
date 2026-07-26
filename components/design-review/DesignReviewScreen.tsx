"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  IdCard,
  MapPin,
  ScanFace,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileAppShell } from "@/components/shell/MobileAppShell";
import { PassportCover } from "@/components/passport/PassportCover";
import { PassportOpenSheet } from "@/components/passport/PassportOpenSheet";
import { LISBON_HOUSE_JOURNEY } from "@/lib/journeys/lisbon-house";
import type { DesignPreviewKey } from "@/lib/design-review/screens";
import type { PrivatePassport } from "@/lib/passport/types";

export type DesignReviewScreenProps = {
  screen: DesignPreviewKey;
};

export function DesignReviewScreen({ screen }: DesignReviewScreenProps) {
  const showProductNav = screen === "explore" || screen === "passport";

  return (
    <MobileAppShell
      showHeader={screen !== "passport-name"}
      showNav={showProductNav}
      contentClassName="justify-start gap-5 pb-8"
    >
      <Link
        href="/design-review"
        className="w-fit text-xs font-semibold text-[var(--nomadic-muted)] underline decoration-[var(--nomadic-border-strong)] underline-offset-4"
      >
        ← All screens
      </Link>
      {screen === "passport-name" ? <PassportNamePreview /> : null}
      {screen === "explore" ? <ExplorePreview /> : null}
      {screen === "passport" ? <PassportPreview /> : null}
      {screen === "journey" ? <JourneyPreview /> : null}
      {screen === "apply" ? <ApplyPreview /> : null}
    </MobileAppShell>
  );
}

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="badge-nomadic badge-nomadic-orange w-fit">{children}</p>
  );
}

function PassportNamePreview() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-7">
      <div>
        <PreviewLabel>Visual preview</PreviewLabel>
        <h1 className="font-display mt-4 text-[30px] font-black leading-[0.95] tracking-display text-[var(--nomadic-ink)]">
          Choose your
          <br />
          Passport name
        </h1>
      </div>

      <div className="space-y-3">
        <Input value="testinggg" readOnly aria-label="Passport handle" />
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nomadic-success)]">
          <Check className="h-4 w-4" aria-hidden />
          testinggg.nomadic-passport.eth is available
        </div>
      </div>

      <PassportCover
        mode="preview"
        displayName="testinggg"
        subtitle="testinggg.nomadic-passport.eth"
      />

      <div className="btn-nomadic btn-nomadic-primary min-h-12 w-full px-6 py-3 text-base">
        Continue
      </div>
    </div>
  );
}

function ExplorePreview() {
  const fixture = LISBON_HOUSE_JOURNEY;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PreviewLabel>Visual preview</PreviewLabel>
        <h1 className="font-display mt-4 text-[30px] font-black leading-none tracking-display text-[var(--nomadic-ink)]">
          Where next?
        </h1>
      </div>

      <section aria-labelledby="review-active-event">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nomadic-muted)]">
          Active event
        </p>
        <h2
          id="review-active-event"
          className="font-display mt-1 text-xl font-bold tracking-display"
        >
          ETHGlobal Lisbon
        </h2>
      </section>

      <article className="surface-clay-strong overflow-hidden">
        <div className="bg-[var(--nomadic-ink)] px-4 py-4">
          <h3 className="text-base font-bold text-[var(--nomadic-cover-cream)]">
            Nomadic Lisbon House
          </h3>
          <p className="mt-0.5 text-xs text-[var(--nomadic-cover-cream)]/65">
            hacker house
          </p>
        </div>
        <div className="space-y-3 px-4 py-4 text-sm text-[var(--nomadic-muted)]">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden />
            Lisbon
          </p>
          <p>{fixture.journey.datesLabel}</p>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden />
            Capacity {fixture.journey.capacity}
          </p>
        </div>
        <div className="px-4 pb-4">
          <div className="btn-nomadic btn-nomadic-primary w-full">
            View Journey
          </div>
        </div>
      </article>
    </div>
  );
}

function PassportPreview() {
  const [open, setOpen] = useState(false);
  const passport: PrivatePassport = {
    publicAddress: "0xd114000000000000000000000000000000009b17",
    identityStatus: "READY",
    ensName: "testinggg.nomadic-passport.eth",
    ensStatus: "ISSUED",
    proofs: [],
    credentials: [],
    journeys: [],
  };

  return (
    <div className="flex flex-col gap-5">
      <PreviewLabel>Visual preview</PreviewLabel>
      <PassportCover
        displayName="testinggg.nomadic-passport.eth"
        subtitle="Public ENS identity"
        editionLabel="Lisbon edition · 2026"
        onOpen={() => setOpen(true)}
      />
      <PassportOpenSheet
        open={open}
        onOpenChange={setOpen}
        passport={passport}
        bookTitle="testinggg’s Nomadic Passport"
        worldSignal={passport.publicAddress || undefined}
      />
    </div>
  );
}

function JourneyPreview() {
  const fixture = LISBON_HOUSE_JOURNEY;

  return (
    <div className="flex flex-col pb-6">
      <PreviewLabel>Visual preview</PreviewLabel>
      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-[var(--nomadic-radius-md)] border border-[var(--nomadic-border)] bg-[var(--nomadic-surface)]">
          <Image
            src={fixture.journey.imageSrc}
            alt=""
            fill
            className="object-contain p-2"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nomadic-muted)]">
            {fixture.community.name}
          </p>
          <h1 className="font-display text-[28px] font-black leading-none tracking-display">
            {fixture.journey.title}
          </h1>
        </div>
      </div>

      <dl className="surface-clay mt-6 space-y-3 px-4 py-4 text-sm">
        <ReviewDetail label="Location" value={fixture.journey.location} />
        <ReviewDetail label="Dates" value={fixture.journey.datesLabel} />
        <ReviewDetail
          label="Capacity"
          value={`${fixture.journey.capacity} places`}
        />
      </dl>

      <h2 className="font-display mt-7 text-xl font-bold tracking-display">
        About this Journey
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--nomadic-muted)]">
        {fixture.journey.description}
      </p>
      <div className="btn-nomadic btn-nomadic-primary mt-8 min-h-12 w-full px-6 py-3 text-base">
        Review application requirements
      </div>
    </div>
  );
}

function ReviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--nomadic-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function ApplyPreview() {
  return (
    <div className="flex flex-col pb-6">
      <PreviewLabel>Visual preview</PreviewLabel>
      <h1 className="font-display mt-5 text-[30px] font-black leading-none tracking-display">
        Apply
      </h1>
      <p className="mt-2 text-sm text-[var(--nomadic-muted)]">
        Nomadic Lisbon House · Lisbon Hacker House
      </p>

      <section className="mt-8 space-y-3" aria-labelledby="preview-proofs">
        <h2
          id="preview-proofs"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nomadic-muted)]"
        >
          Required proofs
        </h2>
        <ReviewRequirement icon={IdCard} title="Identity Check" />
        <ReviewRequirement icon={ScanFace} title="Selfie Check" />
      </section>

      <div className="surface-soft mt-7 px-4 py-4">
        <h2 className="font-display text-xl font-bold tracking-display">
          Privacy by default
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--nomadic-muted)]">
          Nomadic only receives the minimum verification result required for
          this Journey.
        </p>
      </div>

      <div className="btn-nomadic btn-nomadic-primary mt-8 min-h-12 w-full px-6 py-3 text-base">
        Apply to Lisbon House
      </div>
    </div>
  );
}

function ReviewRequirement({
  icon: Icon,
  title,
}: {
  icon: typeof IdCard;
  title: string;
}) {
  return (
    <div className="surface-soft flex items-center gap-3 px-4 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--nomadic-orange)]/[0.12] text-[var(--nomadic-orange-deep)]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--nomadic-muted)]">
          Ready to verify inside Passport
        </p>
      </div>
      <span className="badge-nomadic badge-nomadic-pending">Required</span>
    </div>
  );
}
