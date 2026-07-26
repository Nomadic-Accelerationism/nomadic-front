"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NomadicMark } from "@/components/shell/NomadicBrand";
import { MOBILE_APP_MAX_WIDTH_PX } from "@/lib/shell/constants";

/**
 * Product landing — CSS sunrise sequence:
 * 1) dark dawn + logo alone
 * 2) warm gradient rises
 * 3) copy + login actions appear (house = mist secondary)
 */
export default function LandingComponent() {
  return (
    <div className="min-h-dvh w-full bg-[var(--nomadic-browser-bg)]">
      <div
        className="landing-stage relative mx-auto flex min-h-dvh w-full flex-col overflow-hidden shadow-[0_0_0_1px_var(--nomadic-border)]"
        style={{ maxWidth: MOBILE_APP_MAX_WIDTH_PX }}
        data-landing
      >
        <div className="landing-sunrise pointer-events-none absolute inset-0" aria-hidden />
        <div className="landing-glow pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[160%] -translate-x-1/2 rounded-[100%]" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col px-5 pb-6 pt-10">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="landing-logo flex flex-col items-center gap-4">
              <NomadicMark size={72} decorative />
              <span className="sr-only">Nomadic</span>
            </div>

            <div className="landing-actions mt-8 flex w-full max-w-sm flex-col items-center gap-5">
              <div className="max-w-sm space-y-2">
                <h1 className="font-display text-[28px] font-bold leading-tight tracking-display text-[var(--nomadic-ink)]">
                  Your Nomadic Passport
                </h1>
                <p className="text-base tracking-body text-[var(--nomadic-muted)]">
                  One identity for every journey.
                </p>
              </div>

              <div className="flex w-full flex-col items-center gap-3">
                <Button asChild size="lg" className="w-full">
                  <Link href="/start">Nomad Email Login</Link>
                </Button>

                <Button
                  asChild
                  variant="mist"
                  size="sm"
                  className="mt-2 w-auto min-w-[10.5rem] px-5 text-[13px]"
                >
                  <Link href="/login-house">Continue as house</Link>
                </Button>
              </div>
            </div>
          </div>

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
