"use client";

import { motion } from "framer-motion";
import { NomadicMark } from "@/components/shell/NomadicBrand";

export type PassportCoverProps = {
  displayName: string;
  onOpen?: () => void;
  /** Default: interactive closed Passport. Preview hides the open CTA. */
  mode?: "interactive" | "preview";
  ctaLabel?: string;
  /** Optional subtitle under the display name. */
  subtitle?: string;
  editionLabel?: string;
};

export function PassportCover({
  displayName,
  onOpen,
  mode = "interactive",
  ctaLabel = "Open passport",
  subtitle = "Portable identity",
  editionLabel = "Lisbon edition · 2026",
}: PassportCoverProps) {
  const isPreview = mode === "preview";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto flex w-full max-w-[300px] flex-col"
      data-passport-state={isPreview ? "preview" : "closed"}
      data-passport-cover="true"
    >
      <div
        className="surface-cover relative flex aspect-[3/4] flex-col overflow-hidden px-7 py-7 text-center"
        data-passport-cover-card="true"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--nomadic-cover-cream)]/20"
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col items-center">
          <NomadicMark size={34} decorative className="opacity-95" />
          <h2 className="font-display mt-4 text-[25px] font-black uppercase leading-none tracking-[0.08em] text-[var(--nomadic-cover-cream)]">
            Nomadic Passport
          </h2>
          {isPreview ? (
            <p className="badge-nomadic badge-nomadic-orange mt-3">Preview</p>
          ) : null}

          <PassportGlobe />

          <div className="mt-auto w-full">
            <p className="font-display break-words text-[22px] font-bold leading-[0.95] tracking-display text-[var(--nomadic-cover-cream)]">
              {displayName}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--nomadic-cover-cream)]/45">
              {subtitle}
            </p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--nomadic-cover-cream)]/65">
              {editionLabel}
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

function PassportGlobe() {
  return (
    <svg
      viewBox="0 0 220 150"
      className="my-5 h-auto w-full max-w-[210px]"
      role="img"
      aria-label="Dotted world"
    >
      <defs>
        <pattern
          id="passport-dots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="2"
            cy="2"
            r="1.45"
            fill="var(--nomadic-cover-cream)"
            opacity=".72"
          />
        </pattern>
        <clipPath id="passport-globe-clip">
          <circle cx="110" cy="74" r="61" />
        </clipPath>
      </defs>

      <circle
        cx="110"
        cy="74"
        r="64"
        fill="none"
        stroke="var(--nomadic-cover-cream)"
        strokeOpacity=".22"
      />
      <g clipPath="url(#passport-globe-clip)">
        <rect x="44" y="8" width="132" height="132" fill="url(#passport-dots)" />
        <path
          d="M77 35c12-9 26-14 40-13l9 12-5 11-18 3-7 12-15-4-9-10 5-11Zm55 31 17 4 11 14-6 15-14 5-8 20-12-4-5-17 9-13-4-12 12-12Zm-55 13 16 3 10 12-5 21-13 12-8-17-12-13 12-18Z"
          fill="var(--nomadic-cover)"
          fillOpacity=".72"
        />
        <path
          d="M46 74h128M110 10c-20 18-31 40-31 64s11 46 31 64m0-128c20 18 31 40 31 64s-11 46-31 64"
          fill="none"
          stroke="var(--nomadic-orange)"
          strokeOpacity=".55"
          strokeWidth="1.2"
          strokeDasharray="2 5"
        />
      </g>
      <circle cx="159" cy="42" r="3.5" fill="var(--nomadic-orange)" />
      <circle cx="72" cy="105" r="2.5" fill="var(--nomadic-orange)" />
    </svg>
  );
}
