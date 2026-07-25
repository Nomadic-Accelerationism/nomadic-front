"use client";

import {
  LISBON_HOUSE_JOURNEY,
  proofStatusLabel,
  type ProofRequirementStatus,
} from "@/lib/journeys/lisbon-house";

function statusBadgeClass(status: ProofRequirementStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "integration_unavailable":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Passport Proofs area.
 * Completed is only shown when a real backend verification exists.
 * Current P0: World integration unavailable (no fake success).
 */
export function PassportProofs() {
  const { identityCheck, selfieCheck } = LISBON_HOUSE_JOURNEY.proofs;

  const items = [
    {
      key: "identity",
      title: identityCheck.title,
      description: identityCheck.description,
      // Only "completed" when real backend verification exists — none yet.
      status: identityCheck.status,
    },
    {
      key: "selfie",
      title: selfieCheck.title,
      description: selfieCheck.description,
      status: selfieCheck.status,
    },
  ] as const;

  return (
    <section aria-labelledby="passport-proofs-heading" className="w-full">
      <h2
        id="passport-proofs-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700"
      >
        Proofs
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        World checks live inside your Passport Proofs system and are used when a
        Journey requires them.
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-black">{item.title}</h3>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                  item.status
                )}`}
              >
                {proofStatusLabel(item.status)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
