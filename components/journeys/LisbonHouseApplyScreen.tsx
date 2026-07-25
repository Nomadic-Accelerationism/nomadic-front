"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorldVerificationPanel } from "@/components/world/WorldVerificationPanel";
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
        <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
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
          className="h-11 rounded-xl bg-[#ff671e] font-bold text-black"
        >
          Sign in again
        </Button>
      </div>
    );
  }

  const submitted = uiState === "submitted";

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

        <section
          className="mt-8 space-y-3"
          aria-labelledby="apply-proofs-heading"
        >
          <h2
            id="apply-proofs-heading"
            className="text-sm font-semibold uppercase tracking-wide text-gray-700"
          >
            Required proofs
          </h2>
          {isLoading && !passport ? (
            <p className="text-sm text-gray-600">Loading Passport proofs…</p>
          ) : (
            mergedProofs.map((proof) => (
              <div
                key={proof.id}
                className="rounded-2xl border border-black/10 bg-white/90 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-black">{proof.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      proof.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {passportProofStatusLabel(proof.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{proof.description}</p>
                {proof.status === "completed" &&
                formatProofVerifiedAt(proof.verifiedAt) ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Verified at: {formatProofVerifiedAt(proof.verifiedAt)}
                  </p>
                ) : null}
              </div>
            ))
          )}
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

        {!submitted ? (
          <div className="mt-8">
            {worldConfigured ? (
              <WorldVerificationPanel
                signal={publicAddress || undefined}
                backendProofs={passport?.proofs}
                onProofSynced={() => refetch()}
              />
            ) : (
              <section
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-left"
                data-world-integration-boundary="unavailable"
              >
                <h2 className="text-base font-semibold text-amber-950">
                  Verification
                </h2>
                <p className="mt-2 text-sm text-amber-950">
                  World verification is not available yet.
                </p>
              </section>
            )}
          </div>
        ) : null}

        <section
          className="mt-8 rounded-2xl border border-black/10 bg-white/90 px-4 py-5"
          aria-labelledby="apply-submit-heading"
          data-lisbon-apply-state={uiState}
        >
          <h2
            id="apply-submit-heading"
            className="text-base font-semibold text-black"
          >
            {submitted ? "Application submitted" : "Submit application"}
          </h2>

          {submitted ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Your Passport satisfied lisbon_house_policy_v1 and your
                application has been submitted to Nomadic Lisbon House.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Status:{" "}
                {lisbonApplicationStatusLabel(
                  applicationStatus || existingApplication?.status || "SUBMITTED",
                )}
              </p>
              {existingCredential ? (
                <p className="mt-2 text-sm text-emerald-800">
                  Lisbon House Eligibility credential is on your Passport.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-700">
                {readiness.canSubmit
                  ? "Ready to apply — both Passport proofs are verified."
                  : "Apply stays disabled until both proofs are verified on your Passport."}
              </p>
              {!readiness.canSubmit ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {!readiness.identityProofOnPassport ? (
                    <li>World Identity Check still required</li>
                  ) : null}
                  {!readiness.selfieProofOnPassport ? (
                    <li>World Selfie Check still required</li>
                  ) : null}
                </ul>
              ) : null}

              {submitError ? (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  {submitError}
                </p>
              ) : null}

              <Button
                type="button"
                disabled={!readiness.canSubmit || uiState === "submitting"}
                onClick={() => void handleSubmit()}
                className="mt-4 h-12 w-full rounded-xl bg-[#ff671e] text-base font-bold text-black hover:bg-orange-500 disabled:bg-gray-200 disabled:text-gray-500"
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
                  variant="outline"
                  className="mt-3 h-11 w-full rounded-xl"
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
          variant="outline"
          className="mt-6 h-12 w-full rounded-xl border-black/30 bg-white/80 text-base font-semibold"
        >
          <Link href="/passport">Return to Passport</Link>
        </Button>
      </div>
    </div>
  );
}
