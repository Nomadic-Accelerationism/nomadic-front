"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  IDKitRequestWidget,
  identityCheck,
  selfieCheckLegacy,
  type RpContext,
} from "@worldcoin/idkit";
import type { IDKitErrorCodes, IDKitResult } from "@worldcoin/idkit-core";
import { useUser } from "@/contexts/UserContext";
import { resolveSessionDidToken } from "@/lib/passport/session-did";
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
  /** Fired once both checks verify with World (nothing persisted yet). */
  onBothVerified?: (payload: {
    identity: WorldVerifySummary;
    selfie: WorldVerifySummary;
  }) => void;
};

const INITIAL: StepState = {
  status: "idle",
  message: null,
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

export function WorldVerificationPanel({ signal, onBothVerified }: Props) {
  const { didToken, publicAddress } = useUser();
  const [identity, setIdentity] = useState<StepState>(INITIAL);
  const [selfie, setSelfie] = useState<StepState>(INITIAL);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const activeKindRef = useRef<CheckKind | null>(null);
  const successKindsRef = useRef<Set<CheckKind>>(new Set());
  const identitySummaryRef = useRef<WorldVerifySummary | null>(null);
  const selfieSummaryRef = useRef<WorldVerifySummary | null>(null);
  const bothNotifiedRef = useRef(false);

  const configured = isWorldPublicConfigured();
  const publicAppId = readPublicWorldAppId();
  const publicEnv = readPublicWorldEnvironment();
  const selfieSignal =
    signal?.trim() ||
    publicAddress?.trim() ||
    "lisbon-house-apply";

  const bothDone =
    identity.status === "success" && selfie.status === "success";

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

  const markCancelled = useCallback((kind: CheckKind) => {
    const setter = kind === "identity" ? setIdentity : setSelfie;
    setter((prev) =>
      prev.status === "running"
        ? {
            status: "cancelled",
            message: "World App closed before verification finished.",
            summary: null,
          }
        : prev,
    );
  }, []);

  const beginCheck = useCallback(
    async (kind: CheckKind) => {
      setPanelError(null);
      if (!configured) {
        setPanelError(
          "World is not configured (NEXT_PUBLIC_WORLD_APP_ID missing).",
        );
        return;
      }
      if (kind === "selfie" && identity.status !== "success") {
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
      setter({ status: "running", message: null, summary: null });
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
          summary: null,
        });
        activeKindRef.current = null;
      } finally {
        setBusy(false);
      }
    },
    [authHeaders, configured, identity.status, publicEnv, selfieSignal],
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
      };

      if (!res.ok || !data.ok || !data.summary) {
        const message =
          data.detail || data.code || `Verify failed (${res.status})`;
        setter({ status: "error", message, summary: data.summary ?? null });
        throw new Error(message);
      }

      setter({
        status: "success",
        message: data.note ?? null,
        summary: data.summary,
      });
      successKindsRef.current.add(kind);
      if (kind === "identity") identitySummaryRef.current = data.summary;
      if (kind === "selfie") selfieSummaryRef.current = data.summary;
    },
    [authHeaders],
  );

  const handleSuccess = useCallback(
    (_result: IDKitResult) => {
      setOpen(false);
      setSession(null);
      activeKindRef.current = null;

      const identitySummary = identitySummaryRef.current;
      const selfieSummary = selfieSummaryRef.current;
      if (
        identitySummary &&
        selfieSummary &&
        !bothNotifiedRef.current
      ) {
        bothNotifiedRef.current = true;
        onBothVerified?.({
          identity: identitySummary,
          selfie: selfieSummary,
        });
      }
    },
    [onBothVerified],
  );

  const handleError = useCallback((errorCode: IDKitErrorCodes) => {
    const kind = activeKindRef.current;
    if (!kind) return;
    const setter = kind === "identity" ? setIdentity : setSelfie;
    setter({
      status: "error",
      message: `IDKit error: ${errorCode}`,
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
      // Closed without success — treat as cancel unless already errored.
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
            Complete Identity Check, then Selfie Check. Results are verified
            with World immediately. Passport Proofs stay incomplete until the
            backend persists records — this UI does not fake completion.
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
            identity.status !== "success" ||
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

      {bothDone ? (
        <p className="mt-5 text-sm text-emerald-900">
          Cryptographic checks passed with World. Application submit and
          Passport credential issuance still require backend persistence.
        </p>
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

  return (
    <li className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">{title}</p>
          <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
          <p className="mt-2 text-xs text-gray-700">
            Status: {statusLabel(state.status)}
            {state.summary?.nullifierFingerprint
              ? ` · nullifier ${state.summary.nullifierFingerprint}`
              : ""}
          </p>
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
