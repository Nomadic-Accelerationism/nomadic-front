"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { usePrivatePassport } from "@/hooks/usePrivatePassport";
import {
  findLisbonApplicationRef,
  findLisbonEligibleCredential,
  getLisbonApplyReadiness,
  isSubmittedApplicationStatus,
  LisbonApplicationClientError,
  lisbonApplicationStatusLabel,
  submitLisbonHouseApplication,
  type LisbonApplyUiState,
} from "@/lib/journeys/lisbon-applications";
import { LISBON_HOUSE_JOURNEY } from "@/lib/journeys/lisbon-house";
import {
  formatProofVerifiedAt,
  mergePassportProofs,
  passportProofStatusLabel,
} from "@/lib/passport/merge-proofs";
import { resolveSessionDidToken } from "@/lib/passport/session-did";
import { isWorldPublicConfigured } from "@/lib/world/client";

/**
 * Lisbon House apply — World checks + backend-authoritative application submit.
 */
export function LisbonHouseApplyScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, publicAddress, didToken, logout } =
    useUser();
  const {
    passport,
    isLoading,
    isAuthError,
    refetch,
  } = usePrivatePassport();
  const fixture = LISBON_HOUSE_JOURNEY;
  const { dataMinimization } = fixture.policy;
  const worldConfigured = isWorldPublicConfigured();

  const [uiState, setUiState] = useState<LisbonApplyUiState>("ready");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null,
  );
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  const readiness = useMemo(
    () => getLisbonApplyReadiness(passport?.proofs),
    [passport?.proofs],
  );

  const mergedProofs = useMemo(
    () => mergePassportProofs(passport?.proofs),
    [passport?.proofs],
  );

  const existingApplication = useMemo(
    () => findLisbonApplicationRef(passport?.journeys),
    [passport?.journeys],
  );

  const existingCredential = useMemo(
    () => findLisbonEligibleCredential(passport?.credentials),
    [passport?.credentials],
  );

  useEffect(() => {
    if (
      existingApplication &&
      isSubmittedApplicationStatus(existingApplication.status)
    ) {
      setApplicationStatus(existingApplication.status || "SUBMITTED");
      setUiState("submitted");
    } else if (existingCredential) {
      setUiState("submitted");
      setApplicationStatus((prev) => prev || "SUBMITTED");
    } else if (!readiness.canSubmit) {
      setUiState((prev) => (prev === "submitting" ? prev : "ready"));
    }
  }, [existingApplication, existingCredential, readiness.canSubmit]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    if (uiState === "submitted") return;
    if (!readiness.canSubmit) {
      setUiState("requirements_unsatisfied");
      setSubmitError(
        "Complete both World Identity Check and Selfie Check before applying.",
      );
      return;
    }

    submittingRef.current = true;
    setUiState("submitting");
    setSubmitError(null);

    try {
      const token = await resolveSessionDidToken(didToken);
      if (!token) {
        setUiState("session_expired");
        setSubmitError("Your session expired. Please sign in again.");
        return;
      }

      const result = await submitLisbonHouseApplication(token);
      setApplicationStatus(result.application.status);
      setUiState("submitted");
      refetch();
    } catch (error) {
      if (error instanceof LisbonApplicationClientError) {
        if (
          error.code === "MISSING_SESSION" ||
          error.code === "INVALID_SESSION"
        ) {
          setUiState("session_expired");
          setSubmitError("Your session expired. Please sign in again.");
        } else if (error.code === "POLICY_NOT_SATISFIED") {
          setUiState("requirements_unsatisfied");
          setSubmitError(
            "Requirements are no longer satisfied. Re-check Identity and Selfie proofs.",
          );
          refetch();
        } else if (error.code === "ALREADY_APPLIED") {
          setUiState("submitted");
          setApplicationStatus("SUBMITTED");
          setSubmitError(null);
          refetch();
        } else if (error.code === "BACKEND_UNAVAILABLE") {
          setUiState("backend_unavailable");
          setSubmitError("Backend unavailable. Please try again shortly.");
        } else {
          setUiState("unexpected_error");
          setSubmitError("Unexpected error submitting your application.");
        }
      } else {
        setUiState("unexpected_error");
        setSubmitError("Unexpected error submitting your application.");
      }
    } finally {
      submittingRef.current = false;
    }
  }, [didToken, readiness.canSubmit, refetch, uiState]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-[var(--nomadic-orange)]"
          aria-hidden
        />
        <span className="sr-only">Loading application</span>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 px-6">
        <p className="text-center text-sm text-red-900">
          Your session expired. Please sign in again.
        </p>
        <Button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login-user");
          }}
        >
          Sign in again
        </Button>
      </div>
    );
  }

  const submitted = uiState === "submitted";

  return (
    <div className="flex w-full flex-col pb-6">
        <Button
          asChild
          variant="quiet"
          className="mb-4 h-10 w-fit justify-start px-0 text-sm"
        >
          <Link href={fixture.routes.detail}>← Back to Journey</Link>
        </Button>

        <h1 className="font-display text-2xl font-bold tracking-display text-[var(--nomadic-ink)]">
          Apply
        </h1>
        <p className="mt-2 text-sm text-[var(--nomadic-muted)]">
          {fixture.community.name} · {fixture.journey.title}
        </p>

        <section
          className="mt-8 space-y-3"
          aria-labelledby="apply-proofs-heading"
        >
          <h2
            id="apply-proofs-heading"
            className="text-sm font-semibold uppercase tracking-wide text-[var(--nomadic-muted)]"
          >
            Required proofs
          </h2>
          {isLoading && !passport ? (
            <p className="text-sm text-[var(--nomadic-muted)]">
              Loading Passport proofs…
            </p>
          ) : (
            mergedProofs.map((proof) => (
              <div key={proof.id} className="surface-soft px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[var(--nomadic-ink)]">
                    {proof.title}
                  </h3>
                  <span
                    className={
                      proof.status === "completed"
                        ? "badge-nomadic badge-nomadic-success"
                        : "badge-nomadic badge-nomadic-pending"
                    }
                  >
                    {passportProofStatusLabel(proof.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--nomadic-muted)]">
                  {proof.description}
                </p>
                {proof.status === "completed" &&
                formatProofVerifiedAt(proof.verifiedAt) ? (
                  <p className="mt-2 text-xs text-[var(--nomadic-muted)]">
                    Verified at: {formatProofVerifiedAt(proof.verifiedAt)}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </section>

        <section
          className="surface-soft mt-8 px-4 py-4 text-left"
          aria-labelledby="privacy-disclosure-heading"
        >
          <h2
            id="privacy-disclosure-heading"
            className="text-base font-semibold text-[var(--nomadic-ink)]"
          >
            Privacy disclosure
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--nomadic-muted)]">
            {dataMinimization.disclosure}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--nomadic-muted)]">
            Designed not to retain
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--nomadic-muted)]">
            {dataMinimization.designedNotToRetain.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {!submitted ? (
          <section
            className="surface-soft mt-8 px-4 py-5 text-left"
            aria-labelledby="passport-world-checks-heading"
            data-world-integration-boundary="passport-redirect"
          >
            <h2
              id="passport-world-checks-heading"
              className="text-base font-semibold text-[var(--nomadic-ink)]"
            >
              World checks live on your Passport
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--nomadic-muted)]">
              {worldConfigured
                ? "Identity Check and Selfie Check run on the Passport screen. Complete them there, then return here to apply."
                : "World verification is not available yet."}
            </p>
            {worldConfigured ? (
              <Button asChild size="lg" className="mt-4 w-full">
                <Link href="/passport#world-verification">
                  Open Passport World checks
                </Link>
              </Button>
            ) : null}
          </section>
        ) : null}

        <section
          className="surface-soft mt-8 px-4 py-5"
          aria-labelledby="apply-submit-heading"
          data-lisbon-apply-state={uiState}
        >
          <h2
            id="apply-submit-heading"
            className="text-base font-semibold text-[var(--nomadic-ink)]"
          >
            {submitted ? "Application submitted" : "Submit application"}
          </h2>

          {submitted ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nomadic-muted)]">
                Your Passport satisfied lisbon_house_policy_v1 and your
                application has been submitted to Nomadic Lisbon House.
              </p>
              <p className="mt-2 text-xs text-[var(--nomadic-muted)]">
                Status:{" "}
                {lisbonApplicationStatusLabel(
                  applicationStatus || existingApplication?.status || "SUBMITTED",
                )}
              </p>
              {existingCredential ? (
                <p className="mt-2 text-sm font-medium text-[var(--nomadic-success)]">
                  Lisbon House Eligibility credential is on your Passport.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-[var(--nomadic-muted)]">
                {readiness.canSubmit
                  ? "Ready to apply — both Passport proofs are verified."
                  : "Apply stays disabled until both proofs are verified on your Passport."}
              </p>
              {!readiness.canSubmit ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--nomadic-pending)]">
                  {!readiness.identityVerified ? (
                    <li>World Identity Check still required</li>
                  ) : null}
                  {!readiness.selfieVerified ? (
                    <li>World Selfie Check still required</li>
                  ) : null}
                </ul>
              ) : null}

              {submitError ? (
                <p className="mt-3 rounded-[var(--nomadic-radius-sm)] border border-[var(--nomadic-danger)]/25 bg-[var(--nomadic-danger-soft)] px-3 py-2 text-sm text-[var(--nomadic-danger)]">
                  {submitError}
                </p>
              ) : null}

              <Button
                type="button"
                disabled={!readiness.canSubmit || uiState === "submitting"}
                onClick={() => void handleSubmit()}
                size="lg"
                className="mt-4 w-full"
              >
                {uiState === "submitting"
                  ? "Submitting application…"
                  : readiness.canSubmit
                    ? "Submit application"
                    : "Complete proofs to apply"}
              </Button>

              {uiState === "session_expired" ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => {
                    logout();
                    router.replace("/login-user");
                  }}
                >
                  Sign in again
                </Button>
              ) : null}
            </>
          )}
        </section>

        <Button
          asChild
          variant="secondary"
          size="lg"
          className="mt-6 w-full"
        >
          <Link href="/passport">Return to Passport</Link>
        </Button>
    </div>
  );
}
