"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import { useUser } from "@/contexts/UserContext";
import { LISBON_HOUSE_JOURNEY } from "@/lib/journeys/lisbon-house";

/**
 * Legacy credential placeholder route.
 * Primary P0 path is Journey discovery → policy → apply (World unavailable).
 */
export default function LisbonCredentialPlaceholderPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useUser();
  const journey = LISBON_HOUSE_JOURNEY;

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  return (
    <>
      <MenuUserHeaderComponent />
      {!isInitialized || !isAuthenticated ? (
        <div
          className="flex min-h-[50vh] w-full items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
          <span className="sr-only">Loading</span>
        </div>
      ) : (
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

          <div className="relative z-10 flex w-full max-w-md flex-grow flex-col px-6 pb-10 pt-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <Image
                src="/images/nomadic.webp"
                alt="Nomadic"
                width={64}
                height={64}
              />
              <h1 className="mt-4 text-2xl font-bold text-black">
                Credential not issued
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Eligibility credentials are earned through a Journey application
                after private proofs — nothing has been issued for this Passport.
              </p>
            </div>

            <div className="rounded-2xl border border-black/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-black">
                Continue from the Lisbon House Journey
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Open {journey.community.name}, review {journey.policy.displayName},
                then see application requirements. World verification is not
                available yet — Nomadic will not create a fake credential.
              </p>
            </div>

            <Button
              asChild
              className="mt-6 h-12 w-full rounded-xl bg-[#ff671e] text-base font-bold text-black hover:bg-orange-500"
            >
              <Link href={journey.routes.detail}>Open Lisbon House Journey</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="mt-3 h-12 w-full rounded-xl border-black bg-white text-base font-semibold"
            >
              <Link href="/passport">Back to Passport</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
