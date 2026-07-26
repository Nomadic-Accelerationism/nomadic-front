"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Official compact mark / isotipo (user upload). */
export const NOMADIC_MARK_SRC = "/images/nomadic-logo-26.png";
/** Official horizontal wordmark (user upload). */
export const NOMADIC_WORDMARK_SRC = "/images/nomadic-logo-26-horizontal.png";

const WORDMARK_ASPECT = 1600 / 315;

export type NomadicMarkProps = {
  size?: number;
  className?: string;
  /**
   * When true (default), alt is empty and aria-hidden — use when adjacent
   * accessible text already names Nomadic.
   */
  decorative?: boolean;
};

/** Compact brand mark for landing and small chrome. */
export function NomadicMark({
  size = 28,
  className,
  decorative = true,
}: NomadicMarkProps) {
  return (
    <Image
      src={NOMADIC_MARK_SRC}
      alt={decorative ? "" : "Nomadic"}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden={decorative || undefined}
      priority={size >= 48}
    />
  );
}

export type NomadicWordmarkProps = {
  /** Rendered height in px; width follows the official aspect. */
  height?: number;
  className?: string;
  decorative?: boolean;
};

/** Horizontal wordmark for headers, nav, and auth branding lockups. */
export function NomadicWordmark({
  height = 28,
  className,
  decorative = true,
}: NomadicWordmarkProps) {
  const width = Math.round(height * WORDMARK_ASPECT);
  return (
    <Image
      src={NOMADIC_WORDMARK_SRC}
      alt={decorative ? "" : "Nomadic"}
      width={width}
      height={height}
      className={cn("h-auto w-auto shrink-0 object-contain object-left", className)}
      style={{ height, width: "auto", maxWidth: "100%" }}
      aria-hidden={decorative || undefined}
      priority={height >= 32}
    />
  );
}
