"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IDKitRequestWidget,
  identityCheck,
  selfieCheckLegacy,
  type RpContext,
} from "@worldcoin/idkit";
import type { IDKitErrorCodes, IDKitResult } from "@worldcoin/idkit-core";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { PRIVATE_PASSPORT_QUERY_KEY } from "@/hooks/usePrivatePassport";
import { fetchPrivatePassport } from "@/lib/passport/fetch-me";
import {
  formatProofVerifiedAt,
  isPassportProofVerified,
} from "@/lib/passport/merge-proofs";
import { resolveSessionDidToken } from "@/lib/passport/session-did";
import type { PassportProof } from "@/lib/passport/types";
import {
  WORLD_IDENTITY_ACTION,
  WORLD_IDENTITY_MINIMUM_AGE,
  WORLD_IDENTITY_PRESET,
  WORLD_SELFIE_ACTION,
  WORLD_SELFIE_PRESET,
  isWorldPublicConfigured,
  readPublicWorldAppId,
  readPublicWorldEnvironment,
} from "@/lib/world/client";
import {
  WORLD_FLOW_COPY,
  actionForKind,
  proofIdForKind,
  resolveVerifyOutcome,
  userFacingPhaseMessage,
  type WorldCheckKind,
  type WorldFlowPhase,
} from "@/lib/world/flow-state";
import type {
  WorldEnvironment,
  WorldPreset,
  WorldVerifySummary,
} from "@/lib/world/types";

type StepState = {
  phase: WorldFlowPhase;
  message: string | null;
  verifiedAt: string | null;
  summary: WorldVerifySummary | null;
};

type SessionPayload = {
  appId: string;
  action: string;
  preset: WorldPreset;
  allowLegacy: boolean;
  environment: WorldEnvironment;
  rpContext: RpContext;
};

type Props = {
  /** Optional signal for Selfie Check (wallet preferred). */
  signal?: string;
  /** Backend Passport proofs — permanent source of truth for Verified. */
  backendProofs?: PassportProof[];
  /** Fired after a check verifies and Passport refetch is attempted. */
  onProofSynced?: (kind: WorldCheckKind) => void;
  onBothVerified?: () => void;
};

const IDLE: StepState = {
  phase: "IDLE",
  message: null,
  verifiedAt: null,
  summary: null,
};

function stepFromBackend(
  proofs: PassportProof[] | undefined,
  kind: WorldCheckKind,
): StepState {
  const id = proofIdForKind(kind);
  if (!isPassportProofVerified(proofs, id)) return IDLE;
  const record = proofs?.find((p) => {
    const key = (p.type || p.key || p.proofType || p.action || "").toUpperCase();
    if (kind === "identity") {
      return key.includes("IDENTITY") || key === "LISBON_IDENTITY_V1";
    }
    return key.includes("SELFIE") || key === "APPLY_LISBON_HOUSE_V1";
  });
  return {
    phase: "VERIFIED",
    message: null,
    verifiedAt: record?.verifiedAt || record?.completedAt || null,
    summary: null,
  };
}

function phaseLabel(phase: WorldFlowPhase): string {
  switch (phase) {
    case "IDLE":
      return "Not verified";
    case "CONNECTING":
    case "AWAITING_USER":
      return "In progress";
    case "IDKIT_COMPLETED":
    case "VERIFYING_WITH_WORLD":
    case "PERSISTING":
      return "Verifying…";
    case "VERIFIED":
      return WORLD_FLOW_COPY.verifiedWithWorld;
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
  }
}

function isInFlight(phase: WorldFlowPhase): boolean {
  return (
    phase === "CONNECTING" ||
    phase === "AWAITING_USER" ||
    phase === "IDKIT_COMPLETED" ||
    phase === "VERIFYING_WITH_WORLD" ||
    phase === "PERSISTING"
  );
}

export function WorldVerificationPanel({
  signal,
  backendProofs,
  onProofSynced,
  onBothVerified,
}: Props) {
  const queryClient = useQueryClient();
  const { didToken, publicAddress } = useUser();
  const [identity, setIdentity] = useState<StepState>(() =>
    stepFromBackend(backendProofs, "identity"),
  );
  const [selfie, setSelfie] = useState<StepState>(() =>
    stepFromBackend(backendProofs, "selfie"),
  );
  const [panelError, setPanelError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const activeKindRef = useRef<WorldCheckKind | null>(null);
  const verifiedKindsRef = useRef<Set<WorldCheckKind>>(new Set());
  const bothNotifiedRef = useRef(false);

  const configured = isWorldPublicConfigured();
  const publicAppId = readPublicWorldAppId();
  const publicEnv = readPublicWorldEnvironment();
  const selfieSignal =
    signal?.trim() || publicAddress?.trim() || "lisbon-house-apply";

  const identityFromPassport = isPassportProofVerified(
    backendProofs,
    "WORLD_IDENTITY_CHECK",
  );
  const selfieFromPassport = isPassportProofVerified(
    backendProofs,
    "WORLD_SELFIE_CHECK",
  );

  // Align UI with backend proofs after refetch / remount. Never invent VERIFIED locally.
  useEffect(() => {
    if (identityFromPassport) {
      setIdentity((prev) =>
        isInFlight(prev.phase)
          ? prev
          : stepFromBackend(backendProofs, "identity"),
      );
      verifiedKindsRef.current.add("identity");
    } else {
      setIdentity((prev) =>
        isInFlight(prev.phase) || prev.phase === "FAILED" || prev.phase === "CANCELLED"
          ? prev
          : IDLE,
      );
      verifiedKindsRef.current.delete("identity");
    }

    if (selfieFromPassport) {
      setSelfie((prev) =>
        isInFlight(prev.phase)
          ? prev
          : stepFromBackend(backendProofs, "selfie"),
      );
      verifiedKindsRef.current.add("selfie");
    } else {
      setSelfie((prev) =>
        isInFlight(prev.phase) || prev.phase === "FAILED" || prev.phase === "CANCELLED"
          ? prev
          : IDLE,
      );
      verifiedKindsRef.current.delete("selfie");
    }
  }, [backendProofs, identityFromPassport, selfieFromPassport]);

  const bothDone = identityFromPassport && selfieFromPassport;

  useEffect(() => {
    if (!bothDone || bothNotifiedRef.current) return;
    bothNotifiedRef.current = true;
    onBothVerified?.();
  }, [bothDone, onBothVerified]);

  const widgetPreset = useMemo(() => {
    if (!session) return null;
    if (session.preset === "identityCheck") {
      return identityCheck({
        attributes: [
          { type: "minimum_age", value: WORLD_IDENTITY_MINIMUM_AGE },
        ],
      });
    }
    // Selfie: selfieCheckLegacy + allow_legacy_proofs (from session) + apply_lisbon_house_v1
    return selfieCheckLegacy({ signal: selfieSignal });
  }, [session, selfieSignal]);

  const authHeaders = useCallback(async (): Promise<HeadersInit | null> => {
    const token = await resolveSessionDidToken(didToken);
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [didToken]);

  const refetchPassport = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [...PRIVATE_PASSPORT_QUERY_KEY],
    });
    await queryClient.refetchQueries({
      queryKey: [...PRIVATE_PASSPORT_QUERY_KEY],
    });
  }, [queryClient]);

  const markCancelled = useCallback((kind: WorldCheckKind) => {
    const setter = kind === "identity" ? setIdentity : setSelfie;
    setter((prev) =>
      isInFlight(prev.phase)
        ? {
            phase: "CANCELLED",
            message: WORLD_FLOW_COPY.cancelled,
            verifiedAt: null,
            summary: null,
          }
        : prev,
    );
  }, []);

  const beginCheck = useCallback(
    async (kind: WorldCheckKind) => {
      setPanelError(null);
      if (!configured) {
        setPanelError(
          "World is not configured (NEXT_PUBLIC_WORLD_APP_ID missing).",
        );
        return;
      }
      // Selfie unlocks only when Passport has Identity proof — not local IDKit success.
      if (kind === "selfie" && !identityFromPassport) {
        setPanelError(
          "Complete Identity Check first. Selfie unlocks after your Passport shows the Identity proof.",
        );
        return;
      }

      const headers = await authHeaders();
      if (!headers) {
        setPanelError("Sign in again to continue with World verification.");
        return;
      }

      const action = actionForKind(kind);
      const preset =
        kind === "identity" ? WORLD_IDENTITY_PRESET : WORLD_SELFIE_PRESET;
      const setter = kind === "identity" ? setIdentity : setSelfie;

      setBusy(true);
      activeKindRef.current = kind;
      setter({
        phase: "CONNECTING",
        message: WORLD_FLOW_COPY.connecting,
        verifiedAt: null,
        summary: null,
      });
      setSession(null);
      setOpen(false);

      try {
        const res = await fetch("/api/world/request", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action,
            preset,
            signal: kind === "selfie" ? selfieSignal : undefined,
            attributes:
              kind === "identity"
                ? [
                    {
                      type: "minimum_age",
                      value: WORLD_IDENTITY_MINIMUM_AGE,
                    },
                  ]
                : undefined,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          code?: string;
          detail?: string;
          app_id?: string;
          allow_legacy_proofs?: boolean;
          environment?: WorldEnvironment;
          rp_context?: RpContext;
        };

        if (!res.ok || !data.ok || !data.rp_context || !data.app_id) {
          setter({
            phase: "FAILED",
            message:
              data.detail ||
              data.code ||
              `Could not start World request (${res.status})`,
            verifiedAt: null,
            summary: null,
          });
          activeKindRef.current = null;
          return;
        }

        // Selfie must receive allow_legacy_proofs from BFF (selfieCheckLegacy).
        setSession({
          appId: data.app_id,
          action,
          preset,
          allowLegacy: Boolean(data.allow_legacy_proofs),
          environment: data.environment || publicEnv,
          rpContext: data.rp_context,
        });
        setter({
          phase: "AWAITING_USER",
          message: WORLD_FLOW_COPY.awaitingUser,
          verifiedAt: null,
          summary: null,
        });
        setOpen(true);
      } catch (err) {
        setter({
          phase: "FAILED",
          message: err instanceof Error ? err.message : "Request failed",
          verifiedAt: null,
          summary: null,
        });
        activeKindRef.current = null;
      } finally {
        setBusy(false);
      }
    },
    [
      authHeaders,
      configured,
      identityFromPassport,
      publicEnv,
      selfieSignal,
    ],
  );

  /**
   * IDKit handleVerify — gate final Nomadic VERIFIED behind:
   * 1) /api/world/verify ok
   * 2) persisted === true
   * 3) Passport refetch contains matching proof
   *
   * Throws on verify/persist failure so onSuccess does not mean Nomadic Verified.
   */
  const handleVerify = useCallback(
    async (idkitResponse: IDKitResult) => {
      const kind = activeKindRef.current;
      if (!kind) {
        throw new Error("No active World check");
      }

      const headers = await authHeaders();
      if (!headers) {
        throw new Error("Sign in again to verify with the backend.");
      }

      const action = actionForKind(kind);
      const setter = kind === "identity" ? setIdentity : setSelfie;
      const proofId = proofIdForKind(kind);

      setter({
        phase: "IDKIT_COMPLETED",
        message: WORLD_FLOW_COPY.idkitCompleted,
        verifiedAt: null,
        summary: null,
      });

      setter({
        phase: "VERIFYING_WITH_WORLD",
        message: WORLD_FLOW_COPY.verifyingWithWorld,
        verifiedAt: null,
        summary: null,
      });

      const res = await fetch("/api/world/verify", {
        method: "POST",
        headers,
        // Pass IDKit completion result through unchanged — do not remap fields.
        body: JSON.stringify({ action, idkitResponse }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        detail?: string;
        summary?: WorldVerifySummary;
        note?: string;
        persisted?: boolean;
        verifiedAt?: string;
      };

      if (!res.ok || !data.ok) {
        const message = WORLD_FLOW_COPY.verificationFailed;
        setter({
          phase: "FAILED",
          message,
          verifiedAt: null,
          summary: data.summary ?? null,
        });
        throw new Error(message);
      }

      setter({
        phase: "PERSISTING",
        message: WORLD_FLOW_COPY.persisting,
        verifiedAt: null,
        summary: data.summary ?? null,
      });

      await refetchPassport();

      let passportHasProof = false;
      try {
        const token = await resolveSessionDidToken(didToken);
        if (token) {
          const fresh = await fetchPrivatePassport(token);
          passportHasProof = isPassportProofVerified(
            fresh.passport.proofs,
            proofId,
          );
        }
      } catch {
        passportHasProof = false;
      }

      const outcome = resolveVerifyOutcome({
        httpOk: res.ok,
        bodyOk: data.ok === true,
        persisted: data.persisted === true,
        passportHasProof,
      });

      if (outcome.phase === "FAILED") {
        setter({
          phase: "FAILED",
          message: outcome.message,
          verifiedAt: null,
          summary: data.summary ?? null,
        });
        throw new Error(outcome.message);
      }

      const verifiedAt =
        data.verifiedAt ||
        data.summary?.verifiedAt ||
        new Date().toISOString();

      // Permanent VERIFIED only after backend persistence + Passport proof.
      setter({
        phase: "VERIFIED",
        message: null,
        verifiedAt,
        summary: data.summary ?? null,
      });
      verifiedKindsRef.current.add(kind);
      onProofSynced?.(kind);
    },
    [authHeaders, didToken, onProofSynced, refetchPassport],
  );

  // Runs only after handleVerify resolves — still not permanent truth without Passport.
  const handleSuccess = useCallback((_result: IDKitResult) => {
    setOpen(false);
    setSession(null);
    activeKindRef.current = null;
  }, []);

  const handleError = useCallback((errorCode: IDKitErrorCodes) => {
    const kind = activeKindRef.current;
    if (!kind) return;
    const setter = kind === "identity" ? setIdentity : setSelfie;
    setter((prev) => {
      if (
        errorCode === "failed_by_host_app" &&
        prev.phase === "FAILED" &&
        prev.message
      ) {
        return prev;
      }
      return {
        phase: "FAILED",
        message:
          errorCode === "failed_by_host_app"
            ? WORLD_FLOW_COPY.verificationFailed
            : `World connector error: ${errorCode}`,
        verifiedAt: null,
        summary: null,
      };
    });
    setOpen(false);
    setSession(null);
    activeKindRef.current = null;
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) return;
      const kind = activeKindRef.current;
      if (!kind) {
        setSession(null);
        return;
      }
      if (verifiedKindsRef.current.has(kind)) {
        setSession(null);
        activeKindRef.current = null;
        return;
      }
      // If already FAILED from handleVerify throw, keep that message.
      const current = kind === "identity" ? identity : selfie;
      if (current.phase === "FAILED") {
        setSession(null);
        activeKindRef.current = null;
        return;
      }
      markCancelled(kind);
      setSession(null);
      activeKindRef.current = null;
    },
    [identity, markCancelled, selfie],
  );

  if (!configured) {
    return (
      <section
        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-left"
        aria-labelledby="world-misconfigured-heading"
        data-world-integration-boundary="misconfigured"
      >
        <h2
          id="world-misconfigured-heading"
          className="text-base font-semibold text-amber-950"
        >
          World not configured
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950">
          Set <code className="text-xs">NEXT_PUBLIC_WORLD_APP_ID</code> (and
          server RP secrets) to enable Identity Check and Selfie Check.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-black/10 bg-white/90 px-4 py-5 text-left"
      aria-labelledby="world-verification-heading"
      data-world-integration-boundary="live"
      data-world-environment={publicEnv}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="world-verification-heading"
            className="text-base font-semibold text-black"
          >
            World verification
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            Complete Identity Check, then Selfie Check. Final Verified status
            appears only after Nomadic verifies the result and saves it to your
            Passport.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            IDKit environment:{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">
              {publicEnv}
            </code>
            {publicEnv === "staging"
              ? " (simulator OK)"
              : " — set NEXT_PUBLIC_WORLD_ENVIRONMENT=staging for the simulator"}
          </p>
        </div>
        {bothDone ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Both verified
          </span>
        ) : null}
      </div>

      {panelError ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {panelError}
        </p>
      ) : null}

      <ol className="mt-5 space-y-3">
        <CheckRow
          title="1. Identity Check"
          subtitle={`Action ${WORLD_IDENTITY_ACTION} · age ≥ ${WORLD_IDENTITY_MINIMUM_AGE}`}
          state={identity}
          verifiedFromPassport={identityFromPassport}
          disabled={busy || isInFlight(identity.phase) || bothDone}
          ctaLabel={
            identityFromPassport
              ? "Verified"
              : identity.phase === "FAILED" || identity.phase === "CANCELLED"
                ? "Retry Identity Check"
                : "Start Identity Check"
          }
          onStart={() => void beginCheck("identity")}
        />
        <CheckRow
          title="2. Selfie Check"
          subtitle={`Action ${WORLD_SELFIE_ACTION} · selfieCheckLegacy · after Identity`}
          state={selfie}
          verifiedFromPassport={selfieFromPassport}
          disabled={
            busy ||
            isInFlight(selfie.phase) ||
            !identityFromPassport ||
            bothDone
          }
          ctaLabel={
            selfieFromPassport
              ? "Verified"
              : selfie.phase === "FAILED" || selfie.phase === "CANCELLED"
                ? "Retry Selfie Check"
                : "Start Selfie Check"
          }
          onStart={() => void beginCheck("selfie")}
        />
      </ol>

      {process.env.NODE_ENV === "development" &&
      (identity.summary?.nullifierFingerprint ||
        selfie.summary?.nullifierFingerprint) ? (
        <details className="mt-4 text-xs text-gray-500">
          <summary className="cursor-pointer">Dev diagnostics</summary>
          <p className="mt-1">
            Fingerprints only (never shown in production Passport UI).
          </p>
        </details>
      ) : null}

      {session && widgetPreset ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={handleOpenChange}
          app_id={(session.appId || publicAppId) as `app_${string}`}
          action={session.action}
          rp_context={session.rpContext}
          allow_legacy_proofs={session.allowLegacy}
          environment={session.environment}
          preset={widgetPreset}
          autoClose
          handleVerify={handleVerify}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      ) : null}
    </section>
  );
}

function CheckRow({
  title,
  subtitle,
  state,
  verifiedFromPassport,
  disabled,
  ctaLabel,
  onStart,
}: {
  title: string;
  subtitle: string;
  state: StepState;
  verifiedFromPassport: boolean;
  disabled: boolean;
  ctaLabel: string;
  onStart: () => void;
}) {
  // Show final success only after handleVerify confirmed Passport proof (phase VERIFIED)
  // or when backendProofs already contain the record (refresh / remount).
  const verified = verifiedFromPassport || state.phase === "VERIFIED";

  const tone = verified
    ? "border-emerald-200 bg-emerald-50"
    : state.phase === "FAILED"
      ? "border-rose-200 bg-rose-50"
      : state.phase === "CANCELLED"
        ? "border-amber-200 bg-amber-50"
        : isInFlight(state.phase)
          ? "border-amber-200 bg-amber-50/60"
          : "border-black/10 bg-white";

  const verifiedLabel = formatProofVerifiedAt(state.verifiedAt);
  const progressMessage =
    !verified && state.message
      ? state.message
      : !verified
        ? userFacingPhaseMessage(state.phase)
        : null;

  return (
    <li className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">{title}</p>
          <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
          {verified ? (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-emerald-800">
                {WORLD_FLOW_COPY.verifiedWithWorld}
              </p>
              <p className="text-xs text-emerald-700">
                {WORLD_FLOW_COPY.savedToPassport}
              </p>
              {verifiedLabel ? (
                <p className="text-xs text-gray-600">
                  Verified at: {verifiedLabel}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-700">
              Status: {phaseLabel(state.phase)}
            </p>
          )}
          {!verified && progressMessage ? (
            <p
              className={`mt-1 text-xs ${
                state.phase === "FAILED" ? "text-rose-800" : "text-gray-700"
              }`}
            >
              {progressMessage}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={disabled || verified}
          onClick={onStart}
          className="h-10 shrink-0 rounded-xl bg-[#ff671e] px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          {ctaLabel}
        </button>
      </div>
    </li>
  );
}
