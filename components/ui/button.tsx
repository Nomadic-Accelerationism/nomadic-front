import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-nomadic focus-visible:outline-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "btn-nomadic-primary",
        primary: "btn-nomadic-primary",
        destructive: "btn-nomadic-danger",
        danger: "btn-nomadic-danger",
        outline: "btn-nomadic-secondary",
        secondary: "btn-nomadic-secondary",
        quiet: "btn-nomadic-quiet",
        ghost: "btn-nomadic-quiet",
        mist: "btn-nomadic-mist",
        link: "bg-transparent text-[color:var(--nomadic-orange)] underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "min-h-11 px-5 py-2.5 text-[15px]",
        sm: "min-h-10 px-3.5 py-2 text-sm",
        lg: "min-h-12 px-6 py-3 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Attach Cuelume tick on click. Default true. */
  cueTick?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, cueTick = true, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        data-cuelume-toggle={cueTick ? "tick" : undefined}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
