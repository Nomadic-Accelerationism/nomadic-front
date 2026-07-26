"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NomadicMark } from "@/components/shell/NomadicBrand";

/**
 * Product landing — CSS sunrise sequence:
 * 1) clean white canvas
 * 2) orange radial sunrise rises from the bottom
 * 3) brand, editorial headline and login actions appear in layers
 */
export default function LandingComponent() {
  return (
    <div className="min-h-dvh w-full bg-[var(--nomadic-browser-bg)]">
      <div
        className="landing-stage relative flex min-h-dvh w-full flex-col overflow-hidden shadow-[0_0_0_1px_var(--nomadic-border)] md:shadow-none"
        data-landing
      >
        <div className="landing-sunrise pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="landing-glow pointer-events-none absolute bottom-0 left-1/2 h-[62%] w-[165%] -translate-x-1/2"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-dvh flex-col px-6 pb-5 pt-9 sm:px-8 sm:pt-10">
          <div className="landing-logo flex justify-center">
            <NomadicMark size={76} decorative />
            <span className="sr-only">Nomadic</span>
          </div>

          <main className="flex flex-1 -translate-y-5 flex-col items-center justify-center pb-3 pt-5 text-center md:-translate-y-9">
            <div className="landing-hero-copy w-full max-w-[390px] md:max-w-[760px]">
              <h1 className="landing-title font-display uppercase text-[var(--nomadic-ink)]">
                <span className="block">Where</span>
                <span className="block">crypto-</span>
                <span className="block">nomads</span>
                <span className="block">belong</span>
              </h1>
              <Image
                src="/images/landing-scribble.svg"
                width={298}
                height={23}
                alt=""
                className="landing-scribble mx-auto mt-2 h-auto"
                priority
              />
            </div>

            <div className="landing-actions mt-7 flex w-full flex-col items-center gap-3">
              <Button asChild size="lg" className="w-full max-w-[14rem]">
                <Link href="/login-user">Nomad log in</Link>
              </Button>

              <Button
                asChild
                variant="mist"
                size="sm"
                className="w-auto min-w-[10.5rem] px-5 text-[13px]"
              >
                <Link href="/login-house">Continue as house</Link>
              </Button>
            </div>
          </main>

          <p className="landing-footer mx-auto max-w-sm text-center text-[11px] leading-relaxed tracking-body text-[var(--nomadic-muted)]">
            By continuing, you agree to the{" "}
            <Link href="#" className="underline underline-offset-2">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline underline-offset-2">
              Terms
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
