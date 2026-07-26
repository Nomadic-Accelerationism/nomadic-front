"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileAppShell } from "@/components/shell/MobileAppShell";
import { PassportCover } from "@/components/passport/PassportCover";
import { PassportOpenSheet } from "@/components/passport/PassportOpenSheet";
import { WorldVerificationPanel } from "@/components/world/WorldVerificationPanel";
import { useUser } from "@/contexts/UserContext";
import { usePrivatePassport } from "@/hooks/usePrivatePassport";
import { passportBookTitle } from "@/lib/passport/display-name";
import {
  isPassportBookOpen,
  type PassportBookState,
} from "@/lib/passport/ui-state";
import { isWorldPublicConfigured } from "@/lib/world/client";

export function PassportScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, logout, publicAddress } = useUser();
  const {
    passport,
    isLoading,
    isError,
    errorCode,
    requestId,
    shape,
    refetch,
    isAuthError,
    isBackendError,
  } = usePrivatePassport();
  const [bookState, setBookState] = useState<PassportBookState>("closed");
  const worldConfigured = isWorldPublicConfigured();

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
      <MobileAppShell showNav={false}>
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="h-8 w-8 animate-spin text-[var(--nomadic-orange)]"
            aria-hidden
          />
          <p className="text-sm text-[var(--nomadic-muted)]">
            Loading your Passport…
          </p>
        </div>
      </MobileAppShell>
    );
  }

  if (isLoading && !passport) {
    return (
      <MobileAppShell>
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3"
          role="status"
          aria-live="polite"
          data-state="passport-loading"
        >
          <Loader2
            className="h-8 w-8 animate-spin text-[var(--nomadic-orange)]"
            aria-hidden
          />
          <p className="text-sm text-[var(--nomadic-muted)]">
            Loading your Passport…
          </p>
        </div>
      </MobileAppShell>
    );
  }

  if (isAuthError) {
    return (
      <MobileAppShell>
        <div
          className="rounded-[var(--nomadic-radius-md)] border border-[var(--nomadic-danger)]/25 bg-[var(--nomadic-danger-soft)] px-4 py-6"
          role="alert"
        >
          <p className="text-base font-semibold text-[var(--nomadic-ink)]">
            Your session expired. Please sign in again.
          </p>
          <Button type="button" onClick={handleExpiredSession} className="mt-4 w-full">
            Sign in again
          </Button>
        </div>
      </MobileAppShell>
    );
  }

  if ((isError && isBackendError) || !passport) {
    return (
      <MobileAppShell>
        <div
          className="rounded-[var(--nomadic-radius-md)] border border-[var(--nomadic-pending)]/25 bg-[var(--nomadic-pending-soft)] px-4 py-6"
          role="alert"
          data-state="passport-unavailable"
        >
          <p className="text-base font-semibold text-[var(--nomadic-ink)]">
            Passport unavailable
          </p>
          <p className="mt-2 text-sm text-[var(--nomadic-muted)]">
            Your sign-in is still active. You can try loading again.
          </p>
          {requestId || shape ? (
            <details className="mt-3 text-xs text-[var(--nomadic-muted)]">
              <summary className="cursor-pointer">Technical details</summary>
              <p className="mt-1 break-all">
                {errorCode}
                {requestId ? ` · Request ID: ${requestId}` : ""}
              </p>
            </details>
          ) : null}
          <Button type="button" onClick={() => refetch()} className="mt-4 w-full">
            Retry
          </Button>
        </div>
      </MobileAppShell>
    );
  }

  const bookTitle = passportBookTitle(passport.ensName);
  const coverName =
    passport.ensStatus === "ISSUED" && passport.ensName
      ? passport.ensName.split(".")[0]
      : abbreviatedHandle(passport.publicAddress);
  const worldSignal =
    passport.publicAddress || publicAddress || undefined;

  return (
    <MobileAppShell contentClassName="justify-start gap-4 pb-8 pt-2">
      <PassportCover
        displayName={coverName}
        onOpen={() => setBookState("open")}
        subtitle={
          passport.ensStatus === "ISSUED"
            ? "Temporary communities · Journeys"
            : "Passport name not issued yet · World checks stay available"
        }
      >
        {worldConfigured ? (
          <WorldVerificationPanel
            variant="cover"
            signal={worldSignal}
            backendProofs={passport.proofs}
            onProofSynced={() => refetch()}
          />
        ) : (
          <section
            id="world-verification"
            className="rounded-[var(--nomadic-radius-sm)] border border-[var(--nomadic-cover-cream)]/20 bg-[var(--nomadic-cover-cream)]/5 px-3 py-3 text-left"
            data-world-integration-boundary="unavailable"
            data-world-variant="cover"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--nomadic-cover-cream)]/80">
              World verification
            </h2>
            <p className="mt-1.5 text-xs text-[var(--nomadic-cover-cream)]/55">
              World verification is not available yet.
            </p>
          </section>
        )}
      </PassportCover>

      <PassportOpenSheet
        open={isPassportBookOpen(bookState)}
        onOpenChange={(open) => setBookState(open ? "open" : "closed")}
        passport={passport}
        bookTitle={bookTitle}
      />
    </MobileAppShell>
  );
}

function abbreviatedHandle(address: `0x${string}` | null): string {
  if (!address) return "Nomad";
  return `${address.slice(0, 6)}…`;
}
