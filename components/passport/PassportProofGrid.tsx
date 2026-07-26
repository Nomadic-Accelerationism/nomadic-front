"use client";

import {
  Fingerprint,
  BadgeCheck,
  IdCard,
  Globe2,
  Sparkles,
  Wrench,
  Users,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import {
  buildPassportProofGrid,
  type ProofGridItem,
  type ProofGridItemId,
  type ProofGridStatus,
} from "@/lib/passport/proof-grid";
import type { PassportProof } from "@/lib/passport/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ProofGridItemId, LucideIcon> = {
  unique_human: Fingerprint,
  age_18: BadgeCheck,
  government_id: IdCard,
  country: Globe2,
  contributions: Sparkles,
  skills: Wrench,
  references: Users,
  attendance: CalendarCheck,
};

function statusTone(status: ProofGridStatus): string {
  switch (status) {
    case "verified":
      return "badge-nomadic badge-nomadic-success";
    case "soon":
      return "badge-nomadic badge-nomadic-neutral";
    case "failed":
      return "badge-nomadic badge-nomadic-error";
    case "expired":
    case "unavailable":
      return "badge-nomadic badge-nomadic-pending";
    default:
      return "badge-nomadic badge-nomadic-neutral";
  }
}

function ProofCell({ item }: { item: ProofGridItem }) {
  const Icon = ICONS[item.id];
  return (
    <li
      className={cn(
        "surface-flat flex flex-col gap-1.5 rounded-[var(--nomadic-radius-sm)] border border-[var(--nomadic-border)] bg-[var(--nomadic-surface)]/80 px-2.5 py-2.5",
        item.placeholder && "opacity-55"
      )}
      data-proof-id={item.id}
      data-proof-status={item.status}
      data-privacy={item.privacy}
    >
      <div className="flex items-start justify-between gap-1">
        <Icon
          className="h-4 w-4 text-[var(--nomadic-ink)]"
          aria-hidden
        />
        <span className={statusTone(item.status)}>{item.statusLabel}</span>
      </div>
      <p className="text-xs font-semibold leading-tight text-[var(--nomadic-ink)]">
        {item.title}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--nomadic-muted)]">
        {item.privacy}
      </p>
    </li>
  );
}

export type PassportProofGridProps = {
  backendProofs: PassportProof[];
  isLoading?: boolean;
};

export function PassportProofGrid({
  backendProofs,
  isLoading = false,
}: PassportProofGridProps) {
  const items = buildPassportProofGrid(backendProofs);

  return (
    <section aria-labelledby="passport-proofs-heading">
      <h2
        id="passport-proofs-heading"
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nomadic-muted)]"
      >
        Identity proofs
      </h2>
      {isLoading ? (
        <p
          className="text-xs text-[var(--nomadic-muted)]"
          role="status"
          data-state="proofs-loading"
        >
          Loading proofs…
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <ProofCell key={item.id} item={item} />
          ))}
        </ul>
      )}
      <details className="mt-3 text-[11px] text-[var(--nomadic-muted)]">
        <summary className="cursor-pointer font-medium">Privacy</summary>
        <p className="mt-1.5 leading-relaxed">
          Private proofs stay in Nomadic. Published community credentials can be
          verified publicly.
        </p>
      </details>
    </section>
  );
}
