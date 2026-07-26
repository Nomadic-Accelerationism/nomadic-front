"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { NomadicMark } from "@/components/shell/NomadicBrand";
import { cn } from "@/lib/utils";

export type PassportCoverProps = {
  displayName: string;
  onOpen?: () => void;
  /** Default: interactive closed Passport. Preview hides the open CTA. */
  mode?: "interactive" | "preview";
  ctaLabel?: string;
  /** Optional subtitle under the display name. */
  subtitle?: string;
  /**
   * Content rendered inside the dark cover card (e.g. World checks).
   * When set, the cover may grow taller than the classic booklet aspect.
   */
  children?: ReactNode;
};

export function PassportCover({
  displayName,
  onOpen,
  mode = "interactive",
  ctaLabel = "Open passport",
  subtitle = "Temporary communities · Journeys",
  children,
}: PassportCoverProps) {
  const isPreview = mode === "preview";
  const hasInner = Boolean(children);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative mx-auto flex w-full flex-col",
        hasInner ? "max-w-full" : "max-w-[280px]"
      )}
      data-passport-state={isPreview ? "preview" : "closed"}
      data-passport-cover="true"
    >
      <div
        className={cn(
          "surface-cover relative flex flex-col overflow-hidden text-center",
          hasInner ? "min-h-[400px] px-4 py-5 sm:px-5" : "aspect-[280/400] px-7 py-8"
        )}
        data-passport-cover-card="true"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--nomadic-cover-cream)]/20"
          aria-hidden
        />
        {!hasInner ? (
          <>
            <div
              className="pointer-events-none absolute left-1/2 top-[40%] h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--nomadic-cover-cream)]/12"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-1/2 top-[40%] h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--nomadic-cover-cream)]/16"
              aria-hidden
            />
          </>
        ) : null}

        <div className="relative z-10 flex flex-col items-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--nomadic-cover-cream)]/25 bg-[var(--nomadic-cover-cream)]/5">
            <NomadicMark size={28} decorative className="opacity-95" />
          </span>
          <p className="font-display mt-[18px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--nomadic-cover-cream)]/75">
            Nomadic Passport
          </p>
          {isPreview ? (
            <p className="badge-nomadic badge-nomadic-orange mt-3">Preview</p>
          ) : null}

          {hasInner ? (
            <div className="mt-4 w-full text-left" data-passport-cover-slot="world">
              {children}
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className={cn("w-full", hasInner ? "mt-5" : "")}>
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
                className="btn-nomadic btn-nomadic-primary mt-5 w-full"
              >
                {ctaLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
