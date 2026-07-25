"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { usePrivatePassport } from "@/hooks/usePrivatePassport";
import { PassportIdentity } from "@/components/passport/PassportIdentity";
import { PassportProofs } from "@/components/passport/PassportProofs";
import { PassportCredentials } from "@/components/passport/PassportCredentials";
import { PassportJourneys } from "@/components/passport/PassportJourneys";

function PassportShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </div>
  );
}

function PassportHeader() {
  return (
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
  );
}

export function PassportScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, userMetadata, logout } = useUser();
  const {
    passport,
    isLoading,
    isError,
    errorCode,
    requestId,
    refetch,
    isAuthError,
    isBackendError,
  } = usePrivatePassport();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  const handleExpiredSession = () => {
    logout();
    router.replace("/login-user");
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <PassportShell>
        <div
          className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
          <p className="text-sm text-gray-700">Loading your Passport…</p>
        </div>
      </PassportShell>
    );
  }

  // Loading Passport from backend — do not flash fixture/local wallet identity.
  if (isLoading && !passport) {
    return (
      <PassportShell>
        <PassportHeader />
        <div
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-10"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
          <p className="text-sm text-gray-700">Loading your Passport…</p>
        </div>
      </PassportShell>
    );
  }

  if (isAuthError) {
    return (
      <PassportShell>
        <PassportHeader />
        <div
          className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-left"
          role="alert"
        >
          <p className="text-base font-semibold text-red-950">
            Your session expired. Please sign in again.
          </p>
          <Button
            type="button"
            onClick={handleExpiredSession}
            className="mt-4 h-11 w-full rounded-xl bg-[#ff671e] text-sm font-bold text-black hover:bg-orange-500"
          >
            Sign in again
          </Button>
        </div>
      </PassportShell>
    );
  }

  if ((isError && isBackendError) || !passport) {
    return (
      <PassportShell>
        <PassportHeader />
        <div
          className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-left"
          role="alert"
        >
          <p className="text-base font-semibold text-amber-950">
            Your Passport could not be loaded right now.
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            Your sign-in is still active. You can try loading again.
          </p>
          {requestId ? (
            <details className="mt-3 text-xs text-amber-900/70">
              <summary className="cursor-pointer">Technical details</summary>
              <p className="mt-1 break-all">
                {errorCode} · Request ID: {requestId}
              </p>
            </details>
          ) : null}
          <Button
            type="button"
            onClick={() => refetch()}
            className="mt-4 h-11 w-full rounded-xl bg-[#ff671e] text-sm font-bold text-black hover:bg-orange-500"
          >
            Retry
          </Button>
        </div>
        {/* Journeys discovery remains available from frontend fixture during backend outage. */}
        <div className="mt-8 w-full">
          <PassportJourneys />
        </div>
      </PassportShell>
    );
  }

  const privateEmail =
    typeof userMetadata?.email === "string" && userMetadata.email.trim()
      ? userMetadata.email.trim()
      : null;

  return (
    <PassportShell>
      <PassportHeader />

      <div className="w-full space-y-8">
        <PassportIdentity
          publicAddress={passport.publicAddress}
          identityStatus={passport.identityStatus}
          ensName={passport.ensName}
          ensStatus={passport.ensStatus}
        />

        <PassportProofs backendProofs={passport.proofs} />

        <section aria-labelledby="passport-credentials-heading">
          <h2
            id="passport-credentials-heading"
            className="mb-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-700"
          >
            Credentials
          </h2>
          <PassportCredentials credentials={passport.credentials} />
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
    </PassportShell>
  );
}
