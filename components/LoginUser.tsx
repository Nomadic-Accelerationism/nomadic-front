"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isNomadicApiConfigured } from "@/lib/config/nomadic-api";
import type { ValidateOtpErrorCode } from "@/lib/auth/validate-otp-errors";
import { playBloom, playSuccess } from "@/lib/cuelume/feedback";
import { getSepoliaMagic } from "@/lib/magic/sepolia-singleton";
import { NomadicWordmark } from "@/components/shell/NomadicBrand";
import { MobileAppShell } from "@/components/shell/MobileAppShell";

type AuthUiState =
  | "idle"
  | "requesting_otp"
  | "otp_sent"
  | "validating_magic_session"
  | "creating_nomadic_session"
  | "authenticated"
  | "configuration_error"
  | "backend_unavailable"
  | "invalid_session"
  | "unexpected_error";

/**
 * Shared Sepolia Magic only — never construct a separate Magic client here.
 * A second default-network instance on /start leaves a stale .magic-iframe and
 * blocks provision eth_sendTransaction with "Please refresh the page…".
 */
const magic = typeof window !== "undefined" ? getSepoliaMagic() : null;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (magic) {
  magic.preload();
}

function mapValidateOtpCode(code: unknown): AuthUiState {
  switch (code as ValidateOtpErrorCode) {
    case "MISSING_API_CONFIG":
      return "configuration_error";
    case "BACKEND_UNAVAILABLE":
      return "backend_unavailable";
    case "INVALID_SESSION":
    case "MISSING_DID":
      return "invalid_session";
    default:
      return "unexpected_error";
  }
}

const USER_MESSAGES: Partial<Record<AuthUiState, string>> = {
  requesting_otp: "Requesting a sign-in code…",
  otp_sent: "Check your email for the Magic sign-in code.",
  validating_magic_session: "Validating your Magic session…",
  creating_nomadic_session: "Creating your Nomadic Passport session…",
  authenticated: "Signed in. Opening Passport setup…",
  configuration_error: "Nomadic authentication is temporarily unavailable.",
  backend_unavailable:
    "Your email was verified, but Nomadic could not start your Passport session. Please try again.",
  invalid_session: "Your verification session expired. Please sign in again.",
  unexpected_error: "Something went wrong. Please try again.",
};

export default function UserLoginComponent() {
  const [email, setEmail] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { setUserMetadata, setDidToken, setPublicAddress } = useUser();
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthUiState>(() => {
    if (!process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY?.trim()) {
      return "configuration_error";
    }
    if (!isNomadicApiConfigured()) {
      return "configuration_error";
    }
    return "idle";
  });
  const [requestId, setRequestId] = useState<string | null>(null);

  const isBusy = useMemo(
    () =>
      [
        "requesting_otp",
        "otp_sent",
        "validating_magic_session",
        "creating_nomadic_session",
        "authenticated",
      ].includes(authState),
    [authState]
  );

  const statusMessage = USER_MESSAGES[authState] ?? null;
  const isErrorState = [
    "configuration_error",
    "backend_unavailable",
    "invalid_session",
    "unexpected_error",
  ].includes(authState);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (isErrorState && authState !== "configuration_error") {
      setAuthState("idle");
      setRequestId(null);
    }
  };

  const requestOTP = async (loginEmail: string) => {
    setRequestId(null);

    if (!process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY?.trim() || !magic) {
      setAuthState("configuration_error");
      playBloom();
      return;
    }
    if (!isNomadicApiConfigured()) {
      setAuthState("configuration_error");
      playBloom();
      return;
    }

    try {
      setAuthState("requesting_otp");

      // Magic UI handles OTP entry; treat return as OTP completed.
      setAuthState("otp_sent");
      const didToken = await magic.auth.loginWithEmailOTP({ email: loginEmail });

      if (!didToken) {
        setAuthState("invalid_session");
        playBloom();
        return;
      }

      setAuthState("validating_magic_session");
      await magic.user.getInfo();

      // Do not treat Magic OTP success as Nomadic login until backend succeeds.
      setAuthState("creating_nomadic_session");
      const response = await axios.post(
        "/api/auth/validate-otp",
        { email: loginEmail, didToken },
        { validateStatus: () => true }
      );

      if (response.status < 200 || response.status >= 300) {
        const code = response.data?.code;
        const rid =
          typeof response.data?.requestId === "string"
            ? response.data.requestId
            : null;
        setRequestId(rid);
        setAuthState(mapValidateOtpCode(code));
        playBloom();
        return;
      }

      const metadata = response.data?.metadata;
      if (!metadata) {
        setAuthState("unexpected_error");
        playBloom();
        return;
      }

      // Persist session only after backend success.
      setDidToken(didToken);
      setUserMetadata(metadata);
      if (metadata.publicAddress) {
        setPublicAddress(metadata.publicAddress);
      }

      setAuthState("authenticated");
      playSuccess();
      // First-time path: choose Passport name / creation gate before Explore.
      router.push("/start");
    } catch (error) {
      // Avoid logging tokens; axios errors may embed request bodies.
      console.error("Login flow failed", axios.isAxiosError(error) ? error.code : "error");
      if (axios.isAxiosError(error) && !error.response) {
        setAuthState("backend_unavailable");
      } else {
        setAuthState("unexpected_error");
      }
      playBloom();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(email)) {
      setIsAlertOpen(true);
      playBloom();
      return;
    }

    await requestOTP(email);
  };

  const requestNewOTP = () => {
    if (!emailRegex.test(email)) {
      setIsAlertOpen(true);
      playBloom();
      return;
    }
    void requestOTP(email);
  };

  return (
    <MobileAppShell
      showHeader={false}
      showNav={false}
      contentClassName="relative justify-center overflow-hidden px-6 py-8 sm:px-7"
    >
      <div
        className="pointer-events-none absolute inset-x-[-35%] bottom-[-18%] h-[58%] rounded-full bg-[radial-gradient(circle,rgba(255,103,30,0.25),rgba(255,170,116,0.1)_48%,transparent_72%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[calc(100dvh-4rem)] flex-col justify-between">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="flex flex-col items-center text-center">
            <NomadicWordmark
              height={36}
              decorative
              className="brightness-0"
            />
            <span className="sr-only">Nomadic</span>
            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--nomadic-muted)]">
              Nomad login
            </p>
            <h1 className="font-display mt-3 text-[30px] font-black leading-[0.95] tracking-display text-[var(--nomadic-ink)]">
              Travel, share,
              <br />
              hack &amp; enjoy
            </h1>
            <p className="mt-4 text-[clamp(10px,3vw,12px)] leading-5 tracking-body text-[var(--nomadic-muted)]">
              <span className="block whitespace-nowrap">
                Enter your email to receive a one-time code.
              </span>
              <span className="block whitespace-nowrap">
                We recommend using a personal email for continuity.
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="relative">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={handleEmailChange}
                className="pr-12"
                disabled={isBusy}
                aria-describedby={statusMessage ? "login-status" : undefined}
              />
              <Button
                type="submit"
                className="absolute bottom-0 right-0 top-0 rounded-l-none px-3"
                disabled={isBusy}
                aria-label="Continue with email"
              >
                {isBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                )}
              </Button>
            </div>

            {statusMessage ? (
              <div
                id="login-status"
                className={`rounded-[var(--nomadic-radius-sm)] border px-4 py-3 text-sm ${
                  isErrorState
                    ? "border-[var(--nomadic-danger)]/25 bg-[var(--nomadic-danger-soft)] text-[var(--nomadic-danger)]"
                    : "border-[var(--nomadic-border)] bg-[var(--nomadic-surface)] text-[var(--nomadic-ink)]"
                }`}
                role={isErrorState ? "alert" : "status"}
                aria-live="polite"
              >
                <p>{statusMessage}</p>
                {requestId ? (
                  <details className="mt-2 text-xs text-[var(--nomadic-muted)]">
                    <summary className="cursor-pointer">
                      Technical details
                    </summary>
                    <p className="mt-1 break-all">Request ID: {requestId}</p>
                  </details>
                ) : null}
              </div>
            ) : null}

            {authState !== "idle" && authState !== "configuration_error" ? (
              <Button
                type="button"
                variant="quiet"
                className="w-full"
                onClick={requestNewOTP}
                disabled={isBusy}
              >
                Send new code
              </Button>
            ) : null}
          </form>
        </div>

        <div className="pt-8 text-center">
          <p className="text-xs text-[var(--nomadic-muted)]">v.0.01a</p>
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalid Email</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter a valid email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setIsAlertOpen(false)}>OK</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileAppShell>
  );
}
