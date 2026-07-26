"use client";

import { Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PassportProofGrid } from "@/components/passport/PassportProofGrid";
import { PassportCommunityStamps } from "@/components/passport/PassportCommunityStamps";
import { PassportLinkedWallets } from "@/components/passport/PassportLinkedWallets";
import { passportSharePath } from "@/lib/passport/display-name";
import { truncateAddress } from "@/lib/wallet";
import type { PrivatePassport } from "@/lib/passport/types";

export type PassportOpenSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passport: PrivatePassport;
  bookTitle: string;
  proofsLoading?: boolean;
};

export function PassportOpenSheet({
  open,
  onOpenChange,
  passport,
  bookTitle,
  proofsLoading = false,
}: PassportOpenSheetProps) {
  const abbreviated = truncateAddress(passport.publicAddress);
  const hasEns =
    passport.ensStatus === "ISSUED" &&
    typeof passport.ensName === "string" &&
    passport.ensName.trim().length > 0;
  const sharePath = passportSharePath(passport.ensName);

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
        className="mx-auto max-h-[92dvh] max-w-[430px] border-[var(--nomadic-paper-edge)] bg-[var(--nomadic-paper)]"
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
              className="overflow-y-auto px-4 pb-8 pt-2"
            >
              <div className="surface-flat mb-4 border-b border-[var(--nomadic-paper-edge)] pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold tracking-display text-[var(--nomadic-ink)]">
                      {bookTitle}
                    </h2>
                    {hasEns ? (
                      <p className="mt-0.5 break-all text-xs font-medium text-[var(--nomadic-ink)]">
                        {passport.ensName}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-[var(--nomadic-muted)]">
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
              </div>

              <div className="space-y-6">
                <PassportProofGrid
                  backendProofs={passport.proofs}
                  isLoading={proofsLoading}
                />
                <PassportCommunityStamps ensName={passport.ensName} />
                <PassportLinkedWallets
                  publicAddress={passport.publicAddress}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
}
