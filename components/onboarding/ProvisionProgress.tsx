"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PassportCover } from "@/components/passport/PassportCover";
import type {
  ProductProvisionPhase,
  ProvisionStatusView,
} from "@/lib/passport/provision/types";

export type ProvisionProgressProps = {
  displayName: string;
  passportName: string;
  abbreviatedWallet?: string | null;
  phase: ProductProvisionPhase;
  phaseLabel: string;
  stepLabel: string | null;
  message: string | null;
  busy: boolean;
  needsUserSignature: boolean;
  insufficientFunds: boolean;
  walletAddress: `0x${string}` | null;
  provision: ProvisionStatusView | null;
  onContinueSignature: () => void;
  onChangeName: () => void;
  actionLabel: string | null;
};

export function ProvisionProgress({
  displayName,
  passportName,
  abbreviatedWallet,
  phase,
  phaseLabel,
  stepLabel,
  message,
  busy,
  needsUserSignature,
  insufficientFunds,
  walletAddress,
  provision,
  onContinueSignature,
  onChangeName,
  actionLabel,
}: ProvisionProgressProps) {
  const showDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_NOMADIC_PROVISION_DEBUG === "1";

  return (
    <div className="flex flex-col gap-6" data-onboarding="provisioning">
      <header className="space-y-1 text-center">
        <h1 className="font-display text-[22px] font-bold tracking-display text-[var(--nomadic-ink)]">
          {phase === "complete" ? "Your Passport is ready" : phaseLabel}
        </h1>
        {stepLabel ? (
          <p className="text-xs font-medium text-[var(--nomadic-muted)]">
            {stepLabel}
          </p>
        ) : null}
        {abbreviatedWallet ? (
          <p className="font-mono text-xs text-[var(--nomadic-muted)]">
            {abbreviatedWallet}
          </p>
        ) : null}
      </header>

      <PassportCover
        mode="preview"
        displayName={displayName}
        subtitle={passportName}
      />

      <div className="space-y-3" role="status" aria-live="polite">
        {busy ||
        phase === "preparing" ||
        phase === "creating" ||
        phase === "verifying" ? (
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--nomadic-muted)]">
            <Loader2
              className="h-4 w-4 animate-spin text-[var(--nomadic-orange)]"
              aria-hidden
            />
            <span>{phaseLabel}</span>
          </div>
        ) : null}

        {message ? (
          <p className="text-center text-xs text-[var(--nomadic-muted)]">
            {message}
          </p>
        ) : null}

        {insufficientFunds ? (
          <div className="surface-soft space-y-2 px-4 py-3 text-center">
            <p className="text-sm text-[var(--nomadic-ink)]">
              Your test wallet needs a small amount of Sepolia ETH to create the
              Passport.
            </p>
            {walletAddress ? (
              <p className="break-all font-mono text-[11px] text-[var(--nomadic-muted)]">
                {walletAddress}
              </p>
            ) : null}
            {walletAddress && showDev ? (
              <Button
                type="button"
                variant="mist"
                size="sm"
                className="mx-auto"
                onClick={() => {
                  void navigator.clipboard?.writeText(walletAddress);
                }}
              >
                Copy address
              </Button>
            ) : null}
          </div>
        ) : null}

        {needsUserSignature ? (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={onContinueSignature}
          >
            {actionLabel || "Continue creating Passport"}
          </Button>
        ) : null}

        {phase === "cancelled" ? (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={onContinueSignature}
          >
            Continue creating Passport
          </Button>
        ) : null}

        {phase === "failed" || phase === "blocked" || phase === "idle" ? (
          <Button
            type="button"
            variant="quiet"
            size="lg"
            className="w-full"
            onClick={onChangeName}
          >
            Change name
          </Button>
        ) : null}
      </div>

      {showDev && provision ? (
        <details className="rounded-[var(--nomadic-radius-sm)] border border-[var(--nomadic-border)] px-3 py-2 text-[11px] text-[var(--nomadic-muted)]">
          <summary className="cursor-pointer font-medium text-[var(--nomadic-ink)]">
            Development details
          </summary>
          <dl className="mt-2 space-y-1 break-all font-mono">
            <div>
              <dt className="inline font-sans">id: </dt>
              <dd className="inline">{provision.id}</dd>
            </div>
            <div>
              <dt className="inline font-sans">status: </dt>
              <dd className="inline">{provision.status}</dd>
            </div>
            <div>
              <dt className="inline font-sans">name: </dt>
              <dd className="inline">{provision.passportName}</dd>
            </div>
            <div>
              <dt className="inline font-sans">next: </dt>
              <dd className="inline">{provision.nextAction}</dd>
            </div>
            <div>
              <dt className="inline font-sans">platform txs: </dt>
              <dd className="inline">
                {[
                  provision.platformTransactionHashes.registry,
                  provision.platformTransactionHashes.resolver,
                  provision.platformTransactionHashes.register,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="inline font-sans">user txs: </dt>
              <dd className="inline">
                {[
                  provision.userTransactionHashes.parent,
                  provision.userTransactionHashes.records,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </details>
      ) : null}
    </div>
  );
}
