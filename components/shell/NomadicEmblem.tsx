"use client";

import { NomadicMark } from "@/components/shell/NomadicBrand";
import { cn } from "@/lib/utils";

/**
 * Compact brand mark. Prefer NomadicMark / NomadicWordmark for new call sites.
 * Kept as a thin alias so existing imports keep the official isotipo.
 */
export function NomadicEmblem({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return <NomadicMark size={size} className={cn(className)} decorative />;
}
