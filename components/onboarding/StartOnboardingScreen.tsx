"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileAppShell } from "@/components/shell/MobileAppShell";
import { PassportCover } from "@/components/passport/PassportCover";
import { ProvisionProgress } from "@/components/onboarding/ProvisionProgress";
import UserLoginComponent from "@/components/LoginUser";
import { useUser } from "@/contexts/UserContext";
import { usePrivatePassport } from "@/hooks/usePrivatePassport";
import { usePassportHandleAvailability } from "@/hooks/usePassportHandleAvailability";
import { usePassportProvisionFlow } from "@/hooks/usePassportProvisionFlow";
import { fetchPrivatePassport } from "@/lib/passport/fetch-me";
import { displayLabelFromHandle } from "@/lib/passport/handle";
import {
  evaluateProvisioningGate,
  type ProvisioningGateResult,
} from "@/lib/passport/provisioning-gate";
import { resolveSessionDidToken } from "@/lib/passport/session-did";
import { truncateAddress } from "@/lib/wallet";
import { playBloom, playSuccess } from "@/lib/cuelume/feedback";

type ExistingProbe =
  | { found: true; passportName: string; source: string }
  | { found: false; reason?: string };

async function fetchExisting(did: string): Promise<ExistingProbe> {
  const res = await fetch("/api/passport/existing", {
    headers: { Authorization: `Bearer ${did}` },
    cache: "no-store",
  });
  return (await res.json()) as ExistingProbe;
}

export function StartOnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, didToken, publicAddress } = useUser();
  const { passport, isLoading: passportLoading, refetch } = usePrivatePassport();
  const handle = usePassportHandleAvailability();
  const flow = usePassportProvisionFlow();
  const [uiPhase, setUiPhase] = useState<"select" | "preview" | "provision">(
    "select"
  );
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const existingQuery = useQuery({
    queryKey: ["passport", "existing", Boolean(didToken)],
    enabled: isInitialized && isAuthenticated && Boolean(didToken),
    queryFn: async () => {
      const token = await resolveSessionDidToken(didToken);
      if (!token) return { found: false as const, reason: "Missing session." };
      return fetchExisting(token);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isAuthenticated || !didToken) return;
    void (async () => {
      const token = await resolveSessionDidToken(didToken);
      if (!token) return;
      await flow.refreshMintAdapter();
      await flow.resumeIfNeeded({
        didToken: token,
        expectedOwner: (passport?.publicAddress ||
          publicAddress) as `0x${string}` | null,
      });
    })();
    // Intentionally once after auth settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, Boolean(didToken)]);

  useEffect(() => {
    if (
      flow.phase !== "idle" &&
      flow.phase !== "blocked" &&
      flow.provision
    ) {
      setUiPhase("provision");
    }
    if (flow.phase === "complete") {
      void (async () => {
        refetch();
        const token = await resolveSessionDidToken(didToken);
        if (!token) return;
        try {
          const me = await fetchPrivatePassport(token);
          const ensName =
            typeof me.passport.ensName === "string"
              ? me.passport.ensName.trim()
              : "";
          const expected = flow.provision?.passportName?.toLowerCase();
          const issuedOk =
            me.passport.ensStatus === "ISSUED" &&
            ensName.length > 0 &&
            (!expected || ensName.toLowerCase() === expected);
          if (issuedOk) {
            router.replace("/passport");
          }
        } catch {
          // Stay on provision UI until /passport/me confirms ISSUED.
        }
      })();
    }
  }, [didToken, flow.phase, flow.provision, refetch, router]);

  useEffect(() => {
    if (!existingQuery.data?.found) return;
    router.replace("/passport");
  }, [existingQuery.data, router]);

  useEffect(() => {
    if (!passport) return;
    if (passport.ensStatus === "ISSUED" && passport.ensName) {
      router.replace("/passport");
    }
  }, [passport, router]);

  useEffect(() => {
    if (handle.handleValid) {
      flow.clearAttemptForNewLabel(handle.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle.label, handle.handleValid]);

  const mintAvailable = Boolean(flow.mintAdapter?.available);

  const gate: ProvisioningGateResult = useMemo(
    () =>
      evaluateProvisioningGate({
        isAuthenticated,
        ensStatus: passport?.ensStatus ?? "NOT_ISSUED",
        identityStatus: passport?.identityStatus ?? null,
        handleValid: handle.handleValid,
        availabilityStatus: handle.status,
        registryConfigured: true,
        mintAdapterAvailable: mintAvailable,
      }),
    [
      isAuthenticated,
      passport?.ensStatus,
      passport?.identityStatus,
      handle.handleValid,
      handle.status,
      mintAvailable,
    ]
  );

  const previewName = handle.handleValid
    ? displayLabelFromHandle(handle.label)
    : "your-name";
  const abbreviated = truncateAddress(
    passport?.publicAddress || publicAddress
  );

  const statusHint =
    handle.message ||
    handle.validationMessage ||
    (handle.status === "empty"
      ? "This will be your public Nomadic Passport."
      : null);

  useEffect(() => {
    if (handle.status === "available") playSuccess();
    if (
      handle.status === "taken" ||
      handle.status === "reserved" ||
      handle.status === "unavailable"
    ) {
      playBloom();
    }
  }, [handle.status]);

  const handleCreate = async () => {
    setCreateMessage(null);
    if (!gate.canCreate || !handle.handleValid) {
      setCreateMessage(
        gate.message || "Passport creation is temporarily unavailable."
      );
      playBloom();
      return;
    }

    const token = await resolveSessionDidToken(didToken);
    if (!token) {
      setCreateMessage("Sign in to create your Passport.");
      playBloom();
      return;
    }

    setUiPhase("provision");
    await flow.beginCreate({
      didToken: token,
      label: handle.label,
      expectedOwner: (passport?.publicAddress ||
        publicAddress) as `0x${string}` | null,
    });
  };

  if (!isInitialized) {
    return (
      <MobileAppShell showNav={false} showHeader={false}>
        <div
          className="flex min-h-[50vh] flex-col items-center justify-center gap-3"
          role="status"
        >
          <Loader2
            className="h-7 w-7 animate-spin text-[var(--nomadic-orange)]"
            aria-hidden
          />
        </div>
      </MobileAppShell>
    );
  }

  if (!isAuthenticated) {
    if (showEmailLogin) {
      return <UserLoginComponent />;
    }

    return (
      <MobileAppShell showNav={false} showHeader={false}>
        <div
          className="flex flex-1 flex-col items-center justify-center gap-8 px-2 py-10 text-center"
          data-onboarding="logged-out"
        >
          <div className="space-y-3">
            <h1 className="font-display text-[30px] font-bold leading-tight tracking-display text-[var(--nomadic-ink)]">
              Your Nomadic Passport
            </h1>
            <p className="text-base tracking-body text-[var(--nomadic-muted)]">
              One identity for every journey.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full max-w-sm"
            onClick={() => setShowEmailLogin(true)}
          >
            Continue with email
          </Button>
        </div>
      </MobileAppShell>
    );
  }

  if (
    (passportLoading && !passport) ||
    existingQuery.isLoading ||
    existingQuery.data?.found
  ) {
    return (
      <MobileAppShell showNav={false}>
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
          role="status"
        >
          <Loader2
            className="h-7 w-7 animate-spin text-[var(--nomadic-orange)]"
            aria-hidden
          />
          <p className="text-sm text-[var(--nomadic-muted)]">
            Opening your Passport…
          </p>
        </div>
      </MobileAppShell>
    );
  }

  if (uiPhase === "provision" && (flow.provision || flow.busy || flow.phase !== "idle")) {
    return (
      <MobileAppShell showNav={false}>
        <ProvisionProgress
          displayName={
            flow.provision?.label
              ? displayLabelFromHandle(flow.provision.label)
              : previewName
          }
          passportName={
            flow.provision?.passportName ||
            handle.passportName ||
            "your-name.nomadic-passport.eth"
          }
          abbreviatedWallet={abbreviated}
          phase={flow.phase}
          phaseLabel={flow.phaseLabel}
          stepLabel={flow.stepLabel}
          message={flow.message || createMessage}
          busy={flow.busy || flow.platformInFlight}
          needsUserSignature={flow.needsUserSignature}
          insufficientFunds={flow.insufficientFunds}
          walletAddress={
            flow.walletAddress ||
            ((passport?.publicAddress || publicAddress) as `0x${string}` | null)
          }
          provision={flow.provision}
          actionLabel={flow.actionLabel}
          onContinueSignature={() => {
            void (async () => {
              const token = await resolveSessionDidToken(didToken);
              const owner = (passport?.publicAddress ||
                publicAddress) as `0x${string}` | null;
              if (!token || !owner) {
                playBloom();
                return;
              }
              await flow.continueUserSignature({
                didToken: token,
                expectedOwner: owner,
              });
            })();
          }}
          onChangeName={() => {
            setUiPhase("select");
            setCreateMessage(null);
            flow.resetMessage();
          }}
        />
      </MobileAppShell>
    );
  }

  if (
    uiPhase === "preview" &&
    handle.handleValid &&
    handle.status === "available"
  ) {
    return (
      <MobileAppShell showNav={false}>
        <div className="flex flex-col gap-6" data-onboarding="preview">
          <header className="space-y-1 text-center">
            <h1 className="font-display text-[22px] font-bold tracking-display text-[var(--nomadic-ink)]">
              Your Passport
            </h1>
            {abbreviated ? (
              <p className="font-mono text-xs text-[var(--nomadic-muted)]">
                {abbreviated}
              </p>
            ) : null}
          </header>

          <PassportCover
            mode="preview"
            displayName={previewName}
            subtitle={handle.passportName || undefined}
          />

          <p className="text-center text-xs leading-relaxed text-[var(--nomadic-muted)]">
            Private proofs stay in Nomadic. Only credentials you publish become
            public.
          </p>

          <div className="space-y-3">
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!gate.canCreate || flow.busy}
              onClick={() => void handleCreate()}
              data-provision-can-create={gate.canCreate}
            >
              {flow.busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                "Create Passport"
              )}
            </Button>
            <p
              className="text-center text-xs text-[var(--nomadic-muted)]"
              role="status"
              data-provision-can-create={gate.canCreate}
            >
              {createMessage ||
                flow.message ||
                (mintAvailable
                  ? gate.message
                  : "Passport creation is temporarily unavailable.")}
            </p>
            <Button
              type="button"
              variant="quiet"
              size="lg"
              className="w-full"
              onClick={() => {
                setUiPhase("select");
                setCreateMessage(null);
              }}
            >
              Change name
            </Button>
          </div>
        </div>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell showNav={false}>
      <div className="flex flex-col gap-6" data-onboarding="select">
        <header className="space-y-2">
          <h1 className="font-display text-[26px] font-bold leading-tight tracking-display text-[var(--nomadic-ink)]">
            Choose your Passport name
          </h1>
        </header>

        <section aria-labelledby="handle-heading" className="space-y-3">
          <h2 id="handle-heading" className="sr-only">
            Passport name
          </h2>
          <div className="flex items-stretch gap-2">
            <label htmlFor="passport-handle" className="sr-only">
              Passport handle
            </label>
            <Input
              id="passport-handle"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="maria"
              value={handle.raw}
              onChange={(e) => {
                handle.setRaw(e.target.value);
                setUiPhase("select");
              }}
              visualState={handle.visualState}
              aria-describedby="handle-status handle-suffix"
              className="flex-1"
            />
            <span
              id="handle-suffix"
              className="inline-flex min-h-11 shrink-0 items-center text-xs font-medium text-[var(--nomadic-muted)]"
            >
              .nomadic-passport.eth
            </span>
          </div>

          <div
            id="handle-status"
            className="flex items-start gap-2 text-xs font-medium text-[var(--nomadic-ink)]"
            role="status"
            data-availability={handle.status}
          >
            {handle.status === "checking" ? (
              <Loader2
                className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[var(--nomadic-pending)]"
                aria-hidden
              />
            ) : null}
            {handle.status === "available" ? (
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--nomadic-success)]"
                aria-hidden
              />
            ) : null}
            {handle.status === "taken" ||
            handle.status === "reserved" ||
            handle.status === "invalid" ||
            handle.status === "unavailable" ? (
              <X
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--nomadic-danger)]"
                aria-hidden
              />
            ) : null}
            <span>{statusHint}</span>
          </div>
        </section>

        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!(handle.handleValid && handle.status === "available")}
            onClick={() => {
              void flow.refreshMintAdapter();
              setUiPhase("preview");
            }}
          >
            Continue
          </Button>
          <Button asChild variant="quiet" size="lg" className="w-full">
            <Link href="/explore">Continue without Passport name</Link>
          </Button>
        </div>
      </div>
    </MobileAppShell>
  );
}
