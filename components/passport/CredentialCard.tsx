"use client";

import { cn } from "@/lib/utils";

interface CredentialCardProps {
  className?: string;
}

/**
 * Honest empty credentials state.
 * Do not display NOMADIC_LISBON_HOUSE_ELIGIBLE (or any credential) as issued
 * until a real application + verification exists.
 */
export function CredentialCard({ className }: CredentialCardProps) {
  return (
    <article
      className={cn(
        "w-full rounded-2xl border border-dashed border-black/30 bg-white/70 p-5 text-left",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-tight">No credentials yet</h3>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          Empty
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Portable credentials appear here after you complete a Journey
        application and its eligibility checks. Nothing has been issued for this
        Passport yet.
      </p>
    </article>
  );
}
