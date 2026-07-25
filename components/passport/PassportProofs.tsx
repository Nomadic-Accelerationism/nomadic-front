"use client";

import Link from "next/link";
import {
  mergePassportProofs,
  passportProofStatusLabel,
  type PassportProofUiStatus,
} from "@/lib/passport/merge-proofs";
import type { PassportProof } from "@/lib/passport/types";
import { LISBON_HOUSE_JOURNEY } from "@/lib/journeys/lisbon-house";
import { isWorldPublicConfigured } from "@/lib/world/client";

function statusBadgeClass(status: PassportProofUiStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "expired":
      return "bg-orange-100 text-orange-900";
    case "unavailable":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export type PassportProofsProps = {
  /** Backend completion records — never invent Completed without these. */
  backendProofs: PassportProof[];
};

/**
 * Passport Proofs area.
 * Supported products are frontend knowledge; completion is backend-only.
 * World CTAs deep-link to Journey apply — local IDKit success ≠ Completed here.
 */
export function PassportProofs({ backendProofs }: PassportProofsProps) {
  const items = mergePassportProofs(backendProofs);
  const worldConfigured = isWorldPublicConfigured();
  const applyHref = LISBON_HOUSE_JOURNEY.routes.apply;
  const anyIncomplete = items.some((item) => item.status !== "completed");

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
        Journey requires them. Completed appears only after the backend stores a
        verified record.
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-black">{item.title}</h3>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                  item.status
                )}`}
              >
                {passportProofStatusLabel(item.status)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {item.description}
            </p>
            {item.status !== "completed" && worldConfigured ? (
              <Link
                href={applyHref}
                className="mt-3 inline-flex text-sm font-semibold text-[#ff671e] underline-offset-2 hover:underline"
              >
                Complete via Lisbon House apply
              </Link>
            ) : null}
          </li>
        ))}
      </ul>

      {worldConfigured && anyIncomplete ? (
        <p
          className="mt-4 text-xs text-gray-500"
          data-world-integration-boundary="passport-cta"
        >
          Identity Check and Selfie Check run on the Journey apply flow. A
          successful World verify here does not mark Passport Proofs completed
          until Nomadic persists the result.
        </p>
      ) : null}
    </section>
  );
}
