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
          className="text-lg font-bold text-black"
        >
          Eligibility policy
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {policy.displayName}{" "}
          <span className="font-mono text-xs text-gray-400">({policy.key})</span>
        </p>
      </div>

      <ol className="space-y-4">
        {policy.requirements.map((req, index) => (
          <li
            key={req.id}
            className="rounded-2xl border border-black/10 bg-white/90 px-4 py-4"
          >
            <p className="text-xs font-medium text-gray-500">
              Requirement {index + 1}
            </p>
            <h3 className="mt-1 text-base font-semibold text-black">
              {req.title}
            </h3>
            <p className="mt-2 text-sm text-gray-700">{req.summary}</p>
            <div className="mt-3 rounded-xl bg-orange-50/80 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Why is this required?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {req.whyRequired}
              </p>
            </div>
            {req.confirmationState === "aspirational" ? (
              <p className="mt-2 text-[11px] text-gray-400">
                Attribute confirmation pending live World integration.
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-black/10 bg-white/90 px-4 py-4">
        <h3 className="text-base font-semibold text-black">
          What Nomadic is designed not to retain
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          {policy.dataMinimization.disclosure}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {policy.dataMinimization.designedNotToRetain.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          Wording reflects product intent. Live World integration will confirm
          which minimum results are available.
        </p>
      </div>
    </section>
  );
}
