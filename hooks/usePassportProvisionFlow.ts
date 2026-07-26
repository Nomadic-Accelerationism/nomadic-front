"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { playBloom, playSuccess } from "@/lib/cuelume/feedback";
import {
  advancePlatform,
  fetchMintAdapterStatus,
  getProvision,
  ProvisionClientError,
  startProvision,
  submitUserTx,
} from "@/lib/passport/provision/client";
import {
  checkProvisionWalletBalance,
} from "@/lib/passport/provision/balance";
import { productMessageForProvisionError } from "@/lib/passport/provision/errors";
import { sendUserProvisionTransaction } from "@/lib/passport/provision/magic-send";
import {
  confirmingActionLabel,
  confirmingStepLabel,
  mapBackendStatusToProductPhase,
  productPhaseLabel,
} from "@/lib/passport/provision/product-phase";
import {
  clearProvisionResume,
  createIdempotencyKey,
  readProvisionResume,
  writeProvisionResume,
} from "@/lib/passport/provision/resume-storage";
import type {
  MintAdapterStatus,
  ProductProvisionPhase,
  ProvisionStatusView,
  SafeResumeRecord,
} from "@/lib/passport/provision/types";
import { fetchPrivatePassport } from "@/lib/passport/fetch-me";

export type ProvisionFlowApi = {
  phase: ProductProvisionPhase;
  phaseLabel: string;
  stepLabel: string | null;
  actionLabel: string | null;
  provision: ProvisionStatusView | null;
  mintAdapter: MintAdapterStatus | null;
  message: string | null;
  busy: boolean;
  platformInFlight: boolean;
  needsUserSignature: boolean;
  insufficientFunds: boolean;
  walletAddress: `0x${string}` | null;
  refreshMintAdapter: () => Promise<MintAdapterStatus>;
  beginCreate: (input: {
    didToken: string;
    label: string;
    expectedOwner: `0x${string}` | null;
  }) => Promise<void>;
  continueUserSignature: (input: {
    didToken: string;
    expectedOwner: `0x${string}`;
  }) => Promise<void>;
  resumeIfNeeded: (input: {
    didToken: string;
    expectedOwner: `0x${string}` | null;
  }) => Promise<void>;
  clearAttemptForNewLabel: (label: string) => void;
  resetMessage: () => void;
};

function needsPlatformAdvance(provision: ProvisionStatusView): boolean {
  return (
    provision.nextAction === "platform_advance" &&
    provision.status !== "ISSUED" &&
    provision.status !== "FAILED" &&
    provision.status !== "BLOCKED"
  );
}

function needsPoll(provision: ProvisionStatusView): boolean {
  return (
    provision.nextAction === "await_parent_confirmation" ||
    provision.nextAction === "await_final_verification" ||
    provision.status === "PLATFORM_STEP_SUBMITTED" ||
    provision.status === "USER_PARENT_SUBMITTED" ||
    provision.status === "USER_RECORDS_SUBMITTED" ||
    provision.status === "VERIFYING"
  );
}

export function usePassportProvisionFlow(): ProvisionFlowApi {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<ProductProvisionPhase>("idle");
  const [provision, setProvision] = useState<ProvisionStatusView | null>(null);
  const [mintAdapter, setMintAdapter] = useState<MintAdapterStatus | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [platformInFlight, setPlatformInFlight] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(
    null
  );

  const attemptRef = useRef<SafeResumeRecord | null>(null);
  const platformMutex = useRef(false);
  const pollTimer = useRef<number | null>(null);
  const pollCount = useRef(0);
  const cancelled = useRef(false);
  const MAX_POLL_ATTEMPTS = 40;

  const confirmIssuedWithMe = useCallback(
    async (
      didToken: string,
      expectedName: string | null | undefined
    ): Promise<boolean> => {
      try {
        const me = await fetchPrivatePassport(didToken);
        const ensName =
          typeof me.passport.ensName === "string"
            ? me.passport.ensName.trim()
            : "";
        if (me.passport.ensStatus !== "ISSUED" || !ensName) return false;
        if (
          expectedName &&
          ensName.toLowerCase() !== expectedName.trim().toLowerCase()
        ) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const stopPoll = useCallback(() => {
    if (pollTimer.current != null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      stopPoll();
    };
  }, [stopPoll]);

  const applyProvision = useCallback((next: ProvisionStatusView) => {
    setProvision(next);
    setPhase(mapBackendStatusToProductPhase(next.status));
    if (next.errorCode) {
      setMessage(productMessageForProvisionError(next.errorCode));
    }
    if (attemptRef.current) {
      writeProvisionResume({
        ...attemptRef.current,
        provisioningId: next.id,
        passportName: next.passportName,
        label: next.label,
      });
    }
  }, []);

  const refreshMintAdapter = useCallback(async () => {
    const status = await fetchMintAdapterStatus();
    setMintAdapter(status);
    return status;
  }, []);

  const runPlatformLoop = useCallback(
    async (didToken: string, current: ProvisionStatusView) => {
      let cursor = current;
      let guards = 0;

      while (
        !cancelled.current &&
        needsPlatformAdvance(cursor) &&
        guards < 8
      ) {
        guards += 1;
        if (platformMutex.current) return cursor;
        platformMutex.current = true;
        setPlatformInFlight(true);
        try {
          cursor = await advancePlatform(didToken, cursor.id);
          if (cancelled.current) return cursor;
          applyProvision(cursor);
        } catch (error) {
          // Timeout / ambiguous — re-read status before any retry.
          try {
            cursor = await getProvision(didToken, cursor.id);
            if (cancelled.current) return cursor;
            applyProvision(cursor);
            if (!needsPlatformAdvance(cursor)) break;
          } catch {
            // keep prior
          }
          if (error instanceof ProvisionClientError) {
            setMessage(productMessageForProvisionError(error.code));
            if (error.code !== "LOCK_HELD") {
              setPhase(
                error.code === "MINT_ADAPTER_UNAVAILABLE" ? "blocked" : "failed"
              );
              playBloom();
              break;
            }
          } else {
            setMessage(
              "We couldn’t verify the transaction yet. Try again shortly."
            );
            break;
          }
        } finally {
          platformMutex.current = false;
          setPlatformInFlight(false);
        }
      }
      return cursor;
    },
    [applyProvision]
  );

  const schedulePoll = useCallback(
    (didToken: string, id: string, delayMs = 2200) => {
      stopPoll();
      pollTimer.current = window.setTimeout(async () => {
        pollCount.current += 1;
        if (pollCount.current > MAX_POLL_ATTEMPTS) {
          setMessage(
            "We couldn’t verify the transaction yet. Try again shortly."
          );
          setPhase("failed");
          playBloom();
          return;
        }
        try {
          let next = await getProvision(didToken, id);
          if (cancelled.current) return;
          applyProvision(next);

          if (needsPlatformAdvance(next)) {
            next = await runPlatformLoop(didToken, next);
          }

          if (next.status === "ISSUED") {
            const confirmed = await confirmIssuedWithMe(
              didToken,
              next.passportName
            );
            if (!confirmed) {
              schedulePoll(didToken, id, Math.min(delayMs * 1.35, 8000));
              return;
            }
            clearProvisionResume();
            attemptRef.current = null;
            setPhase("complete");
            playSuccess();
            await queryClient.invalidateQueries({ queryKey: ["passport"] });
            return;
          }

          if (needsPoll(next)) {
            schedulePoll(didToken, id, Math.min(delayMs * 1.35, 8000));
          }
        } catch {
          schedulePoll(didToken, id, Math.min(delayMs * 1.5, 10000));
        }
      }, delayMs);
    },
    [
      applyProvision,
      confirmIssuedWithMe,
      queryClient,
      runPlatformLoop,
      stopPoll,
    ]
  );

  const clearAttemptForNewLabel = useCallback((label: string) => {
    const resume = attemptRef.current ?? readProvisionResume();
    if (!resume) return;
    // Only clear unused attempts (no submitted hashes yet).
    const hasOnchain =
      provision &&
      (Boolean(provision.platformTransactionHashes.registry) ||
        Boolean(provision.platformTransactionHashes.resolver) ||
        Boolean(provision.platformTransactionHashes.register) ||
        Boolean(provision.userTransactionHashes.parent) ||
        Boolean(provision.userTransactionHashes.records));
    if (hasOnchain) return;
    if (resume.label !== label) {
      clearProvisionResume();
      attemptRef.current = null;
      setProvision(null);
      setPhase("idle");
    }
  }, [provision]);

  const beginCreate = useCallback(
    async (input: {
      didToken: string;
      label: string;
      expectedOwner: `0x${string}` | null;
    }) => {
      setBusy(true);
      setMessage(null);
      setInsufficientFunds(false);
      setPhase("preparing");
      pollCount.current = 0;

      try {
        const adapter = await refreshMintAdapter();
        if (!adapter.available) {
          setPhase("blocked");
          setMessage("Passport creation is temporarily unavailable.");
          playBloom();
          return;
        }

        // Recheck live availability (server also rechecks on provision start).
        const availRes = await fetch(
          `/api/passport/availability?label=${encodeURIComponent(input.label)}`,
          { cache: "no-store" }
        );
        const availBody = (await availRes.json()) as { status?: string };
        if (availBody.status !== "available") {
          setPhase("blocked");
          setMessage(
            availBody.status === "taken" || availBody.status === "reserved"
              ? "That Passport name is no longer available."
              : "Name availability could not be verified."
          );
          playBloom();
          return;
        }

        if (input.expectedOwner) {
          setWalletAddress(input.expectedOwner);
          const balance = await checkProvisionWalletBalance(input.expectedOwner);
          if (!balance.ok) {
            setInsufficientFunds(true);
            setPhase("insufficient_funds");
            setMessage(balance.message);
            playBloom();
            return;
          }
        }

        let attempt = attemptRef.current ?? readProvisionResume();
        if (!attempt || attempt.label !== input.label) {
          attempt = {
            provisioningId: "",
            idempotencyKey: createIdempotencyKey(),
            passportName: `${input.label}.nomadic-passport.eth`,
            label: input.label,
          };
        }
        attemptRef.current = attempt;

        setPhase("creating");
        let next = await startProvision(input.didToken, {
          label: input.label,
          idempotencyKey: attempt.idempotencyKey,
        });
        attempt = {
          ...attempt,
          provisioningId: next.id,
          passportName: next.passportName,
          label: next.label,
        };
        attemptRef.current = attempt;
        writeProvisionResume(attempt);
        applyProvision(next);

        next = await runPlatformLoop(input.didToken, next);

        if (next.status === "ISSUED") {
          const confirmed = await confirmIssuedWithMe(
            input.didToken,
            next.passportName
          );
          if (!confirmed) {
            setPhase("verifying");
            schedulePoll(input.didToken, next.id);
            return;
          }
          clearProvisionResume();
          setPhase("complete");
          playSuccess();
          await queryClient.invalidateQueries({ queryKey: ["passport"] });
          return;
        }

        if (needsPoll(next) || needsPlatformAdvance(next)) {
          schedulePoll(input.didToken, next.id);
        }
      } catch (error) {
        if (error instanceof ProvisionClientError) {
          setMessage(productMessageForProvisionError(error.code));
          setPhase(
            error.code === "MINT_ADAPTER_UNAVAILABLE" ? "blocked" : "failed"
          );
        } else {
          setMessage("Something went wrong. Please try again.");
          setPhase("failed");
        }
        playBloom();
      } finally {
        setBusy(false);
      }
    },
    [
      applyProvision,
      confirmIssuedWithMe,
      queryClient,
      refreshMintAdapter,
      runPlatformLoop,
      schedulePoll,
    ]
  );

  const continueUserSignature = useCallback(
    async (input: {
      didToken: string;
      expectedOwner: `0x${string}`;
    }) => {
      if (!provision?.userTransactionPlan || !provision.userSigningRequired) {
        setMessage("Nothing to confirm right now.");
        return;
      }

      // Do not resend if hash already persisted for this step.
      const step = provision.userTransactionPlan.step;
      const existingHash =
        step === "parent"
          ? provision.userTransactionHashes.parent
          : provision.userTransactionHashes.records;
      if (existingHash) {
        setPhase("verifying");
        try {
          const next = await submitUserTx(input.didToken, provision.id, {
            step,
            transactionHash: existingHash,
          });
          applyProvision(next);
          schedulePoll(input.didToken, next.id);
        } catch (error) {
          if (error instanceof ProvisionClientError) {
            setMessage(productMessageForProvisionError(error.code));
          }
          playBloom();
        }
        return;
      }

      setBusy(true);
      setMessage(null);
      try {
        const sent = await sendUserProvisionTransaction({
          expectedFrom: input.expectedOwner,
          plan: provision.userTransactionPlan,
        });

        if (!sent.ok) {
          if (sent.code === "REJECTED") {
            setPhase("cancelled");
            setMessage(sent.message);
          } else {
            setMessage(sent.message);
            playBloom();
          }
          return;
        }

        setPhase("verifying");
        const next = await submitUserTx(input.didToken, provision.id, {
          step,
          transactionHash: sent.hash,
        });
        applyProvision(next);

        if (next.status === "ISSUED") {
          const confirmed = await confirmIssuedWithMe(
            input.didToken,
            next.passportName
          );
          if (!confirmed) {
            setPhase("verifying");
            schedulePoll(input.didToken, next.id);
            return;
          }
          clearProvisionResume();
          setPhase("complete");
          playSuccess();
          await queryClient.invalidateQueries({ queryKey: ["passport"] });
          return;
        }

        if (needsPlatformAdvance(next)) {
          await runPlatformLoop(input.didToken, next);
        }
        schedulePoll(input.didToken, next.id);
      } catch (error) {
        // Ambiguous submit — re-read before any new Magic send.
        try {
          const refreshed = await getProvision(input.didToken, provision.id);
          applyProvision(refreshed);
        } catch {
          // keep
        }
        if (error instanceof ProvisionClientError) {
          setMessage(productMessageForProvisionError(error.code));
        } else {
          setMessage(
            "We couldn’t verify the transaction yet. Try again shortly."
          );
        }
        playBloom();
      } finally {
        setBusy(false);
      }
    },
    [
      applyProvision,
      confirmIssuedWithMe,
      provision,
      queryClient,
      runPlatformLoop,
      schedulePoll,
    ]
  );

  const resumeIfNeeded = useCallback(
    async (input: {
      didToken: string;
      expectedOwner: `0x${string}` | null;
    }) => {
      // Prefer issued account over any resume.
      try {
        const me = await fetchPrivatePassport(input.didToken);
        if (
          me.passport.ensStatus === "ISSUED" &&
          me.passport.ensName
        ) {
          clearProvisionResume();
          setPhase("complete");
          return;
        }
      } catch {
        // continue resume path
      }

      const resume = readProvisionResume();
      if (!resume?.provisioningId) return;

      attemptRef.current = resume;
      setBusy(true);
      try {
        let next = await getProvision(input.didToken, resume.provisioningId);
        applyProvision(next);

        if (next.status === "ISSUED") {
          const confirmed = await confirmIssuedWithMe(
            input.didToken,
            next.passportName
          );
          if (!confirmed) {
            setPhase("verifying");
            schedulePoll(input.didToken, next.id);
            return;
          }
          clearProvisionResume();
          setPhase("complete");
          playSuccess();
          await queryClient.invalidateQueries({ queryKey: ["passport"] });
          return;
        }

        if (needsPlatformAdvance(next)) {
          next = await runPlatformLoop(input.didToken, next);
        }
        if (needsPoll(next)) {
          schedulePoll(input.didToken, next.id);
        }
      } catch (error) {
        if (
          error instanceof ProvisionClientError &&
          (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")
        ) {
          clearProvisionResume();
          attemptRef.current = null;
        }
      } finally {
        setBusy(false);
      }
    },
    [
      applyProvision,
      confirmIssuedWithMe,
      queryClient,
      runPlatformLoop,
      schedulePoll,
    ]
  );

  const needsUserSignature = Boolean(
    provision?.userSigningRequired && provision.userTransactionPlan
  );

  const effectivePhase: ProductProvisionPhase =
    phase === "confirming" && needsUserSignature
      ? "confirming"
      : phase === "cancelled"
        ? "cancelled"
        : phase;

  return {
    phase: effectivePhase,
    phaseLabel:
      effectivePhase === "confirming"
        ? confirmingActionLabel(provision)
        : productPhaseLabel(effectivePhase),
    stepLabel: confirmingStepLabel(provision),
    actionLabel: needsUserSignature ? "Continue creating Passport" : null,
    provision,
    mintAdapter,
    message,
    busy,
    platformInFlight,
    needsUserSignature,
    insufficientFunds,
    walletAddress,
    refreshMintAdapter,
    beginCreate,
    continueUserSignature,
    resumeIfNeeded,
    clearAttemptForNewLabel,
    resetMessage: () => setMessage(null),
  };
}
