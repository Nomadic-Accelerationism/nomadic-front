"use client";

import { motion } from "framer-motion";

export type PassportCoverProps = {
  displayName: string;
  onOpen?: () => void;
  /** Default: interactive closed Passport. Preview hides the open CTA. */
  mode?: "interactive" | "preview";
  ctaLabel?: string;
  /** Optional subtitle under the display name. */
  subtitle?: string;
};

export function PassportCover({
  displayName,
  onOpen,
  mode = "interactive",
  ctaLabel = "Open passport",
  subtitle = "Temporary communities · Journeys",
}: PassportCoverProps) {
  const isPreview = mode === "preview";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto flex w-full max-w-[280px] flex-col"
      data-passport-state={isPreview ? "preview" : "closed"}
    >
      <div className="surface-cover relative flex aspect-[280/400] flex-col overflow-hidden px-7 py-8 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--nomadic-cover-cream)]/20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[40%] h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--nomadic-cover-cream)]/12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[40%] h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--nomadic-cover-cream)]/16"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col items-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--nomadic-cover-cream)]/25">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--nomadic-orange)]" />
          </span>
          <p className="font-display mt-[22px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--nomadic-cover-cream)]/75">
            Nomadic Passport
          </p>
          {isPreview ? (
            <p className="badge-nomadic badge-nomadic-orange mt-3">Preview</p>
          ) : null}
          <div className="flex-1" />
          <p className="font-display text-xl font-bold leading-tight tracking-display text-[var(--nomadic-cover-cream)]">
            {displayName}
          </p>
          <p className="mt-2 text-[11px] text-[var(--nomadic-cover-cream)]/50">
            {subtitle}
          </p>
          {!isPreview && onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="btn-nomadic btn-nomadic-primary mt-6 w-full"
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
