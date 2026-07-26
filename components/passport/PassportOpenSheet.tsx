"use client";

import { useState } from "react";
import { ChevronDown, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PassportProofGrid } from "@/components/passport/PassportProofGrid";
import { PassportCommunityStamps } from "@/components/passport/PassportCommunityStamps";
import { PassportLinkedWallets } from "@/components/passport/PassportLinkedWallets";
import { WorldVerificationPanel } from "@/components/world/WorldVerificationPanel";
import { passportSharePath } from "@/lib/passport/display-name";
import { isWorldPublicConfigured } from "@/lib/world/client";
import { truncateAddress } from "@/lib/wallet";
import type { PrivatePassport } from "@/lib/passport/types";

export type PassportOpenSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passport: PrivatePassport;
  bookTitle: string;
  proofsLoading?: boolean;
  worldSignal?: string;
  onProofSynced?: () => void;
};

export function PassportOpenSheet({
  open,
  onOpenChange,
  passport,
  bookTitle,
  proofsLoading = false,
  worldSignal,
  onProofSynced,
}: PassportOpenSheetProps) {
  const abbreviated = truncateAddress(passport.publicAddress);
  const hasEns =
    passport.ensStatus === "ISSUED" &&
    typeof passport.ensName === "string" &&
    passport.ensName.trim().length > 0;
  const sharePath = passportSharePath(passport.ensName);
  const worldConfigured = isWorldPublicConfigured();

  const handleShare = async () => {
    if (!sharePath || typeof window === "undefined") return;
    const url = `${window.location.origin}${sharePath}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: bookTitle, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // user cancelled share — ignore
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="mx-auto max-h-[92dvh] max-w-[720px] border-[var(--nomadic-border)] bg-[var(--nomadic-bg)]"
        data-passport-state="open"
      >
        <DrawerTitle className="sr-only">{bookTitle}</DrawerTitle>
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-y-auto px-5 pb-8 pt-2 sm:px-8 sm:pb-10"
            >
              <header className="surface-flat mb-7 border-b border-[var(--nomadic-border)] pb-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--nomadic-muted)]">
                      Open Passport
                    </p>
                    <h2 className="font-display mt-1 text-[26px] font-black leading-none tracking-display text-[var(--nomadic-ink)]">
                      Nomadic Passport
                    </h2>
                    {hasEns ? (
                      <p className="mt-2 break-all text-xs font-semibold text-[var(--nomadic-ink)]">
                        {passport.ensName}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--nomadic-muted)]">
                        Public Passport not issued yet
                      </p>
                    )}
                    {abbreviated ? (
                      <p className="mt-1 font-mono text-xs text-[var(--nomadic-muted)]">
                        {abbreviated}
                      </p>
                    ) : null}
                  </div>
                  {hasEns ? (
                    <button
                      type="button"
                      onClick={() => void handleShare()}
                      className="btn-nomadic btn-nomadic-quiet shrink-0 !min-h-9 gap-1 px-2.5 py-1.5 text-[11px]"
                    >
                      <Share2 className="h-3.5 w-3.5" aria-hidden />
                      Share
                    </button>
                  ) : null}
                </div>
                {hasEns ? (
                  <p className="badge-nomadic badge-nomadic-ink mt-2">
                    Public Passport
                  </p>
                ) : null}
              </header>

              <section
                className="surface-clay px-4 py-5 sm:px-5"
                aria-labelledby="passport-world-heading"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--nomadic-orange-deep)]">
                  World
                </p>
                <h2
                  id="passport-world-heading"
                  className="font-display mt-1 text-[24px] font-black leading-none tracking-display text-[var(--nomadic-ink)]"
                >
                  Verify your Passport
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[var(--nomadic-muted)]">
                  Complete the two private checks required for trusted Journeys.
                </p>

                <div className="mt-4">
                  {worldConfigured ? (
                    <WorldVerificationPanel
                      variant="passport"
                      signal={worldSignal}
                      backendProofs={passport.proofs}
                      onProofSynced={() => onProofSynced?.()}
                    />
                  ) : (
                    <div
                      id="world-verification"
                      className="surface-soft px-4 py-4"
                      data-world-integration-boundary="unavailable"
                      data-world-variant="passport"
                    >
                      <p className="text-sm font-semibold text-[var(--nomadic-ink)]">
                        World verification is not available yet.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-8" aria-labelledby="passport-details-heading">
                <h2
                  id="passport-details-heading"
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--nomadic-muted)]"
                >
                  Passport details
                </h2>
                <div className="mt-3 space-y-2">
                  <PassportDetail title="Identity proofs">
                    <PassportProofGrid
                      backendProofs={passport.proofs}
                      isLoading={proofsLoading}
                      showHeading={false}
                    />
                  </PassportDetail>
                  <PassportDetail title="Community stamps">
                    <PassportCommunityStamps
                      ensName={passport.ensName}
                      showHeading={false}
                    />
                  </PassportDetail>
                  <PassportDetail title="Linked wallet">
                    <PassportLinkedWallets
                      publicAddress={passport.publicAddress}
                      showHeading={false}
                    />
                  </PassportDetail>
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
}

function PassportDetail({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      className="group surface-soft overflow-hidden"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[var(--nomadic-ink)] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--nomadic-muted)] transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      {isOpen ? (
        <div className="border-t border-[var(--nomadic-border)] px-3 pb-4 pt-3">
          {children}
        </div>
      ) : null}
    </details>
  );
}
