import * as React from "react"

import { cn } from "@/lib/utils"

export type BadgeTone = "neutral" | "success" | "pending" | "info" | "error" | "orange"

export interface BadgeNomadicProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClass: Record<BadgeTone, string> = {
  neutral: "badge-nomadic badge-nomadic-neutral",
  success: "badge-nomadic badge-nomadic-success",
  pending: "badge-nomadic badge-nomadic-pending",
  info: "badge-nomadic badge-nomadic-info",
  error: "badge-nomadic badge-nomadic-error",
  orange: "badge-nomadic badge-nomadic-orange",
}

export function BadgeNomadic({
  tone = "neutral",
  className,
  ...props
}: BadgeNomadicProps) {
  return <span className={cn(toneClass[tone], className)} {...props} />
}
