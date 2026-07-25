import { CircleAlert, Loader2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

interface ClayStateProps {
  title: string
  description?: string
  kind?: "loading" | "empty" | "error"
  className?: string
}

const toneClasses = {
  loading: "clay-tone-sky",
  empty: "clay-tone-butter",
  error: "clay-tone-peach",
} as const

export function ClayState({
  title,
  description,
  kind = "empty",
  className,
}: ClayStateProps) {
  const Icon = kind === "loading" ? Loader2 : kind === "error" ? CircleAlert : Sparkles

  return (
    <div
      className={cn("clay-page flex min-h-[45vh] items-center justify-center px-6 py-10", className)}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <div className={cn("clay-surface w-full max-w-sm px-6 py-7 text-center", toneClasses[kind])}>
        <Icon
          className={cn("mx-auto mb-4 h-9 w-9 text-clay-ink", kind === "loading" && "animate-spin")}
          aria-hidden
        />
        <p className="text-xl font-bold text-clay-ink">{title}</p>
        {description ? <p className="mt-2 text-sm leading-relaxed text-clay-muted">{description}</p> : null}
      </div>
    </div>
  )
}
