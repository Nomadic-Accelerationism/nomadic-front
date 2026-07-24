"use client";

import { useCallback, useMemo, useState } from "react";
import {
  IDKitRequestWidget,
  identityCheck,
  selfieCheckLegacy,
  type RpContext,
} from "@worldcoin/idkit";
import { AuthService } from "@/services/auth-service";
import type {
  WorldSpikePreset,
  WorldSpikeRequestResponse,
  WorldSpikeVerifyResponse,
} from "@/lib/spikes/world/types";

/**
 * Isolated World IDKit spike UI.
 * Not a Journey apply flow. Cannot mint credentials.
 */
export default function WorldSpikePage() {
  const [preset, setPreset] = useState<WorldSpikePreset>("selfieCheckLegacy");
  const [action, setAction] = useState("spike_selfie_lisbon_v1");
  const [open, setOpen] = useState(false);
  const [appId, setAppId] = useState<string>("");
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [allowLegacy, setAllowLegacy] = useState(true);
  const [status, setStatus] = useState<string>("Idle");
  const [verifySummary, setVerifySummary] = useState<string>("");

  const widgetPreset = useMemo(() => {
    if (preset === "identityCheck") {
      return identityCheck({
        attributes: [{ type: "minimum_age", value: 18 }],
      });
    }
    return selfieCheckLegacy({ signal: "world-spike-user" });
  }, [preset]);

  const fetchRpContext = useCallback(async () => {
    setStatus("Requesting RP context…");
    setVerifySummary("");
    const res = await fetch("/api/spikes/world/request", {
      method: "POST",
      headers: AuthService.getAuthHeaders(),
      body: JSON.stringify({
        action,
        preset,
        signal: "world-spike-user",
        attributes:
          preset === "identityCheck"
            ? [{ type: "minimum_age", value: 18 }]
            : undefined,
      }),
    });
    const data = (await res.json()) as WorldSpikeRequestResponse;
    if (!data.ok) {
      setStatus(`Blocked: ${data.code} — ${data.detail}`);
      setRpContext(null);
      return;
    }
    setAppId(data.app_id);
    setRpContext(data.rp_context);
    setAllowLegacy(data.allow_legacy_proofs);
    setStatus("RP context ready — open IDKit");
    setOpen(true);
  }, [action, preset]);

  const handleVerify = useCallback(
    async (idkitResponse: unknown) => {
      setStatus("Verifying with World (no persist)…");
      const res = await fetch("/api/spikes/world/verify", {
        method: "POST",
        headers: AuthService.getAuthHeaders(),
        body: JSON.stringify({ action, idkitResponse }),
      });
      const data = (await res.json()) as WorldSpikeVerifyResponse;
      setVerifySummary(JSON.stringify(data, null, 2));
      if (!data.ok) {
        throw new Error(data.detail);
      }
      setStatus("Verify OK — nothing persisted (spike)");
    },
    [action],
  );

  return (
    <main className="mx-auto max-w-xl px-4 py-10 font-sans text-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Spike only</p>
      <h1 className="mt-2 text-2xl font-semibold">World IDKit prototype</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Demonstrates RP context → IDKit → verify forward. Does not create
        credentials, UserProofs, or Prisma rows. Requires login Bearer token and
        World spike env credentials.
      </p>

      <label className="mt-6 block text-sm">
        Preset
        <select
          className="mt-1 w-full border border-zinc-300 px-2 py-2"
          value={preset}
          onChange={(e) => {
            const next = e.target.value as WorldSpikePreset;
            setPreset(next);
            setAction(
              next === "identityCheck"
                ? "spike_identity_lisbon_v1"
                : "spike_selfie_lisbon_v1",
            );
            setOpen(false);
            setRpContext(null);
          }}
        >
          <option value="selfieCheckLegacy">selfieCheckLegacy</option>
          <option value="identityCheck">identityCheck (minimum_age 18)</option>
        </select>
      </label>

      <label className="mt-4 block text-sm">
        Action
        <input
          className="mt-1 w-full border border-zinc-300 px-2 py-2"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
      </label>

      <button
        type="button"
        className="mt-6 w-full bg-zinc-900 px-4 py-3 text-sm text-white"
        onClick={() => void fetchRpContext()}
      >
        1. Request RP context + open IDKit
      </button>

      <p className="mt-4 text-sm text-zinc-700">{status}</p>

      {rpContext && appId ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={appId as `app_${string}`}
          action={action}
          rp_context={rpContext}
          allow_legacy_proofs={allowLegacy}
          preset={widgetPreset}
          handleVerify={handleVerify}
          onSuccess={() => {
            setStatus("IDKit onSuccess (after handleVerify)");
          }}
          onError={(code) => {
            setStatus(`IDKit error: ${code}`);
          }}
        />
      ) : null}

      {verifySummary ? (
        <pre className="mt-6 overflow-auto border border-zinc-200 bg-zinc-50 p-3 text-xs">
          {verifySummary}
        </pre>
      ) : null}
    </main>
  );
}
