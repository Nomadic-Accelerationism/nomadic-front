import * as React from "react"

import { cn } from "@/lib/utils"

export type InputVisualState =
  | "default"
  | "focused"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "disabled"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual state for upcoming Passport-handle onboarding. Styles only. */
  visualState?: InputVisualState
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, visualState = "default", disabled, ...props }, ref) => {
    const state = disabled ? "disabled" : visualState

    return (
      <input
        type={type}
        disabled={disabled}
        data-state={state === "default" ? undefined : state}
        className={cn("input-nomadic", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
