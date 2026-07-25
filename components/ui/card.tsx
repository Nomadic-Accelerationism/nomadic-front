import * as React from "react"

import { cn } from "@/lib/utils"

export type ClayTone =
  | "peach"
  | "mint"
  | "sky"
  | "lilac"
  | "butter"
  | "white"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ClayTone
  interactive?: boolean
}

const toneClasses: Record<ClayTone, string> = {
  peach: "clay-tone-peach",
  mint: "clay-tone-mint",
  sky: "clay-tone-sky",
  lilac: "clay-tone-lilac",
  butter: "clay-tone-butter",
  white: "clay-tone-white",
}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, tone, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      tone && "clay-surface rounded-[28px] border-transparent shadow-clay",
      tone && toneClasses[tone],
      interactive && "clay-interactive",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
