"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  STAGE5A_CHAIN_ID,
  STAGE5A_EXPECTED_SIGNER,
  STAGE5A_ISSUER,
  STAGE5A_KEYS,
  STAGE5A_METADATA_VALUE,
  STAGE5A_RESOLVER,
  getStage5ARevokeTx,
  runStage5APreflight,
  type Stage5APreflight,
} from "@/lib/ensv2/stage5a";
import {
  getMagicSepoliaRpcUrl,
  getPublicSepoliaRpcUrl,
  getSepoliaMagic,
} from "@/lib/magic/sepolia-singleton";

type UiPhase =
  | "boot"
  | "need_login"
  | "preflight"
  | "sending"
  | "waiting_receipt"
  | "done"
  | "error";

/**
 * Stage 5A runner — one Magic eth_sendTransaction multicall that revokes
 * the issuer's four scoped ROLE_SET_TEXT permissions. Does not alter records.
 * Does not run Stage 5B.
 */
export default function EnsV2Stage5APage() {
  // Reads use public RPC; Magic txs use same-origin proxy (no keyed URL in browser).
  const readRpcUrl = useMemo(() => getPublicSepoliaRpcUrl(), []);
  const magicRpcUrl = useMemo(() => getMagicSepoliaRpcUrl(), []);
  const revokeTx = useMemo(() => getStage5ARevokeTx(), []);
  const [phase, setPhase] = useState<UiPhase>("boot");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<Stage5APreflight | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [postflight, setPostflight] = useState<Stage5APreflight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [...prev, line]);
  }, []);

  const refreshPreflight = useCallback(async () => {
    const result = await runStage5APreflight(readRpcUrl);
    setPreflight(result);
    return result;
  }, [readRpcUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const magic = getSepoliaMagic();
        if (!magic) {
          setError("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not configured.");
          setPhase("error");
          return;
        }
        const loggedIn = await magic.user.isLoggedIn();
        if (!cancelled && loggedIn) {
          const info = await magic.user.getInfo();
          const addr =
            typeof info.publicAddress === "string"
              ? info.publicAddress
              : null;
          setAddress(addr);
          const pf = await refreshPreflight();
          if (!cancelled) {
            setPhase("preflight");
            pushLog(
              pf.alreadyRevoked
                ? "Preflight: issuer roles already 0 (Stage 5A may already be done)."
                : `Preflight: issuer ROLE_SET_TEXT present on ${STAGE5A_KEYS.length} keys.`,
            );
          }
          return;
        }
        if (!cancelled) setPhase("need_login");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Boot failed");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushLog, refreshPreflight]);

  const handleLogin = useCallback(async () => {
    setError(null);
    const magic = getSepoliaMagic();
    if (!magic) {
      setError("Magic not configured");
      return;
    }
    try {
      await magic.auth.loginWithEmailOTP({ email: email.trim() });
      const info = await magic.user.getInfo();
      const addr =
        typeof info.publicAddress === "string" ? info.publicAddress : null;
      setAddress(addr);
      await refreshPreflight();
      setPhase("preflight");
      pushLog(`Logged in as ${addr}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }, [email, pushLog, refreshPreflight]);

  const handleRevoke = useCallback(async () => {
    setError(null);
    const magic = getSepoliaMagic();
    if (!magic) {
      setError("Magic not configured");
      return;
    }
    if (
      !address ||
      address.toLowerCase() !== STAGE5A_EXPECTED_SIGNER.toLowerCase()
    ) {
      setError(
        `Connected ${address ?? "none"} — expected Magic Passport owner ${STAGE5A_EXPECTED_SIGNER}`,
      );
      return;
    }
    if (preflight?.alreadyRevoked) {
      setError("Issuer roles already zero — refusing to re-send revoke.");
      return;
    }
    if (!preflight?.readyToRevoke) {
      setError(
        "Preflight not ready. Issuer roles must be 0x10 and metadata must be issuer-demo-stage4-verified.",
      );
      return;
    }

    try {
      setPhase("sending");
      pushLog("Sending eth_sendTransaction revoke multicall…");
      const provider = magic.rpcProvider as {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      };

      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: revokeTx.to,
            data: revokeTx.data,
            value: revokeTx.value,
          },
        ],
      })) as string;

      setTxHash(hash);
      pushLog(`Tx submitted: ${hash}`);
      setPhase("waiting_receipt");

      // Poll receipt
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const receipt = (await provider.request({
          method: "eth_getTransactionReceipt",
          params: [hash],
        })) as { status?: string; blockNumber?: string } | null;
        if (receipt?.status) {
          const ok = receipt.status === "0x1";
          pushLog(
            ok
              ? `Receipt OK block ${receipt.blockNumber}`
              : `Receipt FAILED status ${receipt.status}`,
          );
          if (!ok) {
            setError("Transaction reverted on-chain");
            setPhase("error");
            return;
          }
          break;
        }
      }

      const after = await runStage5APreflight(readRpcUrl);
      setPostflight(after);
      setPreflight(after);
      if (!after.alreadyRevoked) {
        setError("Tx mined but issuer roles are not all zero");
        setPhase("error");
        return;
      }
      if (!after.metadataIntact) {
        setError(
          `Metadata changed unexpectedly: ${after.metadata} (expected ${STAGE5A_METADATA_VALUE})`,
        );
        setPhase("error");
        return;
      }
      pushLog("Stage 5A complete — issuer text roles revoked; metadata intact.");
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
      setPhase("error");
    }
  }, [address, preflight, pushLog, readRpcUrl, revokeTx]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 text-left">
      <h1 className="text-2xl font-bold text-black">ENSv2 Stage 5A</h1>
      <p className="mt-2 text-sm text-gray-700">
        One Magic-signed atomic resolver <code>multicall</code> that revokes the
        Lisbon House issuer&apos;s four scoped <code>ROLE_SET_TEXT</code>{" "}
        permissions. Does not change credential record values. Does not run
        Stage 5B.
      </p>

      <dl className="mt-6 space-y-1 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-xs text-gray-700">
        <div>
          <dt className="font-semibold text-gray-500">Chain</dt>
          <dd>Sepolia {STAGE5A_CHAIN_ID}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">Magic RPC (proxy)</dt>
          <dd className="break-all">{magicRpcUrl}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">Read RPC (public)</dt>
          <dd className="break-all">{readRpcUrl}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">Resolver</dt>
          <dd className="break-all font-mono">{STAGE5A_RESOLVER}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">Expected signer</dt>
          <dd className="break-all font-mono">{STAGE5A_EXPECTED_SIGNER}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">Issuer</dt>
          <dd className="break-all font-mono">{STAGE5A_ISSUER}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">Connected</dt>
          <dd className="break-all font-mono">{address ?? "—"}</dd>
        </div>
      </dl>

      {phase === "need_login" ? (
        <section className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-gray-800">
            Magic email (Passport owner)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="button"
            onClick={() => void handleLogin()}
            className="h-11 rounded-xl bg-[#ff671e] px-4 text-sm font-bold text-white"
          >
            Sign in with Magic
          </button>
        </section>
      ) : null}

      {preflight ? (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Preflight
          </h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-gray-800">
            {STAGE5A_KEYS.map((key) => (
              <li key={key}>
                {key}: {preflight.roles[key]}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-700">
            metadata:{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              {preflight.metadata || "(empty)"}
            </code>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Ready: {String(preflight.readyToRevoke)} · Already revoked:{" "}
            {String(preflight.alreadyRevoked)} · Metadata intact:{" "}
            {String(preflight.metadataIntact)}
          </p>
        </section>
      ) : null}

      {phase === "preflight" || phase === "error" ? (
        <button
          type="button"
          disabled={!preflight?.readyToRevoke}
          onClick={() => void handleRevoke()}
          className="mt-6 h-12 w-full rounded-xl bg-[#ff671e] text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          Revoke issuer permissions (1 Magic tx)
        </button>
      ) : null}

      {phase === "sending" || phase === "waiting_receipt" ? (
        <p className="mt-6 text-sm font-medium text-amber-900">
          {phase === "sending"
            ? "Confirm the Magic transaction…"
            : "Waiting for Sepolia receipt…"}
        </p>
      ) : null}

      {txHash ? (
        <p className="mt-4 break-all text-sm text-gray-800">
          Tx:{" "}
          <a
            className="font-mono text-[#ff671e] underline"
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {txHash}
          </a>
        </p>
      ) : null}

      {phase === "done" && postflight ? (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
          <p className="font-semibold">Stage 5A complete</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {STAGE5A_KEYS.map((key) => (
              <li key={key}>
                {key}: {postflight.roles[key]}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            metadata still{" "}
            <code>{postflight.metadata}</code>
          </p>
          <p className="mt-2 text-xs">
            Stage 5B (issuer write failure) is intentionally not run here.
          </p>
        </section>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      {log.length ? (
        <pre className="mt-6 overflow-x-auto rounded-xl bg-stone-950 px-3 py-3 text-[11px] text-stone-100">
          {log.join("\n")}
        </pre>
      ) : null}
    </main>
  );
}
