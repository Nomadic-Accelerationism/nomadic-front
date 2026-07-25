"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { isPlausibleEthAddress } from "@/lib/wallet";
import { PassportIdentity } from "@/components/passport/PassportIdentity";
import { CredentialCard } from "@/components/passport/CredentialCard";

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
        <Loader2 className="h-8 w-8 animate-spin text-clay-ink" aria-hidden />
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
        <Loader2 className="h-8 w-8 animate-spin text-clay-ink" aria-hidden />
        <span className="sr-only">Redirecting to login</span>
      </div>
    );
  }

  const walletAvailable = isPlausibleEthAddress(publicAddress);
  const privateEmail =
    typeof userMetadata?.email === "string" && userMetadata.email.trim()
      ? userMetadata.email.trim()
      : null;

  return (
    <div
      className="clay-page-gradient relative flex w-full flex-col items-center overflow-hidden"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      <div className="relative z-10 flex w-full max-w-md flex-grow flex-col items-center px-6 pb-10 pt-8">
        <div className="clay-surface clay-tone-white mb-8 flex w-full flex-col items-center px-6 py-6">
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
          <p className="mt-2 text-center text-sm text-clay-muted">
            Your portable identity for communities and events.
          </p>
        </div>

        <div className="w-full space-y-8">
          <PassportIdentity publicAddress={publicAddress} />

          <section aria-labelledby="passport-credentials-heading">
            <h2
              id="passport-credentials-heading"
              className="mb-4 text-left text-sm font-bold uppercase tracking-[0.14em] text-clay-muted"
            >
              Credentials
            </h2>
            <CredentialCard claimAvailable={walletAvailable} />
          </section>

          {privateEmail ? (
            <section
              aria-labelledby="passport-account-heading"
              className="clay-surface clay-tone-lilac rounded-[26px] border-none px-5 py-5 text-left"
            >
              <h2
                id="passport-account-heading"
                className="text-sm font-bold text-clay-ink"
              >
                Private account
              </h2>
              <p className="mt-1 break-all text-sm text-clay-muted">
                Signed in as {privateEmail}
              </p>
              <p className="mt-2 text-xs text-clay-muted">
                Email stays private and is never used as your public Passport
                identity.
              </p>
            </section>
          ) : null}
        </div>

        <p className="mt-auto pt-8 text-xs font-semibold text-clay-ink">v.0.01a · Lisbon</p>
      </div>
    </div>
  );
}
