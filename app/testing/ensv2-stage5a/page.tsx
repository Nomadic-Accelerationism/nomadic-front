"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  STAGE5A_CHAIN_ID,
  STAGE5A_COMPLETION_TX,
  STAGE5A_EXPECTED_SIGNER,
  STAGE5A_ISSUER,
  STAGE5A_KEYS,
  STAGE5A_METADATA_VALUE,
  STAGE5A_RESOLVER,
  getStage5AMagicTxParams,
  probeSepoliaRpcProxy,
  runStage5APreflight,
  type Stage5APreflight,
} from "@/lib/ensv2/stage5a";
import {
  countMagicIframes,
  getEnsSepoliaProxyUrl,
  getMagicSepoliaRpcUrl,
  getPublicSepoliaRpcUrl,
  getSepoliaMagic,
} from "@/lib/magic/sepolia-singleton";

function formatMagicError(err: unknown): string {
  if (!(err instanceof Error)) return "Revoke failed";
  const msg = err.message || "Revoke failed";
  if (/failed to fetch/i.test(msg)) {
    return `${msg} — Check Magic Dashboard CSP/connect-src allowlist for this origin (Allowed Origins alone is not enough), then hard-refresh.`;
  }
  return msg;
}

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
 *
 * Hidden from normal navigation (/testing/...). When issuer roles are already
 * zero, the page marks Stage 5A completed and hides the revoke control.
 */
export default function EnsV2Stage5APage() {
  // Reads: publicnode. Magic + probes: same-origin proxy → ENS_SEPOLIA_RPC_URL (dRPC).
  const readRpcUrl = useMemo(() => getPublicSepoliaRpcUrl(), []);
  const magicRpcUrl = useMemo(() => getMagicSepoliaRpcUrl(), []);
  const proxyRpcUrl = useMemo(() => getEnsSepoliaProxyUrl(), []);
  const [phase, setPhase] = useState<UiPhase>("boot");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<Stage5APreflight | null>(null);
  const [txHash, setTxHash] = useState<string | null>(STAGE5A_COMPLETION_TX);
  const [postflight, setPostflight] = useState<Stage5APreflight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [proxyKeyed, setProxyKeyed] = useState<boolean | null>(null);

  const completed =
    phase === "done" || Boolean(preflight?.alreadyRevoked) || Boolean(postflight?.alreadyRevoked);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [...prev, line]);
  }, []);

  const refreshPreflight = useCallback(async () => {
    const result = await runStage5APreflight(readRpcUrl);
    setPreflight(result);
    if (result.alreadyRevoked) {
      setPostflight(result);
      setTxHash((prev) => prev ?? STAGE5A_COMPLETION_TX);
    }
    return result;
  }, [readRpcUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Always read chain state first — Stage 5A may already be complete.
        const pf = await refreshPreflight();
        if (cancelled) return;
        if (pf.alreadyRevoked) {
          setPhase("done");
          pushLog(
            "Stage 5A already complete — issuer ROLE_SET_TEXT is 0 on all four keys. Revoke disabled.",
          );
        }

        const magic = getSepoliaMagic();
        if (!magic) {
          if (!pf.alreadyRevoked) {
            setError("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not configured.");
            setPhase("error");
          }
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
          if (!pf.alreadyRevoked) {
            setPhase("preflight");
            pushLog(
              `Preflight: issuer ROLE_SET_TEXT present on ${STAGE5A_KEYS.length} keys.`,
            );
          }
          return;
        }
        if (!cancelled && !pf.alreadyRevoked) setPhase("need_login");
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
    if (preflight?.alreadyRevoked) {
      setPhase("done");
      return;
    }
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
      const pf = await refreshPreflight();
      if (pf.alreadyRevoked) {
        setPhase("done");
        pushLog("Stage 5A already complete — revoke disabled.");
        return;
      }
      setPhase("preflight");
      pushLog(`Logged in as ${addr}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }, [email, preflight?.alreadyRevoked, pushLog, refreshPreflight]);

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
    // Stage 3 / Stage 5 resume protection: never re-broadcast revoke.
    if (preflight?.alreadyRevoked) {
      setPhase("done");
      setError(null);
      pushLog("Resume protection: issuer roles already zero — revoke not offered.");
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
      const iframes = countMagicIframes();
      pushLog(
        `Magic rpcUrl=${magicRpcUrl} iframes=${iframes} proxy=${proxyRpcUrl}`,
      );
      if (iframes > 1) {
        throw new Error(
          `Found ${iframes} Magic iframes — hard-refresh this tab so only one Magic network config is active.`,
        );
      }

      pushLog(`Probing keyed proxy→dRPC…`);
      const probe = await probeSepoliaRpcProxy(proxyRpcUrl);
      setProxyKeyed(probe.keyed);
      pushLog(
        `Proxy OK chainId=${probe.chainIdHex} keyed=${String(probe.keyed)}`,
      );
      if (!probe.keyed) {
        throw new Error(
          "ENS_SEPOLIA_RPC_URL unset on Vercel — cannot use dRPC upstream.",
        );
      }

      // Do NOT call magic.user.getInfo/isLoggedIn here — can throw Failed to fetch
      // even when boot already proved the session is alive.
      const txParams = getStage5AMagicTxParams(address as `0x${string}`);
      pushLog(
        `Sending eth_sendTransaction via Magic→proxy→dRPC to=${txParams.to}`,
      );

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
            from: txParams.from,
            to: txParams.to,
            data: txParams.data,
            value: txParams.value,
          },
        ],
      })) as string;

      setTxHash(hash);
      pushLog(`Tx submitted: ${hash}`);
      setPhase("waiting_receipt");

      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const receiptRes = await fetch(proxyRpcUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getTransactionReceipt",
            params: [hash],
          }),
        });
        const receiptJson = (await receiptRes.json()) as {
          result?: { status?: string; blockNumber?: string } | null;
        };
        const receipt = receiptJson.result;
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
      setError(formatMagicError(err));
      setPhase("error");
    }
  }, [address, magicRpcUrl, preflight, proxyRpcUrl, pushLog, readRpcUrl]);

  const showRevokeButton =
    !completed &&
    (phase === "preflight" || phase === "error") &&
    Boolean(preflight?.readyToRevoke);

  const rolesView = postflight ?? preflight;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 text-left">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Internal testing route — not linked in product navigation
      </p>
      <h1 className="mt-2 text-2xl font-bold text-black">ENSv2 Stage 5A</h1>
      <p className="mt-2 text-sm text-gray-700">
        One Magic-signed atomic resolver <code>multicall</code> that revokes the
        Lisbon House issuer&apos;s four scoped <code>ROLE_SET_TEXT</code>{" "}
        permissions. Does not change credential record values.
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Stage 5B is intentionally read-only (issuer write simulation elsewhere)
        and is <strong>not</strong> run as a transaction from this page.
      </p>

      {completed ? (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
          <p className="font-semibold">Stage 5A completed</p>
          <p className="mt-1 text-xs">
            Issuer scoped text roles are zero and metadata remains{" "}
            <code>{STAGE5A_METADATA_VALUE}</code>. Revocation is disabled
            (reload/resume protection — no re-send, no automatic repair). Stage
            5B is intentionally read-only and not offered here.
          </p>
          <p className="mt-3 break-all text-xs">
            Tx:{" "}
            <a
              className="font-mono text-[#ff671e] underline"
              href={`https://sepolia.etherscan.io/tx/${txHash ?? STAGE5A_COMPLETION_TX}`}
              target="_blank"
              rel="noreferrer"
            >
              {txHash ?? STAGE5A_COMPLETION_TX}
            </a>
          </p>
        </section>
      ) : null}

      <dl className="mt-6 space-y-1 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-xs text-gray-700">
        <div>
          <dt className="font-semibold text-gray-500">Status</dt>
          <dd>{completed ? "COMPLETED" : phase}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">Chain</dt>
          <dd>Sepolia {STAGE5A_CHAIN_ID}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">
            Magic RPC (proxy→dRPC)
          </dt>
          <dd className="break-all">{magicRpcUrl}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-500">dRPC via proxy</dt>
          <dd>
            {proxyKeyed === null
              ? "— (checked on revoke)"
              : proxyKeyed
                ? "yes (ENS_SEPOLIA_RPC_URL)"
                : "no — set ENS_SEPOLIA_RPC_URL on Vercel"}
          </dd>
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

      {phase === "need_login" && !completed ? (
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

      {rolesView ? (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            {completed ? "On-chain state" : "Preflight"}
          </h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-gray-800">
            {STAGE5A_KEYS.map((key) => (
              <li key={key}>
                {key}: {rolesView.roles[key]}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-700">
            metadata:{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              {rolesView.metadata || "(empty)"}
            </code>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Ready: {String(rolesView.readyToRevoke)} · Already revoked:{" "}
            {String(rolesView.alreadyRevoked)} · Metadata intact:{" "}
            {String(rolesView.metadataIntact)}
          </p>
        </section>
      ) : null}

      {showRevokeButton ? (
        <button
          type="button"
          onClick={() => void handleRevoke()}
          className="mt-6 h-12 w-full rounded-xl bg-[#ff671e] text-sm font-bold text-white"
        >
          Revoke issuer permissions (1 Magic tx)
        </button>
      ) : null}

      {completed && !showRevokeButton ? (
        <p className="mt-6 rounded-xl border border-black/10 bg-gray-50 px-3 py-3 text-sm text-gray-700">
          Revoke control hidden — Stage 5A is complete. No further revocation
          transactions from this page.
        </p>
      ) : null}

      {phase === "sending" || phase === "waiting_receipt" ? (
        <p className="mt-6 text-sm font-medium text-amber-900">
          {phase === "sending"
            ? "Confirm the Magic transaction…"
            : "Waiting for Sepolia receipt…"}
        </p>
      ) : null}

      {error && !completed ? (
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
