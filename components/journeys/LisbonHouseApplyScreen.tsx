"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorldVerificationPanel } from "@/components/world/WorldVerificationPanel";
import { useUser } from "@/contexts/UserContext";
import {
  LISBON_HOUSE_JOURNEY,
  proofStatusLabel,
} from "@/lib/journeys/lisbon-house";
import { isWorldPublicConfigured } from "@/lib/world/client";

/**
 * Lisbon House apply — World Identity + Selfie via IDKit.
 * Does not create applications, credentials, or fake Passport completion.
 */
export function LisbonHouseApplyScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, publicAddress } = useUser();
  const fixture = LISBON_HOUSE_JOURNEY;
  const { identityCheck, selfieCheck } = fixture.proofs;
  const { dataMinimization } = fixture.policy;
  const worldConfigured = isWorldPublicConfigured();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
        <span className="sr-only">Loading application</span>
      </div>
    );
  }

  return (
    <div
      className="relative flex w-full flex-col items-center overflow-hidden"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to top, #fe7432 5%, #ffcfb8 40%, white 60%, white 100%)",
          backgroundSize: "100% 100%",
          backgroundPosition: "bottom",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-md flex-col px-6 pb-12 pt-6">
        <Button
          asChild
          variant="ghost"
          className="mb-4 h-10 w-fit justify-start px-0 text-sm text-gray-700"
        >
          <Link href={fixture.routes.detail}>← Back to Journey</Link>
        </Button>

        <h1 className="text-2xl font-bold text-black">Apply</h1>
        <p className="mt-2 text-sm text-gray-700">
          {fixture.community.name} · {fixture.journey.title}
        </p>

        <section className="mt-8 space-y-3" aria-labelledby="apply-proofs-heading">
          <h2
            id="apply-proofs-heading"
            className="text-sm font-semibold uppercase tracking-wide text-gray-700"
          >
            Required proofs
          </h2>

          {[identityCheck, selfieCheck].map((proof) => (
            <div
              key={proof.title}
              className="rounded-2xl border border-black/10 bg-white/90 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-black">{proof.title}</h3>
                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                  {proofStatusLabel(proof.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{proof.description}</p>
            </div>
          ))}
        </section>

        <section
          className="mt-8 rounded-2xl border border-black/10 bg-white/90 px-4 py-4 text-left"
          aria-labelledby="privacy-disclosure-heading"
        >
          <h2
            id="privacy-disclosure-heading"
            className="text-base font-semibold text-black"
          >
            Privacy disclosure
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {dataMinimization.disclosure}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            Designed not to retain
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {dataMinimization.designedNotToRetain.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          {worldConfigured ? (
            <WorldVerificationPanel signal={publicAddress || undefined} />
          ) : (
            <section
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-left"
              aria-labelledby="world-unavailable-heading"
              data-world-integration-boundary="unavailable"
            >
              <h2
                id="world-unavailable-heading"
                className="text-base font-semibold text-amber-950"
              >
                Verification
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-950">
                World verification is not available yet.
              </p>
              <p className="mt-2 text-xs text-amber-900/80">
                Your email sign-in is not enough to submit this application. When
                Identity Check and Selfie Check are enabled, you will complete
                them here before applying.
              </p>
              <Button
                type="button"
                disabled
                className="mt-4 h-12 w-full rounded-xl bg-gray-200 text-base font-bold text-gray-500"
              >
                Start World verification
              </Button>
            </section>
          )}
        </div>

        <Button
          asChild
          variant="outline"
          className="mt-6 h-12 w-full rounded-xl border-black/30 bg-white/80 text-base font-semibold"
        >
          <Link href="/passport">Return to Passport</Link>
        </Button>
      </div>
    </div>
  );
}
