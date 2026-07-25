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
import type {
  WorldEnvironment,
  WorldPreset,
  WorldVerifySummary,
} from "@/lib/world/types";

type CheckKind = "identity" | "selfie";

type CheckStatus = "idle" | "running" | "success" | "cancelled" | "error";

type StepState = {
  status: CheckStatus;
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
  /** Backend Passport proofs — source of truth for Verified state after refresh. */
  backendProofs?: PassportProof[];
  /** Fired after a check verifies and Passport refetch is attempted. */
  onProofSynced?: (kind: CheckKind) => void;
  onBothVerified?: () => void;
};

const INITIAL: StepState = {
  status: "idle",
  message: null,
  verifiedAt: null,
  summary: null,
};

function statusLabel(status: CheckStatus): string {
  switch (status) {
    case "idle":
      return "Not started";
    case "running":
      return "In progress";
    case "success":
      return "Verified with World";
    case "cancelled":
      return "Cancelled";
    case "error":
      return "Failed";
  }
}

function stepFromBackend(
  proofs: PassportProof[] | undefined,
  kind: CheckKind
): StepState {
  const id =
    kind === "identity" ? "WORLD_IDENTITY_CHECK" : "WORLD_SELFIE_CHECK";
  if (!isPassportProofVerified(proofs, id)) return INITIAL;
  const record = proofs?.find((p) => {
    const key = (p.type || p.key || p.proofType || p.action || "").toUpperCase();
    if (kind === "identity") {
      return (
        key.includes("IDENTITY") || key === "LISBON_IDENTITY_V1"
      );
    }
    return key.includes("SELFIE") || key === "APPLY_LISBON_HOUSE_V1";
  });
  return {
    status: "success",
    message: null,
    verifiedAt: record?.verifiedAt || record?.completedAt || null,
    summary: null,
  };
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
    stepFromBackend(backendProofs, "identity")
  );
  const [selfie, setSelfie] = useState<StepState>(() =>
    stepFromBackend(backendProofs, "selfie")
  );
  const [panelError, setPanelError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const activeKindRef = useRef<CheckKind | null>(null);
  const successKindsRef = useRef<Set<CheckKind>>(new Set());
  const bothNotifiedRef = useRef(false);

  const configured = isWorldPublicConfigured();
  const publicAppId = readPublicWorldAppId();
  const publicEnv = readPublicWorldEnvironment();
  const selfieSignal =
    signal?.trim() || publicAddress?.trim() || "lisbon-house-apply";

  // Keep panel aligned with backend proofs after refetch / remount.
  useEffect(() => {
    if (isPassportProofVerified(backendProofs, "WORLD_IDENTITY_CHECK")) {
      setIdentity((prev) =>
        prev.status === "running"
          ? prev
          : stepFromBackend(backendProofs, "identity")
      );
      successKindsRef.current.add("identity");
    }
    if (isPassportProofVerified(backendProofs, "WORLD_SELFIE_CHECK")) {
      setSelfie((prev) =>
        prev.status === "running"
          ? prev
          : stepFromBackend(backendProofs, "selfie")
      );
      successKindsRef.current.add("selfie");
    }
  }, [backendProofs]);

  const bothDone =
    isPassportProofVerified(backendProofs, "WORLD_IDENTITY_CHECK") &&
    isPassportProofVerified(backendProofs, "WORLD_SELFIE_CHECK");

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

  const markCancelled = useCallback((kind: CheckKind) => {
    const setter = kind === "identity" ? setIdentity : setSelfie;
    setter((prev) =>
      prev.status === "running"
        ? {
            status: "cancelled",
            message: "World App closed before verification finished.",
            verifiedAt: null,
            summary: null,
          }
        : prev,
    );
  }, []);

  const beginCheck = useCallback(
    async (kind: CheckKind) => {
      setPanelError(null);
      setSyncError(null);
      if (!configured) {
        setPanelError(
          "World is not configured (NEXT_PUBLIC_WORLD_APP_ID missing).",
        );
        return;
      }
      if (
        kind === "selfie" &&
        !isPassportProofVerified(backendProofs, "WORLD_IDENTITY_CHECK") &&
        identity.status !== "success"
      ) {
        setPanelError("Complete Identity Check first.");
        return;
      }

      const headers = await authHeaders();
      if (!headers) {
        setPanelError("Sign in again to continue with World verification.");
        return;
      }

      const action =
        kind === "identity" ? WORLD_IDENTITY_ACTION : WORLD_SELFIE_ACTION;
      const preset =
        kind === "identity" ? WORLD_IDENTITY_PRESET : WORLD_SELFIE_PRESET;
      const setter = kind === "identity" ? setIdentity : setSelfie;

      setBusy(true);
      activeKindRef.current = kind;
      setter({
        status: "running",
        message: null,
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
            status: "error",
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

        setSession({
          appId: data.app_id,
          action,
          preset,
          allowLegacy: Boolean(data.allow_legacy_proofs),
          environment: data.environment || publicEnv,
          rpContext: data.rp_context,
        });
        setOpen(true);
      } catch (err) {
        setter({
          status: "error",
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
      backendProofs,
      configured,
      identity.status,
      publicEnv,
      selfieSignal,
    ],
  );

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

      const action =
        kind === "identity" ? WORLD_IDENTITY_ACTION : WORLD_SELFIE_ACTION;
      const setter = kind === "identity" ? setIdentity : setSelfie;
      const proofId =
        kind === "identity" ? "WORLD_IDENTITY_CHECK" : "WORLD_SELFIE_CHECK";

      const res = await fetch("/api/world/verify", {
        method: "POST",
        headers,
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

      if (!res.ok || !data.ok || !data.summary) {
        const message =
          data.detail || data.code || `Verify failed (${res.status})`;
        setter({
          status: "error",
          message,
          verifiedAt: null,
          summary: data.summary ?? null,
        });
        throw new Error(message);
      }

      const verifiedAt =
        data.verifiedAt ||
        data.summary.verifiedAt ||
        new Date().toISOString();

      setter({
        status: "success",
        message: null,
        verifiedAt,
        summary: data.summary,
      });
      successKindsRef.current.add(kind);

      await refetchPassport();

      let inPassport = false;
      try {
        const token = await resolveSessionDidToken(didToken);
        if (token) {
          const fresh = await fetchPrivatePassport(token);
          inPassport = isPassportProofVerified(
            fresh.passport.proofs,
            proofId,
          );
        }
      } catch {
        inPassport = false;
      }

      if (!data.persisted || !inPassport) {
        setSyncError(
          "World verified this check, but your Passport has not synced the proof yet. Tap Retry sync or refresh Passport.",
        );
      } else {
        setSyncError(null);
      }

      onProofSynced?.(kind);
    },
    [authHeaders, didToken, onProofSynced, refetchPassport],
  );

  const handleSuccess = useCallback((_result: IDKitResult) => {
    setOpen(false);
    setSession(null);
    activeKindRef.current = null;
  }, []);

  const handleError = useCallback((errorCode: IDKitErrorCodes) => {
    const kind = activeKindRef.current;
    if (!kind) return;
    const setter = kind === "identity" ? setIdentity : setSelfie;
    setter({
      status: "error",
      message: `IDKit error: ${errorCode}`,
      verifiedAt: null,
      summary: null,
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
      if (successKindsRef.current.has(kind)) {
        setSession(null);
        activeKindRef.current = null;
        return;
      }
      markCancelled(kind);
      setSession(null);
      activeKindRef.current = null;
    },
    [markCancelled],
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
            Complete Identity Check, then Selfie Check. Verified status comes
            from your Passport after the backend saves each proof.
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

      {syncError ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p>{syncError}</p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold underline"
            onClick={() => void refetchPassport().then(() => setSyncError(null))}
          >
            Retry Passport sync
          </button>
        </div>
      ) : null}

      <ol className="mt-5 space-y-3">
        <CheckRow
          title="1. Identity Check"
          subtitle={`Action ${WORLD_IDENTITY_ACTION} · age ≥ ${WORLD_IDENTITY_MINIMUM_AGE}`}
          state={identity}
          disabled={busy || identity.status === "running" || bothDone}
          ctaLabel={
            identity.status === "success"
              ? "Verified"
              : identity.status === "error" || identity.status === "cancelled"
                ? "Retry Identity Check"
                : "Start Identity Check"
          }
          onStart={() => void beginCheck("identity")}
        />
        <CheckRow
          title="2. Selfie Check"
          subtitle={`Action ${WORLD_SELFIE_ACTION} · after Identity`}
          state={selfie}
          disabled={
            busy ||
            selfie.status === "running" ||
            (!isPassportProofVerified(backendProofs, "WORLD_IDENTITY_CHECK") &&
              identity.status !== "success") ||
            bothDone
          }
          ctaLabel={
            selfie.status === "success"
              ? "Verified"
              : selfie.status === "error" || selfie.status === "cancelled"
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
  disabled,
  ctaLabel,
  onStart,
}: {
  title: string;
  subtitle: string;
  state: StepState;
  disabled: boolean;
  ctaLabel: string;
  onStart: () => void;
}) {
  const tone =
    state.status === "success"
      ? "border-emerald-200 bg-emerald-50"
      : state.status === "error"
        ? "border-rose-200 bg-rose-50"
        : state.status === "cancelled"
          ? "border-amber-200 bg-amber-50"
          : "border-black/10 bg-white";

  const verifiedLabel = formatProofVerifiedAt(state.verifiedAt);

  return (
    <li className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">{title}</p>
          <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
          <p className="mt-2 text-xs text-gray-700">
            {state.status === "success"
              ? "Verified with World"
              : `Status: ${statusLabel(state.status)}`}
          </p>
          {state.status === "success" && verifiedLabel ? (
            <p className="mt-1 text-xs text-gray-600">
              Verified at: {verifiedLabel}
            </p>
          ) : null}
          {state.message ? (
            <p className="mt-1 text-xs text-gray-700">{state.message}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={disabled || state.status === "success"}
          onClick={onStart}
          className="h-10 shrink-0 rounded-xl bg-[#ff671e] px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          {ctaLabel}
        </button>
      </div>
    </li>
  );
}
