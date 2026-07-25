"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { PassportIdentity } from "@/components/passport/PassportIdentity";
import { PassportProofs } from "@/components/passport/PassportProofs";
import { CredentialCard } from "@/components/passport/CredentialCard";
import { PassportJourneys } from "@/components/passport/PassportJourneys";

export function PassportScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, publicAddress, userMetadata } =
    useUser();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div
        className="flex min-h-[50vh] w-full items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
        <span className="sr-only">Loading passport</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-[50vh] w-full items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
        <span className="sr-only">Redirecting to login</span>
      </div>
    );
  }

  const privateEmail =
    typeof userMetadata?.email === "string" && userMetadata.email.trim()
      ? userMetadata.email.trim()
      : null;

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

      <div className="relative z-10 flex w-full max-w-md flex-grow flex-col items-center px-6 pb-10 pt-8">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/images/nomadic.webp"
            alt="Nomadic"
            width={72}
            height={72}
            priority
          />
          <h1 className="mt-4 text-center text-2xl font-bold text-black">
            Nomadic Passport
          </h1>
          <p className="mt-2 text-center text-sm text-gray-700">
            Your portable identity for communities, proofs, and Journeys.
          </p>
        </div>

        <div className="w-full space-y-8">
          <PassportIdentity publicAddress={publicAddress} />

          <PassportProofs />

          <section aria-labelledby="passport-credentials-heading">
            <h2
              id="passport-credentials-heading"
              className="mb-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-700"
            >
              Credentials
            </h2>
            <CredentialCard />
          </section>

          <PassportJourneys />

          {privateEmail ? (
            <section
              aria-labelledby="passport-account-heading"
              className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4 text-left"
            >
              <h2
                id="passport-account-heading"
                className="text-sm font-semibold text-gray-700"
              >
                Private account
              </h2>
              <p className="mt-1 break-all text-sm text-gray-600">
                Signed in as {privateEmail}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Email stays private and is never used as your public Passport
                identity.
              </p>
            </section>
          ) : null}
        </div>

        <p className="mt-auto pt-8 text-xs text-gray-800">v.0.01a · Lisbon</p>
      </div>
    </div>
  );
}
