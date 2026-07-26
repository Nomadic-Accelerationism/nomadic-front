import * as React from "react"

import { cn } from "@/lib/utils"

export type SurfaceLevel = "flat" | "soft" | "clay" | "clay-strong" | "paper" | "cover"

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: SurfaceLevel
  as?: "div" | "section" | "article" | "aside"
}

const levelClass: Record<SurfaceLevel, string> = {
  flat: "surface-flat",
  soft: "surface-soft",
  clay: "surface-clay",
  "clay-strong": "surface-clay-strong",
  paper: "surface-paper",
  cover: "surface-cover",
}

export function Surface({
  level = "soft",
  as: Comp = "div",
  className,
  ...props
}: SurfaceProps) {
  return <Comp className={cn(levelClass[level], className)} {...props} />
}
