"use client";

import type { LisbonHouseJourneyFixture } from "@/lib/journeys/lisbon-house";

interface PolicyDisclosureProps {
  policy: LisbonHouseJourneyFixture["policy"];
}

export function PolicyDisclosure({ policy }: PolicyDisclosureProps) {
  return (
    <section
      aria-labelledby="policy-disclosure-heading"
      className="w-full space-y-5 text-left"
    >
      <div>
        <h2
          id="policy-disclosure-heading"
          className="font-display text-lg font-bold tracking-display text-[var(--nomadic-ink)]"
        >
          Eligibility policy
        </h2>
        <p className="mt-1 text-sm text-[var(--nomadic-muted)]">
          {policy.displayName}{" "}
          <span className="font-mono text-xs text-[var(--nomadic-muted)]/80">
            ({policy.key})
          </span>
        </p>
      </div>

      <ol className="space-y-4">
        {policy.requirements.map((req, index) => (
          <li key={req.id} className="surface-soft px-4 py-4">
            <p className="text-xs font-medium text-[var(--nomadic-muted)]">
              Requirement {index + 1}
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--nomadic-ink)]">
              {req.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--nomadic-muted)]">
              {req.summary}
            </p>
            <div className="mt-3 rounded-[var(--nomadic-radius-sm)] bg-[var(--nomadic-surface-soft)] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--nomadic-muted)]">
                Why is this required?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--nomadic-ink)]">
                {req.whyRequired}
              </p>
            </div>
            {req.confirmationState === "aspirational" ? (
              <p className="mt-2 text-[11px] text-[var(--nomadic-muted)]">
                Attribute confirmation pending live World integration.
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="surface-soft px-4 py-4">
        <h3 className="text-base font-semibold text-[var(--nomadic-ink)]">
          What Nomadic is designed not to retain
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--nomadic-muted)]">
          {policy.dataMinimization.disclosure}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--nomadic-muted)]">
          {policy.dataMinimization.designedNotToRetain.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--nomadic-muted)]">
          Wording reflects product intent. Live World integration will confirm
          which minimum results are available.
        </p>
      </div>
    </section>
  );
}
