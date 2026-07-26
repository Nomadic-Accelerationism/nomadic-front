"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IdCard, ScanFace, type LucideIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  /**
   * `cover` — compact dark styling for nesting inside PassportCover.
   * `passport` — compact two-card layout for the open Passport.
   * Default light panel for other non-cover surfaces.
   */
  variant?: "default" | "cover" | "passport";
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
  variant = "default",
}: Props) {
  const isCover = variant === "cover";
  const isPassport = variant === "passport";
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

      // Cryptographic failure only — do not throw on persist/sync issues.
      if (!res.ok || !data.ok) {
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
        data.summary?.verifiedAt ||
        new Date().toISOString();

      setter({
        status: "success",
        message: null,
        verifiedAt,
        summary: data.summary ?? null,
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
      // Resolve handleVerify so IDKit does not emit failed_by_host_app.
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
    // Preserve a more specific host verify message when IDKit wraps it.
    setter((prev) => {
      if (
        errorCode === "failed_by_host_app" &&
        prev.status === "error" &&
        prev.message
      ) {
        return prev;
      }
      return {
        status: "error",
        message: `IDKit error: ${errorCode}`,
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
        id="world-verification"
        className={cn(
          "text-left",
          isCover
            ? "rounded-[var(--nomadic-radius-sm)] border border-[var(--nomadic-cover-cream)]/20 bg-[var(--nomadic-cover-cream)]/5 px-3 py-3"
            : isPassport
              ? "surface-soft px-4 py-4"
            : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5"
        )}
        aria-labelledby="world-misconfigured-heading"
        data-world-integration-boundary="misconfigured"
        data-world-variant={variant}
      >
        <h2
          id="world-misconfigured-heading"
          className={cn(
            "text-base font-semibold",
            isCover
              ? "text-[var(--nomadic-cover-cream)]"
              : isPassport
                ? "text-[var(--nomadic-ink)]"
                : "text-amber-950"
          )}
        >
          World not configured
        </h2>
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed",
            isCover
              ? "text-[var(--nomadic-cover-cream)]/70"
              : isPassport
                ? "text-[var(--nomadic-muted)]"
              : "text-amber-950"
          )}
        >
          Set <code className="text-xs">NEXT_PUBLIC_WORLD_APP_ID</code> (and
          server RP secrets) to enable Identity Check and Selfie Check.
        </p>
      </section>
    );
  }

  return (
    <section
      id="world-verification"
      className={cn(
        "text-left",
        isCover
          ? "rounded-[var(--nomadic-radius-sm)] border border-[var(--nomadic-cover-cream)]/15 bg-[var(--nomadic-cover-cream)]/[0.04] px-3 py-3"
          : isPassport
            ? "text-left"
          : "rounded-2xl border border-black/10 bg-white/90 px-4 py-5"
      )}
      aria-labelledby="world-verification-heading"
      data-world-integration-boundary="live"
      data-world-environment={publicEnv}
      data-world-variant={variant}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="world-verification-heading"
            className={cn(
              "text-sm font-semibold",
              isCover
                ? "uppercase tracking-[0.12em] text-[var(--nomadic-cover-cream)]/80"
                : isPassport
                  ? "sr-only"
                : "text-base text-black"
            )}
          >
            World verification
          </h2>
          <p
            className={cn(
              "mt-1.5 text-xs leading-relaxed",
              isCover
                ? "text-[var(--nomadic-cover-cream)]/55"
                : "text-sm text-gray-700"
            )}
          >
            {isPassport
              ? "Identity Check first, then Selfie Check."
              : "Complete Identity Check, then Selfie Check. Verified status comes from your Passport after the backend saves each proof."}
          </p>
          {!isCover && !isPassport ? (
            <p className="mt-2 text-xs text-gray-500">
              IDKit environment:{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">
                {publicEnv}
              </code>
              {publicEnv === "staging"
                ? " (simulator OK)"
                : " — set NEXT_PUBLIC_WORLD_ENVIRONMENT=staging for the simulator"}
            </p>
          ) : null}
        </div>
        {bothDone ? (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              isCover
                ? "bg-emerald-400/15 text-emerald-200"
                : "bg-emerald-100 text-emerald-800"
            )}
          >
            Both verified
          </span>
        ) : null}
      </div>

      {panelError ? (
        <p
          className={cn(
            "mt-3 rounded-xl px-3 py-2 text-sm",
            isCover
              ? "border border-rose-300/30 bg-rose-400/10 text-rose-100"
              : "border border-rose-200 bg-rose-50 text-rose-900"
          )}
        >
          {panelError}
        </p>
      ) : null}

      {syncError ? (
        <div
          className={cn(
            "mt-3 rounded-xl px-3 py-2 text-sm",
            isCover
              ? "border border-amber-300/30 bg-amber-400/10 text-amber-100"
              : "border border-amber-200 bg-amber-50 text-amber-950"
          )}
        >
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

      <ol
        className={cn(
          "mt-3",
          isPassport ? "grid grid-cols-2 gap-3" : "space-y-2"
        )}
      >
        <CheckRow
          title="Identity Check"
          subtitle={
            isCover || isPassport
              ? `Age ≥ ${WORLD_IDENTITY_MINIMUM_AGE}`
              : `Action ${WORLD_IDENTITY_ACTION} · age ≥ ${WORLD_IDENTITY_MINIMUM_AGE}`
          }
          state={identity}
          icon={IdCard}
          variant={variant}
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
          title="Selfie Check"
          subtitle={
            isCover || isPassport
              ? "After Identity"
              : `Action ${WORLD_SELFIE_ACTION} · after Identity`
          }
          state={selfie}
          icon={ScanFace}
          variant={variant}
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
  icon: Icon,
  variant,
}: {
  title: string;
  subtitle: string;
  state: StepState;
  disabled: boolean;
  ctaLabel: string;
  onStart: () => void;
  icon: LucideIcon;
  variant: "default" | "cover" | "passport";
}) {
  const isCover = variant === "cover";
  const isPassport = variant === "passport";
  const tone = isCover
    ? state.status === "success"
      ? "border-emerald-300/25 bg-emerald-400/10"
      : state.status === "error"
        ? "border-rose-300/25 bg-rose-400/10"
        : state.status === "cancelled"
          ? "border-amber-300/25 bg-amber-400/10"
          : "border-[var(--nomadic-cover-cream)]/15 bg-[var(--nomadic-cover-cream)]/[0.06]"
    : state.status === "success"
      ? "border-emerald-200 bg-emerald-50"
      : state.status === "error"
        ? "border-rose-200 bg-rose-50"
        : state.status === "cancelled"
          ? "border-amber-200 bg-amber-50"
          : "border-black/10 bg-white";

  const verifiedLabel = formatProofVerifiedAt(state.verifiedAt);

  return (
    <li
      className={cn(
        "rounded-xl border px-3 py-2.5",
        isPassport && "min-h-[178px] rounded-[var(--nomadic-radius-md)] p-3.5",
        tone
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-2",
          isPassport && "h-full flex-col flex-nowrap"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2.5",
            isPassport && "w-full flex-col gap-2"
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
              isCover
                ? "border-[var(--nomadic-cover-cream)]/25 bg-[var(--nomadic-cover-cream)]/5 text-[var(--nomadic-cover-cream)]"
                : isPassport
                  ? "border-[var(--nomadic-orange)]/20 bg-[var(--nomadic-orange)]/[0.12] text-[var(--nomadic-orange-deep)]"
                : "border-[var(--nomadic-border)] bg-[var(--nomadic-surface)] text-[var(--nomadic-ink)]"
            )}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-semibold",
                isCover
                  ? "text-[var(--nomadic-cover-cream)]"
                  : "text-[var(--nomadic-ink)]"
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[11px]",
                isCover
                  ? "text-[var(--nomadic-cover-cream)]/50"
                  : "text-gray-600"
              )}
            >
              {subtitle}
            </p>
            <p
              className={cn(
                "mt-1.5 text-[11px]",
                isCover
                  ? "text-[var(--nomadic-cover-cream)]/65"
                  : "text-gray-700"
              )}
            >
              {state.status === "success"
                ? "Verified with World"
                : `Status: ${statusLabel(state.status)}`}
            </p>
            {state.status === "success" && verifiedLabel ? (
              <p
                className={cn(
                  "mt-1 text-[11px]",
                  isCover
                    ? "text-[var(--nomadic-cover-cream)]/50"
                    : "text-gray-600"
                )}
              >
                Verified at: {verifiedLabel}
              </p>
            ) : null}
            {state.message ? (
              <p
                className={cn(
                  "mt-1 text-[11px]",
                  isCover
                    ? "text-[var(--nomadic-cover-cream)]/65"
                    : "text-gray-700"
                )}
              >
                {state.message}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          disabled={disabled || state.status === "success"}
          onClick={onStart}
          className={cn(
            "h-9 shrink-0 rounded-xl px-3 text-[11px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nomadic-orange)] focus-visible:ring-offset-2 disabled:cursor-not-allowed",
            isPassport && "mt-auto min-h-10 h-auto w-full whitespace-normal py-2 leading-tight",
            isCover
              ? "bg-[var(--nomadic-orange)] text-[var(--nomadic-ink)] disabled:bg-[var(--nomadic-cover-cream)]/15 disabled:text-[var(--nomadic-cover-cream)]/35"
              : "bg-[#ff671e] text-white hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-500"
          )}
        >
          {ctaLabel}
        </button>
      </div>
    </li>
  );
}
